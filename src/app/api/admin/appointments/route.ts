import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";
import { addCalendarEvent, updateCalendarEvent, cancelCalendarEvent } from "@/lib/google-calendar";
import { sendAppointmentEmail } from "@/lib/appointment-email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quoteId = searchParams.get("quote_id");

  if (!quoteId) {
    return NextResponse.json({ error: "quote_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("quote_id", Number(quoteId))
    .order("date_time", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }

  return NextResponse.json({ appointments: data });
}

export async function POST(request: Request) {
  const user = await getUser();
  const { quote_id, date_time, details, share_with_contact } = await request.json();

  if (!quote_id || !date_time) {
    return NextResponse.json({ error: "quote_id and date_time are required" }, { status: 400 });
  }

  // Get quote info for calendar event and email
  const { data: quote } = await supabase
    .from("quotes")
    .select("name, email, phone, service, vehicle")
    .eq("id", quote_id)
    .single();

  // Create Google Calendar event
  let googleEventId: string | null = null;
  try {
    const eventTitle = `${quote?.name || "Customer"} — ${quote?.service || "Appointment"}`;
    const attendees = share_with_contact && quote?.email ? [quote.email] : [];

    googleEventId = await addCalendarEvent({
      title: eventTitle,
      dateTime: date_time,
      description: [
        details || "",
        quote ? `Contact: ${quote.name}` : "",
        quote?.email ? `Email: ${quote.email}` : "",
        quote?.phone ? `Phone: ${quote.phone}` : "",
        quote?.vehicle ? `Vehicle: ${quote.vehicle}` : "",
      ].filter(Boolean).join("\n"),
      attendees,
    });
    console.log("Google Calendar event created:", googleEventId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Google Calendar error:", message);
  }

  const insertData: Record<string, unknown> = {
    quote_id,
    date_time,
    details: details?.trim() || null,
    status: "scheduled",
    share_with_contact: !!share_with_contact,
    google_event_id: googleEventId,
    created_by: user?.email || null,
    created_by_name: user?.name || null,
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }

  // Send email to contact if shared
  if (share_with_contact && quote?.email) {
    try {
      await sendAppointmentEmail({
        to: quote.email,
        contactName: quote.name,
        dateTime: date_time,
        details: details || "",
        service: quote.service,
      });
    } catch (err) {
      console.error("Appointment email error:", err);
    }
  }

  if (user) {
    await logAudit({
      user_id: user.id,
      user_email: user.email,
      action: "create_appointment",
      entity_type: "appointment",
      entity_id: data.id,
      changes: { quote_id, date_time, details, share_with_contact },
    });
  }

  return NextResponse.json({ appointment: data });
}

export async function PUT(request: Request) {
  const user = await getUser();
  const { id, date_time, details, share_with_contact } = await request.json();

  if (!id || !date_time) {
    return NextResponse.json({ error: "id and date_time are required" }, { status: 400 });
  }

  // Get existing appointment and quote info
  const { data: existing } = await supabase
    .from("appointments")
    .select("*, quotes(name, email, phone, service, vehicle)")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const quote = existing.quotes as { name: string; email: string; phone: string; service: string; vehicle: string } | null;

  // Update Google Calendar event if it exists
  if (existing.google_event_id) {
    try {
      const eventTitle = `${quote?.name || "Customer"} — ${quote?.service || "Appointment"}`;
      const attendees = share_with_contact && quote?.email ? [quote.email] : [];

      await updateCalendarEvent(existing.google_event_id, {
        title: eventTitle,
        dateTime: date_time,
        description: [
          details || "",
          quote ? `Contact: ${quote.name}` : "",
          quote?.email ? `Email: ${quote.email}` : "",
          quote?.phone ? `Phone: ${quote.phone}` : "",
          quote?.vehicle ? `Vehicle: ${quote.vehicle}` : "",
        ].filter(Boolean).join("\n"),
        attendees,
      });
    } catch (err) {
      console.error("Google Calendar update error:", err);
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      date_time,
      details: details?.trim() || null,
      share_with_contact: !!share_with_contact,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }

  if (user) {
    await logAudit({
      user_id: user.id,
      user_email: user.email,
      action: "update_appointment",
      entity_type: "appointment",
      entity_id: id,
      changes: { quote_id: existing.quote_id, date_time, details, share_with_contact },
    });
  }

  return NextResponse.json({ appointment: data });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  const { id, status } = await request.json();

  if (!id || status !== "cancelled") {
    return NextResponse.json({ error: "id and status='cancelled' are required" }, { status: 400 });
  }

  // Get the appointment to find google_event_id
  const { data: existing } = await supabase
    .from("appointments")
    .select("google_event_id")
    .eq("id", id)
    .single();

  // Cancel Google Calendar event
  if (existing?.google_event_id) {
    try {
      await cancelCalendarEvent(existing.google_event_id);
    } catch (err) {
      console.error("Google Calendar cancel error:", err);
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user?.email || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
  }

  if (user) {
    await logAudit({
      user_id: user.id,
      user_email: user.email,
      action: "cancel_appointment",
      entity_type: "appointment",
      entity_id: id,
    });
  }

  return NextResponse.json({ appointment: data });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
  }

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("appointments")
    .select("google_event_id, quote_id")
    .eq("id", id)
    .single();

  if (existing?.google_event_id) {
    try {
      await cancelCalendarEvent(existing.google_event_id);
    } catch (err) {
      console.error("Google Calendar delete error:", err);
    }
  }

  const { error } = await supabase.from("appointments").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "delete_appointment",
    entity_type: "appointment",
    entity_id: id,
    changes: { quote_id: existing?.quote_id },
  });

  return NextResponse.json({ success: true });
}
