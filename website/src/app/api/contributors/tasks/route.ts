import { NextRequest, NextResponse } from "next/server";
import { getDb, logAudit, createNotification, awardAchievement } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    let sql = `
      SELECT t.id, t.title, t.category, t.difficulty, t.description, t.requirements,
             t.status, t.issue_url, t.pr_url, t.reward_xp, t.assigned_to, t.created_at,
             u.display_name as assignee_name, u.username as assignee_username
      FROM contribution_tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      sql += " AND t.category = ?";
      params.push(category);
    }
    if (status) {
      sql += " AND t.status = ?";
      params.push(status);
    }

    sql += " ORDER BY CASE t.status WHEN 'open' THEN 1 WHEN 'assigned' THEN 2 WHEN 'in_review' THEN 3 ELSE 4 END, t.created_at DESC";

    const rows = db.prepare(sql).all(...params) as any[];

    const data = rows.map((r) => {
      let reqs = [];
      try {
        reqs = JSON.parse(r.requirements);
      } catch {
        reqs = [];
      }
      return {
        ...r,
        requirements: reqs,
      };
    });

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    console.error("Contributor tasks GET error:", err);
    return NextResponse.json({ success: false, error: "Gagal memuat daftar tugas kontribusi." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Autentikasi diperlukan." }, { status: 401 });
    }

    const body = await req.json();
    const { action, taskId, prUrl, title, category, difficulty, description, requirements, rewardXp } = body;
    const db = getDb();
    const now = new Date().toISOString();

    if (action === "claim") {
      if (!taskId) {
        return NextResponse.json({ success: false, error: "ID tugas diperlukan." }, { status: 400 });
      }

      const task = db.prepare("SELECT * FROM contribution_tasks WHERE id = ?").get(taskId) as any;
      if (!task) {
        return NextResponse.json({ success: false, error: "Tugas tidak ditemukan." }, { status: 404 });
      }
      if (task.status !== "open") {
        return NextResponse.json({ success: false, error: "Tugas sudah diambil atau ditutup." }, { status: 400 });
      }

      db.prepare(`
        UPDATE contribution_tasks 
        SET assigned_to = ?, status = 'assigned', updated_at = ? 
        WHERE id = ?
      `).run(user.id, now, taskId);

      logAudit(user.id, "claim_contribution_task", "contribution", taskId);
      createNotification(
        user.id,
        "Tugas Kontribusi Berhasil Diambil",
        `Anda telah memilih tugas "${task.title}". Selesaikan dan lampirkan tautan Pull Request setelah siap.`,
        "info",
        "/contributors"
      );

      return NextResponse.json({ success: true, message: "Tugas berhasil diklaim untuk Anda kerjakan." });
    }

    if (action === "submit_pr") {
      if (!taskId || !prUrl) {
        return NextResponse.json({ success: false, error: "ID tugas dan tautan PR GitHub wajib diisi." }, { status: 400 });
      }

      const task = db.prepare("SELECT * FROM contribution_tasks WHERE id = ?").get(taskId) as any;
      if (!task) {
        return NextResponse.json({ success: false, error: "Tugas tidak ditemukan." }, { status: 404 });
      }
      if (task.assigned_to !== user.id && user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Anda tidak terdaftar sebagai pengerja tugas ini." }, { status: 403 });
      }

      db.prepare(`
        UPDATE contribution_tasks 
        SET pr_url = ?, status = 'in_review', updated_at = ? 
        WHERE id = ?
      `).run(prUrl.trim(), now, taskId);

      logAudit(user.id, "submit_task_pr", "contribution", taskId, `PR: ${prUrl}`);
      createNotification(
        user.id,
        "Pull Request Berhasil Diajukan",
        `PR untuk tugas "${task.title}" sedang diverifikasi oleh Maintainer Repositori.`,
        "info",
        "/contributors"
      );

      return NextResponse.json({ success: true, message: "Tautan PR berhasil disubmit untuk proses review." });
    }

    // Admin creates task
    if (action === "create_task") {
      if (user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Hanya admin yang dapat mempublikasikan tugas kontribusi baru." }, { status: 403 });
      }

      const id = `task-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`;
      const reqsJson = Array.isArray(requirements) ? JSON.stringify(requirements) : "[]";

      db.prepare(`
        INSERT INTO contribution_tasks (
          id, title, category, difficulty, description, requirements,
          status, issue_url, reward_xp, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)
      `).run(
        id,
        title.trim(),
        category || "module",
        difficulty || "medium",
        description.trim(),
        reqsJson,
        body.issueUrl || "",
        rewardXp || 50,
        user.id,
        now,
        now
      );

      return NextResponse.json({ success: true, message: "Tugas kontribusi baru berhasil dipublikasikan.", taskId: id });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err: any) {
    console.error("Contributor tasks POST error:", err);
    return NextResponse.json({ success: false, error: "Gagal memproses aksi tugas kontribusi." }, { status: 500 });
  }
}
