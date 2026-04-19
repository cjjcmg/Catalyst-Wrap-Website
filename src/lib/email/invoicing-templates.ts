/**
 * Plain-HTML email templates for the invoicing flow, matching the pattern
 * already in use across the app (src/lib/email.ts sends html strings).
 * Every template is wrapped by withChrome() which paints the header/footer
 * shared across transactional emails.
 */

const RED = "#E10600";
const DARK = "#111111";
const GREY = "#666666";
const LIGHT = "#F8F8F8";

interface ChromeOpts {
  logoUrl: string | null;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessWebsite: string;
  content: string;
  preheader?: string;
}

function withChrome(o: ChromeOpts): string {
  const logoBlock = o.logoUrl
    ? `<img src="${o.logoUrl}" alt="${esc(o.businessName)}" height="40" style="display:block;border:0;outline:none;">`
    : `<span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:1px;">${esc(o.businessName.toUpperCase())}</span>`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(o.businessName)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${LIGHT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:${DARK};">
    ${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${LIGHT};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
            <tr>
              <td style="background-color:#111111;padding:20px 32px;border-bottom:3px solid ${RED};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">${logoBlock}</td>
                    <td style="vertical-align:middle;text-align:right;color:#D4D4D4;font-size:12px;line-height:1.55;">
                      <strong style="color:#ffffff;font-size:13px;">${esc(o.businessName)}</strong><br>
                      ${esc(o.businessAddress)}<br>
                      ${esc(o.businessPhone)} · ${esc(o.businessWebsite)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                ${o.content}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px;border-top:1px solid #EAEAEA;color:${GREY};font-size:12px;line-height:1.5;text-align:center;">
                Questions? Call <a href="tel:${esc(o.businessPhone)}" style="color:${RED};text-decoration:none;">${esc(o.businessPhone)}</a> · ${esc(o.businessWebsite)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtMoney(n: number): string {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr><td style="background-color:${RED};border-radius:6px;">
      <a href="${esc(href)}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${esc(label)}</a>
    </td></tr>
  </table>`;
}

export interface SettingsShape {
  logo_url: string | null;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_website: string;
}

function chromeArgs(settings: SettingsShape, content: string, preheader?: string): ChromeOpts {
  return {
    logoUrl: settings.logo_url,
    businessName: settings.business_name,
    businessAddress: settings.business_address,
    businessPhone: settings.business_phone,
    businessWebsite: settings.business_website,
    content,
    preheader,
  };
}

// ---------------------------------------------------------------------------

export interface QuoteSentVars {
  customerName: string;
  quoteNumber: string;
  totalAmount: number;
  depositAmount: number | null;
  expiresAt: string | null;
  acceptanceUrl: string;
  personalNote?: string;
  settings: SettingsShape;
}

export function quoteSentEmail(v: QuoteSentVars): { subject: string; html: string; text: string } {
  const subject = `Your ${v.settings.business_name} Quote — ${v.quoteNumber}`;
  const expiryLine = v.expiresAt
    ? `<p style="color:${GREY};font-size:13px;margin:8px 0 0;">This quote is valid until ${esc(
        new Date(v.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      )}.</p>`
    : "";

  const depositLine = v.depositAmount
    ? `<p style="margin:4px 0 16px;color:${GREY};font-size:14px;">Deposit due on acceptance: <strong style="color:${DARK};">${fmtMoney(v.depositAmount)}</strong></p>`
    : "";

  const content = `
    <h1 style="font-size:20px;font-weight:700;margin:0 0 12px;color:${DARK};">Hi ${esc(v.customerName.split(" ")[0])},</h1>
    <p style="font-size:15px;line-height:1.55;margin:0 0 16px;">
      ${v.personalNote
        ? esc(v.personalNote)
        : `Thanks for considering ${esc(v.settings.business_name)}. Your quote is attached and ready for review.`}
    </p>
    <p style="margin:0 0 4px;color:${GREY};font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Quote ${esc(v.quoteNumber)}</p>
    <p style="font-size:28px;font-weight:700;margin:0 0 4px;color:${DARK};">${fmtMoney(v.totalAmount)}</p>
    ${depositLine}
    ${button(v.acceptanceUrl, "View & Accept Quote")}
    ${expiryLine}
    <p style="font-size:13px;color:${GREY};margin:16px 0 0;line-height:1.5;">
      Questions? Reply directly to this email or call us at ${esc(v.settings.business_phone)}.
    </p>
  `;

  const text = [
    `Hi ${v.customerName.split(" ")[0]},`,
    "",
    v.personalNote ||
      `Thanks for considering ${v.settings.business_name}. Your quote (${v.quoteNumber}) is attached.`,
    "",
    `Total: ${fmtMoney(v.totalAmount)}`,
    v.depositAmount ? `Deposit due on acceptance: ${fmtMoney(v.depositAmount)}` : "",
    "",
    `View & accept: ${v.acceptanceUrl}`,
    v.expiresAt
      ? `Valid until ${new Date(v.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`
      : "",
    "",
    `Questions? Reply to this email or call ${v.settings.business_phone}.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html: withChrome(chromeArgs(v.settings, content, `Quote ${v.quoteNumber} — ${fmtMoney(v.totalAmount)}`)), text };
}

// ---------------------------------------------------------------------------

export interface QuoteAcceptedVars {
  customerName: string;
  quoteNumber: string;
  totalAmount: number;
  depositAmount: number | null;
  acceptedByName: string;
  acceptedAt: string;
  acceptedIp: string | null;
  vehicle: string;
  quoteLink: string;
  settings: SettingsShape;
}

export function quoteAcceptedInternalEmail(v: QuoteAcceptedVars): { subject: string; html: string; text: string } {
  const subject = `✅ Quote Accepted — ${v.quoteNumber} — ${v.customerName}`;

  const content = `
    <p style="margin:0 0 12px;font-size:16px;"><strong>${esc(v.customerName)}</strong> just accepted a quote.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:12px 0;background-color:${LIGHT};border-radius:6px;">
      <tr><td style="padding:12px 16px;font-size:14px;">
        <div style="margin-bottom:6px;"><span style="color:${GREY};">Quote:</span> <strong>${esc(v.quoteNumber)}</strong></div>
        <div style="margin-bottom:6px;"><span style="color:${GREY};">Total:</span> <strong>${fmtMoney(v.totalAmount)}</strong></div>
        ${v.depositAmount ? `<div style="margin-bottom:6px;"><span style="color:${GREY};">Deposit due:</span> <strong>${fmtMoney(v.depositAmount)}</strong></div>` : ""}
        <div style="margin-bottom:6px;"><span style="color:${GREY};">Vehicle:</span> ${esc(v.vehicle)}</div>
        <div style="margin-bottom:6px;"><span style="color:${GREY};">Signed by:</span> ${esc(v.acceptedByName)}</div>
        <div><span style="color:${GREY};">Accepted:</span> ${esc(new Date(v.acceptedAt).toLocaleString("en-US"))}${v.acceptedIp ? ` · IP ${esc(v.acceptedIp)}` : ""}</div>
      </td></tr>
    </table>
    ${button(v.quoteLink, "Open quote in CRM")}
    <p style="font-size:13px;color:${GREY};margin:16px 0 0;">Next step: send a Square invoice when you're ready to collect payment.</p>
  `;

  const text = [
    `${v.customerName} accepted ${v.quoteNumber} — ${fmtMoney(v.totalAmount)}`,
    v.depositAmount ? `Deposit due: ${fmtMoney(v.depositAmount)}` : "",
    `Vehicle: ${v.vehicle}`,
    `Signed by: ${v.acceptedByName}`,
    `Accepted: ${new Date(v.acceptedAt).toLocaleString("en-US")}${v.acceptedIp ? ` · IP ${v.acceptedIp}` : ""}`,
    "",
    `Open in CRM: ${v.quoteLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html: withChrome(chromeArgs(v.settings, content)), text };
}

// ---------------------------------------------------------------------------

export interface InvoicePaidVars {
  customerName: string;
  invoiceNumber: string;
  quoteNumber: string;
  amount: number;
  type: string;
  invoiceLink: string;
  settings: SettingsShape;
}

export function invoicePaidInternalEmail(v: InvoicePaidVars): { subject: string; html: string; text: string } {
  const subject = `💵 Payment Received — ${v.invoiceNumber} — ${fmtMoney(v.amount)}`;

  const content = `
    <p style="margin:0 0 12px;font-size:16px;"><strong>${esc(v.customerName)}</strong> paid an invoice.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:12px 0;background-color:${LIGHT};border-radius:6px;">
      <tr><td style="padding:12px 16px;font-size:14px;">
        <div style="margin-bottom:6px;"><span style="color:${GREY};">Invoice:</span> <strong>${esc(v.invoiceNumber)}</strong> (${esc(v.type)})</div>
        <div style="margin-bottom:6px;"><span style="color:${GREY};">Amount:</span> <strong>${fmtMoney(v.amount)}</strong></div>
        <div><span style="color:${GREY};">Quote:</span> ${esc(v.quoteNumber)}</div>
      </td></tr>
    </table>
    ${button(v.invoiceLink, "Open invoice")}
  `;

  const text = [
    `${v.customerName} paid ${v.invoiceNumber} — ${fmtMoney(v.amount)} (${v.type})`,
    `Quote: ${v.quoteNumber}`,
    "",
    `Open: ${v.invoiceLink}`,
  ].join("\n");

  return { subject, html: withChrome(chromeArgs(v.settings, content)), text };
}

// ---------------------------------------------------------------------------

export interface QuoteExpiringVars {
  quotes: Array<{
    quote_number: string;
    customer_name: string;
    total: number;
    expires_at: string;
    link: string;
  }>;
  settings: SettingsShape;
}

export function quoteExpiringDigestEmail(v: QuoteExpiringVars): { subject: string; html: string; text: string } {
  const subject = `⏰ ${v.quotes.length} quote${v.quotes.length === 1 ? "" : "s"} expiring in the next 3 days`;

  const rows = v.quotes
    .map((q) => {
      const daysLeft = Math.max(0, Math.ceil((new Date(q.expires_at).getTime() - Date.now()) / 86400000));
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #EAEAEA;font-family:monospace;font-size:13px;"><a href="${esc(q.link)}" style="color:${RED};text-decoration:none;">${esc(q.quote_number)}</a></td>
        <td style="padding:8px 12px;border-bottom:1px solid #EAEAEA;">${esc(q.customer_name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #EAEAEA;text-align:right;">${fmtMoney(q.total)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #EAEAEA;text-align:right;color:${GREY};">${daysLeft === 0 ? "today" : `${daysLeft}d`}</td>
      </tr>`;
    })
    .join("");

  const content = `
    <p style="margin:0 0 12px;font-size:15px;">These sent quotes expire in the next 3 days. Consider a nudge or follow-up:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background-color:${LIGHT};">
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:${GREY};font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Quote</th>
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:${GREY};font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Customer</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;color:${GREY};font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Total</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;color:${GREY};font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Expires</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const text =
    `Quotes expiring soon:\n\n` +
    v.quotes
      .map((q) => `${q.quote_number} — ${q.customer_name} — ${fmtMoney(q.total)} — ${q.link}`)
      .join("\n");

  return { subject, html: withChrome(chromeArgs(v.settings, content)), text };
}
