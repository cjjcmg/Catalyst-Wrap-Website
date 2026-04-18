import Anthropic from "@anthropic-ai/sdk";
import { sendEmail } from "./email";

const WELCOME_FROM =
  process.env.RESEND_WELCOME_FROM_EMAIL ||
  "Catalyst Motorsport <team@catalystmotorsport.com>";
const TEAM_EMAIL = "team@catalystmotorsport.com";

const HYPE_MODEL = "claude-sonnet-4-6";
const HYPE_TIMEOUT_MS = 6000;

export type LeadKind = "lead" | "solicitation" | "partnership";

const FALLBACK_HYPE =
  "Your project is exactly the kind of work we live for. Our team is already mapping out the details, and we'll bring the same obsession to your build that we bring to every car that rolls through our bay. Keep your phone close — we'll be in touch very soon.";

const SYSTEM_PROMPT = `You write short email paragraphs for Catalyst Motorsport, a premium auto customization and brokerage shop in Anaheim, CA. We do vinyl wraps, window tint, paint protection film (PPF), ceramic coating, and premium vehicle customization/brokerage. We are NOT looking to buy services — we sell services to vehicle owners.

First, classify the inbound message into one of three kinds:
- "lead": a real customer asking about vehicle services (wrap, tint, PPF, ceramic, customization, wheels, accessories, install for their car/truck/SUV/etc.).
- "solicitation": someone pitching services TO us — web design, SEO, AI tools, marketing, staffing, lead-gen, "grow your business," generic "partner with us," etc. Template-style bulk outreach counts even when it asks us to share "offerings, pricing, case studies."
- "partnership": an explicit B2B partnership, collaboration, referral, reseller, or joint-project proposal — distinct from a vendor pitch.

Then write ONE paragraph (3–5 sentences, 60–110 words) appropriate to that kind. No emojis, no tired phrases like "take it to the next level" or "turn heads." Do not greet the customer or say "welcome." Do not sign off. Reference specifics from their message when possible.

Tone per kind:
- lead: confident, hype, like a pit crew chief who just saw the build come together in their head. Reference their specific service and vehicle. Make them want to keep their phone in their hand until we call.
- solicitation: polite, light sarcasm, a little levity. Make it clear Catalyst is an auto customization shop — we work on vehicles, not website backends or pitch decks. If their pitch somehow makes sense for a vehicle, invite them to submit a real request. Otherwise, thanks-but-no-thanks without being mean.
- partnership: direct and professional with a touch of dry wit. Ask them to email team@catalystmotorsport.com with a real proposal — scope, what they're actually proposing, how it fits auto customization. State plainly that we only respond to serious inquiries; generic templates don't get a reply.

Return ONLY a JSON object, no prose before or after, with this exact shape:
{"kind": "lead" | "solicitation" | "partnership", "paragraph": "..."}`;

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
  if (lead.message && lead.message !== request) lines.push(`Message: ${lead.message}`);
  if (lead.firstName && lead.firstName.trim()) lines.push(`First name: ${lead.firstName}`);
  if (vehicleParts) lines.push(`Vehicle: ${vehicleParts}`);
  return lines.join("\n");
}

export interface HypeResult {
  kind: LeadKind;
  paragraph: string;
}

function parseHypeJson(raw: string): HypeResult | null {
  // Strip markdown fences if the model wrapped the JSON.
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const kind = parsed?.kind;
    const paragraph = typeof parsed?.paragraph === "string" ? parsed.paragraph.trim() : "";
    if (!paragraph) return null;
    if (kind !== "lead" && kind !== "solicitation" && kind !== "partnership") return null;
    return { kind, paragraph };
  } catch {
    return null;
  }
}

export async function generateHypeParagraph(
  lead: WelcomeLead,
  client?: Anthropic
): Promise<HypeResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { kind: "lead", paragraph: FALLBACK_HYPE };
  }

  const anthropic = client || new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const userMessage = buildUserMessage(lead);
  if (!userMessage) return { kind: "lead", paragraph: FALLBACK_HYPE };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HYPE_TIMEOUT_MS);

  try {
    const response = await anthropic.messages.create(
      {
        model: HYPE_MODEL,
        max_tokens: 400,
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

    const parsed = parseHypeJson(text);
    if (parsed) return parsed;

    // Model returned non-JSON — use it as a lead paragraph if non-empty.
    return { kind: "lead", paragraph: text || FALLBACK_HYPE };
  } catch (err) {
    console.error("Hype paragraph generation failed:", err);
    return { kind: "lead", paragraph: FALLBACK_HYPE };
  } finally {
    clearTimeout(timer);
  }
}

const STATIC_OPENERS: Record<LeadKind, string> = {
  lead: "Welcome to Catalyst Motorsport! Thanks for reaching out — we just received your request and one of our agents will be in touch with you shortly.",
  solicitation: "Thanks for reaching out to Catalyst Motorsport.",
  partnership: "Thanks for reaching out to Catalyst Motorsport.",
};

const SUBJECTS: Record<LeadKind, string> = {
  lead: "Welcome to Catalyst Motorsport — we're on it",
  solicitation: "Thanks for the outreach — Catalyst Motorsport",
  partnership: "Partnership inquiries — Catalyst Motorsport",
};

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

export function buildWelcomeHtml(opener: string, hype: string, siteUrl: string): string {
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
                  ${escapeHtml(opener)}
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

export function buildWelcomeText(opener: string, hype: string): string {
  return [opener, "", hype, "", ...STATIC_SIGNOFF_LINES].join("\n");
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
  kind: LeadKind;
}

export async function composeWelcomeEmail(
  lead: WelcomeLead,
  anthropicClient?: Anthropic
): Promise<ComposedWelcomeEmail> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://catalystmotorsport.com";
  const { kind, paragraph } = await generateHypeParagraph(lead, anthropicClient);
  const opener = STATIC_OPENERS[kind];
  return {
    from: WELCOME_FROM,
    to: lead.email,
    cc: TEAM_EMAIL,
    replyTo: TEAM_EMAIL,
    subject: SUBJECTS[kind],
    html: buildWelcomeHtml(opener, paragraph, siteUrl),
    text: buildWelcomeText(opener, paragraph),
    hype: paragraph,
    kind,
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
  STATIC_OPENERS,
  STATIC_SIGNOFF_LINES,
  SUBJECTS,
};
