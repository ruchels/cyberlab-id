/**
 * Public API v1 Authentication & Rate Limiting Guard
 * Validates Developer API Keys with SHA-256 constant-time hashing,
 * scope verification, rate limiting, and request telemetry.
 */

import crypto from "crypto";
import { NextRequest } from "next/server";
import { getDb } from "./db.ts";

export interface ApiAuthResult {
  authenticated: boolean;
  keyId?: string;
  userId?: string;
  scopes?: string[];
  error?: string;
  status?: number;
}

// In-memory rate limiting map: keyId -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

export function authenticateApiKey(req: NextRequest, requiredScope?: string): ApiAuthResult {
  // Extract key from X-API-Key header or Authorization: Bearer <token>
  let token = req.headers.get("x-api-key");
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return {
      authenticated: false,
      error: "Autentikasi gagal: Header 'X-API-Key' atau 'Authorization: Bearer <token>' diperlukan.",
      status: 401,
    };
  }

  const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
  const db = getDb();

  const keyRow = db
    .prepare(
      `SELECT id, user_id, key_name, scopes, rate_limit_per_minute, is_revoked
       FROM developer_api_keys
       WHERE key_hash = ?`
    )
    .get(tokenHash) as any;

  if (!keyRow) {
    return {
      authenticated: false,
      error: "API Key tidak valid atau tidak terdaftar.",
      status: 401,
    };
  }

  if (keyRow.is_revoked === 1) {
    return {
      authenticated: false,
      error: "API Key ini telah dicabut (revoked) dan tidak lagi aktif.",
      status: 403,
    };
  }

  // Parse scopes
  let scopes: string[] = [];
  try {
    scopes = JSON.parse(keyRow.scopes);
  } catch {
    scopes = ["read:public"];
  }

  // Verify required scope
  if (requiredScope && !scopes.includes(requiredScope) && !scopes.includes("all")) {
    return {
      authenticated: false,
      error: `Izin akses ditolak: API Key tidak memiliki scope '${requiredScope}' yang dibutuhkan.`,
      status: 403,
    };
  }

  // Enforce Rate Limiting (default 60 req/min)
  const now = Date.now();
  const limit = keyRow.rate_limit_per_minute || 60;
  const currentWindow = rateLimitMap.get(keyRow.id) || { count: 0, windowStart: now };

  if (now - currentWindow.windowStart > 60000) {
    // Reset window
    currentWindow.count = 1;
    currentWindow.windowStart = now;
    rateLimitMap.set(keyRow.id, currentWindow);
  } else {
    currentWindow.count++;
    if (currentWindow.count > limit) {
      return {
        authenticated: false,
        error: `Batas laju pemanggilan terlampaui (${limit} request/menit). Harap tunggu beberapa detik.`,
        status: 429,
      };
    }
  }

  // Asynchronously update telemetry in database
  try {
    const timestamp = new Date().toISOString();
    db.prepare(`
      UPDATE developer_api_keys 
      SET total_requests = total_requests + 1, last_used_at = ? 
      WHERE id = ?
    `).run(timestamp, keyRow.id);
  } catch {}

  return {
    authenticated: true,
    keyId: keyRow.id,
    userId: keyRow.user_id,
    scopes,
  };
}

