import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/server/api-v1-auth";
import { getDb } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const auth = authenticateApiKey(req, "read:events");
  if (!auth.authenticated) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const db = getDb();
    const events = db
      .prepare(
        `SELECT id, title, description, category, event_date, location, speaker_name,
                speaker_title, max_participants, registered_count, is_published, created_at
         FROM community_events
         WHERE is_published = 1
         ORDER BY event_date ASC`
      )
      .all() as any[];

    return NextResponse.json({
      success: true,
      apiVersion: "1.0",
      timestamp: new Date().toISOString(),
      count: events.length,
      data: events,
    });
  } catch (err: any) {
    console.error("API v1 events error:", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
