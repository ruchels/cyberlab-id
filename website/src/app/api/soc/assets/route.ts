import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, logAudit } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get("institutionId");

    let query = "SELECT * FROM soc_assets WHERE 1=1";
    const params: any[] = [];
    if (institutionId) {
      query += " AND (institution_id = ? OR institution_id IS NULL)";
      params.push(institutionId);
    }

    query += " ORDER BY criticality DESC, name ASC";
    const assets = db.prepare(query).all(...params) as any[];

    // Fetch vulnerabilities for assets
    const assetIds = assets.map((a) => a.id);
    let vulnerabilities: any[] = [];
    if (assetIds.length > 0) {
      const placeholders = assetIds.map(() => "?").join(",");
      vulnerabilities = db.prepare(`SELECT * FROM soc_vulnerabilities WHERE asset_id IN (${placeholders})`).all(...assetIds);
    }

    const vulnMap: Record<string, any[]> = {};
    vulnerabilities.forEach((v) => {
      if (!vulnMap[v.asset_id]) vulnMap[v.asset_id] = [];
      vulnMap[v.asset_id].push(v);
    });

    const enrichedAssets = assets.map((a) => ({
      ...a,
      vulnerabilities: vulnMap[a.id] || [],
    }));

    return NextResponse.json({ assets: enrichedAssets });
  } catch (error: any) {
    console.error("GET /api/soc/assets error:", error);
    return NextResponse.json({ error: "Gagal memuat inventaris aset" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const { name, ip_address = "", hostname = "", category = "server", criticality = "medium", environment = "lab_simulation", institution_id = null } = body;

    if (!name) return NextResponse.json({ error: "Nama aset wajib diisi" }, { status: 400 });

    const db = getDb();
    const now = new Date().toISOString();
    const assetId = `ast_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    db.prepare(`
      INSERT INTO soc_assets (
        id, institution_id, name, ip_address, hostname, category, criticality, environment, owner_user_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', ?)
    `).run(
      assetId,
      institution_id,
      name.trim(),
      ip_address.trim(),
      hostname.trim(),
      category,
      criticality,
      environment,
      user.id,
      now
    );

    logAudit(user.id, "ASSET_ADDED", "soc_asset", assetId, `Added asset ${name}`);

    return NextResponse.json({ success: true, asset_id: assetId, message: "Aset berhasil ditambahkan ke inventaris" });
  } catch (error: any) {
    console.error("POST /api/soc/assets error:", error);
    return NextResponse.json({ error: "Gagal menambahkan aset: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const body = await req.json();
    const { vulnerability_id, remediation_status, remediation_notes } = body;

    if (!vulnerability_id || !remediation_status) {
      return NextResponse.json({ error: "vulnerability_id dan remediation_status wajib disertakan" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE soc_vulnerabilities
      SET remediation_status = ?,
          remediation_notes = COALESCE(?, remediation_notes),
          assigned_to = COALESCE(assigned_to, ?),
          updated_at = ?
      WHERE id = ?
    `).run(remediation_status, remediation_notes, user.id, now, vulnerability_id);

    return NextResponse.json({ success: true, message: `Status mitigasi kerentanan diperbarui menjadi ${remediation_status}` });
  } catch (error: any) {
    console.error("PATCH /api/soc/assets error:", error);
    return NextResponse.json({ error: "Gagal memperbarui mitigasi: " + error.message }, { status: 500 });
  }
}
