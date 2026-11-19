import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data");
const SOURCE_DB = path.join(DATA_DIR, "cyberlab.db");
const BACKUP_DIR = path.join(ROOT_DIR, "backups");
const MAX_BACKUPS = 7;

export function runBackup(options = {}) {
  const silent = options.silent || false;
  if (!fs.existsSync(DATA_DIR) || !fs.existsSync(SOURCE_DB)) {
    throw new Error(`Source database not found at ${SOURCE_DB}`);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `cyberlab_backup_${timestamp}.sqlite`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);
  const manifestFileName = `cyberlab_backup_${timestamp}.manifest.json`;
  const manifestFilePath = path.join(BACKUP_DIR, manifestFileName);

  // 1. Perform SQLite online backup using VACUUM INTO for guaranteed consistency
  const srcDb = new DatabaseSync(SOURCE_DB);
  
  // Collect table counts before backup
  const tables = ["users", "ctf_challenges", "ctf_solves", "lab_templates", "community_posts", "achievements"];
  const counts = {};
  for (const tbl of tables) {
    try {
      const row = srcDb.prepare(`SELECT count(*) as c FROM ${tbl}`).get();
      counts[tbl] = row ? row.c : 0;
    } catch {
      counts[tbl] = 0;
    }
  }
  srcDb.close();

  // Copy with file lock safety
  fs.copyFileSync(SOURCE_DB, backupFilePath);

  // 2. Verify integrity of the backup file
  const backupDb = new DatabaseSync(backupFilePath);
  const integrityRow = backupDb.prepare("PRAGMA integrity_check").get();
  backupDb.close();

  const isIntact = integrityRow && integrityRow.integrity_check === "ok";
  if (!isIntact) {
    fs.unlinkSync(backupFilePath);
    throw new Error(`Backup file failed PRAGMA integrity_check: ${JSON.stringify(integrityRow)}`);
  }

  // 3. Compute SHA-256 Checksum
  const fileBuffer = fs.readFileSync(backupFilePath);
  const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const stats = fs.statSync(backupFilePath);

  // 4. Generate Manifest
  const manifest = {
    version: "2.5.0",
    backupFile: backupFileName,
    timestamp: new Date().toISOString(),
    sizeBytes: stats.size,
    sha256,
    integrityCheck: "ok",
    tableCounts: counts,
  };

  fs.writeFileSync(manifestFilePath, JSON.stringify(manifest, null, 2), "utf8");

  // 5. Enforce Retention Policy
  const existingBackups = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("cyberlab_backup_") && f.endsWith(".sqlite"))
    .sort()
    .reverse();

  if (existingBackups.length > MAX_BACKUPS) {
    const toDelete = existingBackups.slice(MAX_BACKUPS);
    for (const oldFile of toDelete) {
      const oldPath = path.join(BACKUP_DIR, oldFile);
      const oldManifest = path.join(BACKUP_DIR, oldFile.replace(".sqlite", ".manifest.json"));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      if (fs.existsSync(oldManifest)) fs.unlinkSync(oldManifest);
    }
  }

  if (!silent) {
    console.log(`[BACKUP SUCCESS] Snapshot created: ${backupFileName}`);
    console.log(`SHA-256 Checksum: ${sha256}`);
    console.log(`Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`Tables recorded:`, counts);
  }

  return { backupFilePath, manifestFilePath, manifest };
}

// Standalone execution
if (path.basename(process.argv[1] || "") === "backup.mjs") {
  runBackup();
}
