import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { startLabSession, sweepExpiredSessions } from "@/lib/server/range/session-manager";
import { getDb } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ sessions: [], activeSession: null });
    }

    sweepExpiredSessions();
    const db = getDb();

    const rows = db
      .prepare(`
        SELECT 
          s.id, s.template_id, s.status, s.mode, s.ip_address, s.started_at, s.expires_at, s.completed_at,
          t.title as template_title, t.category as template_category, t.difficulty as template_difficulty, t.xp_reward
        FROM lab_sessions s
        JOIN lab_templates t ON t.id = s.template_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        LIMIT 20
      `)
      .all(user.id) as any[];

    const active = rows.find((r) => r.status === "running") || null;

    return NextResponse.json({
      sessions: rows,
      activeSession: active,
    });
  } catch (error) {
    console.error("List Sessions Error:", error);
    return NextResponse.json({ error: "Gagal memuat sesi lab." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Silakan masuk (login) terlebih dahulu untuk meluncurkan sesi Cyber Range." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId } = body;

    if (!templateId || typeof templateId !== "string") {
      return NextResponse.json({ error: "ID Template lab wajib ditentukan." }, { status: 400 });
    }

    const session = await startLabSession(user.id, templateId);
    return NextResponse.json({
      message: "Sesi lingkungan Cyber Range berhasil diinisialisasi!",
      session,
    });
  } catch (error: any) {
    if (error?.message === "TEMPLATE_NOT_FOUND") {
      return NextResponse.json({ error: "Template lab tidak ditemukan atau belum aktif." }, { status: 404 });
    }
    if (error?.message === "CONCURRENT_SESSION_LIMIT") {
      return NextResponse.json(
        {
          error:
            "Batas kuota sesi simultan tercapai (Maksimal 1 sesi aktif per user). Selesaikan atau hentikan sesi aktif Anda terlebih dahulu.",
        },
        { status: 429 }
      );
    }
    console.error("Start Session Error:", error);
    return NextResponse.json({ error: "Gagal meluncurkan sesi Cyber Range." }, { status: 500 });
  }
}
