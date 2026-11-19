import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { ingestAndEvaluateEvent } from "@/lib/server/soc-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);

    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const sourceType = searchParams.get("sourceType");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const search = searchParams.get("q")?.toLowerCase();
    const institutionId = searchParams.get("institutionId");

    let query = "SELECT * FROM soc_events WHERE 1=1";
    const params: any[] = [];

    if (institutionId) {
      query += " AND (institution_id = ? OR institution_id IS NULL)";
      params.push(institutionId);
    }
    if (sourceType) {
      query += " AND source_type = ?";
      params.push(sourceType);
    }
    if (severity) {
      query += " AND severity = ?";
      params.push(severity);
    }
    if (category) {
      query += " AND event_category = ?";
      params.push(category);
    }
    if (search) {
      query += " AND (LOWER(raw_payload) LIKE ? OR LOWER(source_host) LIKE ? OR LOWER(event_category) LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);

    const events = db.prepare(query).all(...params);

    const parsedEvents = events.map((e: any) => ({
      ...e,
      parsed_details: typeof e.parsed_details === "string" ? JSON.parse(e.parsed_details || "{}") : e.parsed_details,
    }));

    return NextResponse.json({ events: parsedEvents, count: parsedEvents.length });
  } catch (error: any) {
    console.error("GET /api/soc/events error:", error);
    return NextResponse.json({ error: "Gagal memuat event keamanan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json();
    const { raw_log, source_type = "web", institution_id = null, is_simulation = true } = body;

    if (!raw_log) {
      return NextResponse.json({ error: "Payload log (raw_log) wajib diisi" }, { status: 400 });
    }

    const result = ingestAndEvaluateEvent(raw_log, source_type, institution_id, is_simulation);

    return NextResponse.json({
      success: true,
      event: result.event,
      triggered_alerts_count: result.triggeredAlerts.length,
      triggered_alerts: result.triggeredAlerts,
      message:
        result.triggeredAlerts.length > 0
          ? `Event berhasil di-ingest. ${result.triggeredAlerts.length} alert terdeteksi oleh detection engine.`
          : "Event berhasil di-ingest. Tidak ada alert terpicu.",
    });
  } catch (error: any) {
    console.error("POST /api/soc/events error:", error);
    return NextResponse.json({ error: "Gagal memproses ingestion event: " + error.message }, { status: 500 });
  }
}
