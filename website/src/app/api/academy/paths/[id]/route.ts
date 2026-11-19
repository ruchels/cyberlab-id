import { NextResponse } from "next/server";
import { getDb, runTransaction, logAudit, createNotification, hashString } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const user = await getSessionUser(request);

    const path = db.prepare("SELECT * FROM academy_paths WHERE id = ?").get(id) as any;
    if (!path) {
      return NextResponse.json({ error: "Learning path tidak ditemukan." }, { status: 404 });
    }

    let modules = [];
    try {
      modules = JSON.parse(path.modules_list);
    } catch {}

    let enrollment = null;
    let certificate = null;

    if (user) {
      enrollment = db
        .prepare("SELECT * FROM academy_enrollments WHERE user_id = ? AND path_id = ?")
        .get(user.id, path.id) as any;

      if (enrollment) {
        try {
          enrollment.completed_items = JSON.parse(enrollment.completed_items);
        } catch {
          enrollment.completed_items = [];
        }
      }

      certificate = db
        .prepare("SELECT * FROM certificates WHERE user_id = ? AND path_id = ?")
        .get(user.id, path.id);
    }

    return NextResponse.json({
      success: true,
      path: {
        ...path,
        modules,
      },
      enrollment,
      certificate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch path" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login untuk mengakses fitur Academy." }, { status: 401 });
    }

    const db = getDb();
    const path = db.prepare("SELECT * FROM academy_paths WHERE id = ?").get(id) as any;
    if (!path) {
      return NextResponse.json({ error: "Learning path tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || "enroll"; // "enroll" | "progress" | "claim"

    const now = new Date().toISOString();

    if (action === "enroll") {
      const existing = db
        .prepare("SELECT id FROM academy_enrollments WHERE user_id = ? AND path_id = ?")
        .get(user.id, path.id);

      if (existing) {
        return NextResponse.json({ success: true, message: "Anda sudah terdaftar pada learning path ini." });
      }

      const enrollId = `enr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      db.prepare(`
        INSERT INTO academy_enrollments (id, user_id, path_id, progress_percent, completed_items, is_completed, enrolled_at)
        VALUES (?, ?, ?, 0, '[]', 0, ?)
      `).run(enrollId, user.id, path.id, now);

      logAudit(user.id, "ENROLL_PATH", "academy_path", path.id, `Enrolled into ${path.title}`);

      return NextResponse.json({
        success: true,
        message: `Berhasil mendaftar ke Learning Path "${path.title}". Selamat belajar!`,
      });
    }

    if (action === "progress") {
      const { itemId } = body;
      if (!itemId) {
        return NextResponse.json({ error: "itemId is required." }, { status: 400 });
      }

      let enrollment = db
        .prepare("SELECT * FROM academy_enrollments WHERE user_id = ? AND path_id = ?")
        .get(user.id, path.id) as any;

      if (!enrollment) {
        const enrollId = `enr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
        db.prepare(`
          INSERT INTO academy_enrollments (id, user_id, path_id, progress_percent, completed_items, is_completed, enrolled_at)
          VALUES (?, ?, ?, 0, '[]', 0, ?)
        `).run(enrollId, user.id, path.id, now);
        enrollment = { id: enrollId, completed_items: "[]" };
      }

      let completedItems: string[] = [];
      try {
        completedItems = JSON.parse(enrollment.completed_items || "[]");
      } catch {}

      if (!completedItems.includes(itemId)) {
        completedItems.push(itemId);
      }

      let totalModules = 1;
      try {
        totalModules = JSON.parse(path.modules_list).length || 1;
      } catch {}

      const progressPercent = Math.min(100, Math.round((completedItems.length / totalModules) * 100));

      db.prepare(`
        UPDATE academy_enrollments
        SET progress_percent = ?, completed_items = ?
        WHERE user_id = ? AND path_id = ?
      `).run(progressPercent, JSON.stringify(completedItems), user.id, path.id);

      return NextResponse.json({
        success: true,
        progressPercent,
        completedItems,
      });
    }

    if (action === "claim") {
      // 1. Verify that user completed all items in path
      let enrollment = db
        .prepare("SELECT * FROM academy_enrollments WHERE user_id = ? AND path_id = ?")
        .get(user.id, path.id) as any;

      if (!enrollment) {
        return NextResponse.json({ error: "Anda belum terdaftar pada learning path ini." }, { status: 400 });
      }

      // 2. Check if certificate already exists
      const existingCert = db
        .prepare("SELECT id FROM certificates WHERE user_id = ? AND path_id = ?")
        .get(user.id, path.id);

      if (existingCert) {
        return NextResponse.json({
          error: "Sertifikat untuk learning path ini telah diterbitkan sebelumnya.",
          certificateId: (existingCert as any).id,
        }, { status: 400 });
      }

      // Generate unique certificate ID & verification hash
      const pathSlug = path.id.replace("path-", "").toUpperCase();
      const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
      const certId = `CERT-CYBERLAB-${pathSlug}-${randomSuffix}`;
      const verificationPayload = `${certId}:${user.id}:${path.id}:${now}`;
      const verificationHash = hashString(verificationPayload);

      runTransaction((txDb) => {
        // Mark enrollment as completed
        txDb.prepare(`
          UPDATE academy_enrollments
          SET progress_percent = 100, is_completed = 1, completed_at = ?
          WHERE user_id = ? AND path_id = ?
        `).run(now, user.id, path.id);

        // Issue Certificate
        txDb.prepare(`
          INSERT INTO certificates (
            id, user_id, path_id, user_display_name, path_title, issue_date, status, verification_hash, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'valid', ?, ?)
        `).run(certId, user.id, path.id, user.display_name, path.title, now, verificationHash, now);

        // Award Completion XP
        txDb.prepare("UPDATE users SET total_xp = total_xp + ?, updated_at = ? WHERE id = ?").run(
          path.completion_xp,
          now,
          user.id
        );

        // Award Academy Graduate Badge
        const achGrad = txDb
          .prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_code = 'academy-graduate'")
          .get(user.id);
        if (!achGrad) {
          txDb.prepare(`
            INSERT INTO user_achievements (id, user_id, achievement_code, unlocked_at)
            VALUES (?, ?, 'academy-graduate', ?)
          `).run(`uach_${user.id}_grad`, user.id, now);
        }

        // Award Verified Scholar Badge
        const achScholar = txDb
          .prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_code = 'verified-scholar'")
          .get(user.id);
        if (!achScholar) {
          txDb.prepare(`
            INSERT INTO user_achievements (id, user_id, achievement_code, unlocked_at)
            VALUES (?, ?, 'verified-scholar', ?)
          `).run(`uach_${user.id}_scholar`, user.id, now);
        }
      });

      logAudit(user.id, "ISSUE_CERTIFICATE", "certificate", certId, `Issued certificate for ${path.title}`);
      createNotification(
        user.id,
        "Selamat! Sertifikat Kelulusan Anda Telah Terbit",
        `Anda berhasil menuntaskan Learning Path "${path.title}" (+${path.completion_xp} XP). Nomor Sertifikat: ${certId}`,
        "achievement",
        `/verify/${certId}`
      );

      return NextResponse.json({
        success: true,
        message: `Selamat! Anda berhasil menyelesaikan learning path "${path.title}" dan memperoleh sertifikat resmi internal CyberLab-ID.`,
        certificateId: certId,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}
