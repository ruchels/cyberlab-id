import { getDb, hashPassword, verifyPassword, hashString, runTransaction } from "../website/src/lib/server/db.ts";
import { checkRateLimit } from "../website/src/lib/server/rate-limit.ts";
import { startLabSession, stopLabSession, sweepExpiredSessions } from "../website/src/lib/server/range/session-manager.ts";
import crypto from "node:crypto";

console.log("==================================================");
console.log("CYBERLAB-ID PRODUCTION LOAD & STRESS TEST SUITE");
console.log("==================================================");

function calculatePercentile(latencies, p) {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runBenchmark(name, iterations, concurrency, taskFn) {
  process.stdout.write(`Benchmarking ${name} (${iterations} requests, concurrency ${concurrency})... `);
  const latencies = [];
  let successful = 0;
  let failed = 0;

  const startTotal = Date.now();

  const queue = Array.from({ length: iterations }, (_, i) => i);
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const idx = queue.shift();
      if (idx === undefined) break;

      const t0 = performance.now();
      try {
        await taskFn(idx);
        successful++;
      } catch (err) {
        failed++;
      } finally {
        const t1 = performance.now();
        latencies.push(t1 - t0);
      }
    }
  });

  await Promise.all(workers);
  const totalDurationMs = Date.now() - startTotal;
  const rps = ((iterations / totalDurationMs) * 1000).toFixed(1);

  const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  const p50 = calculatePercentile(latencies, 50).toFixed(2);
  const p95 = calculatePercentile(latencies, 95).toFixed(2);
  const p99 = calculatePercentile(latencies, 99).toFixed(2);

  console.log(`DONE in ${totalDurationMs}ms (${rps} req/sec)`);
  console.log(`   Success: ${successful}, Failed: ${failed}`);
  console.log(`   Latency: avg: ${avg}ms | p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms\n`);

  return { name, iterations, durationMs: totalDurationMs, rps: Number(rps), avg, p50, p95, p99, successful, failed };
}

async function main() {
  const db = getDb();
  const results = [];

  // 1. Leaderboard & User XP Querying Under High Concurrency
  results.push(
    await runBenchmark("Leaderboard Queries (Indexed)", 500, 20, async () => {
      const rows = db.prepare("SELECT id, username, display_name, total_xp FROM users ORDER BY total_xp DESC LIMIT 20").all();
      if (rows.length === 0) throw new Error("No rows returned");
    })
  );

  // 2. Community Forum Browsing & Thread Retrieval
  results.push(
    await runBenchmark("Community Discussions & Comments", 400, 15, async (idx) => {
      const posts = db.prepare("SELECT id, title, category FROM community_posts ORDER BY created_at DESC LIMIT 10").all();
      if (posts.length > 0) {
        db.prepare("SELECT id, content FROM community_comments WHERE post_id = ? LIMIT 5").all(posts[0].id);
      }
    })
  );

  // 3. User Authentication & Password Hashing Verification
  const salt = crypto.randomBytes(16).toString("hex");
  const testHash = hashPassword("CyberLabSecure2026!", salt);
  results.push(
    await runBenchmark("Auth Password Verification (PBKDF2 10k iters)", 100, 5, async () => {
      const ok = verifyPassword("CyberLabSecure2026!", testHash, salt);
      if (!ok) throw new Error("Auth failed");
    })
  );

  // 4. CTF Flag Submissions & Rate Limiting Enforcement
  results.push(
    await runBenchmark("CTF Submissions & Rate-Limiter", 300, 10, async (idx) => {
      const flagHash = hashString("CYBERLAB{test_flag_submission}");
      const rl = checkRateLimit(`load_test_user_${idx % 10}`, 50, 10000);
      if (rl.allowed) {
        // Safe check
      }
    })
  );

  // 5. Cyber Range Session Lifecycle (Create, Sweep, Terminate)
  const tempUser = "usr_budi";
  results.push(
    await runBenchmark("Cyber Range Session Lifecycle", 30, 2, async (idx) => {
      sweepExpiredSessions();
      // Ensure any running session stopped first
      db.prepare("UPDATE lab_sessions SET status = 'completed' WHERE user_id = ?").run(tempUser);
      const session = await startLabSession(tempUser, "tpl-linux-core");
      await stopLabSession(tempUser, session.id);
    })
  );

  console.log("==================================================");
  console.log("LOAD TEST SUMMARY RESULTS");
  console.log("==================================================");
  console.table(
    results.map((r) => ({
      Target: r.name,
      Requests: r.iterations,
      "Throughput (req/s)": r.rps,
      "p50 (ms)": r.p50,
      "p95 (ms)": r.p95,
      "p99 (ms)": r.p99,
      "Success Rate": `${(((r.iterations - r.failed) / r.iterations) * 100).toFixed(1)}%`,
    }))
  );
}

main().catch(console.error);
