import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, logAudit, awardAchievement } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Autentikasi diperlukan." }, { status: 401 });
    }

    const db = getDb();
    const rows = db
      .prepare(
        `SELECT id, key_name, key_prefix, scopes, rate_limit_per_minute, total_requests,
                last_used_at, is_revoked, created_at
         FROM developer_api_keys
         WHERE user_id = ?
         ORDER BY created_at DESC`
      )
      .all(user.id) as any[];

    const data = rows.map((r) => {
      let scopes = [];
      try {
        scopes = JSON.parse(r.scopes);
      } catch {
        scopes = ["read:public"];
      }
      return {
        ...r,
        scopes,
        is_revoked: r.is_revoked === 1,
      };
    });

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    console.error("Developer keys GET error:", err);
    return NextResponse.json({ success: false, error: "Gagal mengambil daftar API key." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Autentikasi diperlukan." }, { status: 401 });
    }

    const body = await req.json();
    const { action, keyName, scopes, keyId } = body;
    const db = getDb();
    const now = new Date().toISOString();

    if (action === "create") {
      if (!keyName || keyName.trim().length < 3) {
        return NextResponse.json({ success: false, error: "Nama API key minimal 3 karakter." }, { status: 400 });
      }

      // Check max keys per user (limit 5 active keys)
      const activeCount = db
        .prepare("SELECT count(*) as count FROM developer_api_keys WHERE user_id = ? AND is_revoked = 0")
        .get(user.id) as { count: number };

      if (activeCount.count >= 5) {
        return NextResponse.json(
          { success: false, error: "Batas maksimum 5 API key aktif tercapai. Harap cabut (revoke) key lama terlebih dahulu." },
          { status: 400 }
        );
      }

      // Generate secure 32-byte hex key with prefix cl_live_
      const rawSecret = `cl_live_${crypto.randomBytes(24).toString("hex")}`;
      const keyHash = crypto.createHash("sha256").update(rawSecret).digest("hex");
      const keyPrefix = `${rawSecret.slice(0, 16)}...`;
      const id = `key_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

      const allowedScopes = ["read:modules", "read:events", "read:research", "read:ctf_public"];
      const validatedScopes = Array.isArray(scopes)
        ? scopes.filter((s) => allowedScopes.includes(s))
        : ["read:modules", "read:events"];

      if (validatedScopes.length === 0) validatedScopes.push("read:modules");

      db.prepare(`
        INSERT INTO developer_api_keys (
          id, user_id, key_name, key_prefix, key_hash, scopes,
          rate_limit_per_minute, total_requests, is_revoked, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 60, 0, 0, ?)
      `).run(id, user.id, keyName.trim(), keyPrefix, keyHash, JSON.stringify(validatedScopes), now);

      logAudit(user.id, "developer_key_created", "api_key", id, `Key: ${keyName.trim()}`);
      awardAchievement(user.id, "ach_api-architect");

      return NextResponse.json({
        success: true,
        message: "Developer API Key berhasil dibuat. Salin token ini sekarang karena tidak akan ditampilkan lagi demi keamanan.",
        apiKey: rawSecret,
        keyId: id,
        keyPrefix,
        scopes: validatedScopes,
      });
    }

    if (action === "revoke") {
      if (!keyId) {
        return NextResponse.json({ success: false, error: "ID key diperlukan." }, { status: 400 });
      }

      const key = db
        .prepare("SELECT * FROM developer_api_keys WHERE id = ? AND user_id = ?")
        .get(keyId, user.id) as any;

      if (!key) {
        return NextResponse.json({ success: false, error: "API key tidak ditemukan." }, { status: 404 });
      }

      db.prepare("UPDATE developer_api_keys SET is_revoked = 1 WHERE id = ?").run(keyId);
      logAudit(user.id, "developer_key_revoked", "api_key", keyId);

      return NextResponse.json({ success: true, message: "API key berhasil dicabut dan dinonaktifkan." });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err: any) {
    console.error("Developer keys POST error:", err);
    return NextResponse.json({ success: false, error: "Gagal memproses aksi API key." }, { status: 500 });
  }
}
