import { getDb, runTransaction } from "./website/src/lib/server/db.ts";
import { executeVirtualCommand } from "./website/src/lib/server/range/driver.ts";
import { checkRateLimit } from "./website/src/lib/server/rate-limit.ts";
import crypto from "node:crypto";
import fs from "node:fs";

console.log("==================================================");
console.log("CYBERLAB-ID PHASE 5 PRODUCTION READINESS SUITE");
console.log("==================================================");

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`);
  }
}

async function runTests() {
  const db = getDb();

  // 1. Database Production Indexes Verification
  console.log("\n1. Verifying Database Performance Indexes...");
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map((r) => r.name);

  assert(indexes.includes("idx_sessions_user_id"), "Index 'idx_sessions_user_id' exists");
  assert(indexes.includes("idx_users_total_xp"), "Index 'idx_users_total_xp' exists for high-speed leaderboard sorting");
  assert(indexes.includes("idx_community_posts_cat_created"), "Index 'idx_community_posts_cat_created' exists");
  assert(indexes.includes("idx_ctf_solves_user_challenge"), "Index 'idx_ctf_solves_user_challenge' exists");
  assert(indexes.includes("idx_lab_sessions_user_status"), "Index 'idx_lab_sessions_user_status' exists");
  assert(indexes.includes("idx_lab_completions_user"), "Index 'idx_lab_completions_user' exists");

  // 2. Atomic Database Transactions (Commit & Rollback Guarantee)
  console.log("\n2. Verifying Atomic Transaction Consistency (ACID)...");
  const testUserId = `test_tx_user_${Date.now()}`;
  db.prepare(`
    INSERT INTO users (id, username, email, password_hash, salt, display_name, avatar, bio, role, status, total_xp, created_at, updated_at)
    VALUES (?, ?, ?, 'hash', 'salt', 'Tx User', 'avatar', '', 'user', 'active', 100, datetime('now'), datetime('now'))
  `).run(testUserId, `tx_user_${Date.now()}`, `${testUserId}@cyberlab.id`);

  // Test Successful Commit
  runTransaction((txDb) => {
    txDb.prepare("UPDATE users SET total_xp = total_xp + 50 WHERE id = ?").run(testUserId);
  });
  const updatedUser = db.prepare("SELECT total_xp FROM users WHERE id = ?").get(testUserId);
  assert(updatedUser.total_xp === 150, "Transaction successfully commits state changes (+50 XP)");

  // Test Rollback on Failure
  let caughtError = false;
  try {
    runTransaction((txDb) => {
      txDb.prepare("UPDATE users SET total_xp = total_xp + 500 WHERE id = ?").run(testUserId);
      throw new Error("SIMULATED_TRANSACTION_FAILURE");
    });
  } catch (err) {
    caughtError = true;
  }
  const rolledBackUser = db.prepare("SELECT total_xp FROM users WHERE id = ?").get(testUserId);
  assert(caughtError === true, "Simulated transaction error properly intercepted");
  assert(rolledBackUser.total_xp === 150, "Transaction successfully rolls back partial writes on error (ACID Preserved)");

  // Cleanup test user
  db.prepare("DELETE FROM users WHERE id = ?").run(testUserId);

  // 3. Cyber Range SSRF & Cloud Metadata Protection
  console.log("\n3. Verifying Cyber Range Egress SSRF Isolation...");
  const dummySessionId = `test_ssrf_sess_${Date.now()}`;
  
  const imdsResult = executeVirtualCommand(dummySessionId, "curl http://169.254.169.254/latest/meta-data/", "{}");
  assert(imdsResult.exitCode !== 0, "Outbound curl to AWS/GCP IMDS (169.254.169.254) exited with non-zero error code");
  assert(imdsResult.output.includes("Cloud Metadata") || imdsResult.output.includes("blocked"), "Output explicitly confirms Cloud Metadata protection alert");

  const pingImdsResult = executeVirtualCommand(dummySessionId, "ping 169.254.169.254", "{}");
  assert(pingImdsResult.exitCode !== 0, "Ping to 169.254.169.254 is blocked by range security policy");

  const internalResult = executeVirtualCommand(dummySessionId, "curl http://localhost:8080", "{}");
  assert(internalResult.output.includes("CyberLab Range Sandbox Target"), "Internal lab application loopback access remains operational");

  // 4. Production Security Headers & Standalone Build Config
  console.log("\n4. Verifying Next.js Production Security Headers Configuration...");
  const nextConfigContent = fs.readFileSync("./website/next.config.ts", "utf8");
  assert(nextConfigContent.includes("output: \"standalone\"") || nextConfigContent.includes("output: 'standalone'"), "Next.js output configured for standalone container deployment");
  assert(nextConfigContent.includes("Strict-Transport-Security"), "HSTS Security Header configured");
  assert(nextConfigContent.includes("Content-Security-Policy"), "Content-Security-Policy Header configured");
  assert(nextConfigContent.includes("X-Frame-Options"), "X-Frame-Options Header configured (DENY)");
  assert(nextConfigContent.includes("nosniff"), "X-Content-Type-Options Header configured (nosniff)");

  // 5. Rate Limiting Protection (Anti-Brute Force)
  console.log("\n5. Verifying Rate Limiting Protection...");
  const rlKey = `test_phase5_rl_${Date.now()}`;
  for (let i = 0; i < 5; i++) {
    checkRateLimit(rlKey, 5, 60000);
  }
  const blockedCheck = checkRateLimit(rlKey, 5, 60000);
  assert(blockedCheck.allowed === false, "Rate limiter properly blocks requests exceeding threshold");

  // 6. Production Reverse Proxy & Manifests
  console.log("\n6. Verifying Production Deployment Artifacts...");
  assert(fs.existsSync("./deploy/nginx/cyberlab.conf"), "Production Nginx reverse proxy configuration exists");
  assert(fs.existsSync("./deploy/docker/docker-compose.prod.yml"), "Production Docker Compose orchestration manifest exists");
  assert(fs.existsSync("./deploy/kubernetes/network-policy.yaml"), "Kubernetes egress isolation NetworkPolicy exists");
  assert(fs.existsSync("./.env.production.example"), "Production environment variable template exists");
  assert(fs.existsSync("./docs/API_REFERENCE.md"), "API Reference documentation specification exists");
  assert(fs.existsSync("./docs/DISASTER_RECOVERY.md"), "Disaster Recovery runbook exists");

  console.log("==================================================");
  console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
