import fs from "node:fs";
import path from "node:path";
import { runBackup } from "./backup.mjs";
import { runRestore } from "./restore.mjs";
import { DatabaseSync } from "node:sqlite";

console.log("==================================================");
console.log("CYBERLAB-ID DATABASE BACKUP & RESTORE VERIFICATION");
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

try {
  // Step 1: Execute Backup
  console.log("\n1. Testing automated backup creation...");
  const { backupFilePath, manifestFilePath, manifest } = runBackup({ silent: true });

  assert(fs.existsSync(backupFilePath), "Backup snapshot file created");
  assert(fs.existsSync(manifestFilePath), "Backup manifest JSON created");
  assert(typeof manifest.sha256 === "string" && manifest.sha256.length === 64, "SHA-256 checksum generated");
  assert(manifest.integrityCheck === "ok", "Database PRAGMA integrity_check verified");
  assert(manifest.tableCounts.users > 0, "Users table captured in snapshot");
  assert(manifest.tableCounts.ctf_challenges > 0, "CTF challenges captured in snapshot");
  assert(manifest.tableCounts.lab_templates > 0, "Lab templates captured in snapshot");

  // Step 2: Test Restoration to an Isolated Target
  console.log("\n2. Testing restoration to isolated temporary database...");
  const testRestoreTarget = path.join(process.cwd(), "data", `test_restored_${Date.now()}.db`);

  const restoreResult = runRestore(backupFilePath, testRestoreTarget, { silent: true });
  assert(restoreResult.success === true, "Restore function succeeded");
  assert(fs.existsSync(testRestoreTarget), "Restored database file exists on disk");

  // Step 3: Validate Restored Database Contents
  console.log("\n3. Validating data integrity of restored database...");
  const testDb = new DatabaseSync(testRestoreTarget);

  const restoredUsers = testDb.prepare("SELECT count(*) as c FROM users").get();
  assert(restoredUsers.c === manifest.tableCounts.users, "Restored users count matches snapshot exactly");

  const restoredTemplates = testDb.prepare("SELECT count(*) as c FROM lab_templates").get();
  assert(restoredTemplates.c === manifest.tableCounts.lab_templates, "Restored lab templates match snapshot exactly");

  const restoredChallenges = testDb.prepare("SELECT count(*) as c FROM ctf_challenges").get();
  assert(restoredChallenges.c === manifest.tableCounts.ctf_challenges, "Restored CTF challenges match snapshot exactly");

  const adminUser = testDb.prepare("SELECT username, role FROM users WHERE role = 'admin' LIMIT 1").get();
  assert(adminUser && adminUser.username === "admin", "Admin account preserved intact with admin role");

  testDb.close();

  // Step 4: Cleanup temporary test database
  if (fs.existsSync(testRestoreTarget)) {
    fs.unlinkSync(testRestoreTarget);
  }
  assert(!fs.existsSync(testRestoreTarget), "Temporary test restore artifact cleanly pruned");

  console.log("==================================================");
  console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
} catch (error) {
  console.error("Test execution failed:", error);
  process.exit(1);
}
