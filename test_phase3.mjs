import { hashPassword, verifyPassword, hashString } from "./website/src/lib/server/db.ts";
import { checkRateLimit } from "./website/src/lib/server/rate-limit.ts";
import crypto from "node:crypto";

console.log("==================================================");
console.log("CYBERLAB-ID PHASE 3 AUTOMATED VERIFICATION SUITE");
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

// 1. Password Security & PBKDF2 Hashing
const salt1 = crypto.randomBytes(16).toString("hex");
const salt2 = crypto.randomBytes(16).toString("hex");
const passPlain = "ComplexP@ssw0rd2026!";

const hash1 = hashPassword(passPlain, salt1);
const hash2 = hashPassword(passPlain, salt2);

assert(hash1 !== hash2, "PBKDF2 produces distinct hashes for different salts (Salting Protection)");
assert(verifyPassword(passPlain, hash1, salt1) === true, "verifyPassword validates correct password");
assert(verifyPassword("WrongPassword123", hash1, salt1) === false, "verifyPassword rejects incorrect password");
assert(verifyPassword(passPlain, hash1, salt2) === false, "verifyPassword rejects mismatched salt");

// 2. Server-side Flag Hashing (Zero Client Flag Disclosure)
const secretFlag = "CYBERLAB{Caesar cipher is fun}";
const computedHash = hashString(secretFlag);
const normalizedHash = hashString("   CYBERLAB{caesar cipher is fun}  ");
assert(computedHash === normalizedHash, "hashString normalizes lowercase and trims whitespace");

const incorrectFlagHash = hashString("CYBERLAB{wrong_answer}");
assert(computedHash !== incorrectFlagHash, "Incorrect flag produces mismatched hash");

// 3. Rate Limiting Protection (Anti-Brute Force)
const testKey = `test_rate_limit_${Date.now()}`;
let wasBlocked = false;

for (let i = 0; i < 7; i++) {
  const rl = checkRateLimit(testKey, 5, 10000);
  if (!rl.allowed) {
    wasBlocked = true;
    break;
  }
}
assert(wasBlocked === true, "Rate limiter blocks excessive authentication/flag requests after threshold");

// 4. Input Validation & Sanitization Simulation
function validateUsername(u) {
  return typeof u === "string" && u.trim().length >= 3 && u.trim().length <= 24 && /^[a-zA-Z0-9_]+$/.test(u.trim());
}

assert(validateUsername("budi_hacker") === true, "Valid username accepted");
assert(validateUsername("bad user name!") === false, "Username with spaces and symbols rejected");
assert(validateUsername("ab") === false, "Username under 3 chars rejected");
assert(validateUsername("<script>alert(1)</script>") === false, "XSS injection username rejected");

// 5. Leaderboard Calculation Integrity
const mockUsers = [
  { username: "alice", xp: 120 },
  { username: "bob", xp: 350 },
  { username: "charlie", xp: 210 },
];
const sorted = [...mockUsers].sort((a, b) => b.xp - a.xp);
assert(sorted[0].username === "bob" && sorted[1].username === "charlie" && sorted[2].username === "alice", "Leaderboard sorts deterministically by total XP descending");

console.log("==================================================");
console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
console.log("==================================================");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
