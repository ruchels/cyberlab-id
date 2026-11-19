import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, awardAchievement, logAudit } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const institutionId = searchParams.get("institutionId");

    let query = `
      SELECT inc.*, u.display_name as lead_analyst_name
      FROM soc_incidents inc
      LEFT JOIN users u ON inc.lead_analyst_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (institutionId) {
      query += " AND (inc.institution_id = ? OR inc.institution_id IS NULL)";
      params.push(institutionId);
    }
    if (status) {
      query += " AND inc.status = ?";
      params.push(status);
    }
    if (severity) {
      query += " AND inc.severity = ?";
      params.push(severity);
    }
    if (category) {
      query += " AND inc.category = ?";
      params.push(category);
    }

    query += " ORDER BY inc.declared_at DESC";
    const incidents = db.prepare(query).all(...params);

    const parsed = incidents.map((inc: any) => ({
      ...inc,
      related_alert_ids: typeof inc.related_alert_ids === "string" ? JSON.parse(inc.related_alert_ids || "[]") : inc.related_alert_ids,
      affected_assets: typeof inc.affected_assets === "string" ? JSON.parse(inc.affected_assets || "[]") : inc.affected_assets,
      timeline_events: typeof inc.timeline_events === "string" ? JSON.parse(inc.timeline_events || "[]") : inc.timeline_events,
    }));

    return NextResponse.json({ incidents: parsed });
  } catch (error: any) {
    console.error("GET /api/soc/incidents error:", error);
    return NextResponse.json({ error: "Gagal memuat insiden keamanan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const {
      title,
      category = "account_compromise",
      severity = "high",
      related_alert_ids = [],
      affected_assets = [],
      containment_plan = "",
      institution_id = null,
    } = body;

    if (!title) return NextResponse.json({ error: "Judul insiden wajib diisi" }, { status: 400 });

    const db = getDb();
    const now = new Date().toISOString();
    const currentYear = new Date().getFullYear();
    const incCount = (db.prepare("SELECT COUNT(*) as c FROM soc_incidents").get() as any).c + 1;
    const incidentNumber = `INC-${currentYear}-${String(incCount).padStart(3, "0")}`;
    const incidentId = `inc_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const timeline = [
      {
        timestamp: now,
        description: `Insiden ${incidentNumber} dideklarasikan oleh analis ${user.display_name}.`,
        source: "Manual IR Declaration",
      },
    ];

    db.prepare(`
      INSERT INTO soc_incidents (
        id, institution_id, incident_number, title, category, severity, status,
        lead_analyst_id, related_alert_ids, affected_assets, timeline_events,
        containment_plan, eradication_plan, recovery_plan, lessons_learned,
        is_simulation, declared_at, resolved_at
      ) VALUES (?, ?, ?, ?, ?, 'initial_assessment', ?, ?, ?, ?, ?, '', '', '', 1, ?, NULL)
    `).run(
      incidentId,
      institution_id,
      incidentNumber,
      title.trim(),
      category,
      severity,
      user.id,
      JSON.stringify(related_alert_ids),
      JSON.stringify(affected_assets),
      JSON.stringify(timeline),
      containment_plan,
      now
    );

    // If related alerts exist, update their status to 'escalated'
    if (related_alert_ids.length > 0) {
      const placeholders = related_alert_ids.map(() => "?").join(",");
      db.prepare(`UPDATE soc_alerts SET status = 'escalated', updated_at = ? WHERE id IN (${placeholders})`).run(now, ...related_alert_ids);
    }

    // Award incident responder achievement
    awardAchievement(user.id, "ach_incident-responder");
    logAudit(user.id, "INCIDENT_DECLARED", "soc_incident", incidentId, `Declared incident ${incidentNumber}`);

    return NextResponse.json({
      success: true,
      incident_id: incidentId,
      incident_number: incidentNumber,
      message: `Insiden ${incidentNumber} berhasil dideklarasikan.`,
    });
  } catch (error: any) {
    console.error("POST /api/soc/incidents error:", error);
    return NextResponse.json({ error: "Gagal membuat insiden: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const { incident_id, status, containment_plan, eradication_plan, recovery_plan, lessons_learned } = body;

    if (!incident_id) {
      return NextResponse.json({ error: "incident_id wajib disertakan" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();
    let resolvedAt = null;

    if (status === "closure" || status === "post_review") {
      resolvedAt = now;
    }

    db.prepare(`
      UPDATE soc_incidents
      SET status = COALESCE(?, status),
          containment_plan = COALESCE(?, containment_plan),
          eradication_plan = COALESCE(?, eradication_plan),
          recovery_plan = COALESCE(?, recovery_plan),
          lessons_learned = COALESCE(?, lessons_learned),
          resolved_at = COALESCE(?, resolved_at)
      WHERE id = ?
    `).run(status, containment_plan, eradication_plan, recovery_plan, lessons_learned, resolvedAt, incident_id);

    logAudit(user.id, "INCIDENT_UPDATED", "soc_incident", incident_id, `Updated incident status to ${status}`);

    return NextResponse.json({ success: true, message: "Insiden berhasil diperbarui" });
  } catch (error: any) {
    console.error("PATCH /api/soc/incidents error:", error);
    return NextResponse.json({ error: "Gagal memperbarui insiden: " + error.message }, { status: 500 });
  }
}
