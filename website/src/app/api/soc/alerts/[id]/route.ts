import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, awardAchievement, logAudit } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const alert = db
      .prepare(`
        SELECT a.*, r.rule_name, r.mitre_technique_id, r.mitre_tactic, r.description as rule_description,
               u.display_name as analyst_name
        FROM soc_alerts a
        LEFT JOIN soc_detection_rules r ON a.rule_id = r.id
        LEFT JOIN users u ON a.assigned_analyst_id = u.id
        WHERE a.id = ?
      `)
      .get(id) as any;

    if (!alert) {
      return NextResponse.json({ error: "Alert tidak ditemukan" }, { status: 404 });
    }

    const eventIds = typeof alert.source_event_ids === "string" ? JSON.parse(alert.source_event_ids || "[]") : alert.source_event_ids;
    let events: any[] = [];
    if (eventIds.length > 0) {
      const placeholders = eventIds.map(() => "?").join(",");
      events = db.prepare(`SELECT * FROM soc_events WHERE id IN (${placeholders})`).all(...eventIds);
    }

    const notes = db
      .prepare(`
        SELECT n.*, u.display_name as author_name, u.avatar as author_avatar
        FROM soc_alert_notes n
        JOIN users u ON n.author_id = u.id
        WHERE n.alert_id = ?
        ORDER BY n.created_at ASC
      `)
      .all(id);

    return NextResponse.json({
      alert: {
        ...alert,
        source_event_ids: eventIds,
        indicators: typeof alert.indicators === "string" ? JSON.parse(alert.indicators || "[]") : alert.indicators,
      },
      events,
      notes,
    });
  } catch (error: any) {
    console.error("GET /api/soc/alerts/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat detail alert" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const { status, assigned_analyst_id, resolution_notes } = body;

    const validStatuses = ["new", "acknowledged", "investigating", "escalated", "resolved", "closed", "false_positive"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status alert tidak valid" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE soc_alerts
      SET status = COALESCE(?, status),
          assigned_analyst_id = COALESCE(?, assigned_analyst_id),
          resolution_notes = COALESCE(?, resolution_notes),
          updated_at = ?
      WHERE id = ?
    `).run(status, assigned_analyst_id, resolution_notes, now, id);

    logAudit(user.id, "ALERT_STATUS_UPDATED", "soc_alert", id, `Alert status updated to ${status}`);

    return NextResponse.json({ success: true, message: `Status alert diperbarui menjadi ${status}` });
  } catch (error: any) {
    console.error("PATCH /api/soc/alerts/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status alert: " + error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const { note_text, evidence_refs = [] } = body;

    if (!note_text) {
      return NextResponse.json({ error: "Teks catatan investigasi wajib diisi" }, { status: 400 });
    }

    const db = getDb();
    const noteId = `anot_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO soc_alert_notes (id, alert_id, author_id, note_text, evidence_refs, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(noteId, id, user.id, note_text.trim(), JSON.stringify(evidence_refs), now);

    // Auto update alert status to 'investigating' if it was 'new' or 'acknowledged'
    db.prepare(`
      UPDATE soc_alerts
      SET status = 'investigating', assigned_analyst_id = COALESCE(assigned_analyst_id, ?), updated_at = ?
      WHERE id = ? AND status IN ('new', 'acknowledged')
    `).run(user.id, now, id);

    // Award achievement to analyst
    awardAchievement(user.id, "ach_soc-analyst-tier1");

    return NextResponse.json({ success: true, note_id: noteId, message: "Catatan investigasi berhasil disimpan" });
  } catch (error: any) {
    console.error("POST /api/soc/alerts/[id] error:", error);
    return NextResponse.json({ error: "Gagal menambahkan catatan: " + error.message }, { status: 500 });
  }
}
