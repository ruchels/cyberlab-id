import { NextRequest, NextResponse } from "next/server";
import { getDb, logAudit, createNotification } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const country = searchParams.get("country");

    let sql = `
      SELECT id, organization_name, org_type, country, city, website_url, logo_url,
             description, status, collaboration_categories, verified_at, created_at,
             CASE WHEN is_contact_public = 1 THEN contact_name ELSE '' END as contact_name,
             CASE WHEN is_contact_public = 1 THEN contact_email ELSE '' END as contact_email
      FROM partnerships
      WHERE status = 'approved'
    `;
    const params: any[] = [];

    if (type) {
      sql += " AND org_type = ?";
      params.push(type);
    }
    if (country) {
      sql += " AND country = ?";
      params.push(country.toUpperCase());
    }

    sql += " ORDER BY country ASC, organization_name ASC";

    const rows = db.prepare(sql).all(...params) as any[];

    const data = rows.map((r) => {
      let cats = [];
      try {
        cats = JSON.parse(r.collaboration_categories);
      } catch {
        cats = [];
      }
      return {
        ...r,
        collaboration_categories: cats,
      };
    });

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    console.error("Partnership GET error:", err);
    return NextResponse.json({ success: false, error: "Gagal memuat daftar mitra." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const {
      orgName,
      orgType,
      country,
      websiteUrl,
      contactName,
      contactEmail,
      proposedCollaboration,
      supportingLinks,
    } = body;

    if (!orgName || !orgType || !country || !websiteUrl || !contactName || !contactEmail || !proposedCollaboration) {
      return NextResponse.json(
        { success: false, error: "Mohon lengkapi seluruh kolom formulir kemitraan yang wajib diisi." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json({ success: false, error: "Format email kontak tidak valid." }, { status: 400 });
    }

    const db = getDb();
    const id = `papp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const linksJson = Array.isArray(supportingLinks) ? JSON.stringify(supportingLinks) : "[]";

    db.prepare(`
      INSERT INTO partnership_applications (
        id, applicant_user_id, org_name, org_type, country, website_url,
        contact_name, contact_email, proposed_collaboration, supporting_links,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      id,
      user?.id || null,
      orgName.trim(),
      orgType,
      country.trim().toUpperCase(),
      websiteUrl.trim(),
      contactName.trim(),
      contactEmail.trim(),
      proposedCollaboration.trim(),
      linksJson,
      now,
      now
    );

    if (user?.id) {
      logAudit(user.id, "partnership_application_submitted", "partnership", id, `Diajukan oleh ${orgName}`);
      createNotification(
        user.id,
        "Pengajuan Kemitraan Terkirim",
        `Pengajuan kolaborasi dari ${orgName} telah diterima dan sedang ditinjau oleh Dewan Pengelola CyberLab-ID.`,
        "info",
        "/partnerships"
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pengajuan kemitraan institusi/komunitas berhasil dikirimkan dan menunggu peninjauan administrator.",
      applicationId: id,
    });
  } catch (err: any) {
    console.error("Partnership POST error:", err);
    return NextResponse.json({ success: false, error: "Gagal mengirimkan pengajuan kemitraan." }, { status: 500 });
  }
}
