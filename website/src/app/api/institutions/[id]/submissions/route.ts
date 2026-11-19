import { NextRequest, NextResponse } from "next/server";
import { getDb, createNotification } from "@/lib/server/db";
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
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json({ error: "Parameter assignmentId wajib disertakan" }, { status: 400 });
    }

    const isInstructor = ["owner", "admin", "academic_director", "department_admin", "instructor", "ta"].includes(auth.memberRole || "");

    let query = `
      SELECT s.*, u.display_name as student_name, u.email as student_email,
             g.display_name as grader_name
      FROM institution_submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users g ON s.graded_by = g.id
      WHERE s.institution_id = ? AND s.assignment_id = ?
    `;
    const queryParams: any[] = [inst.id, assignmentId];

    // If not instructor/admin, limit query strictly to current student (Anti-IDOR)
    if (!isInstructor && !auth.isPlatformAdmin) {
      query += ` AND s.user_id = ?`;
      queryParams.push(user.id);
    }

    query += ` ORDER BY s.submitted_at DESC`;
    const submissions = db.prepare(query).all(...queryParams);

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/submissions error:", error);
    return NextResponse.json({ error: "Gagal memuat pengumpulan tugas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "student");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const body = await req.json();
    const { assignment_id, content, file_url } = body;

    if (!assignment_id || !content) {
      return NextResponse.json({ error: "assignment_id dan konten jawaban wajib diisi" }, { status: 400 });
    }

    const db = getDb();
    // IDOR check: verify assignment belongs to this institution
    const assignment = db.prepare("SELECT id, title FROM institution_course_assignments WHERE id = ? AND institution_id = ?").get(assignment_id, inst.id) as any;
    if (!assignment) {
      return NextResponse.json({ error: "Tugas tidak ditemukan pada institusi ini" }, { status: 404 });
    }

    const subId = `isub_${inst.id.slice(-4)}_${user.id.slice(-4)}_${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO institution_submissions (
        id, institution_id, assignment_id, user_id, content, file_url, score, feedback, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, '', ?)
      ON CONFLICT(assignment_id, user_id) DO UPDATE SET
        content = excluded.content,
        file_url = excluded.file_url,
        submitted_at = excluded.submitted_at
    `).run(subId, inst.id, assignment_id, user.id, content, file_url || "", now);

    logTenantAudit(inst.id, user.id, "ASSIGNMENT_SUBMITTED", "submission", subId, { assignment_id });

    return NextResponse.json({ success: true, submission_id: subId, message: "Tugas berhasil dikumpulkan" });
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/submissions error:", error);
    return NextResponse.json({ error: "Gagal mengumpulkan tugas: " + error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    // Role check: Instructor, TA, or Admin required for grading
    const auth = validateTenantAccess(user.id, id, "ta");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const body = await req.json();
    const { submission_id, score, feedback } = body;

    if (!submission_id || score === undefined) {
      return NextResponse.json({ error: "submission_id dan nilai (score) wajib disertakan" }, { status: 400 });
    }

    const db = getDb();
    const submission = db.prepare("SELECT user_id, assignment_id FROM institution_submissions WHERE id = ? AND institution_id = ?").get(submission_id, inst.id) as any;
    if (!submission) {
      return NextResponse.json({ error: "Pengumpulan tugas tidak ditemukan pada institusi ini" }, { status: 404 });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE institution_submissions
      SET score = ?, feedback = ?, graded_by = ?, graded_at = ?
      WHERE id = ? AND institution_id = ?
    `).run(score, feedback || "", user.id, now, submission_id, inst.id);

    logTenantAudit(inst.id, user.id, "SUBMISSION_GRADED", "submission", submission_id, { score, student_id: submission.user_id });

    createNotification(
      submission.user_id,
      "Tugas Anda Telah Dinilai!",
      `Nilai Anda: ${score}/100. Feedback instruktur: ${feedback ? feedback.slice(0, 80) : "Telah diverifikasi"}`,
      "info",
      `/institutions/${inst.slug}`
    );

    return NextResponse.json({ success: true, message: "Nilai dan feedback berhasil disimpan" });
  } catch (error: any) {
    console.error("PATCH /api/institutions/[id]/submissions error:", error);
    return NextResponse.json({ error: "Gagal menilai tugas: " + error.message }, { status: 500 });
  }
}
