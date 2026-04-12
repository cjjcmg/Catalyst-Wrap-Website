import { google } from "googleapis";

/**
 * Google Calendar integration using a service account.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  — service account email
 *   GOOGLE_SERVICE_ACCOUNT_KEY    — private key (with \n line breaks)
 *   GOOGLE_CALENDAR_ID            — calendar ID for "Catalyst Wraps Shared"
 */

function getAuth() {
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "";
  // Handle both literal \n and escaped \\n from env vars
  key = key.replace(/\\n/g, "\n");
  // Also handle case where the key was JSON-stringified with extra quotes
  if (key.startsWith('"') && key.endsWith('"')) {
    key = JSON.parse(key);
  }

  if (!key || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    console.error("Google Calendar: Missing service account credentials");
  }

  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

interface CalendarEventInput {
  title: string;
  dateTime: string; // ISO string
  endDateTime?: string; // ISO string — if not provided, defaults to durationMinutes after start
  description: string;
  attendees: string[]; // email addresses
  durationMinutes?: number;
}

export async function addCalendarEvent(input: CalendarEventInput): Promise<string | null> {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const startTime = new Date(input.dateTime);
  const endTime = input.endDateTime
    ? new Date(input.endDateTime)
    : new Date(startTime.getTime() + (input.durationMinutes || 60) * 60 * 1000);

  const event = {
    summary: input.title,
    description: input.description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "America/Los_Angeles",
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "America/Los_Angeles",
    },
    attendees: input.attendees.map((email) => ({ email })),
  };

  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: event,
    sendUpdates: input.attendees.length > 0 ? "all" : "none",
  });

  return res.data.id || null;
}

export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput
): Promise<void> {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const startTime = new Date(input.dateTime);
  const endTime = input.endDateTime
    ? new Date(input.endDateTime)
    : new Date(startTime.getTime() + (input.durationMinutes || 60) * 60 * 1000);

  await calendar.events.update({
    calendarId: CALENDAR_ID,
    eventId,
    requestBody: {
      summary: input.title,
      description: input.description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "America/Los_Angeles",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "America/Los_Angeles",
      },
      attendees: input.attendees.map((email) => ({ email })),
    },
    sendUpdates: input.attendees.length > 0 ? "all" : "none",
  });
}

export async function cancelCalendarEvent(eventId: string): Promise<void> {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId,
    sendUpdates: "all",
  });
}
