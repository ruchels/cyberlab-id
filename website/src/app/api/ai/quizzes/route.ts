import { NextResponse } from "next/server";
import { getDb, logAudit, awardAchievement, createNotification } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const status = searchParams.get("status") || "approved";

    const db = getDb();
    let query = "SELECT * FROM ai_quiz_drafts WHERE status = ?";
    const queryParams: any[] = [status];

    if (category && category !== "all") {
      query += " AND category = ?";
      queryParams.push(category);
    }
    if (difficulty && difficulty !== "all") {
      query += " AND difficulty = ?";
      queryParams.push(difficulty);
    }

    query += " ORDER BY created_at DESC LIMIT 50";

    const rawQuizzes = db.prepare(query).all(...queryParams) as any[];

    const quizzes = rawQuizzes.map((q) => {
      let options = [];
      try {
        options = JSON.parse(q.options);
      } catch {}
      return {
        ...q,
        options,
      };
    });

    return NextResponse.json({
      success: true,
      quizzes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch quizzes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;
    const db = getDb();
    const now = new Date().toISOString();

    // 1. Submit quiz completion
    if (action === "submit_quiz") {
      const { quizId, selectedAnswer } = body;
      const quiz = db.prepare("SELECT * FROM ai_quiz_drafts WHERE id = ?").get(quizId) as any;
      if (!quiz) {
        return NextResponse.json({ error: "Quiz question not found" }, { status: 404 });
      }

      const isCorrect = quiz.correct_answer.trim().toLowerCase() === selectedAnswer.trim().toLowerCase();

      if (isCorrect) {
        awardAchievement(user.id, "quiz-champion");
        db.prepare("UPDATE users SET total_xp = total_xp + 15, updated_at = ? WHERE id = ?").run(now, user.id);
      }

      return NextResponse.json({
        success: true,
        isCorrect,
        correctAnswer: quiz.correct_answer,
        explanation: quiz.explanation,
        xpAwarded: isCorrect ? 15 : 0,
      });
    }

    // 2. Admin/Curator: Generate draft question
    if (action === "generate") {
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
      }

      const { topic, category, difficulty = "intermediate", question, options, correctAnswer, explanation } = body;

      if (!topic || !question || !correctAnswer || !Array.isArray(options)) {
        return NextResponse.json({ error: "Topic, question, options, and correctAnswer are required" }, { status: 400 });
      }

      const id = `quiz_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

      db.prepare(`
        INSERT INTO ai_quiz_drafts (
          id, created_by, topic, category, difficulty, question, type, options, correct_answer, explanation, status, reviewer_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'multiple_choice', ?, ?, ?, 'draft', '', ?, ?)
      `).run(
        id,
        user.id,
        topic,
        category || "general",
        difficulty,
        question,
        JSON.stringify(options),
        correctAnswer,
        explanation || "",
        now,
        now
      );

      logAudit(user.id, "GENERATE_QUIZ_DRAFT", "ai_quiz_drafts", id, `Created draft quiz for topic ${topic}`);

      return NextResponse.json({
        success: true,
        quizId: id,
        message: "Draf kuis berhasil dibuat dan siap ditinjau oleh kurator.",
      });
    }

    // 3. Admin: Review draft
    if (action === "review") {
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
      }

      const { quizId, status, notes = "" } = body;
      if (!quizId || !["approved", "rejected", "draft"].includes(status)) {
        return NextResponse.json({ error: "Valid quizId and status required" }, { status: 400 });
      }

      db.prepare(`
        UPDATE ai_quiz_drafts
        SET status = ?, reviewer_notes = ?, updated_at = ?
        WHERE id = ?
      `).run(status, notes, now, quizId);

      logAudit(user.id, "REVIEW_QUIZ_DRAFT", "ai_quiz_drafts", quizId, `Status set to ${status}`);

      return NextResponse.json({
        success: true,
        message: `Kuis berhasil diubah ke status: ${status}`,
      });
    }

    return NextResponse.json({ error: "Unrecognized action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process quiz action" }, { status: 500 });
  }
}
