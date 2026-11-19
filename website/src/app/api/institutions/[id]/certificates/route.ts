import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, awardAchievement, createNotification } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { validateTenantAccess, logTenantAudit } from "@/lib/server/tenant-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "student");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const db = getDb();
    const isInstructor = ["owner", "admin", "academic_director", "department_admin", "instructor"].includes(auth.memberRole || "");

    let query = `
      SELECT cert.*, u.display_name as student_name, u.email as student_email,
             c.title as course_title, c.code as course_code
      FROM institution_certificates cert
      JOIN users u ON cert.user_id = u.id
      LEFT JOIN institution_courses c ON cert.course_id = c.id
      WHERE cert.institution_id = ?
    `;
    const queryParams: any[] = [inst.id];

    if (!isInstructor && !auth.isPlatformAdmin) {
      query += ` AND cert.user_id = ?`;
      queryParams.push(user.id);
    }

    query += ` ORDER BY cert.created_at DESC`;
    const certificates = db.prepare(query).all(...queryParams);

    return NextResponse.json({ certificates });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/certificates error:", error);
    return NextResponse.json({ error: "Gagal memuat sertifikat institusi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    // Role check: Academic Director, Admin, or Owner required to issue institutional certificates
    const auth = validateTenantAccess(user.id, id, "academic_director");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const body = await req.json();
    const { user_id, course_id, title, issuing_authority, criteria } = body;

    if (!user_id || !title) {
      return NextResponse.json({ error: "user_id dan judul sertifikat wajib disertakan" }, { status: 400 });
    }

    const db = getDb();
    const targetUser = db.prepare("SELECT id, display_name, email FROM users WHERE id = ?").get(user_id) as any;
    if (!targetUser) {
      return NextResponse.json({ error: "Siswa penerima tidak ditemukan" }, { status: 404 });
    }

    const certId = `icert_${inst.id.slice(-4)}_${Date.now().toString().slice(-6)}`;
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const code = `CERT-${inst.slug.toUpperCase()}-${new Date().getFullYear()}-${randomHex}`;
    const hash = crypto.createHash("sha256").update(`${code}:${user_id}:${inst.id}`).digest("hex");
    const now = new Date().toISOString();
    const issueDate = now.split("T")[0];

    db.prepare(`
      INSERT INTO institution_certificates (
        id, institution_id, user_id, course_id, certificate_code, verification_hash,
        title, issue_date, issuing_authority, criteria, is_revoked, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      certId,
      inst.id,
      user_id,
      course_id || null,
      code,
      hash,
      title.trim(),
      issueDate,
      issuing_authority || inst.name,
      criteria || "Menyelesaikan seluruh modul praktikum dan evaluasi kelulusan institusi.",
      now
    );

    logTenantAudit(inst.id, user.id, "CERTIFICATE_ISSUED", "certificate", certId, { code, student_id: user_id });

    // Award achievement to recipient
    awardAchievement(user_id, "ach_certified-graduate");

    createNotification(
      user_id,
      "Sertifikat Kompetensi Diterbitkan!",
      `Selamat! Institusi ${inst.name} telah menerbitkan sertifikat ${title}. Kode verifikasi: ${code}`,
      "achievement",
      `/institutions/${inst.slug}`
    );

    return NextResponse.json({
      success: true,
      certificate_id: certId,
      certificate_code: code,
      verification_hash: hash,
      message: "Sertifikat resmi institusi berhasil diterbitkan",
    });
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/certificates error:", error);
    return NextResponse.json({ error: "Gagal menerbitkan sertifikat: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "admin");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const body = await req.json();
    const { certificate_id, is_revoked, revocation_reason } = body;

    if (!certificate_id) {
      return NextResponse.json({ error: "certificate_id wajib disertakan" }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE institution_certificates
      SET is_revoked = ?, revocation_reason = ?
      WHERE id = ? AND institution_id = ?
    `).run(is_revoked ? 1 : 0, revocation_reason || "Dicabut oleh administrator institusi", certificate_id, inst.id);

    logTenantAudit(inst.id, user.id, "CERTIFICATE_REVOCATION_UPDATED", "certificate", certificate_id, { is_revoked, revocation_reason });

    return NextResponse.json({ success: true, message: "Status sertifikat berhasil diperbarui" });
  } catch (error: any) {
    console.error("PATCH /api/institutions/[id]/certificates error:", error);
    return NextResponse.json({ error: "Gagal memperbarui sertifikat: " + error.message }, { status: 500 });
  }
}
