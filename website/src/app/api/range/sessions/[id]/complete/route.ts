import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { completeLabSession } from "@/lib/server/range/session-manager";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { evidenceToken } = body;

    const result = await completeLabSession(sessionId, user.id, evidenceToken);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      xpAwarded: result.xpAwarded,
      badgesUnlocked: result.badgesUnlocked,
    });
  } catch (error: any) {
    if (error?.message === "SESSION_NOT_FOUND") {
      return NextResponse.json({ error: "Sesi tidak ditemukan atau akses tidak diizinkan." }, { status: 404 });
    }
    console.error("Complete Lab Error:", error);
    return NextResponse.json({ error: "Gagal menyelesaikan lab." }, { status: 500 });
  }
}
