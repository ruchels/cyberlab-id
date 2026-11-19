import { NextRequest, NextResponse } from "next/server";
import { getDb, hashString } from "@/lib/server/db";
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
    const isInstructor = ["owner", "admin", "academic_director", "department_admin", "instructor", "ta"].includes(auth.memberRole || "");

    const assessments = db
      .prepare(`
        SELECT a.*, c.name as class_name,
               (SELECT COUNT(*) FROM institution_assessment_attempts WHERE assessment_id = a.id) as attempt_count,
               (SELECT score FROM institution_assessment_attempts WHERE assessment_id = a.id AND user_id = ?) as my_score
        FROM institution_assessments a
        LEFT JOIN institution_classes c ON a.class_id = c.id
        WHERE a.institution_id = ?
        ORDER BY a.starts_at DESC
      `)
      .all(user.id, inst.id);

    // Sanitize questions for students (never expose answer_hash!)
    const sanitized = assessments.map((ass: any) => {
      let questions = [];
      try {
        questions = typeof ass.questions === "string" ? JSON.parse(ass.questions || "[]") : ass.questions;
      } catch {}

      if (!isInstructor && !auth.isPlatformAdmin) {
        questions = questions.map((q: any) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options,
          points: q.points,
        }));
      }

      return {
        ...ass,
        questions,
      };
    });

    return NextResponse.json({ assessments: sanitized });
  } catch (error: any) {
    console.error("GET /api/institutions/[id]/assessments error:", error);
    return NextResponse.json({ error: "Gagal memuat asesmen institusi" }, { status: 500 });
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
    const { class_id, title, description, time_limit_minutes = 60, questions = [], starts_at, ends_at } = body;

    if (!title || !starts_at || !ends_at || questions.length === 0) {
      return NextResponse.json({ error: "Judul, jadwal mulai/selesai, dan daftar soal wajib diisi" }, { status: 400 });
    }

    // Process questions and compute cryptographic answer hashes
    const secureQuestions = questions.map((q: any, idx: number) => ({
      id: q.id || `q_${idx + 1}`,
      prompt: q.prompt,
      options: q.options || [],
      answer_hash: hashString(q.correct_answer || q.answer),
      points: Number(q.points) || 10,
    }));

    const assessmentId = `iass_${inst.id.slice(-4)}_${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const db = getDb();

    db.prepare(`
      INSERT INTO institution_assessments (
        id, institution_id, class_id, title, description, time_limit_minutes, questions, starts_at, ends_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      assessmentId,
      inst.id,
      class_id || null,
      title.trim(),
      description || "",
      time_limit_minutes,
      JSON.stringify(secureQuestions),
      starts_at,
      ends_at,
      now
    );

    logTenantAudit(inst.id, user.id, "ASSESSMENT_CREATED", "assessment", assessmentId, { title, class_id });

    return NextResponse.json({ success: true, assessment_id: assessmentId, message: "Asesmen/CTF institusi berhasil dibuat" });
  } catch (error: any) {
    console.error("POST /api/institutions/[id]/assessments error:", error);
    return NextResponse.json({ error: "Gagal membuat asesmen: " + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Autentikasi diperlukan" }, { status: 401 });

    const auth = validateTenantAccess(user.id, id, "student");
    if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const inst = auth.institution;
    const body = await req.json();
    const { assessment_id, answers = {} } = body; // answers: { q1: "option_selected", ... }

    if (!assessment_id) {
      return NextResponse.json({ error: "assessment_id wajib disertakan" }, { status: 400 });
    }

    const db = getDb();
    const ass = db.prepare("SELECT * FROM institution_assessments WHERE id = ? AND institution_id = ?").get(assessment_id, inst.id) as any;
    if (!ass) {
      return NextResponse.json({ error: "Asesmen tidak ditemukan pada institusi ini" }, { status: 404 });
    }

    let questions = [];
    try {
      questions = typeof ass.questions === "string" ? JSON.parse(ass.questions || "[]") : ass.questions;
    } catch {}

    // Evaluate answers securely on server
    let totalScore = 0;
    let maxPossible = 0;

    for (const q of questions) {
      maxPossible += q.points || 10;
      const submittedAns = answers[q.id];
      if (submittedAns && hashString(submittedAns) === q.answer_hash) {
        totalScore += q.points || 10;
      }
    }

    const normalizedScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
    const attemptId = `iatt_${inst.id.slice(-4)}_${user.id.slice(-4)}_${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO institution_assessment_attempts (id, institution_id, assessment_id, user_id, score, answers, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(attemptId, inst.id, assessment_id, user.id, normalizedScore, JSON.stringify(answers), now);

    logTenantAudit(inst.id, user.id, "ASSESSMENT_SUBMITTED", "attempt", attemptId, { score: normalizedScore });

    return NextResponse.json({
      success: true,
      score: normalizedScore,
      earned_points: totalScore,
      max_points: maxPossible,
      message: `Asesmen selesai. Skor akhir Anda: ${normalizedScore}/100`,
    });
  } catch (error: any) {
    console.error("PUT /api/institutions/[id]/assessments error:", error);
    return NextResponse.json({ error: "Gagal memproses jawaban asesmen: " + error.message }, { status: 500 });
  }
}
