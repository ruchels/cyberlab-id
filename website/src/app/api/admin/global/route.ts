import { NextRequest, NextResponse } from "next/server";
import { getDb, logAudit, createNotification, awardAchievement } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses ditolak: Hak administrator diperlukan." }, { status: 403 });
    }

    const db = getDb();

    // 1. Partnership Applications
    const applications = db
      .prepare(
        `SELECT pa.*, u.username as applicant_username, u.display_name as applicant_name
         FROM partnership_applications pa
         LEFT JOIN users u ON pa.applicant_user_id = u.id
         ORDER BY CASE pa.status WHEN 'pending' THEN 1 WHEN 'under_review' THEN 2 ELSE 3 END, pa.created_at DESC`
      )
      .all() as any[];

    // 2. Verified Partnerships
    const partners = db
      .prepare("SELECT * FROM partnerships ORDER BY country ASC, organization_name ASC")
      .all() as any[];

    // 3. Contribution Tasks
    const tasks = db
      .prepare(
        `SELECT ct.*, u.display_name as assignee_name, u.username as assignee_username
         FROM contribution_tasks ct
         LEFT JOIN users u ON ct.assigned_to = u.id
         ORDER BY CASE ct.status WHEN 'in_review' THEN 1 WHEN 'open' THEN 2 ELSE 3 END, ct.created_at DESC`
      )
      .all() as any[];

    // 4. Developer API Keys Stats
    const apiKeys = db
      .prepare(
        `SELECT k.id, k.key_name, k.key_prefix, k.scopes, k.rate_limit_per_minute,
                k.total_requests, k.last_used_at, k.is_revoked, k.created_at,
                u.username, u.display_name
         FROM developer_api_keys k
         JOIN users u ON k.user_id = u.id
         ORDER BY k.created_at DESC`
      )
      .all() as any[];

    // 5. External Knowledge Cache Summary
    const cacheSummary = db
      .prepare(
        `SELECT source_type, count(*) as count, max(cached_at) as last_cached
         FROM external_knowledge_cache
         GROUP BY source_type`
      )
      .all() as any[];

    return NextResponse.json({
      success: true,
      data: {
        applications,
        partners,
        tasks,
        apiKeys,
        cacheSummary,
      },
    });
  } catch (err: any) {
    console.error("Admin global GET error:", err);
    return NextResponse.json({ success: false, error: "Gagal memuat data administrasi global." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Akses ditolak: Hak administrator diperlukan." }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const db = getDb();
    const now = new Date().toISOString();

    if (action === "review_partnership") {
      const { applicationId, status, reviewNotes } = body;
      if (!applicationId || !["approved", "rejected", "under_review"].includes(status)) {
        return NextResponse.json({ success: false, error: "Data review tidak valid." }, { status: 400 });
      }

      const app = db.prepare("SELECT * FROM partnership_applications WHERE id = ?").get(applicationId) as any;
      if (!app) {
        return NextResponse.json({ success: false, error: "Aplikasi kemitraan tidak ditemukan." }, { status: 404 });
      }

      db.prepare(`
        UPDATE partnership_applications 
        SET status = ?, review_notes = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(status, reviewNotes || "", user.id, now, now, applicationId);

      // If approved, create/update official entry in partnerships table
      if (status === "approved") {
        const partnerId = `part-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6)}`;
        db.prepare(`
          INSERT INTO partnerships (
            id, organization_name, org_type, country, city, website_url, logo_url,
            description, status, contact_name, contact_email, is_contact_public,
            collaboration_categories, partnership_agreement_ref, verified_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, '', ?, 'Shield', ?, 'approved', ?, ?, 0, '["curriculum","mentorship"]', ?, ?, ?, ?)
        `).run(
          partnerId,
          app.org_name,
          app.org_type,
          app.country,
          app.website_url,
          app.proposed_collaboration,
          app.contact_name,
          app.contact_email,
          `APP-${applicationId}`,
          now,
          now,
          now
        );

        if (app.applicant_user_id) {
          awardAchievement(app.applicant_user_id, "ach_global-collaborator");
          createNotification(
            app.applicant_user_id,
            "Kemitraan Resmi Disetujui!",
            `Selamat! Kemitraan dengan ${app.org_name} telah resmi disetujui dan ditayangkan di Direktori Mitra Global CyberLab-ID.`,
            "achievement",
            "/partnerships"
          );
        }
      }

      logAudit(user.id, `partnership_${status}`, "partnership_app", applicationId);
      return NextResponse.json({ success: true, message: `Status kemitraan berhasil diperbarui menjadi ${status}.` });
    }

    if (action === "review_task") {
      const { taskId, status } = body; // 'completed' or 'open' (rejected PR)
      const task = db.prepare("SELECT * FROM contribution_tasks WHERE id = ?").get(taskId) as any;
      if (!task) {
        return NextResponse.json({ success: false, error: "Tugas tidak ditemukan." }, { status: 404 });
      }

      db.prepare("UPDATE contribution_tasks SET status = ?, updated_at = ? WHERE id = ?").run(status, now, taskId);

      if (status === "completed" && task.assigned_to) {
        // Award XP and achievement to contributor
        db.prepare("UPDATE users SET total_xp = total_xp + ?, updated_at = ? WHERE id = ?").run(
          task.reward_xp,
          now,
          task.assigned_to
        );
        awardAchievement(task.assigned_to, "ach_open-source-hero");
        createNotification(
          task.assigned_to,
          "Kontribusi Open Source Diterima!",
          `Tugas "${task.title}" telah disetujui (+${task.reward_xp} XP). Terima kasih atas kontribusi Anda pada ekosistem siber Indonesia!`,
          "achievement",
          "/contributors"
        );
      }

      logAudit(user.id, `task_${status}`, "contribution_task", taskId);
      return NextResponse.json({ success: true, message: `Status tugas kontribusi diperbarui menjadi ${status}.` });
    }

    if (action === "admin_revoke_key") {
      const { keyId } = body;
      db.prepare("UPDATE developer_api_keys SET is_revoked = 1 WHERE id = ?").run(keyId);
      logAudit(user.id, "admin_revoke_api_key", "developer_key", keyId);
      return NextResponse.json({ success: true, message: "Developer API Key berhasil dicabut oleh administrator." });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err: any) {
    console.error("Admin global POST error:", err);
    return NextResponse.json({ success: false, error: "Gagal memproses aksi administrasi global." }, { status: 500 });
  }
}
