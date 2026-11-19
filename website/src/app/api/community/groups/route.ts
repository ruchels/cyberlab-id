import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let sql = `
      SELECT id, name, slug, category, region_or_language, description, member_count, is_official, created_at
      FROM community_groups
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    sql += " ORDER BY is_official DESC, member_count DESC";

    const rows = db.prepare(sql).all(...params) as any[];

    return NextResponse.json({ success: true, count: rows.length, data: rows });
  } catch (err: any) {
    console.error("Community groups GET error:", err);
    return NextResponse.json({ success: false, error: "Gagal memuat grup komunitas." }, { status: 500 });
  }
}
