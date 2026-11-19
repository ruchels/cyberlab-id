import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    const db = getDb();
    let query = `
      SELECT id, username, email, display_name, avatar, role, status, total_xp, created_at, updated_at,
             (SELECT count(*) FROM ctf_solves WHERE user_id = users.id) as solves_count
      FROM users
      WHERE 1=1
    `;
    const params: string[] = [];

    if (search && search.trim().length > 0) {
      query += " AND (username LIKE ? OR email LIKE ? OR display_name LIKE ?)";
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (role && role !== "all") {
      query += " AND role = ?";
      params.push(role);
    }

    query += " ORDER BY created_at DESC LIMIT 100";

    const users = db.prepare(query).all(...params);
    return NextResponse.json({ users });
  } catch (error: any) {
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Silakan login sebagai administrator." }, { status: 401 });
    }
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak: Hanya administrator yang diizinkan." }, { status: 403 });
    }
    console.error("Admin Users Error:", error);
    return NextResponse.json({ error: "Gagal memuat data pengguna." }, { status: 500 });
  }
}
