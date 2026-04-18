// One-off preview: simulates a Steve-Meyer-style solicitation and sends the
// resulting welcome email to chris@catalystmotorsport.com ONLY (no team@ cc).
// Run: node --import tsx scripts/send-solicitation-preview.mts

import { readFileSync } from "node:fs";

// Load .env.local before importing modules that read process.env.
const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { composeWelcomeEmail } = await import("../src/lib/welcome-email.ts");
const { resend } = await import("../src/lib/email.ts");

const PREVIEW_TO = "chris@catalystmotorsport.com";

const composed = await composeWelcomeEmail({
  firstName: "Steve",
  email: PREVIEW_TO,
  request: "other",
  serviceType: "other",
  message:
    "Hi,\n\nI'm Steve Meyer CEO of Shaw Construction. We're currently seeking partners for an upcoming project in your area and would like to learn about your services.\n\nPlease share details about your offerings, pricing, and any case studies or references.\n\nI look forward to your response.",
});

console.log(`Classified kind: ${composed.kind}`);
console.log(`Subject: ${composed.subject}`);
console.log(`Paragraph: ${composed.hype}`);
console.log("---");

const { data, error } = await resend.emails.send({
  from: composed.from,
  to: PREVIEW_TO,
  // NO cc — preview to chris only.
  replyTo: composed.replyTo,
  subject: `[PREVIEW] ${composed.subject}`,
  html: composed.html,
  text: composed.text,
});

if (error) {
  console.error("Resend error:", error);
  process.exit(1);
}
console.log("Sent:", data);
