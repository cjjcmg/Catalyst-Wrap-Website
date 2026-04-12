import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface AppointmentEmailInput {
  to: string;
  contactName: string;
  dateTime: string;
  details: string;
  service: string;
}

export async function sendAppointmentEmail(input: AppointmentEmailInput) {
  const date = new Date(input.dateTime);
  const formatted = date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: input.to,
    subject: `Appointment Confirmed — Catalyst Motorsport`,
    html: `
      <h2>Your Appointment is Confirmed</h2>
      <p>Hi ${input.contactName},</p>
      <p>Your appointment with Catalyst Motorsport has been scheduled:</p>
      <table style="border-collapse:collapse;font-family:sans-serif;margin:16px 0;">
        <tr><td style="padding:6px 12px;font-weight:bold;">Date &amp; Time</td><td style="padding:6px 12px;">${formatted}</td></tr>
        <tr><td style="padding:6px 12px;font-weight:bold;">Service</td><td style="padding:6px 12px;">${input.service || "To be discussed"}</td></tr>
        ${input.details ? `<tr><td style="padding:6px 12px;font-weight:bold;">Details</td><td style="padding:6px 12px;">${input.details}</td></tr>` : ""}
      </table>
      <p>If you need to reschedule or cancel, please contact us at <a href="tel:7144421333">(714) 442-1333</a> or reply to this email.</p>
      <p style="margin-top:24px;">— Catalyst Motorsport</p>
      <p style="color:#888;font-size:12px;">1001 N Batavia St, Orange, CA 92867</p>
    `,
  });
}
