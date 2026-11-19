import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { executeSessionCommand } from "@/lib/server/range/session-manager";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const body = await request.json();
    const { command } = body;

    if (typeof command !== "string") {
      return NextResponse.json({ error: "Perintah tidak valid." }, { status: 400 });
    }

    const result = await executeSessionCommand(sessionId, user.id, command);
    return NextResponse.json({ result });
  } catch (error: any) {
    if (error?.message === "SESSION_NOT_FOUND") {
      return NextResponse.json({ error: "Sesi tidak ditemukan atau akses tidak diizinkan." }, { status: 404 });
    }
    if (error?.message === "SESSION_NOT_RUNNING") {
      return NextResponse.json(
        { error: "Sesi ini telah kedaluwarsa atau dihentikan. Silakan luncurkan sesi baru." },
        { status: 400 }
      );
    }
    console.error("Execute Command Error:", error);
    return NextResponse.json({ error: "Gagal mengeksekusi perintah." }, { status: 500 });
  }
}
