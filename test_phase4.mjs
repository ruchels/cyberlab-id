import { getDb } from "./website/src/lib/server/db.ts";
import { checkDockerAvailable, getCyberRangeHealth, executeVirtualCommand } from "./website/src/lib/server/range/driver.ts";
import {
  startLabSession,
  getSession,
  stopLabSession,
  executeSessionCommand,
  completeLabSession,
  sweepExpiredSessions,
} from "./website/src/lib/server/range/session-manager.ts";

console.log("==================================================");
console.log("CYBERLAB-ID PHASE 4 AUTOMATED VERIFICATION SUITE");
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

  // 1. Cyber Range Driver & Health Inspection
  const health = getCyberRangeHealth();
  assert(health.status === "healthy", "Cyber Range health report is healthy");
  assert(typeof health.isDockerAvailable === "boolean", "Host container capability safely detected without exceptions");
  assert(health.supportedTemplatesCount >= 5, "Template registry has at least 5 official approved lab templates");

  // 2. Lab Templates Registry Validation
  const linuxTpl = db.prepare("SELECT * FROM lab_templates WHERE id = 'tpl-linux-core'").get();
  assert(linuxTpl !== undefined, "Template 'tpl-linux-core' exists in database");
  assert(linuxTpl.cpu_limit === "0.5 core", "Template enforces 0.5 core CPU limit");
  assert(linuxTpl.memory_limit === "256 MB", "Template enforces 256 MB memory limit");

  const netTpl = db.prepare("SELECT * FROM lab_templates WHERE id = 'tpl-net-topo'").get();
  assert(netTpl !== undefined && netTpl.category === "Networking", "Template 'tpl-net-topo' exists in Networking category");

  // 3. Lab Session Lifecycle: Start Session
  const testUserId = "usr_budi";
  // Clean any previous test sessions
  db.prepare("DELETE FROM lab_completions WHERE user_id = ?").run(testUserId);
  db.prepare("DELETE FROM lab_sessions WHERE user_id = ?").run(testUserId);

  const session = await startLabSession(testUserId, "tpl-linux-core");
  assert(session.id.startsWith("ses_"), "Session created with unique ID");
  assert(session.status === "running", "Session status initialized to 'running'");
  assert(new Date(session.expires_at) > new Date(), "Session expiration timestamp set in the future");

  // 4. Concurrency Limit Protection
  let limitTriggered = false;
  try {
    await startLabSession(testUserId, "tpl-net-topo");
  } catch (err) {
    limitTriggered = err.message === "CONCURRENT_SESSION_LIMIT";
  }
  assert(limitTriggered === true, "Enforces 1 concurrent lab session per user limit");

  // 5. Interactive Terminal Execution & Checkpoints
  const cmd1 = await executeSessionCommand(session.id, testUserId, "pwd");
  assert(cmd1.output === "/home/student", "Terminal executes 'pwd' returning virtual user directory");

  const cmd2 = await executeSessionCommand(session.id, testUserId, "ls /opt/secret");
  assert(cmd2.updatedCheckpoints["chk_ls"] === true, "Checkpoint 'chk_ls' unlocked after inspecting /opt/secret");

  const cmd3 = await executeSessionCommand(session.id, testUserId, "chmod 600 /opt/secret/creds.txt");
  assert(cmd3.updatedCheckpoints["chk_chmod"] === true, "Checkpoint 'chk_chmod' unlocked after restricting permissions");

  const cmd4 = await executeSessionCommand(session.id, testUserId, "find / -perm -4000");
  assert(cmd4.updatedCheckpoints["chk_suid"] === true, "Checkpoint 'chk_suid' unlocked after finding SUID binaries");
  assert(cmd4.allCheckpointsPassed === true, "All required checkpoints passed for completion");

  // 6. Deterministic Completion & XP Award
  const compResult = await completeLabSession(session.id, testUserId);
  assert(compResult.success === true, "Lab completed successfully based on verified checkpoints");
  assert(compResult.xpAwarded === linuxTpl.xp_reward, `Correct XP awarded (+${linuxTpl.xp_reward} XP)`);

  // 7. Anti-Double-Dipping Protection
  const doubleDip = await completeLabSession(session.id, testUserId);
  assert(doubleDip.xpAwarded === 0, "Duplicate lab completion attempts award 0 additional XP");

  // 8. Session Expiration Sweeper
  db.prepare("UPDATE lab_sessions SET expires_at = '2020-01-01T00:00:00.000Z' WHERE id = ?").run(session.id);
  db.prepare("UPDATE lab_sessions SET status = 'running' WHERE id = ?").run(session.id);
  const swept = sweepExpiredSessions();
  const reloaded = await getSession(session.id);
  assert(reloaded.status === "expired", "Session expiration sweep correctly transitions expired sessions to 'expired'");

  // 9. Session Termination
  const stopped = await stopLabSession(session.id, testUserId);
  assert(stopped === true, "Session cleanly stopped and status updated");

  console.log("==================================================");
  console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  console.log("==================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test Suite Unhandled Error:", err);
  process.exit(1);
});
