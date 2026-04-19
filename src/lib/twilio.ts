/**
 * Minimal Twilio helper. If TWILIO_* env vars are missing, sendSms() returns
 * false and logs a note — callers should treat SMS as best-effort.
 * Uses the Twilio REST API directly (no SDK dep) via fetch.
 */

interface SendSmsInput {
  to: string;
  body: string;
}

export async function sendSms({ to, body }: SendSmsInput): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return false;
  }

  const normalizedTo = normalizeToE164(to);
  if (!normalizedTo) {
    console.warn("sendSms: invalid recipient", to);
    return false;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({ To: normalizedTo, From: fromNumber, Body: body });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    console.error("sendSms failed:", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

export function isSmsConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

function normalizeToE164(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (input.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}
