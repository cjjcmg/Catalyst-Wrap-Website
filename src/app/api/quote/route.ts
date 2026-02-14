import { NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";

/*
  ─────────────────────────────────────────────────────────────
  Quote / Lead Submission API Route

  Currently: Logs submissions to a local JSON file.

  TODO: Wire up to your preferred service:
  - Email: Use Resend, SendGrid, or Nodemailer
  - CRM: Pipe to HubSpot, GoHighLevel, etc.
  - Notifications: Send a Slack/Discord webhook
  - Database: Store in Supabase, PlanetScale, etc.
  ─────────────────────────────────────────────────────────────
*/

interface QuoteSubmission {
  name: string;
  email: string;
  phone: string;
  service: string;
  vehicle: string;
  message: string;
  textUpdates: boolean;
  submittedAt: string;
}

const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "submissions.json");

async function getSubmissions(): Promise<QuoteSubmission[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveSubmission(submission: QuoteSubmission) {
  await mkdir(DATA_DIR, { recursive: true });
  const submissions = await getSubmissions();
  submissions.push(submission);
  await writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), "utf-8");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic server-side validation
    if (!body.name?.trim() || !body.email?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and phone are required." },
        { status: 400 }
      );
    }

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const submission: QuoteSubmission = {
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      service: body.service || "",
      vehicle: body.vehicle?.trim() || "",
      message: body.message?.trim() || "",
      textUpdates: !!body.textUpdates,
      submittedAt: new Date().toISOString(),
    };

    // Log to file
    await saveSubmission(submission);

    // Log to console for development
    console.log("📩 New quote submission:", submission);

    /*
      TODO: Add your integrations here. Examples:

      // Send email notification
      await sendEmail({
        to: "quotes@catalystmotorsport.com",
        subject: `New Quote Request from ${submission.name}`,
        body: formatEmailBody(submission),
      });

      // Push to CRM
      await pushToCRM(submission);

      // Send Slack notification
      await sendSlackWebhook(submission);
    */

    return NextResponse.json(
      { success: true, message: "Quote request received." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Quote submission error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
