import { NextResponse } from "next/server";
import { getDb, logAudit, createNotification, awardAchievement } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const db = getDb();

    // 1. Pending / all submissions
    const submissions = db
      .prepare(`
        SELECT s.*, u.username as author_username, u.display_name as author_name
        FROM contributor_submissions s
        JOIN users u ON s.user_id = u.id
        ORDER BY CASE WHEN s.status = 'submitted' THEN 0 ELSE 1 END, s.created_at DESC
        LIMIT 100
      `)
      .all();

    // 2. Pending / all research articles
    const articles = db
      .prepare(`
        SELECT a.*, u.username as author_username
        FROM research_articles a
        JOIN users u ON a.user_id = u.id
        ORDER BY CASE WHEN a.status = 'pending' THEN 0 ELSE 1 END, a.created_at DESC
        LIMIT 100
      `)
      .all();

    // 3. Certificates issued
    const certificates = db
      .prepare(`
        SELECT c.*, u.username, u.display_name, p.title as path_title
        FROM certificates c
        JOIN users u ON c.user_id = u.id
        JOIN academy_paths p ON c.path_id = p.id
        ORDER BY c.issued_at DESC
        LIMIT 100
      `)
      .all();

    // 4. Events
    const events = db
      .prepare(`
        SELECT * FROM community_events
        ORDER BY start_time DESC
        LIMIT 50
      `)
      .all();

    // 5. Competitions
    const competitions = db
      .prepare(`
        SELECT * FROM ctf_competitions
        ORDER BY start_time DESC
        LIMIT 50
      `)
      .all();

    return NextResponse.json({
      success: true,
      data: {
        submissions,
        articles,
        certificates,
        events,
        competitions,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load admin ecosystem data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;
    const db = getDb();

    if (action === "review_submission") {
      const { submissionId, decision, feedback = "" } = body;
      const sub = db.prepare(`SELECT * FROM contributor_submissions WHERE id = ?`).get(submissionId) as any;
      if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE contributor_submissions
        SET status = ?, reviewer_feedback = ?, reviewer_id = ?, updated_at = ?
        WHERE id = ?
      `).run(decision, feedback, user.id, now, submissionId);

      if (decision === "approved" || decision === "published") {
        awardAchievement(sub.user_id, "community-contributor");
        createNotification(
          sub.user_id,
          "contributor",
          "Kontribusi Diterima!",
          `Kontribusi proposal Anda "${sub.title}" telah disetujui (${decision}). Terima kasih atas partisipasi Anda!`,
          "/contributors"
        );
      } else if (decision === "rejected") {
        createNotification(
          sub.user_id,
          "contributor",
          "Pembaruan Proposal Kontribusi",
          `Proposal Anda "${sub.title}" membutuhkan revisi: ${feedback || "Silakan cek pedoman kontributor."}`,
          "/contributors"
        );
      }

      logAudit(user.id, "REVIEW_SUBMISSION", `Submission ${submissionId} reviewed as ${decision}`);
      return NextResponse.json({ success: true, message: `Status kontribusi diubah ke ${decision}` });
    }

    if (action === "review_article") {
      const { articleId, status } = body;
      const art = db.prepare(`SELECT * FROM research_articles WHERE id = ?`).get(articleId) as any;
      if (!art) return NextResponse.json({ error: "Article not found" }, { status: 404 });

      db.prepare(`UPDATE research_articles SET status = ? WHERE id = ?`).run(status, articleId);

      if (status === "published") {
        awardAchievement(art.user_id, "security-researcher");
        createNotification(
          art.user_id,
          "research",
          "Artikel Riset Dipublikasikan!",
          `Artikel riset Anda "${art.title}" telah diverifikasi dan dipublikasikan di Research Hub.`,
          `/research/${art.slug}`
        );
      }

      logAudit(user.id, "REVIEW_ARTICLE", `Article ${articleId} status set to ${status}`);
      return NextResponse.json({ success: true, message: `Status artikel diubah ke ${status}` });
    }

    if (action === "revoke_cert") {
      const { certId, reason } = body;
      const cert = db.prepare(`SELECT * FROM certificates WHERE id = ?`).get(certId) as any;
      if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

      db.prepare(`
        UPDATE certificates
        SET is_revoked = 1, revocation_reason = ?
        WHERE id = ?
      `).run(reason || "Dicabut oleh administrator atas pelanggaran integritas", certId);

      logAudit(user.id, "REVOKE_CERT", `Certificate ${certId} revoked: ${reason}`);
      return NextResponse.json({ success: true, message: "Sertifikat berhasil dicabut." });
    }

    if (action === "create_event") {
      const { title, description, type, speaker_name, start_time, end_time, location_url, max_participants } = body;
      if (!title || !speaker_name || !start_time || !end_time) {
        return NextResponse.json({ error: "Semua kolom event wajib diisi" }, { status: 400 });
      }

      const id = `ev_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO community_events (
          id, title, description, type, speaker_name, start_time, end_time, location_url, max_participants, registered_count, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'scheduled', ?)
      `).run(
        id,
        title,
        description || "",
        type || "workshop",
        speaker_name,
        start_time,
        end_time,
        location_url || "https://meet.cyberlab.id",
        max_participants || 100,
        now
      );

      logAudit(user.id, "CREATE_EVENT", `Created event: ${title}`);
      return NextResponse.json({ success: true, eventId: id, message: "Acara komunitas berhasil dibuat" });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process admin action" }, { status: 500 });
  }
}
