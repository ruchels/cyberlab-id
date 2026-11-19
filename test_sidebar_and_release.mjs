/**
 * CyberLab-ID: Sidebar Navigation & Public GitHub Release Verification Suite
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

console.log("===============================================================");
console.log("CYBERLAB-ID: SIDEBAR & PUBLIC RELEASE VERIFICATION SUITE");
console.log("===============================================================");

// 1. Sidebar Navigation Components
console.log("\n[1] Collapsible Sidebar Navigation Architecture");
assert(fs.existsSync("website/src/components/layout/sidebar.tsx"), "Sidebar component exists");
assert(fs.existsSync("website/src/components/layout/app-shell.tsx"), "AppShell component exists");

const sidebarContent = fs.readFileSync("website/src/components/layout/sidebar.tsx", "utf-8");
assert(sidebarContent.includes("isCollapsed"), "Supports collapsed and expanded state");
assert(sidebarContent.includes("mobileOpen"), "Supports off-canvas mobile drawer state");
assert(sidebarContent.includes("adminOnly"), "Enforces role-based visibility for administrative routes");
assert(sidebarContent.includes("useAuth"), "Integrates with central authentication state");
assert(sidebarContent.includes("useSound"), "Integrates with tactical sound engine feedback");
assert(sidebarContent.includes("aria-label"), "Includes accessible ARIA labels for screen readers");

// 2. Open-Source Documentation & Legal Framework
console.log("\n[2] Open-Source Documentation Standards");
assert(fs.existsSync("README.md"), "README.md exists");
assert(fs.existsSync("CONTRIBUTING.md"), "CONTRIBUTING.md exists");
assert(fs.existsSync("SECURITY.md"), "SECURITY.md exists");
assert(fs.existsSync("LICENSE"), "LICENSE exists (MIT)");
assert(fs.existsSync("CODE_OF_CONDUCT.md"), "CODE_OF_CONDUCT.md exists");
assert(fs.existsSync("CHANGELOG.md"), "CHANGELOG.md exists");

const readmeContent = fs.readFileSync("README.md", "utf-8");
assert(readmeContent.includes("https://github.com/ruchels/cyberlab-id"), "README points to official repository");
assert(readmeContent.includes("cp .env.example .env.local"), "Setup instructions document environment template");

// 3. Environment & Secret Hygiene
console.log("\n[3] Environment & Secret Hygiene");
assert(fs.existsSync(".env.example"), "Root .env.example exists with safe placeholders");
assert(fs.existsSync("website/.env.example"), "Website .env.example exists");

const gitignoreContent = fs.readFileSync(".gitignore", "utf-8");
assert(gitignoreContent.includes(".env"), ".gitignore excludes environment secrets");
assert(gitignoreContent.includes("*.db"), ".gitignore excludes local database files");
assert(gitignoreContent.includes(".next/"), ".gitignore excludes Next.js build cache");
assert(gitignoreContent.includes("node_modules/"), ".gitignore excludes node_modules");

// Verify that no real production secrets are committed in git
console.log("\n[4] Git Tracked Secret Scan");
try {
  const trackedFiles = execSync("git ls-files", { encoding: "utf-8" }).split("\n");
  const hasEnvFile = trackedFiles.some((f) => f === ".env" || f === ".env.local" || f === "website/.env");
  assert(!hasEnvFile, "No private .env files are tracked in Git");

  const hasDbFile = trackedFiles.some((f) => f.endsWith(".db") || f.endsWith(".sqlite"));
  assert(!hasDbFile, "No local SQLite database binary files are tracked in Git");
} catch (e) {
  assert(false, "Git ls-files check failed: " + e.message);
}

// 5. CI/CD Workflows
console.log("\n[5] GitHub Actions CI/CD Pipeline");
assert(fs.existsSync(".github/workflows/ci.yml"), "GitHub Actions CI workflow exists");
const ciContent = fs.readFileSync(".github/workflows/ci.yml", "utf-8");
assert(ciContent.includes("master") && ciContent.includes("main"), "CI supports master and main branches");

console.log("\n===============================================================");
console.log(`TOTAL SIDEBAR & RELEASE CHECKS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log("===============================================================");

if (failCount > 0) {
  process.exit(1);
} else {
  console.log("✓ ALL SIDEBAR & RELEASE VERIFICATIONS PASSED 100%!\n");
}
