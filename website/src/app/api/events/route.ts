import { NextResponse } from "next/server";
import { getDb, logAudit, createNotification, awardAchievement } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const user = await getSessionUser(request);

    const events = db
      .prepare(`
        SELECT id, title, description, type, speaker_name, start_time, end_time,
               location_url, max_participants, registered_count, status, created_at
        FROM community_events
        ORDER BY start_time ASC
      `)
      .all() as any[];

    let userRegistrations: string[] = [];
    if (user) {
      const regRows = db
        .prepare(`SELECT event_id FROM event_registrations WHERE user_id = ?`)
        .all(user.id) as { event_id: string }[];
      userRegistrations = regRows.map((r) => r.event_id);
    }

    const enrichedEvents = events.map((ev) => ({
      ...ev,
      isRegistered: userRegistrations.includes(ev.id),
      isFull: ev.registered_count >= ev.max_participants,
    }));

    return NextResponse.json({
      success: true,
      events: enrichedEvents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, action = "register" } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const db = getDb();
    const event = db.prepare(`SELECT * FROM community_events WHERE id = ?`).get(eventId) as any;
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existing = db
      .prepare(`SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?`)
      .get(eventId, user.id);

    if (action === "cancel") {
      if (!existing) {
        return NextResponse.json({ error: "Not registered for this event" }, { status: 400 });
      }
      db.prepare(`DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?`).run(eventId, user.id);
      db.prepare(`UPDATE community_events SET registered_count = MAX(0, registered_count - 1) WHERE id = ?`).run(eventId);

      logAudit(user.id, "EVENT_UNREGISTER", `Unregistered from event: ${event.title}`);
      return NextResponse.json({ success: true, message: "Pendaftaran berhasil dibatalkan." });
    }

    // Register flow
    if (existing) {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 400 });
    }

    if (event.registered_count >= event.max_participants) {
      return NextResponse.json({ error: "Kuota event ini telah penuh" }, { status: 400 });
    }

    const regId = `reg_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO event_registrations (id, event_id, user_id, registered_at)
      VALUES (?, ?, ?, ?)
    `).run(regId, eventId, user.id, now);

    db.prepare(`
      UPDATE community_events SET registered_count = registered_count + 1 WHERE id = ?
    `).run(eventId);

    // Award event attendee achievement
    awardAchievement(user.id, "event-attendee");

    createNotification(
      user.id,
      "event",
      "Pendaftaran Event Dikonfirmasi",
      `Anda berhasil terdaftar di acara "${event.title}". Tautan akses: ${event.location_url}`,
      "/events"
    );

    logAudit(user.id, "EVENT_REGISTER", `Registered for event: ${event.title}`);

    return NextResponse.json({
      success: true,
      message: "Berhasil mendaftar event!",
      event: {
        ...event,
        registered_count: event.registered_count + 1,
        isRegistered: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process event registration" }, { status: 500 });
  }
}
