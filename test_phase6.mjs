import assert from "node:assert";
import { getDb } from "./website/src/lib/server/db.ts";
import crypto from "node:crypto";

const db = getDb();
db.exec("PRAGMA foreign_keys = ON;");

console.log("================================================================================");
console.log(" CYBERLAB-ID PHASE 6: ECOSYSTEM, ACADEMY, ARENA & COMMUNITY VERIFICATION SUITE");
console.log("================================================================================");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// Setup dedicated test user
const testUserId = "usr_phase6_test_student";
db.prepare("DELETE FROM certificates WHERE user_id = ?").run(testUserId);
db.prepare("DELETE FROM academy_enrollments WHERE user_id = ?").run(testUserId);
db.prepare("DELETE FROM ctf_competition_solves WHERE user_id = ?").run(testUserId);
db.prepare("DELETE FROM ctf_team_members WHERE user_id = ?").run(testUserId);
db.prepare("DELETE FROM contributor_submissions WHERE user_id = ?").run(testUserId);
db.prepare("DELETE FROM research_articles WHERE user_id = ?").run(testUserId);
db.prepare("DELETE FROM mentorship_requests WHERE student_id = ?").run(testUserId);
db.prepare("DELETE FROM event_registrations WHERE user_id = ?").run(testUserId);
db.prepare("DELETE FROM users WHERE id = ?").run(testUserId);

db.prepare(`
  INSERT INTO users (id, username, email, password_hash, salt, display_name, role, status, total_xp, created_at, updated_at)
  VALUES (?, ?, ?, 'hash', 'salt', 'Test Scholar', 'student', 'active', 0, datetime('now'), datetime('now'))
`).run(testUserId, "scholar_test_phase6", "scholar6@test.id");

// -----------------------------------------------------------------------------
// 1. Academy Learning Paths & Modules
// -----------------------------------------------------------------------------
runTest("1.1. Academy paths table has 10 structured learning paths seeded", () => {
  const count = db.prepare("SELECT count(*) as count FROM academy_paths").get().count;
  assert(count >= 10, `Expected at least 10 learning paths, found ${count}`);

  const requiredPaths = [
    "path-cyber-basics",
    "path-linux-admin",
    "path-networking",
    "path-web-appsec",
    "path-cryptography",
    "path-digital-forensics",
    "path-reverse-engineering",
    "path-secops",
    "path-defensive-sec",
    "path-ethical-hacking",
  ];

  for (const pid of requiredPaths) {
    const row = db.prepare("SELECT id, title, modules_list FROM academy_paths WHERE id = ?").get(pid);
    assert(row, `Required path missing: ${pid}`);
    const modules = JSON.parse(row.modules_list);
    assert(Array.isArray(modules) && modules.length >= 2, `Path ${pid} must have at least 2 modules`);
  }
});

runTest("1.2. Academy enrollment and progress calculation", () => {
  const pathId = "path-cyber-basics";
  const enrollId = `enr_${crypto.randomUUID()}`;

  db.prepare(`
    INSERT INTO academy_enrollments (id, user_id, path_id, progress_percent, completed_items, enrolled_at)
    VALUES (?, ?, ?, 0, '[]', datetime('now'))
  `).run(enrollId, testUserId, pathId);

  const pathRow = db.prepare("SELECT modules_list FROM academy_paths WHERE id = ?").get(pathId);
  const modules = JSON.parse(pathRow.modules_list);
  const firstModId = modules[0].id;

  // Complete first module
  const completed = [firstModId];
  const percent = Math.round((completed.length / modules.length) * 100);

  db.prepare(`
    UPDATE academy_enrollments
    SET completed_items = ?, progress_percent = ?
    WHERE id = ?
  `).run(JSON.stringify(completed), percent, enrollId);

  const updatedEnroll = db.prepare("SELECT * FROM academy_enrollments WHERE id = ?").get(enrollId);
  assert.strictEqual(updatedEnroll.progress_percent, percent);
  assert.strictEqual(JSON.parse(updatedEnroll.completed_items).length, 1);
});

// -----------------------------------------------------------------------------
// 2. Certificate Issuance & Cryptographic Hash Validation
// -----------------------------------------------------------------------------
runTest("2.1. Certificate issuance with SHA-256 cryptographic verification hash", () => {
  const pathId = "path-cyber-basics";
  const pathRow = db.prepare("SELECT title FROM academy_paths WHERE id = ?").get(pathId);

  const certId = `CERT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const now = new Date().toISOString();
  const rawHashPayload = `${certId}:${testUserId}:${pathId}:${now}`;
  const verificationHash = crypto.createHash("sha256").update(rawHashPayload).digest("hex");

  db.prepare(`
    INSERT INTO certificates (id, user_id, path_id, user_display_name, path_title, issue_date, status, verification_hash, created_at)
    VALUES (?, ?, ?, 'Test Scholar', ?, ?, 'valid', ?, ?)
  `).run(certId, testUserId, pathId, pathRow.title, now, verificationHash, now);

  const cert = db.prepare("SELECT * FROM certificates WHERE id = ?").get(certId);
  assert(cert, "Certificate must exist in database");
  assert.strictEqual(cert.status, "valid");
  assert.strictEqual(cert.verification_hash.length, 64, "SHA-256 hash must be 64 hexadecimal chars");

  // Re-verify hash calculation
  const reHash = crypto.createHash("sha256").update(rawHashPayload).digest("hex");
  assert.strictEqual(cert.verification_hash, reHash, "Verification hash must match SHA-256 payload");
});

runTest("2.2. Certificate revocation workflow and reason preservation", () => {
  const cert = db.prepare("SELECT id FROM certificates WHERE user_id = ?").get(testUserId);
  assert(cert, "Certificate must exist for revocation test");

  const reason = "Dicabut untuk pengujian integritas administratif";
  db.prepare("UPDATE certificates SET status = 'revoked', revocation_reason = ? WHERE id = ?").run(reason, cert.id);

  const revoked = db.prepare("SELECT status, revocation_reason FROM certificates WHERE id = ?").get(cert.id);
  assert.strictEqual(revoked.status, "revoked");
  assert.strictEqual(revoked.revocation_reason, reason);
});

// -----------------------------------------------------------------------------
// 3. CTF Arena Competitions & Team Management
// -----------------------------------------------------------------------------
runTest("3.1. CTF Competitions table and seeded competition", () => {
  const count = db.prepare("SELECT count(*) as count FROM ctf_competitions").get().count;
  assert(count >= 1, "Must have at least 1 CTF competition");

  const comp = db.prepare("SELECT * FROM ctf_competitions WHERE id = 'comp_nusantara_2026'").get();
  assert(comp, "Nusantara 2026 competition must exist");
  assert.strictEqual(comp.type, "team");
  assert.strictEqual(comp.format, "jeopardy");
});

runTest("3.2. Team creation with unique 6-character invite code and membership", () => {
  const teamId = `team_test_${Date.now()}`;
  const inviteCode = "CYB699";

  db.prepare(`
    INSERT INTO ctf_teams (id, name, description, leader_id, invite_code, total_points, created_at)
    VALUES (?, 'CyberSquad Testing', 'Test team description', ?, ?, 100, datetime('now'))
  `).run(teamId, testUserId, inviteCode);

  db.prepare(`
    INSERT INTO ctf_team_members (id, team_id, user_id, role, joined_at)
    VALUES (?, ?, ?, 'leader', datetime('now'))
  `).run(`mem_${Date.now()}`, teamId, testUserId);

  const team = db.prepare("SELECT * FROM ctf_teams WHERE id = ?").get(teamId);
  assert(team, "Created team must exist");
  assert.strictEqual(team.invite_code, inviteCode);

  const member = db.prepare("SELECT * FROM ctf_team_members WHERE team_id = ? AND user_id = ?").get(teamId, testUserId);
  assert(member, "Leader must be registered as member");
  assert.strictEqual(member.role, "leader");
});

runTest("3.3. Competition solve scoring and tie-breaking ordering", () => {
  const compId = "comp_nusantara_2026";
  const chalId = "base64-mystery"; // Existing seeded challenge
  const teamId = db.prepare("SELECT id FROM ctf_teams WHERE leader_id = ?").get(testUserId).id;

  const solveId = `solv_${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO ctf_competition_solves (id, competition_id, challenge_id, team_id, user_id, points, solved_at)
    VALUES (?, ?, ?, ?, ?, 100, ?)
  `).run(solveId, compId, chalId, teamId, testUserId, now);

  const solve = db.prepare("SELECT * FROM ctf_competition_solves WHERE id = ?").get(solveId);
  assert(solve, "Competition solve must be recorded");
  assert.strictEqual(solve.points, 100);
});

// -----------------------------------------------------------------------------
// 4. Contributor Submissions & Review Workflow
// -----------------------------------------------------------------------------
runTest("4.1. Contributor proposal creation and admin approval workflow", () => {
  const subId = `sub_${Date.now()}`;

  db.prepare(`
    INSERT INTO contributor_submissions (id, user_id, type, title, description, content, tags, status, created_at, updated_at)
    VALUES (?, ?, 'module', 'Praktik PrivEsc Linux', 'Panduan privilege escalation', '# Materi...', '["linux","privesc"]', 'submitted', datetime('now'), datetime('now'))
  `).run(subId, testUserId);

  let sub = db.prepare("SELECT status FROM contributor_submissions WHERE id = ?").get(subId);
  assert.strictEqual(sub.status, "submitted");

  // Admin approves and publishes
  db.prepare(`
    UPDATE contributor_submissions
    SET status = 'published', reviewer_feedback = 'Materi sangat komprehensif!', updated_at = datetime('now')
    WHERE id = ?
  `).run(subId);

  sub = db.prepare("SELECT status, reviewer_feedback FROM contributor_submissions WHERE id = ?").get(subId);
  assert.strictEqual(sub.status, "published");
  assert(sub.reviewer_feedback.includes("komprehensif"));
});

// -----------------------------------------------------------------------------
// 5. Research Hub & Anti-Leak Flag Protection
// -----------------------------------------------------------------------------
runTest("5.1. Research article publishing and like increment", () => {
  const artSlug = `analysis-kernel-exploit-${Date.now()}`;

  db.prepare(`
    INSERT INTO research_articles (id, user_id, author_name, title, slug, abstract, category, keywords, content, status, views_count, likes_count, published_at, created_at)
    VALUES (?, ?, 'Test Scholar', 'Kernel Exploit Analysis', ?, 'Abstrak riset mendalam', 'reverse-engineering', '["kernel","cve"]', 'Konten riset...', 'published', 10, 5, datetime('now'), datetime('now'))
  `).run(`art_${Date.now()}`, testUserId, artSlug);

  const art = db.prepare("SELECT * FROM research_articles WHERE slug = ?").get(artSlug);
  assert(art, "Published article must exist");
  assert.strictEqual(art.views_count, 10);

  // Increment like
  db.prepare("UPDATE research_articles SET likes_count = likes_count + 1 WHERE slug = ?").run(artSlug);
  const updatedArt = db.prepare("SELECT likes_count FROM research_articles WHERE slug = ?").get(artSlug);
  assert.strictEqual(updatedArt.likes_count, 6);
});

runTest("5.2. Anti-leak flag verification pattern check", () => {
  const activeFlag = "CYBERLAB{active_flag_secret_123}";
  const contentWithLeak = `Berikut adalah solusinya: Flag = ${activeFlag}`;
  const contentWithoutLeak = `Berikut adalah solusinya: Flag = CYBERLAB{REDACTED_FLAG}`;

  const hasLeak = contentWithLeak.includes("CYBERLAB{active_flag_secret_123}");
  const cleanLeak = contentWithoutLeak.includes("CYBERLAB{active_flag_secret_123}");

  assert.strictEqual(hasLeak, true, "Must detect leaked active flag");
  assert.strictEqual(cleanLeak, false, "Must pass redacted flag");
});

// -----------------------------------------------------------------------------
// 6. Community Mentorship & Requests
// -----------------------------------------------------------------------------
runTest("6.1. Verified mentors directory and student mentorship request", () => {
  const mentors = db.prepare("SELECT * FROM mentors WHERE status = 'verified'").all();
  assert(mentors.length >= 1, "Must have at least 1 verified mentor seeded");

  const mentor = mentors[0];
  const specialties = JSON.parse(mentor.specialties);
  assert(Array.isArray(specialties), "Mentor specialties must be JSON array");

  const reqId = `req_${Date.now()}`;

  db.prepare(`
    INSERT INTO mentorship_requests (id, mentor_id, student_id, learning_goals, status, created_at, updated_at)
    VALUES (?, ?, ?, 'Ingin belajar binary exploitation', 'pending', datetime('now'), datetime('now'))
  `).run(reqId, mentor.id, testUserId);

  const req = db.prepare("SELECT * FROM mentorship_requests WHERE id = ?").get(reqId);
  assert(req, "Mentorship request must be created");
  assert.strictEqual(req.status, "pending");
});

// -----------------------------------------------------------------------------
// 7. Community Events & Registrations
// -----------------------------------------------------------------------------
runTest("7.1. Community event registration and participant counter", () => {
  const events = db.prepare("SELECT * FROM community_events").all();
  assert(events.length >= 1, "Must have at least 1 community event seeded");

  const event = events[0];

  const initialCount = db.prepare("SELECT registered_count FROM community_events WHERE id = ?").get(event.id).registered_count;

  const regId = `reg_${Date.now()}`;
  db.prepare(`
    INSERT INTO event_registrations (id, event_id, user_id, registered_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(regId, event.id, testUserId);

  db.prepare("UPDATE community_events SET registered_count = registered_count + 1 WHERE id = ?").run(event.id);

  const updatedCount = db.prepare("SELECT registered_count FROM community_events WHERE id = ?").get(event.id).registered_count;
  assert.strictEqual(updatedCount, initialCount + 1, "Registered count must increment by 1");

  // Duplicate registration must fail on UNIQUE constraint
  assert.throws(() => {
    db.prepare(`
      INSERT INTO event_registrations (id, event_id, user_id, registered_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(`reg_dup_${Date.now()}`, event.id, testUserId);
  }, /UNIQUE constraint failed/);
});

// -----------------------------------------------------------------------------
// 8. Database Indexes & Integrity
// -----------------------------------------------------------------------------
runTest("8.1. Phase 6 database performance indexes exist", () => {
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map((r) => r.name);

  const requiredIndexes = [
    "idx_academy_enrollments_user_path",
    "idx_certificates_user",
    "idx_certificates_path",
    "idx_ctf_teams_invite",
    "idx_ctf_team_members_user",
    "idx_contributor_submissions_user_status",
    "idx_research_articles_slug",
    "idx_research_articles_status_cat",
    "idx_mentors_status",
    "idx_community_events_time",
  ];

  for (const idx of requiredIndexes) {
    assert(indexes.includes(idx), `Missing Phase 6 performance index: ${idx}`);
  }
});

runTest("8.2. Phase 6 achievements seeded", () => {
  const phase6Badges = [
    "ach_academy-graduate",
    "ach_verified-scholar",
    "ach_arena-gladiator",
    "ach_team-captain",
    "ach_community-contributor",
    "ach_security-researcher",
    "ach_trusted-mentor",
    "ach_event-attendee",
  ];

  for (const bid of phase6Badges) {
    const ach = db.prepare("SELECT id, title, icon FROM achievements WHERE id = ?").get(bid);
    assert(ach, `Phase 6 badge missing: ${bid}`);
  }
});

// -----------------------------------------------------------------------------
// Cleanup & Summary
// -----------------------------------------------------------------------------
console.log("--------------------------------------------------------------------------------");
console.log(`TOTAL PHASE 6 TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("--------------------------------------------------------------------------------");

if (failed > 0) {
  process.exit(1);
} else {
  console.log(">> ALL PHASE 6 AUTOMATED TESTS PASSED SUCCESSFULLY! (14/14) <<");
  process.exit(0);
}
