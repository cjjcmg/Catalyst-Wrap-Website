import { SquareClient, SquareEnvironment, WebhooksHelper } from "square";
import { supabase } from "@/lib/supabase";

/**
 * Square wrapper for Catalyst Motorsport invoicing.
 *
 * All money passed/received here is USD in cents (BigInt-ified at the
 * Square boundary). Contacts are cached per Square customer by stashing the
 * Square customer id on `quotes.square_customer_id`.
 */

let cachedClient: SquareClient | null = null;

export function isSquareConfigured(): boolean {
  return !!(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

export function getSquareClient(): SquareClient {
  if (!isSquareConfigured()) {
    throw new Error(
      "Square is not configured. Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID in .env.local and restart."
    );
  }
  if (!cachedClient) {
    const env = process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;
    cachedClient = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment: env,
    });
  }
  return cachedClient;
}

export function getLocationId(): string {
  const id = process.env.SQUARE_LOCATION_ID;
  if (!id) throw new Error("SQUARE_LOCATION_ID is not set");
  return id;
}

/**
 * Look up the contact's cached Square customer id, or create a new Square
 * customer record from the contact's name / email / phone and store the id.
 */
export async function ensureSquareCustomer(contactId: number): Promise<string> {
  const { data: contact, error } = await supabase
    .from("quotes")
    .select("id, name, email, phone, square_customer_id")
    .eq("id", contactId)
    .single();
  if (error || !contact) throw new Error("Contact not found for Square lookup");
  if (contact.square_customer_id) return contact.square_customer_id;

  const [given, ...rest] = (contact.name || "").trim().split(/\s+/);
  const family = rest.join(" ");
  const client = getSquareClient();

  const res = await client.customers.create({
    idempotencyKey: `contact-${contactId}-${Date.now()}`,
    givenName: given || undefined,
    familyName: family || undefined,
    emailAddress: contact.email || undefined,
    phoneNumber: contact.phone || undefined,
    referenceId: String(contact.id),
  });
  const sqId = res.customer?.id;
  if (!sqId) throw new Error("Square returned no customer id");

  await supabase
    .from("quotes")
    .update({ square_customer_id: sqId })
    .eq("id", contactId);

  return sqId;
}

export interface CreateSquareInvoiceInput {
  contactId: number;
  salesQuoteId: number;
  quoteNumber: string;
  type: "deposit" | "balance" | "full";
  amountCents: number;
  /** Free-form description shown on the invoice line. */
  description: string;
}

export interface CreateSquareInvoiceResult {
  squareInvoiceId: string;
  squarePublicUrl: string | null;
}

/**
 * Create + publish a Square invoice for a given quote. Creates an Order
 * first (Square requires invoices to be backed by an order), then creates a
 * draft invoice referencing that order, then publishes it. Publishing is
 * what actually emails the customer and returns a `publicUrl` we can link
 * to from the admin UI.
 */
export async function createSquareInvoice(input: CreateSquareInvoiceInput): Promise<CreateSquareInvoiceResult> {
  const customerId = await ensureSquareCustomer(input.contactId);
  const locationId = getLocationId();
  const client = getSquareClient();

  // 1. Create the Order
  const orderRes = await client.orders.create({
    idempotencyKey: `ord-${input.salesQuoteId}-${input.type}-${Date.now()}`,
    order: {
      locationId,
      customerId,
      referenceId: `${input.quoteNumber}-${input.type}`,
      lineItems: [
        {
          name: `${input.quoteNumber} — ${input.type}`,
          quantity: "1",
          basePriceMoney: {
            amount: BigInt(input.amountCents),
            currency: "USD",
          },
          note: input.description.slice(0, 500),
        },
      ],
    },
  });
  const orderId = orderRes.order?.id;
  if (!orderId) throw new Error("Square returned no order id");

  // 2. Create the draft invoice
  const invoiceCreate = await client.invoices.create({
    idempotencyKey: `inv-${input.salesQuoteId}-${input.type}-${Date.now()}`,
    invoice: {
      orderId,
      primaryRecipient: { customerId },
      paymentRequests: [
        {
          requestType: "BALANCE",
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        },
      ],
      deliveryMethod: "EMAIL",
      title: `${input.quoteNumber} — ${input.type[0].toUpperCase()}${input.type.slice(1)}`,
      description: input.description,
      acceptedPaymentMethods: {
        card: true,
        squareGiftCard: true,
        bankAccount: false,
        buyNowPayLater: false,
        cashAppPay: false,
      },
    },
  });
  const draftInvoiceId = invoiceCreate.invoice?.id;
  const draftVersion = invoiceCreate.invoice?.version ?? 0;
  if (!draftInvoiceId) throw new Error("Square returned no invoice id");

  // 3. Publish → customer gets the email, we get the public URL
  const publishRes = await client.invoices.publish({
    invoiceId: draftInvoiceId,
    version: draftVersion,
    idempotencyKey: `pub-${input.salesQuoteId}-${input.type}-${Date.now()}`,
  });

  return {
    squareInvoiceId: draftInvoiceId,
    squarePublicUrl: publishRes.invoice?.publicUrl ?? null,
  };
}

/** Cancel (void) a Square invoice. Square requires the current version. */
export async function voidSquareInvoice(squareInvoiceId: string): Promise<void> {
  const client = getSquareClient();
  const current = await client.invoices.get({ invoiceId: squareInvoiceId });
  const version = current.invoice?.version ?? 0;
  await client.invoices.cancel({ invoiceId: squareInvoiceId, version });
}

/** Refund a completed Square payment. Square accepts partial refunds too. */
export async function refundSquarePayment(
  squarePaymentId: string,
  amountCents: number,
  reason?: string
) {
  const client = getSquareClient();
  const res = await client.refunds.refundPayment({
    idempotencyKey: `refund-${squarePaymentId}-${Date.now()}`,
    paymentId: squarePaymentId,
    amountMoney: { amount: BigInt(amountCents), currency: "USD" },
    reason: reason?.slice(0, 192),
  });
  return res.refund;
}

/**
 * Verify a Square webhook payload using the signature key set in env.
 * Returns true only when the header, payload, signature key, and
 * notification URL all agree.
 */
export async function verifySquareWebhook(params: {
  body: string;
  signature: string | null;
  notificationUrl: string;
}): Promise<boolean> {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey || !params.signature) return false;
  try {
    return await WebhooksHelper.verifySignature({
      requestBody: params.body,
      signatureHeader: params.signature,
      signatureKey,
      notificationUrl: params.notificationUrl,
    });
  } catch {
    return false;
  }
}
