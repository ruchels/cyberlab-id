import { NextResponse } from "next/server";
import { getDb, hashString } from "@/lib/server/db";
import { requireAdmin, logAudit } from "@/lib/server/auth";
import crypto from "node:crypto";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const db = getDb();
    const challenges = db.prepare("SELECT * FROM ctf_challenges ORDER BY points ASC").all();
    return NextResponse.json({ challenges });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error?.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    return NextResponse.json({ error: "Gagal memuat tantangan." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json();
    const { title, description, category, difficulty, points, flag, hint, instructions } = body;

    if (!title || !description || !category || !points || !flag) {
      return NextResponse.json({ error: "Semua kolom wajib diisi (Judul, Deskripsi, Kategori, Poin, Flag)." }, { status: 400 });
    }

    const db = getDb();
    const id = `ctf_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const flagHash = hashString(flag.trim().toLowerCase());
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO ctf_challenges (id, title, description, category, difficulty, points, flag_hash, hint, instructions, is_published, author_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      title.trim(),
      description.trim(),
      category,
      difficulty || "Beginner",
      Number(points),
      flagHash,
      hint?.trim() || "",
      instructions?.trim() || "",
      admin.id,
      now
    );

    logAudit(admin.id, "CREATE_CHALLENGE", "ctf_challenge", id, `Created challenge: ${title.trim()}`);
    return NextResponse.json({ message: "Tantangan CTF berhasil dibuat!", id });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error?.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    return NextResponse.json({ error: "Gagal membuat tantangan." }, { status: 500 });
  }
}
