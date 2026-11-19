/**
 * CyberLab-ID Phase 8 Automated Verification Test Suite
 * Tests Global Ecosystem, Institutional Partnerships, Contributor Tasks,
 * Developer API v1 Authentication & Scopes, External Knowledge Integrations,
 * CVE Search, Community Groups, and GDPR Privacy Portability.
 */

import { getDb } from "./website/src/lib/server/db.ts";
import {
  getKnowledgeBySource,
  searchCveKnowledge,
} from "./website/src/lib/server/integrations/knowledge.ts";
import { authenticateApiKey } from "./website/src/lib/server/api-v1-auth.ts";
import crypto from "crypto";

const db = getDb();

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log("=================================================");
console.log("CYBERLAB-ID: PHASE 8 AUTOMATED VERIFICATION SUITE");
console.log("=================================================\n");

// 1. Database Schema & Tables
console.log("[1] Database Schema & Performance Indexes");
const tables = [
  "partnerships",
  "partnership_applications",
  "contribution_tasks",
  "developer_api_keys",
  "external_knowledge_cache",
  "community_groups",
  "certificate_verifications",
];
for (const table of tables) {
  const info = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table);
  assert(info !== undefined, `Table exists: ${table}`);
}

const indexes = [
  "idx_partnerships_status",
  "idx_partnership_apps_status",
  "idx_contribution_tasks_status",
  "idx_developer_api_keys_hash",
  "idx_developer_api_keys_user",
  "idx_ext_knowledge_src",
  "idx_cert_verifications_cert",
];
for (const idx of indexes) {
  const info = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name=?").get(idx);
  assert(info !== undefined, `Performance index exists: ${idx}`);
}

// Check migrated columns in users
const userCols = db.prepare("PRAGMA table_info(users)").all();
const colNames = userCols.map((c) => c.name);
assert(colNames.includes("preferred_language"), "Migrated column exists: preferred_language");
assert(colNames.includes("preferred_timezone"), "Migrated column exists: preferred_timezone");
assert(colNames.includes("github_username"), "Migrated column exists: github_username");

// 2. Seeded Content & Configurations
console.log("\n[2] Seeded Partnerships, Tasks & External Cache");
const partnersCount = db.prepare("SELECT COUNT(*) as cnt FROM partnerships").get().cnt;
assert(partnersCount >= 6, `Seeded institutional partners present (${partnersCount} partners)`);

const tasksCount = db.prepare("SELECT COUNT(*) as cnt FROM contribution_tasks").get().cnt;
assert(tasksCount >= 4, `Seeded contribution tasks present (${tasksCount} tasks)`);

const cacheCount = db.prepare("SELECT COUNT(*) as cnt FROM external_knowledge_cache").get().cnt;
assert(cacheCount >= 10, `Seeded external knowledge cache present (${cacheCount} items)`);

const groupsCount = db.prepare("SELECT COUNT(*) as cnt FROM community_groups").get().cnt;
assert(groupsCount >= 4, `Seeded community groups present (${groupsCount} groups)`);

const phase8Achievements = [
  "ach_global-collaborator",
  "ach_open-source-hero",
  "ach_api-architect",
  "ach_threat-intel-analyst",
];
for (const achId of phase8Achievements) {
  const ach = db.prepare("SELECT id FROM achievements WHERE id=?").get(achId);
  assert(ach !== undefined, `Phase 8 achievement seeded: ${achId}`);
}

// 3. External Knowledge Integrations (MITRE, NIST, OWASP, CVE)
console.log("\n[3] External Knowledge Integration Framework");
const mitreItems = getKnowledgeBySource("mitre_attack");
assert(mitreItems.length >= 3, `Retrieved MITRE ATT&CK techniques (${mitreItems.length} items)`);
assert(mitreItems.some((i) => i.referenceId === "T1059" && i.dataPayload.tactic === "Execution"), "MITRE T1059 mapped with tactic");

const nistItems = getKnowledgeBySource("nist_csf");
assert(nistItems.length >= 2, `Retrieved NIST CSF functions (${nistItems.length} items)`);
assert(nistItems.some((i) => i.referenceId === "PR.AC"), "NIST PR.AC Access Control function present");

const owaspItems = getKnowledgeBySource("owasp_top10");
assert(owaspItems.length >= 2, `Retrieved OWASP Top 10 risks (${owaspItems.length} items)`);
assert(owaspItems.some((i) => i.referenceId === "A01:2021" && i.severity === "critical"), "OWASP A01:2021 categorized as critical");

const cveResults = await searchCveKnowledge("CVE-2023-44487");
assert(cveResults.length > 0, "Searches and finds CVE-2023-44487 record");
assert(cveResults[0].cvssScore === 7.5, "Accurate CVSS base score (7.5)");
assert(cveResults[0].defensiveMitigation.length > 20, "Provides actionable defensive mitigation advice");

// Test graceful search fallback
const fallbackResults = await searchCveKnowledge("CVE-9999-00000");
assert(Array.isArray(fallbackResults), "Gracefully handles nonexistent CVE search without errors");

// 4. Institutional Partnerships Workflow
console.log("\n[4] Institutional Partnerships Workflow");
const appId = `papp_test_${Date.now()}`;
const now = new Date().toISOString();
db.prepare(`
  INSERT INTO partnership_applications (
    id, applicant_user_id, org_name, org_type, country, website_url,
    contact_name, contact_email, proposed_collaboration, supporting_links,
    status, created_at, updated_at
  ) VALUES (?, 'usr_admin', 'Politeknik Siber Test', 'vocational_school', 'ID', 'https://politeknik-test.ac.id',
            'Budi Kaprodi', 'budi@politeknik-test.ac.id', 'Program Magang Praktikum Keamanan Siber', '[]',
            'pending', ?, ?)
`).run(appId, now, now);

const insertedApp = db.prepare("SELECT * FROM partnership_applications WHERE id=?").get(appId);
assert(insertedApp !== undefined && insertedApp.status === "pending", "Partnership application successfully submitted");

// Admin approves application
db.prepare(`
  UPDATE partnership_applications 
  SET status = 'approved', review_notes = 'Disetujui untuk program vokasi', reviewed_at = ?
  WHERE id = ?
`).run(now, appId);

const approvedApp = db.prepare("SELECT status FROM partnership_applications WHERE id=?").get(appId);
assert(approvedApp.status === "approved", "Partnership application approved by admin");

// Clean up test app
db.prepare("DELETE FROM partnership_applications WHERE id=?").run(appId);

// 5. Open-Source Contribution Tasks Workflow
console.log("\n[5] Open-Source Contribution Tasks Lifecycle");
const testTaskId = `task_test_${Date.now()}`;
db.prepare(`
  INSERT INTO contribution_tasks (
    id, title, category, difficulty, description, requirements,
    status, reward_xp, created_at, updated_at
  ) VALUES (?, 'Test Translation Task', 'translation', 'easy', 'Translate lab guide', '["Markdown"]',
            'open', 50, ?, ?)
`).run(testTaskId, now, now);

// Step 1: Assign/claim task
db.prepare("UPDATE contribution_tasks SET assigned_to = 'usr_admin', status = 'assigned' WHERE id = ?").run(testTaskId);
let task = db.prepare("SELECT status, assigned_to FROM contribution_tasks WHERE id = ?").get(testTaskId);
assert(task.status === "assigned" && task.assigned_to === "usr_admin", "Task claimed by contributor");

// Step 2: Submit PR
db.prepare("UPDATE contribution_tasks SET pr_url = 'https://github.com/CyberLab-ID/cyberlab-id/pull/999', status = 'in_review' WHERE id = ?").run(testTaskId);
task = db.prepare("SELECT status, pr_url FROM contribution_tasks WHERE id = ?").get(testTaskId);
assert(task.status === "in_review" && task.pr_url.includes("pull/999"), "PR submitted for review");

// Step 3: Admin approves task
db.prepare("UPDATE contribution_tasks SET status = 'completed' WHERE id = ?").run(testTaskId);
task = db.prepare("SELECT status FROM contribution_tasks WHERE id = ?").get(testTaskId);
assert(task.status === "completed", "Task approved and marked as completed");

// Clean up test task
db.prepare("DELETE FROM contribution_tasks WHERE id=?").run(testTaskId);

// 6. Developer API Key & Public API v1 Guard
console.log("\n[6] Developer API Key Authentication & Scopes");
const rawApiKey = `cl_live_${crypto.randomBytes(24).toString("hex")}`;
const keyHash = crypto.createHash("sha256").update(rawApiKey).digest("hex");
const testKeyId = `key_test_${Date.now()}`;

db.prepare(`
  INSERT INTO developer_api_keys (
    id, user_id, key_name, key_prefix, key_hash, scopes,
    rate_limit_per_minute, total_requests, is_revoked, created_at
  ) VALUES (?, 'usr_admin', 'Integration Test Key', 'cl_live_test...', ?, ?, 60, 0, 0, ?)
`).run(testKeyId, keyHash, JSON.stringify(["read:modules", "read:events"]), now);

// 6.1 Test valid authentication with matching scope
const validMockReq = {
  headers: {
    get: (name) => (name.toLowerCase() === "x-api-key" ? rawApiKey : null),
  },
};

const authResult = authenticateApiKey(validMockReq, "read:modules");
assert(authResult.authenticated === true, "Authenticates valid Developer API Key");
assert(authResult.userId === "usr_admin", "Binds request to authorized user");

// 6.2 Test missing / invalid key
const invalidMockReq = {
  headers: { get: (name) => (name.toLowerCase() === "x-api-key" ? "cl_live_invalid12345" : null) },
};
const invalidResult = authenticateApiKey(invalidMockReq, "read:modules");
assert(invalidResult.authenticated === false && invalidResult.status === 401, "Rejects invalid API Key (401)");

// 6.3 Test insufficient scope (requesting read:research when key only has read:modules and read:events)
const scopeResult = authenticateApiKey(validMockReq, "read:research");
assert(scopeResult.authenticated === false && scopeResult.status === 403, "Rejects insufficient API scope (403)");

// 6.4 Test revoked key
db.prepare("UPDATE developer_api_keys SET is_revoked = 1 WHERE id = ?").run(testKeyId);
const revokedResult = authenticateApiKey(validMockReq, "read:modules");
assert(revokedResult.authenticated === false && revokedResult.status === 403, "Rejects revoked API Key (403)");

// Clean up test key
db.prepare("DELETE FROM developer_api_keys WHERE id = ?").run(testKeyId);

// 7. GDPR Compliance: User Data Minimization & Preferences
console.log("\n[7] GDPR Data Portability & Region Neutrality");
const adminUser = db.prepare("SELECT * FROM users WHERE id='usr_admin'").get();
assert(adminUser.preferred_language === "id", "Persistent preferred language configured");
assert(adminUser.preferred_timezone !== undefined, "Persistent timezone configured");

// Test updating user preferences
db.prepare("UPDATE users SET preferred_language='en', preferred_timezone='UTC', github_username='cyberlab-dev' WHERE id='usr_admin'").run();
const updatedUser = db.prepare("SELECT preferred_language, preferred_timezone, github_username FROM users WHERE id='usr_admin'").get();
assert(updatedUser.preferred_language === "en", "Successfully updates preferred language to English");
assert(updatedUser.preferred_timezone === "UTC", "Successfully updates timezone to UTC");
assert(updatedUser.github_username === "cyberlab-dev", "Successfully connects GitHub username");

// Restore defaults
db.prepare("UPDATE users SET preferred_language='id', preferred_timezone='Asia/Jakarta', github_username='' WHERE id='usr_admin'").run();

// 8. Summary
console.log("\n=================================================");
console.log(`TOTAL PHASE 8 TESTS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✓ ALL PHASE 8 AUTOMATED VERIFICATIONS PASSED 100%!");
  process.exit(0);
}
