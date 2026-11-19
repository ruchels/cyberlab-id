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

    const courses = db
      .prepare(`
        SELECT c.*, u.display_name as instructor_name,
               (SELECT COUNT(*) FROM institution_course_assignments WHERE course_id = c.id) as assignment_count
        FROM institution_courses c
        LEFT JOIN users u ON c.instructor_user_id = u.id
        WHERE c.institution_id = ?
        ORDER BY c.created_at DESC
      `)
      .all(inst.id);

    const parsedCourses = courses.map((course: any) => ({
      ...course,
      syllabus: typeof course.syllabus === "string" ? JSON.parse(course.syllabus || "[]") : course.syllabus,
      module_ids: typeof course.module_ids === "string" ? JSON.parse(course.module_ids || "[]") : course.module_ids,
    }));

    return NextResponse.json({ courses: parsedCourses });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/courses error:", error);
    return NextResponse.json({ error: "Gagal memuat kursus institusi" }, { status: 500 });
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
    const { title, code, description, syllabus = [], module_ids = [], visibility = "class_only", status = "published" } = body;

    if (!title || !code) {
      return NextResponse.json({ error: "Judul kursus dan kode mata kuliah wajib diisi" }, { status: 400 });
    }

    const courseId = `icrs_${inst.id.slice(-4)}_${code.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const db = getDb();

    db.prepare(`
      INSERT INTO institution_courses (
        id, institution_id, title, code, description, syllabus, module_ids,
        instructor_user_id, visibility, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      courseId,
      inst.id,
      title.trim(),
      code.toUpperCase().trim(),
      description || "",
      JSON.stringify(syllabus),
      JSON.stringify(module_ids),
      user.id,
      visibility,
      status,
      now,
      now
    );

    logTenantAudit(inst.id, user.id, "COURSE_CREATED", "course", courseId, { title, code });

    return NextResponse.json({ success: true, course_id: courseId, message: "Kursus institusi berhasil dibuat" });
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/courses error:", error);
    return NextResponse.json({ error: "Gagal membuat kursus: " + error.message }, { status: 500 });
  }
}
