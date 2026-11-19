import { NextRequest, NextResponse } from "next/server";
import { getDb, awardAchievement } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { validateTenantAccess, checkTenantQuota, logTenantAudit } from "@/lib/server/tenant-guard";

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
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    let query = `
      SELECT l.*, c.name as class_name, c.academic_term
      FROM institution_lab_assignments l
      JOIN institution_classes c ON l.class_id = c.id
      WHERE l.institution_id = ?
    `;
    const queryParams: any[] = [inst.id];

    if (classId) {
      query += ` AND l.class_id = ?`;
      queryParams.push(classId);
    }

    query += ` ORDER BY l.due_date ASC`;
    const labs = db.prepare(query).all(...queryParams);

    return NextResponse.json({ labs });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/labs error:", error);
    return NextResponse.json({ error: "Gagal memuat tugas praktikum range" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "instructor");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const body = await req.json();
    const { class_id, template_id, title, due_date, required_flag } = body;

    if (!class_id || !template_id || !title || !due_date) {
      return NextResponse.json({ error: "class_id, template_id, judul, dan due_date wajib diisi" }, { status: 400 });
    }

    // Check plan lab quota
    const quota = checkTenantQuota(inst.id, "labs");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: 403 });
    }

    const db = getDb();
    // IDOR check: verify class belongs to this institution
    const cls = db.prepare("SELECT id FROM institution_classes WHERE id = ? AND institution_id = ?").get(class_id, inst.id);
    if (!cls) {
      return NextResponse.json({ error: "Kelas tidak ditemukan pada institusi ini" }, { status: 404 });
    }

    const labId = `ilab_${inst.id.slice(-4)}_${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO institution_lab_assignments (id, institution_id, class_id, template_id, title, due_date, required_flag, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(labId, inst.id, class_id, template_id, title.trim(), due_date, required_flag || "", now);

    logTenantAudit(inst.id, user.id, "LAB_ASSIGNED", "lab_assignment", labId, { template_id, class_id });

    // Award range instructor achievement
    awardAchievement(user.id, "ach_range-instructor");

    return NextResponse.json({ success: true, lab_id: labId, message: "Praktikum Cyber Range berhasil ditugaskan" });
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/labs error:", error);
    return NextResponse.json({ error: "Gagal menugaskan praktikum: " + error.message }, { status: 500 });
  }
}
