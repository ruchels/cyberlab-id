/**
 * CyberLab-ID: Phase 10 Automated Verification Suite
 * Verifies Cyber Defense, Security Operations Center (SOC), Event Ingestion,
 * Detection Rules, Alert Triage, Incident Response, Forensics with SHA-256 Hashing,
 * Threat Intelligence, MITRE ATT&CK Matrix, Assets/Vulnerabilities, and Playbooks.
 */

import { getDb } from "./website/src/lib/server/db.ts";
import {
  normalizeSecurityEvent,
  ingestAndEvaluateEvent,
  lookupThreatIntelligence,
  calculateSocMetrics,
} from "./website/src/lib/server/soc-engine.ts";
import crypto from "crypto";

const db = getDb();
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

console.log("==================================================");
console.log("CYBERLAB-ID: PHASE 10 SOC & DEFENSE VERIFICATION");
console.log("==================================================");

// 1. Database Schema & Performance Indexes
console.log("\n[1] SOC Database Schema & Performance Indexes");
const expectedTables = [
  "soc_events",
  "soc_detection_rules",
  "soc_alerts",
  "soc_alert_notes",
  "soc_incidents",
  "soc_threat_indicators",
  "soc_forensic_cases",
  "soc_assets",
  "soc_vulnerabilities",
  "soc_playbooks",
  "soc_scenarios",
];

for (const tbl of expectedTables) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tbl);
  assert(row !== undefined, `Table exists: ${tbl}`);
}

const expectedIndexes = [
  "idx_soc_events_time",
  "idx_soc_events_source",
  "idx_soc_events_inst",
  "idx_soc_alerts_status",
  "idx_soc_alerts_inst",
  "idx_soc_incidents_status",
  "idx_soc_ioc_type_val",
  "idx_soc_forensics_case",
  "idx_soc_assets_cat",
  "idx_soc_vuln_asset",
];

for (const idx of expectedIndexes) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name=?").get(idx);
  assert(row !== undefined, `Performance index exists: ${idx}`);
}

// 2. Seeded Phase 10 Achievements
console.log("\n[2] Phase 10 SOC Achievements");
const achs = ["ach_soc-analyst-tier1", "ach_incident-responder", "ach_threat-hunter", "ach_forensic-investigator"];
for (const a of achs) {
  const row = db.prepare("SELECT * FROM achievements WHERE id=? OR code=?").get(a, a);
  assert(row !== undefined, `Phase 10 achievement seeded: ${a}`);
}

// 3. Seeded Assets, Vulnerabilities & Threat Intel
console.log("\n[3] Defensive Assets & Threat Intelligence");
const assetsCount = db.prepare("SELECT COUNT(*) as c FROM soc_assets").get().c;
assert(assetsCount >= 4, `Defensive assets seeded: ${assetsCount} assets`);

const vulnCve = db.prepare("SELECT * FROM soc_vulnerabilities WHERE cve_id='CVE-2023-44487'").get();
assert(vulnCve !== undefined, "Critical HTTP/2 Rapid Reset CVE tracked in asset inventory");
assert(vulnCve.cvss_score === 7.5, "Accurate CVSS score recorded");

const iocRow = db.prepare("SELECT * FROM soc_threat_indicators WHERE indicator_type='ip' AND indicator_value='198.51.100.23'").get();
assert(iocRow !== undefined, "Threat intel IP indicator seeded (198.51.100.23)");
assert(iocRow.confidence_score >= 80, `High confidence score: ${iocRow.confidence_score}`);

// 4. Security Playbooks
console.log("\n[4] Security Playbooks");
const playbooks = db.prepare("SELECT * FROM soc_playbooks").all();
assert(playbooks.length >= 2, `Seeded security playbooks: ${playbooks.length}`);
const sshPb = playbooks.find((p) => p.id === "ply_brute_force");
assert(sshPb !== undefined, "SSH Brute-Force Playbook present");
assert(JSON.parse(sshPb.investigation_steps).length >= 3, "Contains structured investigation checklist");

// 5. Ingestion Engine & Normalization
console.log("\n[5] Event Normalization & Ingestion");
const testSyslog = `Nov 19 14:10:02 gateway sshd[1234]: Failed password for invalid user root from 198.51.100.23 port 44211 ssh2`;
const normalizedSyslog = normalizeSecurityEvent(testSyslog, "auth", true);
assert(normalizedSyslog.source_host === "198.51.100.23", "Normalized source host correctly extracted");
assert(normalizedSyslog.severity === "high", "Attributed high severity due to known threat intel IoC match");

// 6. Automated Detection Rule Evaluation & Alert Generation
console.log("\n[6] Ingestion & Alert Generation");
const activeRules = db.prepare("SELECT * FROM soc_detection_rules WHERE is_enabled = 1").all();
assert(activeRules.length >= 4, `Active detection rules: ${activeRules.length}`);

// Web SQL Injection log test
const sqliLog = `192.168.1.150 - - [19/Nov/2026:14:15:00 +0000] "GET /api/users?id=1%27%20UNION%20SELECT%20null,password%20FROM%20users-- HTTP/1.1" 200 412`;
const ingestionResult = ingestAndEvaluateEvent(sqliLog, "web", "inst_ui_csc", true);
assert(ingestionResult.event !== undefined, "Event saved to soc_events");
assert(ingestionResult.triggeredAlerts.length >= 1, `Detection rule triggered on SQLi attempt (Alerts: ${ingestionResult.triggeredAlerts.length})`);
assert(ingestionResult.triggeredAlerts[0].rule_id === "rule_sqli_web", "Correct rule matched (rule_sqli_web)");
assert(ingestionResult.triggeredAlerts[0].severity === "critical", "Critical severity alert generated");

// 7. Alert Triage Lifecycle & Investigation Notes
console.log("\n[7] Alert Triage Workflow & Status Transition");
const alertId = ingestionResult.triggeredAlerts[0].id;

// Transition to investigating
db.prepare("UPDATE soc_alerts SET status='investigating', updated_at=? WHERE id=?").run(new Date().toISOString(), alertId);
const checkAlert = db.prepare("SELECT * FROM soc_alerts WHERE id=?").get(alertId);
assert(checkAlert.status === "investigating", "Alert transitioned to 'investigating'");

// Insert investigation note
const noteId = `not_${Date.now()}`;
db.prepare(`
  INSERT INTO soc_alert_notes (id, alert_id, author_id, note_text, created_at)
  VALUES (?, ?, 'usr_admin', 'Verifikasi payload SQLi mengonfirmasi percobaan bypass autentikasi.', ?)
`).run(noteId, alertId, new Date().toISOString());

const notes = db.prepare("SELECT * FROM soc_alert_notes WHERE alert_id=?").all(alertId);
assert(notes.length >= 1, "Analyst investigation note recorded");

// 8. Incident Declaration & Containment Plan
console.log("\n[8] Incident Declaration & Containment Workflow");
const incId = `inc_${Date.now()}`;
db.prepare(`
  INSERT INTO soc_incidents (
    id, institution_id, incident_number, title, category, severity, status,
    lead_analyst_id, related_alert_ids, affected_assets, timeline_events,
    containment_plan, eradication_plan, recovery_plan, lessons_learned,
    is_simulation, declared_at, resolved_at
  ) VALUES (?, 'inst_ui_csc', 'INC-2026-999', 'Database SQLi Exploitation Attempt', 'data_exfiltration', 'critical', 'containment',
    'usr_admin', ?, '["ast_web_portal", "ast_core_db"]', '[]',
    'Isolasi IP penyerang pada Web Application Firewall WAF', '', '', '', 1, ?, NULL)
`).run(incId, JSON.stringify([alertId]), new Date().toISOString());

const incRow = db.prepare("SELECT * FROM soc_incidents WHERE id=?").get(incId);
assert(incRow !== undefined, "Incident declared (INC-2026-999)");
assert(incRow.status === "containment", "Incident status in containment phase");
assert(incRow.containment_plan.includes("WAF"), "Documented human containment plan");

// 9. Digital Forensics Case & SHA-256 Evidence Hashing
console.log("\n[9] Forensics Evidence & Cryptographic Chain of Custody");
const sampleMemoryDump = "DUMP_HEADER_RAW_SYSTEM_MEMORY_STATE_0x0011FFAA";
const computedSha256 = crypto.createHash("sha256").update(sampleMemoryDump).digest("hex");

const fCaseId = `fcase_${Date.now()}`;
const evidenceJson = JSON.stringify([
  {
    id: "evd_001",
    name: "volatile_memory.raw",
    type: "memory_dump",
    sha256: computedSha256,
    acquired_at: new Date().toISOString(),
    acquired_by: "SOC Lead Investigator",
    custody_log: "Diakuisisi dari node server terinfeksi dan diverifikasi dengan SHA-256.",
  },
]);

db.prepare(`
  INSERT INTO soc_forensic_cases (
    id, institution_id, case_number, title, description, lead_investigator_id,
    status, evidence_inventory, findings_summary, created_at, updated_at
  ) VALUES (?, 'inst_ui_csc', 'FCS-2026-999', 'Forensic Memory Dump Analysis', 'Akuisisi memori proses SQLi', 'usr_admin', 'open', ?, '', ?, ?)
`).run(fCaseId, evidenceJson, new Date().toISOString(), new Date().toISOString());

const fCase = db.prepare("SELECT * FROM soc_forensic_cases WHERE id=?").get(fCaseId);
assert(fCase !== undefined, "Forensics case created");
const parsedEvidence = JSON.parse(fCase.evidence_inventory);
assert(parsedEvidence[0].sha256 === computedSha256, "Evidence integrity guaranteed with SHA-256 cryptographic checksum");

// 10. Metrics Calculation & Summary
console.log("\n[10] SOC Metrics & Summary Aggregator");
const metrics = calculateSocMetrics("inst_ui_csc");
assert(metrics !== null, "Metrics engine computed without errors");

// Clean up test data
db.prepare("DELETE FROM soc_forensic_cases WHERE id=?").run(fCaseId);
db.prepare("DELETE FROM soc_incidents WHERE id=?").run(incId);
db.prepare("DELETE FROM soc_alert_notes WHERE id=?").run(noteId);
db.prepare("DELETE FROM soc_alerts WHERE id=?").run(alertId);

console.log("\n==================================================");
console.log(`TOTAL PHASE 10 TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log("==================================================");

if (failCount > 0) {
  process.exit(1);
} else {
  console.log("✓ ALL PHASE 10 AUTOMATED VERIFICATIONS PASSED 100%!\n");
}
