import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { validateTenantAccess, logTenantAudit } from "@/lib/server/tenant-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const inst = db
      .prepare("SELECT * FROM institutions WHERE id = ? OR slug = ?")
      .get(id, id) as any;

    if (!inst) {
      return NextResponse.json({ error: "Institusi tidak ditemukan" }, { status: 404 });
    }

    const user = await getSessionUser(req);
    let myMembership = null;

    if (user) {
      myMembership = db
        .prepare(`
          SELECT role, status, student_id_number, joined_at
          FROM institution_members
          WHERE institution_id = ? AND user_id = ?
        `)
        .get(inst.id, user.id);
    }

    // Aggregated real statistics
    const stats = {
      total_members: (db.prepare("SELECT COUNT(*) as c FROM institution_members WHERE institution_id = ?").get(inst.id) as any).c,
      total_departments: (db.prepare("SELECT COUNT(*) as c FROM institution_departments WHERE institution_id = ?").get(inst.id) as any).c,
      total_classes: (db.prepare("SELECT COUNT(*) as c FROM institution_classes WHERE institution_id = ?").get(inst.id) as any).c,
      total_courses: (db.prepare("SELECT COUNT(*) as c FROM institution_courses WHERE institution_id = ?").get(inst.id) as any).c,
      total_assignments: (db.prepare("SELECT COUNT(*) as c FROM institution_course_assignments WHERE institution_id = ?").get(inst.id) as any).c,
      total_certificates: (db.prepare("SELECT COUNT(*) as c FROM institution_certificates WHERE institution_id = ? AND is_revoked = 0").get(inst.id) as any).c,
    };

    return NextResponse.json({
      institution: inst,
      myMembership,
      stats,
    });
  } catch (error: any) {
    console.error("GET /api/institutions/[id] error:", error);
    return NextResponse.json({ error: "Gagal memuat detail institusi" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });
    }

    // Role check: Admin or Owner required
    const auth = validateTenantAccess(user.id, id, "admin");
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const inst = auth.institution;
    const body = await req.json();
    const { name, description, logo_url, brand_color, welcome_message, website_url, contact_email } = body;

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE institutions
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          logo_url = COALESCE(?, logo_url),
          brand_color = COALESCE(?, brand_color),
          welcome_message = COALESCE(?, welcome_message),
          website_url = COALESCE(?, website_url),
          contact_email = COALESCE(?, contact_email),
          updated_at = ?
      WHERE id = ?
    `).run(
      name,
      description,
      logo_url,
      brand_color,
      welcome_message,
      website_url,
      contact_email,
      now,
      inst.id
    );

    logTenantAudit(inst.id, user.id, "PROFILE_UPDATED", "institution", inst.id, { updated_fields: Object.keys(body) });

    return NextResponse.json({ success: true, message: "Pengaturan institusi berhasil diperbarui" });
  } catch (error: any) {
    console.error("PATCH /api/institutions/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui institusi: " + error.message }, { status: 500 });
  }
}
