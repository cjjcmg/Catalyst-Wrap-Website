"use client";

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

export interface QuotePDFData {
  quote: {
    quote_number: string;
    status: string;
    created_at: string;
    expires_at: string | null;
    vehicle_year: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_color: string | null;
    vehicle_size_tier: string;
    subtotal: number;
    discount_amount: number;
    discount_reason: string | null;
    tax_rate: number;
    tax_amount: number;
    total: number;
    deposit_type: "fixed_amount" | "percent" | "none";
    deposit_value: number | null;
    deposit_amount_calc: number | null;
    customer_notes: string | null;
    terms: string | null;
    accepted_at: string | null;
    accepted_by_name: string | null;
    accepted_ip: string | null;
  };
  line_items: Array<{
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    is_taxable: boolean;
    sort_order: number;
  }>;
  contact: {
    name: string;
    email: string;
    phone: string | null;
  };
  settings: {
    business_name: string;
    business_address: string;
    business_phone: string;
    business_website: string;
    logo_url: string | null;
  };
}

const RED = "#E10600";
const DARK = "#111111";
const GREY = "#666666";
const LIGHT_GREY = "#EAEAEA";
const BG = "#F8F8F8";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: DARK,
  },
  pageBody: {
    padding: 40,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DARK,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderBottomWidth: 3,
    borderBottomColor: RED,
    marginBottom: 24,
  },
  logo: {
    width: 180,
    height: 44,
    objectFit: "contain",
  },
  logoFallback: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  businessBlock: {
    alignItems: "flex-end",
    fontSize: 9,
    color: "#D4D4D4",
  },
  businessName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: DARK,
  },
  quoteMeta: {
    fontSize: 9,
    color: GREY,
    textAlign: "right",
  },
  statusBadge: {
    fontSize: 8,
    fontWeight: "bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: RED,
    color: "white",
    textTransform: "uppercase",
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  twoCol: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  col: {
    flex: 1,
    backgroundColor: BG,
    padding: 10,
    borderRadius: 4,
  },
  colHeader: {
    fontSize: 8,
    fontWeight: "bold",
    color: GREY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  colLine: {
    fontSize: 10,
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: DARK,
    color: "white",
    padding: 6,
    fontSize: 9,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_GREY,
    fontSize: 10,
  },
  colDesc: { flex: 3 },
  colQty: { flex: 0.6, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalsBox: {
    width: 260,
    marginLeft: "auto",
    marginTop: 12,
    padding: 12,
    backgroundColor: BG,
    borderRadius: 4,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    fontSize: 10,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: DARK,
    fontSize: 12,
    fontWeight: "bold",
  },
  depositRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_GREY,
    fontSize: 10,
    color: RED,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: GREY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 10,
    color: DARK,
    lineHeight: 1.4,
  },
  signatureBox: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: LIGHT_GREY,
    borderStyle: "solid",
    borderRadius: 4,
  },
  accepted: {
    backgroundColor: "#E8F7EE",
    borderColor: "#2E7D32",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: GREY,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_GREY,
    paddingTop: 6,
  },
});

function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return "$0.00";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function vehicleString(q: QuotePDFData["quote"]): string {
  const parts = [q.vehicle_year, q.vehicle_make, q.vehicle_model].filter(Boolean);
  const base = parts.join(" ");
  const color = q.vehicle_color ? ` • ${q.vehicle_color}` : "";
  const tier = ` • ${titleCase(q.vehicle_size_tier)} tier`;
  return (base || "—") + color + tier;
}

export function QuotePDF({ data }: { data: QuotePDFData }) {
  const { quote, line_items, contact, settings } = data;
  const isAccepted = quote.status === "accepted" || !!quote.accepted_at;

  return (
    <Document title={`Quote ${quote.quote_number}`} author={settings.business_name}>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          {settings.logo_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={settings.logo_url} style={styles.logo} />
          ) : (
            <Text style={styles.logoFallback}>{settings.business_name.toUpperCase()}</Text>
          )}
          <View style={styles.businessBlock}>
            <Text style={styles.businessName}>{settings.business_name}</Text>
            <Text>{settings.business_address}</Text>
            <Text>{settings.business_phone}</Text>
            <Text>{settings.business_website}</Text>
          </View>
        </View>

        <View style={styles.pageBody}>
        {/* Title + meta */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.statusBadge}>{quote.status}</Text>
            <Text style={styles.title}>Quote {quote.quote_number}</Text>
          </View>
          <View style={styles.quoteMeta}>
            <Text>Issued: {fmtDate(quote.created_at)}</Text>
            {quote.expires_at && <Text>Expires: {fmtDate(quote.expires_at)}</Text>}
          </View>
        </View>

        {/* Bill-to + Vehicle */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colHeader}>Bill To</Text>
            <Text style={[styles.colLine, { fontWeight: "bold" }]}>{contact.name}</Text>
            <Text style={styles.colLine}>{contact.email}</Text>
            {contact.phone && <Text style={styles.colLine}>{contact.phone}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={styles.colHeader}>Vehicle</Text>
            <Text style={styles.colLine}>{vehicleString(quote)}</Text>
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Unit</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {line_items.length === 0 ? (
          <View style={styles.tableRow}>
            <Text style={{ flex: 1, color: GREY, fontStyle: "italic" }}>No line items yet.</Text>
          </View>
        ) : (
          line_items.map((li) => (
            <View key={li.id} style={styles.tableRow} wrap={false}>
              <Text style={styles.colDesc}>
                {li.description}
                {!li.is_taxable && <Text style={{ color: GREY, fontSize: 8 }}> (non-taxable)</Text>}
              </Text>
              <Text style={styles.colQty}>{li.quantity}</Text>
              <Text style={styles.colPrice}>{fmtCurrency(li.unit_price)}</Text>
              <Text style={styles.colTotal}>{fmtCurrency(li.line_total)}</Text>
            </View>
          ))
        )}

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{fmtCurrency(quote.subtotal)}</Text>
          </View>
          {quote.discount_amount > 0 && (
            <View style={styles.totalsRow}>
              <Text>Discount{quote.discount_reason ? ` (${quote.discount_reason})` : ""}</Text>
              <Text>−{fmtCurrency(quote.discount_amount)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text>Tax ({(quote.tax_rate * 100).toFixed(2)}%)</Text>
            <Text>{fmtCurrency(quote.tax_amount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text>Total</Text>
            <Text>{fmtCurrency(quote.total)}</Text>
          </View>
          {quote.deposit_type !== "none" && quote.deposit_amount_calc != null && (
            <>
              <View style={styles.depositRow}>
                <Text>
                  Deposit due
                  {quote.deposit_type === "percent" && quote.deposit_value != null
                    ? ` (${quote.deposit_value}%)`
                    : ""}
                </Text>
                <Text>{fmtCurrency(quote.deposit_amount_calc)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text>Balance on completion</Text>
                <Text>{fmtCurrency(quote.total - quote.deposit_amount_calc)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Customer notes */}
        {quote.customer_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Notes</Text>
            <Text style={styles.sectionText}>{quote.customer_notes}</Text>
          </View>
        )}

        {/* Terms */}
        {quote.terms && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Terms</Text>
            <Text style={styles.sectionText}>{quote.terms}</Text>
          </View>
        )}

        {/* Signature / expiration */}
        <View style={[styles.signatureBox, isAccepted ? styles.accepted : {}]} wrap={false}>
          {isAccepted ? (
            <>
              <Text style={styles.sectionHeader}>Accepted</Text>
              <Text style={styles.sectionText}>
                Accepted by {quote.accepted_by_name || "(unknown)"} on {fmtDate(quote.accepted_at)}
                {quote.accepted_ip ? ` from IP ${quote.accepted_ip}` : ""}.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.sectionHeader}>Acceptance</Text>
              <Text style={styles.sectionText}>
                To accept this quote, visit the acceptance link in your email.
                {quote.expires_at ? ` This quote expires on ${fmtDate(quote.expires_at)}.` : ""}
              </Text>
            </>
          )}
        </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${settings.business_name} — Quote ${quote.quote_number} — Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
