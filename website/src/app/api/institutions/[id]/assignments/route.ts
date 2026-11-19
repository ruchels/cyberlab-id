import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
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
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const classId = searchParams.get("classId");

    let query = `
      SELECT a.*, c.title as course_title, c.code as course_code,
             cls.name as class_name, u.display_name as creator_name,
             (SELECT COUNT(*) FROM institution_submissions WHERE assignment_id = a.id) as submission_count,
             (SELECT score FROM institution_submissions WHERE assignment_id = a.id AND user_id = ?) as my_score,
             (SELECT id FROM institution_submissions WHERE assignment_id = a.id AND user_id = ?) as my_submission_id
      FROM institution_course_assignments a
      JOIN institution_courses c ON a.course_id = c.id
      LEFT JOIN institution_classes cls ON a.class_id = cls.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.institution_id = ?
    `;
    const queryParams: any[] = [user.id, user.id, inst.id];

    if (courseId) {
      query += ` AND a.course_id = ?`;
      queryParams.push(courseId);
    }
    if (classId) {
      query += ` AND a.class_id = ?`;
      queryParams.push(classId);
    }

    query += ` ORDER BY a.due_date ASC`;
    const assignments = db.prepare(query).all(...queryParams);

    return NextResponse.json({ assignments });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/assignments error:", error);
    return NextResponse.json({ error: "Gagal memuat tugas kursus" }, { status: 500 });
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
    const { course_id, class_id, title, instructions, due_date, max_score = 100 } = body;

    if (!course_id || !title || !due_date) {
      return NextResponse.json({ error: "course_id, judul tugas, dan batas waktu (due_date) wajib diisi" }, { status: 400 });
    }

    const db = getDb();
    // IDOR check: Verify course belongs to this institution
    const course = db.prepare("SELECT id FROM institution_courses WHERE id = ? AND institution_id = ?").get(course_id, inst.id);
    if (!course) {
      return NextResponse.json({ error: "Kursus tidak ditemukan pada institusi ini" }, { status: 404 });
    }

    const assignmentId = `iasg_${inst.id.slice(-4)}_${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO institution_course_assignments (
        id, institution_id, course_id, class_id, title, instructions, due_date, max_score, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      assignmentId,
      inst.id,
      course_id,
      class_id || null,
      title.trim(),
      instructions || "",
      due_date,
      max_score,
      user.id,
      now
    );

    logTenantAudit(inst.id, user.id, "ASSIGNMENT_CREATED", "assignment", assignmentId, { title, course_id });

    return NextResponse.json({ success: true, assignment_id: assignmentId, message: "Tugas berhasil dibuat" });
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/assignments error:", error);
    return NextResponse.json({ error: "Gagal membuat tugas: " + error.message }, { status: 500 });
  }
}
