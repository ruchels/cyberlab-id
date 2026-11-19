import { getDb, runTransaction, logAudit, createNotification } from "../db.ts";
import type { LabSession, LabTemplate, TerminalExecutionResult } from "./types.ts";
import { checkDockerAvailable, executeVirtualCommand, getOrCreateVirtualState } from "./driver.ts";
import crypto from "node:crypto";

export function sweepExpiredSessions(): number {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE lab_sessions
    SET status = 'expired'
    WHERE status = 'running' AND expires_at < ?
  `).run(now);
  return Number(result.changes || 0);
}

export async function startLabSession(userId: string, templateId: string): Promise<LabSession> {
  const db = getDb();
  sweepExpiredSessions();

  // 1. Fetch template
  const template = db
    .prepare("SELECT * FROM lab_templates WHERE id = ? AND is_published = 1")
    .get(templateId) as LabTemplate | undefined;

  if (!template) {
    throw new Error("TEMPLATE_NOT_FOUND");
  }

  // 2. Check active running session limit (1 concurrent session per user)
  const activeSession = db
    .prepare("SELECT id FROM lab_sessions WHERE user_id = ? AND status = 'running'")
    .get(userId) as { id: string } | undefined;

  if (activeSession) {
    // If active session belongs to the same template, return it
    const existing = await getSession(activeSession.id, userId);
    if (existing && existing.template_id === templateId) {
      return existing;
    }
    throw new Error("CONCURRENT_SESSION_LIMIT");
  }

  // 3. Create session
  const now = new Date();
  const startedAt = now.toISOString();
  const durationMs = (template.duration_minutes || 60) * 60 * 1000;
  const expiresAt = new Date(now.getTime() + durationMs).toISOString();

  const sessionId = `ses_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const hasDocker = checkDockerAvailable();
  const mode = hasDocker ? "container" : "embedded";
  const ipAddress = `10.240.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 250) + 2}`;

  db.prepare(`
    INSERT INTO lab_sessions (
      id, user_id, template_id, status, mode, terminal_endpoint,
      ip_address, started_at, expires_at, checkpoints_state, terminal_history, created_at
    ) VALUES (?, ?, ?, 'running', ?, '', ?, ?, ?, '{}', '[]', ?)
  `).run(sessionId, userId, template.id, mode, ipAddress, startedAt, expiresAt, startedAt);

  // Initialize virtual state
  getOrCreateVirtualState(sessionId);
  logAudit(userId, "START_LAB_SESSION", "lab_session", sessionId, `Started lab: ${template.title} (${mode} mode)`);

  const createdSession: LabSession = {
    id: sessionId,
    user_id: userId,
    template_id: template.id,
    status: "running",
    mode,
    terminal_endpoint: "",
    ip_address: ipAddress,
    started_at: startedAt,
    expires_at: expiresAt,
    completed_at: null,
    checkpoints_state: "{}",
    terminal_history: "[]",
    created_at: startedAt,
    template,
  };

  return createdSession;
}

export async function getSession(sessionId: string, userId?: string): Promise<LabSession | null> {
  const db = getDb();
  sweepExpiredSessions();

  const session = db
    .prepare("SELECT * FROM lab_sessions WHERE id = ?")
    .get(sessionId) as any | undefined;

  if (!session) return null;

  if (userId && session.user_id !== userId) {
    return null; // unauthorized access attempt
  }

  const template = db
    .prepare("SELECT * FROM lab_templates WHERE id = ?")
    .get(session.template_id) as LabTemplate | undefined;

  return {
    ...session,
    template,
  };
}

export async function stopLabSession(sessionId: string, userId: string): Promise<boolean> {
  const db = getDb();
  const session = await getSession(sessionId, userId);
  if (!session) return false;

  db.prepare(`
    UPDATE lab_sessions
    SET status = 'completed', completed_at = ?
    WHERE id = ? AND user_id = ?
  `).run(new Date().toISOString(), sessionId, userId);

  logAudit(userId, "STOP_LAB_SESSION", "lab_session", sessionId, "User stopped lab session");
  return true;
}

export async function restartLabSession(sessionId: string, userId: string): Promise<boolean> {
  const db = getDb();
  const session = await getSession(sessionId, userId);
  if (!session) return false;

  db.prepare(`
    UPDATE lab_sessions
    SET checkpoints_state = '{}', terminal_history = '[]'
    WHERE id = ? AND user_id = ?
  `).run(sessionId, userId);

  // Reset in-memory state
  getOrCreateVirtualState(sessionId, {});
  logAudit(userId, "RESTART_LAB_SESSION", "lab_session", sessionId, "User restarted lab session state");
  return true;
}

export async function executeSessionCommand(
  sessionId: string,
  userId: string,
  rawCommand: string
): Promise<TerminalExecutionResult> {
  const session = await getSession(sessionId, userId);
  if (!session) {
    throw new Error("SESSION_NOT_FOUND");
  }

  if (session.status !== "running") {
    throw new Error("SESSION_NOT_RUNNING");
  }

  const db = getDb();
  const criteriaJson = session.template?.verification_criteria || "{}";
  const result = executeVirtualCommand(sessionId, rawCommand, criteriaJson);

  // Save history & updated checkpoints
  let history: string[] = [];
  try {
    history = JSON.parse(session.terminal_history || "[]");
  } catch { }
  history.push(rawCommand);
  if (history.length > 50) history.shift();

  db.prepare(`
    UPDATE lab_sessions
    SET checkpoints_state = ?, terminal_history = ?
    WHERE id = ?
  `).run(JSON.stringify(result.updatedCheckpoints), JSON.stringify(history), sessionId);

  return result;
}

export async function completeLabSession(
  sessionId: string,
  userId: string,
  evidenceToken?: string
): Promise<{ success: boolean; xpAwarded: number; message: string; badgesUnlocked: string[] }> {
  const session = await getSession(sessionId, userId);
  if (!session || !session.template) {
    throw new Error("SESSION_NOT_FOUND");
  }

  const db = getDb();
  const template = session.template;

  // 1. Check if user has already completed this template previously
  const existingCompletion = db
    .prepare("SELECT id FROM lab_completions WHERE user_id = ? AND template_id = ?")
    .get(userId, template.id);

  if (existingCompletion) {
    return {
      success: true,
      xpAwarded: 0,
      message: "Lab telah diselesaikan sebelumnya. Anda berhasil menyelesaikan sesi latihan ulang.",
      badgesUnlocked: [],
    };
  }

  // 2. Validate evidence criteria
  let criteriaObj: any = {};
  try {
    criteriaObj = JSON.parse(template.verification_criteria);
  } catch { }

  let isValid = false;
  let summary = "Kriteria evaluasi lab terpenuhi melalui verifikasi checkpoint.";

  if (evidenceToken && criteriaObj.completion_token) {
    isValid = evidenceToken.trim() === criteriaObj.completion_token.trim();
    summary = `Verified with Token: ${evidenceToken.trim()}`;
  } else {
    // Check checkpoints state
    let checkpointsState: Record<string, boolean> = {};
    try {
      checkpointsState = JSON.parse(session.checkpoints_state || "{}");
    } catch { }

    const requiredCheckpoints = criteriaObj.checkpoints || [];
    if (requiredCheckpoints.length > 0) {
      isValid = requiredCheckpoints.every((cp: any) => Boolean(checkpointsState[cp.id]));
      summary = `Checkpoints passed: ${requiredCheckpoints.map((cp: any) => cp.id).join(", ")}`;
    } else {
      isValid = true;
    }
  }

  if (!isValid) {
    return {
      success: false,
      xpAwarded: 0,
      message: "Kriteria penyelesaian belum terpenuhi. Pastikan Anda telah menyelesaikan seluruh instruksi lab.",
      badgesUnlocked: [],
    };
  }

  // 3. Record completion & award XP atomically inside transaction
  const now = new Date().toISOString();
  const completionId = `comp_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const badgesUnlocked: string[] = [];

  runTransaction((txDb) => {
    txDb.prepare(`
      INSERT INTO lab_completions (id, user_id, template_id, session_id, xp_awarded, evidence_summary, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(completionId, userId, template.id, session.id, template.xp_reward, summary, now);

    txDb.prepare(`
      UPDATE lab_sessions
      SET status = 'completed', completed_at = ?
      WHERE id = ?
    `).run(now, session.id);

    txDb.prepare(`
      UPDATE users
      SET total_xp = total_xp + ?, updated_at = ?
      WHERE id = ?
    `).run(template.xp_reward, now, userId);

    // 4. Check & Unlock Phase 4 Badges
    const completionsCount = (
      txDb.prepare("SELECT count(*) as count FROM lab_completions WHERE user_id = ?").get(userId) as { count: number }
    ).count;

    // Range Commander (3+ labs)
    if (completionsCount >= 3) {
      const ach = txDb.prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_code = 'range-commander'").get(userId);
      if (!ach) {
        txDb.prepare(`
          INSERT INTO user_achievements (id, user_id, achievement_code, unlocked_at)
          VALUES (?, ?, 'range-commander', ?)
        `).run(`uach_${userId}_range_cmd`, userId, now);
        txDb.prepare("UPDATE users SET total_xp = total_xp + 100 WHERE id = ?").run(userId);
        badgesUnlocked.push("Range Commander (+100 XP)");
      }
    }

    // Category specific badges
    const categoryBadgeMap: Record<string, { code: string; title: string; bonus: number }> = {
      Networking: { code: "network-architect", title: "Network Architect", bonus: 60 },
      "Web Security": { code: "appsec-breaker", title: "AppSec Breaker", bonus: 60 },
      "Digital Forensics": { code: "forensics-investigator", title: "Forensic Investigator", bonus: 60 },
      "Reverse Engineering": { code: "binary-analyst", title: "Binary Analyst", bonus: 60 },
    };

    const catMatch = categoryBadgeMap[template.category];
    if (catMatch) {
      const ach = txDb.prepare("SELECT id FROM user_achievements WHERE user_id = ? AND achievement_code = ?").get(userId, catMatch.code);
      if (!ach) {
        txDb.prepare(`
          INSERT INTO user_achievements (id, user_id, achievement_code, unlocked_at)
          VALUES (?, ?, ?, ?)
        `).run(`uach_${userId}_${catMatch.code}`, userId, catMatch.code, now);
        txDb.prepare("UPDATE users SET total_xp = total_xp + ? WHERE id = ?").run(catMatch.bonus, userId);
        badgesUnlocked.push(`${catMatch.title} (+${catMatch.bonus} XP)`);
      }
    }
  });

  logAudit(userId, "COMPLETE_LAB", "lab_template", template.id, `Completed lab for +${template.xp_reward} XP`);

  let notifMsg = `Selamat! Anda berhasil menyelesaikan Cyber Range "${template.title}" (+${template.xp_reward} XP).`;
  if (badgesUnlocked.length > 0) {
    notifMsg += ` Lencana baru dibuka: ${badgesUnlocked.join(", ")}!`;
  }

  createNotification(userId, "Praktikum Cyber Range Selesai!", notifMsg, "achievement", "/range");

  return {
    success: true,
    xpAwarded: template.xp_reward,
    message: `Selamat! Anda berhasil menyelesaikan lab "${template.title}" dan memperoleh +${template.xp_reward} XP.`,
    badgesUnlocked,
  };
}
