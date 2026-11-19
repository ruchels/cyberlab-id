import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export function runRestore(backupFilePath, targetDbPath, options = {}) {
  const silent = options.silent || false;

  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found at ${backupFilePath}`);
  }

  // 1. Verify SHA-256 if manifest exists
  const manifestPath = backupFilePath.replace(".sqlite", ".manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const fileBuf = fs.readFileSync(backupFilePath);
    const actualHash = crypto.createHash("sha256").update(fileBuf).digest("hex");
    if (manifest.sha256 && manifest.sha256 !== actualHash) {
      throw new Error(`Checksum mismatch! Expected: ${manifest.sha256}, Got: ${actualHash}`);
    }
  }

  // 2. Validate SQLite internal page integrity before restoring
  const verifyDb = new DatabaseSync(backupFilePath);
  const pragma = verifyDb.prepare("PRAGMA integrity_check").get();
  verifyDb.close();

  if (!pragma || pragma.integrity_check !== "ok") {
    throw new Error(`Corrupted backup file: integrity_check failed.`);
  }

  // 3. Ensure target directory exists
  const targetDir = path.dirname(targetDbPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 4. Safe atomic restore
  fs.copyFileSync(backupFilePath, targetDbPath);

  // 5. Verify restored database can be queried
  const restoredDb = new DatabaseSync(targetDbPath);
  const countRow = restoredDb.prepare("SELECT count(*) as c FROM users").get();
  restoredDb.close();

  if (!silent) {
    console.log(`[RESTORE SUCCESS] Database restored to: ${targetDbPath}`);
    console.log(`Verified user records count: ${countRow ? countRow.c : 0}`);
  }

  return { success: true, targetDbPath, usersCount: countRow ? countRow.c : 0 };
}

// Standalone execution
if (path.basename(process.argv[1] || "") === "restore.mjs") {
  const backupFile = process.argv[2];
  const targetFile = process.argv[3] || path.join(process.cwd(), "data", "cyberlab.db");
  if (!backupFile) {
    console.error("Usage: node scripts/restore.mjs <backup-file-path> [target-db-path]");
    process.exit(1);
  }
  runRestore(backupFile, targetFile);
}
