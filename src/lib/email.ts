import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Catalyst Motorsport <noreply@catalystmotorsport.com>";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  from?: string;
}

export async function sendEmail({ to, subject, html, text, replyTo, cc, from }: SendEmailInput) {
  const { error } = await resend.emails.send({
    from: from || FROM_EMAIL,
    to,
    subject,
    html,
    text,
    replyTo,
    cc,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error(error.message);
  }
}
