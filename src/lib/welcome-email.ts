import Anthropic from "@anthropic-ai/sdk";
import { sendEmail } from "./email";

const WELCOME_FROM =
  process.env.RESEND_WELCOME_FROM_EMAIL ||
  "Catalyst Motorsport <team@catalystmotorsport.com>";
const TEAM_EMAIL = "team@catalystmotorsport.com";

const HYPE_MODEL = "claude-sonnet-4-6";
const HYPE_TIMEOUT_MS = 6000;

const FALLBACK_HYPE =
  "Your project is exactly the kind of work we live for. Our team is already mapping out the details, and we'll bring the same obsession to your build that we bring to every car that rolls through our bay. Keep your phone close — we'll be in touch very soon.";

const SYSTEM_PROMPT =
  "You write short, electrifying email paragraphs for Catalyst Motorsport, a premium auto customization and brokerage shop in Anaheim, CA. Given a customer's request, write ONE paragraph, 3–5 sentences, 60–100 words, that gets them fired up about what we're about to do for their vehicle. Tone: confident, hype, like a pit crew chief who just saw the build come together in their head. No emojis. No tired phrases like 'take it to the next level' or 'turn heads.' Do not greet the customer or use the word 'welcome' — that's handled elsewhere. Do not sign off. Reference the specific service they asked about. Make them want to keep their phone in their hand until we call.";

export interface WelcomeLead {
  firstName?: string | null;
  email: string;
  request?: string | null;
  serviceType?: string | null;
  message?: string | null;
  vehicleYear?: string | number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
}

function buildUserMessage(lead: WelcomeLead): string {
  const request = lead.request || lead.serviceType || lead.message;
  const vehicleParts = [lead.vehicleYear, lead.vehicleMake, lead.vehicleModel]
    .filter((p) => p != null && String(p).trim() !== "")
    .join(" ");

  const lines: string[] = [];
  if (request && String(request).trim()) lines.push(`Customer request: ${request}`);
  if (lead.firstName && lead.firstName.trim()) lines.push(`First name: ${lead.firstName}`);
  if (vehicleParts) lines.push(`Vehicle: ${vehicleParts}`);
  return lines.join("\n");
}

export async function generateHypeParagraph(
  lead: WelcomeLead,
  client?: Anthropic
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return FALLBACK_HYPE;
  }

  const anthropic = client || new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const userMessage = buildUserMessage(lead);
  if (!userMessage) return FALLBACK_HYPE;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HYPE_TIMEOUT_MS);

  try {
    const response = await anthropic.messages.create(
      {
        model: HYPE_MODEL,
        max_tokens: 300,
        temperature: 0.9,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      },
      { signal: controller.signal }
    );

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return text || FALLBACK_HYPE;
  } catch (err) {
    console.error("Hype paragraph generation failed:", err);
    return FALLBACK_HYPE;
  } finally {
    clearTimeout(timer);
  }
}

const STATIC_WELCOME =
  "Welcome to Catalyst Motorsport! Thanks for reaching out — we just received your request and one of our agents will be in touch with you shortly.";
const STATIC_SIGNOFF_LINES = [
  "Talk soon,",
  "The Catalyst Motorsport Team",
  "team@catalystmotorsport.com",
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildWelcomeHtml(hype: string, siteUrl: string): string {
  const logoSrc = `${siteUrl.replace(/\/$/, "")}/images/CM_logo_wh.png`;
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#000000;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#000000;border:1px solid #1a1a1a;">
            <tr>
              <td align="center" style="padding:32px 24px 16px 24px;background:#000000;">
                <img src="${logoSrc}" alt="Catalyst Motorsport" width="220" style="display:block;max-width:220px;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:2px solid #ffffff;">
                <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#ffffff;">
                  ${escapeHtml(STATIC_WELCOME)}
                </p>
                <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#e5e5e5;font-weight:500;">
                  ${escapeHtml(hype)}
                </p>
                <p style="margin:24px 0 0 0;font-size:16px;line-height:1.6;color:#ffffff;font-weight:700;letter-spacing:0.5px;">
                  ${STATIC_SIGNOFF_LINES.map(escapeHtml).join("<br />")}
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 24px;background:#000000;border-top:1px solid #1a1a1a;">
                <p style="margin:0;font-size:11px;color:#888888;letter-spacing:1px;text-transform:uppercase;">
                  Catalyst Motorsport &middot; Anaheim, CA
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildWelcomeText(hype: string): string {
  return [
    STATIC_WELCOME,
    "",
    hype,
    "",
    ...STATIC_SIGNOFF_LINES,
  ].join("\n");
}

export interface ComposedWelcomeEmail {
  from: string;
  to: string;
  cc: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  hype: string;
}

export async function composeWelcomeEmail(
  lead: WelcomeLead,
  anthropicClient?: Anthropic
): Promise<ComposedWelcomeEmail> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://catalystmotorsport.com";
  const hype = await generateHypeParagraph(lead, anthropicClient);
  return {
    from: WELCOME_FROM,
    to: lead.email,
    cc: TEAM_EMAIL,
    replyTo: TEAM_EMAIL,
    subject: "Welcome to Catalyst Motorsport — we're on it",
    html: buildWelcomeHtml(hype, siteUrl),
    text: buildWelcomeText(hype),
    hype,
  };
}

export async function sendWelcomeEmail(lead: WelcomeLead): Promise<void> {
  const composed = await composeWelcomeEmail(lead);
  await sendEmail({
    from: composed.from,
    to: composed.to,
    cc: composed.cc,
    replyTo: composed.replyTo,
    subject: composed.subject,
    html: composed.html,
    text: composed.text,
  });
}

export const __TEST__ = {
  FALLBACK_HYPE,
  STATIC_WELCOME,
  STATIC_SIGNOFF_LINES,
};
