import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const institutionId = searchParams.get("institutionId");

    let query = `
      SELECT a.*, r.rule_name, r.mitre_technique_id, r.mitre_tactic,
             u.display_name as analyst_name
      FROM soc_alerts a
      LEFT JOIN soc_detection_rules r ON a.rule_id = r.id
      LEFT JOIN users u ON a.assigned_analyst_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (institutionId) {
      query += " AND (a.institution_id = ? OR a.institution_id IS NULL)";
      params.push(institutionId);
    }
    if (status) {
      query += " AND a.status = ?";
      params.push(status);
    }
    if (severity) {
      query += " AND a.severity = ?";
      params.push(severity);
    }

    query += " ORDER BY a.detected_at DESC LIMIT 100";
    const alerts = db.prepare(query).all(...params);

    const parsedAlerts = alerts.map((alr: any) => ({
      ...alr,
      source_event_ids: typeof alr.source_event_ids === "string" ? JSON.parse(alr.source_event_ids || "[]") : alr.source_event_ids,
      indicators: typeof alr.indicators === "string" ? JSON.parse(alr.indicators || "[]") : alr.indicators,
    }));

    return NextResponse.json({ alerts: parsedAlerts });
  } catch (error: any) {
    console.error("GET /api/soc/alerts error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar alert" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const { title, description, severity = "medium", affected_asset, indicators = [] } = body;

    if (!title) return NextResponse.json({ error: "Judul alert wajib diisi" }, { status: 400 });

    const alertId = `alr_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date().toISOString();
    const db = getDb();

    db.prepare(`
      INSERT INTO soc_alerts (
        id, title, description, severity, status, affected_asset, indicators, confidence,
        assigned_analyst_id, resolution_notes, is_simulation, detected_at, updated_at
      ) VALUES (?, ?, ?, ?, 'new', ?, ?, 'medium', ?, '', 1, ?, ?)
    `).run(
      alertId,
      title.trim(),
      description || "",
      severity,
      affected_asset || "General Asset",
      JSON.stringify(indicators),
      user.id,
      now,
      now
    );

    return NextResponse.json({ success: true, alert_id: alertId, message: "Alert manual berhasil dibuat" });
  } catch (error: any) {
    console.error("POST /api/soc/alerts error:", error);
    return NextResponse.json({ error: "Gagal membuat alert: " + error.message }, { status: 500 });
  }
}
