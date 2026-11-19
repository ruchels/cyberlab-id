import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getSession, stopLabSession, restartLabSession } from "@/lib/server/range/session-manager";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const session = await getSession(sessionId, user.id);
    if (!session) {
      return NextResponse.json({ error: "Sesi lab tidak ditemukan atau akses tidak diizinkan." }, { status: 404 });
    }

    const now = Date.now();
    const expiresAt = new Date(session.expires_at).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

    return NextResponse.json({
      session: {
        ...session,
        remainingSeconds,
      },
    });
  } catch (error) {
    console.error("Get Session Detail Error:", error);
    return NextResponse.json({ error: "Gagal memuat detail sesi." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const success = await stopLabSession(sessionId, user.id);
    if (!success) {
      return NextResponse.json({ error: "Gagal menghentikan sesi atau sesi tidak ditemukan." }, { status: 400 });
    }

    return NextResponse.json({ message: "Sesi lab berhasil dihentikan." });
  } catch (error) {
    console.error("Stop Session Error:", error);
    return NextResponse.json({ error: "Gagal menghentikan sesi." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const success = await restartLabSession(sessionId, user.id);
    if (!success) {
      return NextResponse.json({ error: "Gagal mereset sesi." }, { status: 400 });
    }

    return NextResponse.json({ message: "Lingkungan lab berhasil direset ke kondisi awal." });
  } catch (error) {
    console.error("Restart Session Error:", error);
    return NextResponse.json({ error: "Gagal mereset sesi." }, { status: 500 });
  }
}
