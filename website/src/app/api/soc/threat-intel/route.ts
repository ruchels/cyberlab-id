import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, awardAchievement, logAudit } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { lookupThreatIntelligence } from "@/lib/server/soc-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ioc = searchParams.get("ioc");

    if (ioc) {
      const match = lookupThreatIntelligence(ioc);
      return NextResponse.json({
        query: ioc,
        found: match !== null,
        data: match,
      });
    }

    const db = getDb();
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");

    let query = "SELECT * FROM soc_threat_indicators WHERE is_active = 1";
    const params: any[] = [];

    if (type) {
      query += " AND indicator_type = ?";
      params.push(type);
    }
    if (severity) {
      query += " AND severity = ?";
      params.push(severity);
    }

    query += " ORDER BY confidence_score DESC, last_observed_at DESC LIMIT 100";
    const indicators = db.prepare(query).all(...params);

    return NextResponse.json({ indicators });
  } catch (error: any) {
    console.error("GET /api/soc/threat-intel error:", error);
    return NextResponse.json({ error: "Gagal memuat intelijen ancaman" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const { indicator_type, indicator_value, source_attribution, confidence_score = 80, severity = "medium", context_notes = "" } = body;

    if (!indicator_type || !indicator_value || !source_attribution) {
      return NextResponse.json({ error: "indicator_type, indicator_value, dan source_attribution wajib diisi" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();
    const iocId = `ioc_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    db.prepare(`
      INSERT INTO soc_threat_indicators (
        id, indicator_type, indicator_value, source_attribution, confidence_score,
        severity, context_notes, first_observed_at, last_observed_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      iocId,
      indicator_type,
      indicator_value.trim(),
      source_attribution.trim(),
      confidence_score,
      severity,
      context_notes,
      now,
      now
    );

    // Award threat hunter achievement
    awardAchievement(user.id, "ach_threat-hunter");
    logAudit(user.id, "THREAT_INDICATOR_ADDED", "soc_ioc", iocId, `Added IoC ${indicator_value}`);

    return NextResponse.json({
      success: true,
      ioc_id: iocId,
      message: `Indikator ancaman "${indicator_value}" berhasil ditambahkan ke database threat intelligence.`,
    });
  } catch (error: any) {
    console.error("POST /api/soc/threat-intel error:", error);
    return NextResponse.json({ error: "Gagal menambahkan IoC: " + error.message }, { status: 500 });
  }
}
