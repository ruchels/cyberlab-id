import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, awardAchievement, logAudit } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get("institutionId");

    let query = `
      SELECT f.*, u.display_name as lead_investigator_name
      FROM soc_forensic_cases f
      LEFT JOIN users u ON f.lead_investigator_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (institutionId) {
      query += " AND (f.institution_id = ? OR f.institution_id IS NULL)";
      params.push(institutionId);
    }

    query += " ORDER BY f.created_at DESC";
    const cases = db.prepare(query).all(...params);

    const parsedCases = cases.map((c: any) => ({
      ...c,
      evidence_inventory: typeof c.evidence_inventory === "string" ? JSON.parse(c.evidence_inventory || "[]") : c.evidence_inventory,
    }));

    return NextResponse.json({ cases: parsedCases });
  } catch (error: any) {
    console.error("GET /api/soc/forensics error:", error);
    return NextResponse.json({ error: "Gagal memuat kasus digital forensik" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const { title, description, evidence_items = [], institution_id = null } = body;

    if (!title) return NextResponse.json({ error: "Judul kasus forensik wajib diisi" }, { status: 400 });

    const db = getDb();
    const now = new Date().toISOString();
    const caseCount = (db.prepare("SELECT COUNT(*) as c FROM soc_forensic_cases").get() as any).c + 1;
    const caseNumber = `FC-${new Date().getFullYear()}-${String(caseCount).padStart(3, "0")}`;
    const caseId = `fcase_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    // Process evidence items and calculate integrity hash if payload content is supplied
    const processedEvidence = evidence_items.map((ev: any, idx: number) => {
      const sha256 = ev.content
        ? crypto.createHash("sha256").update(ev.content).digest("hex")
        : ev.sha256 || crypto.createHash("sha256").update(`${ev.name}:${now}`).digest("hex");

      return {
        id: `evd_${Date.now().toString().slice(-4)}_${idx + 1}`,
        name: ev.name || `Evidence_${idx + 1}`,
        type: ev.type || "disk_image",
        sha256,
        acquired_at: now,
        acquired_by: user.display_name,
        custody_log: ev.custody_log || "Diakuisisi dan dihitung checksum hash SHA-256 oleh investigator.",
      };
    });

    db.prepare(`
      INSERT INTO soc_forensic_cases (
        id, institution_id, case_number, title, description, lead_investigator_id,
        status, evidence_inventory, findings_summary, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, '', ?, ?)
    `).run(
      caseId,
      institution_id,
      caseNumber,
      title.trim(),
      description || "",
      user.id,
      JSON.stringify(processedEvidence),
      now,
      now
    );

    // Award forensic investigator achievement
    awardAchievement(user.id, "ach_forensic-investigator");
    logAudit(user.id, "FORENSIC_CASE_CREATED", "soc_forensics", caseId, `Created case ${caseNumber}`);

    return NextResponse.json({
      success: true,
      case_id: caseId,
      case_number: caseNumber,
      evidence_count: processedEvidence.length,
      message: `Kasus forensik ${caseNumber} berhasil dibuat dengan ${processedEvidence.length} artefak bukti ber-hash SHA-256.`,
    });
  } catch (error: any) {
    console.error("POST /api/soc/forensics error:", error);
    return NextResponse.json({ error: "Gagal membuat kasus forensik: " + error.message }, { status: 500 });
  }
}
