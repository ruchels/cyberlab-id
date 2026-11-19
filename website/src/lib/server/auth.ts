import { getDb } from "./db.ts";
import crypto from "node:crypto";
import { cookies } from "next/headers";
export { checkRateLimit } from "./rate-limit.ts";

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar: string;
  bio: string;
  role: "user" | "admin" | "moderator";
  status: "active" | "suspended";
  total_xp: number;
  created_at: string;
  updated_at: string;
}

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
export const SESSION_COOKIE_NAME = "cyberlab_session";

export function createSession(userId: string): { token: string; expiresAt: string } {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(token, userId, expiresAt, createdAt);

  return { token, expiresAt };
}

export function destroySession(token: string): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
}

export async function getSessionUser(request?: Request): Promise<User | null> {
  const db = getDb();
  let token: string | undefined;

  // 1. Try reading from Next.js cookies()
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (cookie?.value) {
      token = cookie.value;
    }
  } catch {
    // If not in a Server Component / action context, fallback to Request headers
  }

  // 2. Fallback to Authorization header if request passed
  if (!token && request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    // Also check Cookie header directly from request
    if (!token) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }
    }
  }

  if (!token) return null;

  const now = new Date().toISOString();
  const session = db
    .prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?")
    .get(token) as { user_id: string; expires_at: string } | undefined;

  if (!session) return null;

  if (session.expires_at < now) {
    // Session expired
    db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
    return null;
  }

  const user = db
    .prepare(
      "SELECT id, username, email, display_name, avatar, bio, role, status, total_xp, created_at, updated_at FROM users WHERE id = ?"
    )
    .get(session.user_id) as User | undefined;

  if (!user || user.status === "suspended") return null;

  return user;
}

export async function requireAuth(request?: Request): Promise<User> {
  const user = await getSessionUser(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(request?: Request): Promise<User> {
  const user = await requireAuth(request);
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export { logAudit, createNotification } from "./db.ts";
export const getCurrentUser = getSessionUser;
