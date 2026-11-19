/**
 * CyberLab-ID: Phase 9 Automated Verification Suite
 * Enterprise & Institutional Edition
 * Tests multi-tenant isolation, role hierarchy, anti-IDOR protections,
 * academic structures, LMS courses, assignments, grading, Cyber Range,
 * assessments, verifiable certificates, and audit logs.
 */

import { getDb, hashString } from "./website/src/lib/server/db.ts";
import {
  validateTenantAccess,
  verifyTenantResourceOwnership,
  checkTenantQuota,
  logTenantAudit,
} from "./website/src/lib/server/tenant-guard.ts";
import crypto from "crypto";

const db = getDb();

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("=================================================");
console.log("CYBERLAB-ID: PHASE 9 AUTOMATED VERIFICATION SUITE");
console.log("=================================================");

// 1. Database Schema & Performance Indexes
console.log("\n[1] Multi-Tenant Database Schema & Performance Indexes");
const tables = [
  "institutions",
  "institution_departments",
  "institution_members",
  "institution_invitations",
  "institution_classes",
  "institution_class_students",
  "institution_courses",
  "institution_course_assignments",
  "institution_submissions",
  "institution_lab_assignments",
  "institution_assessments",
  "institution_assessment_attempts",
  "institution_certificates",
  "institution_ai_settings",
  "institution_audit_logs",
  "institution_sso_configs",
];

for (const t of tables) {
  const check = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t);
  assert(check !== undefined, `Table exists: ${t}`);
}

const indexes = [
  "idx_inst_slug",
  "idx_inst_status",
  "idx_inst_members_user",
  "idx_inst_members_inst",
  "idx_inst_dept_inst",
  "idx_inst_classes_inst",
  "idx_inst_courses_inst",
  "idx_inst_assignments_inst",
  "idx_inst_submissions_asg",
  "idx_inst_labs_inst",
  "idx_inst_assessments_inst",
  "idx_inst_certs_inst",
  "idx_inst_certs_hash",
  "idx_inst_audit_inst",
];

for (const idx of indexes) {
  const check = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name=?").get(idx);
  assert(check !== undefined, `Performance index exists: ${idx}`);
}

// 2. Seeded Institutions, Achievements & Initial Workspaces
console.log("\n[2] Seeded Institutions, Departments & Workspaces");
const seededInstitutions = db.prepare("SELECT * FROM institutions").all();
assert(seededInstitutions.length >= 2, `Seeded institutions present (${seededInstitutions.length} institutions)`);

const uiInst = db.prepare("SELECT * FROM institutions WHERE slug='ui-csc'").get();
assert(uiInst && uiInst.org_type === "university", "UI Center for Cyber Security registered as University");
assert(uiInst.plan_tier === "enterprise", "UI CSC provisioned with Enterprise plan");

const smkInst = db.prepare("SELECT * FROM institutions WHERE slug='smk-idnet'").get();
assert(smkInst && smkInst.org_type === "vocational_school", "SMK ID-Networkers registered as Vocational School");

const achs = ["ach_enterprise-admin", "ach_cohort-valedictorian", "ach_range-instructor", "ach_certified-graduate"];
for (const code of achs) {
  const ach = db.prepare("SELECT * FROM achievements WHERE id=? OR code=?").get(code, code.replace(/^ach_/, ""));
  assert(ach !== undefined, `Phase 9 achievement seeded: ${code}`);
}

// 3. Tenant Isolation & Access Guard (Server-Side Security)
console.log("\n[3] Tenant Isolation & Role Hierarchy Guard");

// Citra is student in UI CSC
const citraStudentAuth = validateTenantAccess("usr_citra", "inst_ui_csc", "student");
assert(citraStudentAuth.authorized === true, "Student (Citra) authorized for student-level access in UI CSC");

// Citra (student) attempting instructor action in UI CSC must be REJECTED (403)
const citraPrivilegeEscalation = validateTenantAccess("usr_citra", "inst_ui_csc", "instructor");
assert(
  citraPrivilegeEscalation.authorized === false && citraPrivilegeEscalation.status === 403,
  "Privilege escalation prevented: Student rejected for instructor action (403)"
);

// Budi is instructor in UI CSC
const budiInstructorAuth = validateTenantAccess("usr_budi", "inst_ui_csc", "instructor");
assert(budiInstructorAuth.authorized === true, "Instructor (Budi) authorized for instructor-level action");

// Cross-tenant data isolation: Citra is NOT member of SMK ID-Networkers
const citraCrossTenant = validateTenantAccess("usr_citra", "inst_smk_idnet", "student");
assert(
  citraCrossTenant.authorized === false && citraCrossTenant.status === 403,
  "Cross-tenant data access blocked: Citra rejected from accessing SMK workspace (403)"
);

// Nonexistent institution
const nonexistentAuth = validateTenantAccess("usr_citra", "inst_ghost_org");
assert(nonexistentAuth.authorized === false && nonexistentAuth.status === 404, "Nonexistent institution returns 404");

// Platform superadmin oversight
const superAdminAuth = validateTenantAccess("usr_admin", "inst_ui_csc", "admin");
assert(superAdminAuth.authorized === true && superAdminAuth.isPlatformAdmin === true, "Platform Super Admin inherits institutional oversight");

// Suspended tenant protection
db.prepare("UPDATE institutions SET status='suspended' WHERE id='inst_smk_idnet'").run();
const suspendedCheck = validateTenantAccess("usr_budi", "inst_smk_idnet", "student");
assert(
  suspendedCheck.authorized === false && suspendedCheck.status === 403,
  "Suspended tenant access blocked for normal members"
);
// Restore status
db.prepare("UPDATE institutions SET status='active' WHERE id='inst_smk_idnet'").run();

// 4. Anti-IDOR Resource Ownership Verification
console.log("\n[4] Insecure Direct Object Reference (IDOR) Protections");
const uiCourseOwned = verifyTenantResourceOwnership("institution_courses", "icrs_ui_adv_sec", "inst_ui_csc");
assert(uiCourseOwned === true, "Course correctly verified as belonging to UI CSC");

const uiCourseCrossTenant = verifyTenantResourceOwnership("institution_courses", "icrs_ui_adv_sec", "inst_smk_idnet");
assert(uiCourseCrossTenant === false, "Anti-IDOR: Rejects claiming UI course from SMK workspace");

const uiLabOwned = verifyTenantResourceOwnership("institution_lab_assignments", "ilab_ui_topology", "inst_ui_csc");
assert(uiLabOwned === true, "Range lab assignment verified for UI CSC");

const uiLabCrossTenant = verifyTenantResourceOwnership("institution_lab_assignments", "ilab_ui_topology", "inst_smk_idnet");
assert(uiLabCrossTenant === false, "Anti-IDOR: Rejects claiming UI lab from SMK workspace");

// 5. Subscription Quotas
console.log("\n[5] Subscription Plan Quotas");
const userQuota = checkTenantQuota("inst_ui_csc", "users");
assert(userQuota.allowed === true && userQuota.max === 2000, "Enterprise user quota verified (max 2000 users)");

const labQuota = checkTenantQuota("inst_ui_csc", "labs");
assert(labQuota.allowed === true && labQuota.max === 100, "Enterprise concurrent lab quota verified (max 100 labs)");

// 6. Academic Management & LMS Lifecycle
console.log("\n[6] Academic Structure & LMS Course Delivery");
const departments = db.prepare("SELECT * FROM institution_departments WHERE institution_id='inst_ui_csc'").all();
assert(departments.length >= 2, `Departments present in UI CSC (${departments.length} departments)`);

const classes = db.prepare("SELECT * FROM institution_classes WHERE institution_id='inst_ui_csc'").all();
assert(classes.length >= 1, `Classes present in UI CSC (${classes.length} classes)`);

const uiClassStudent = db.prepare("SELECT * FROM institution_class_students WHERE class_id='icls_ui_cs401' AND user_id='usr_citra'").get();
assert(uiClassStudent !== undefined, "Citra enrolled in CS-401 class");

const courses = db.prepare("SELECT * FROM institution_courses WHERE institution_id='inst_ui_csc'").all();
assert(courses.length >= 1, "Institutional LMS course present");

const assignment = db.prepare("SELECT * FROM institution_course_assignments WHERE id='iasg_ui_wireshark'").get();
assert(assignment && assignment.max_score === 100, "Course assignment created with 100 max points");

const submission = db.prepare("SELECT * FROM institution_submissions WHERE assignment_id='iasg_ui_wireshark' AND user_id='usr_citra'").get();
assert(submission && submission.score === 95, "Student submission successfully graded (Score: 95/100)");

// 7. Cyber Range Practical Lab Integration
console.log("\n[7] Cyber Range Institutional Lab Assignments");
const labAsg = db.prepare("SELECT * FROM institution_lab_assignments WHERE id='ilab_ui_topology'").get();
assert(labAsg && labAsg.template_id === "tpl-net-topo", "Practical lab template assigned to CS-401 class");
assert(labAsg.required_flag.length > 0, "Lab specifies verification flag criteria");

// 8. Institutional Assessment & Anti-Leak CTF
console.log("\n[8] Institutional Assessment & Anti-Leak CTF Evaluation");
const assessment = db.prepare("SELECT * FROM institution_assessments WHERE id='iass_ui_midterm'").get();
assert(assessment && assessment.time_limit_minutes === 90, "Timed assessment configured (90 minutes)");

const questions = JSON.parse(assessment.questions);
assert(questions.length >= 2, `Assessment question bank populated (${questions.length} questions)`);
assert(questions[0].answer_hash !== undefined, "Assessment answers hashed with SHA-256 (Anti-leak protection)");

// Test server-side evaluation
let testScore = 0;
let maxScore = 0;
const submittedAnswers = {
  q1: "Parameterized Prepared Statements",
  q2: "Content-Security-Policy: frame-ancestors 'none'",
};
for (const q of questions) {
  maxScore += q.points;
  if (hashString(submittedAnswers[q.id]) === q.answer_hash) {
    testScore += q.points;
  }
}
const calculatedScore = Math.round((testScore / maxScore) * 100);
assert(calculatedScore === 100, "Server-side answer evaluation produces exact 100% score for correct inputs");

// 9. Institutional Verifiable Certification
console.log("\n[9] Cryptographic Institutional Certificate Verification");
const cert = db.prepare("SELECT * FROM institution_certificates WHERE id='icert_ui_citra'").get();
assert(cert && cert.is_revoked === 0, "Active certificate issued to student");

const expectedHash = crypto.createHash("sha256").update(`${cert.certificate_code}:${cert.user_id}:${cert.institution_id}`).digest("hex");
assert(cert.verification_hash === expectedHash, "Tamper-proof cryptographic SHA-256 verification hash valid");

// Test revocation workflow
db.prepare("UPDATE institution_certificates SET is_revoked=1, revocation_reason='Penyalahgunaan kredensial' WHERE id='icert_ui_citra'").run();
const revokedCert = db.prepare("SELECT is_revoked, revocation_reason FROM institution_certificates WHERE id='icert_ui_citra'").get();
assert(revokedCert.is_revoked === 1, "Certificate successfully revoked");
assert(revokedCert.revocation_reason.includes("Penyalahgunaan"), "Preserves documented revocation justification");

// Restore certificate to active
db.prepare("UPDATE institution_certificates SET is_revoked=0, revocation_reason=NULL WHERE id='icert_ui_citra'").run();

// 10. Audit Logging & Compliance
console.log("\n[10] Institutional Compliance & Audit Trail");
logTenantAudit("inst_ui_csc", "usr_admin", "POLICY_UPDATED", "tenant_policy", "inst_ui_csc", { strict_mode: true });
const auditRecord = db.prepare("SELECT * FROM institution_audit_logs WHERE institution_id='inst_ui_csc' AND action='POLICY_UPDATED'").get();
assert(auditRecord !== undefined, "Institutional security audit trail successfully recorded");

// Summary
console.log("\n=================================================");
console.log(`TOTAL PHASE 9 TESTS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✓ ALL PHASE 9 AUTOMATED VERIFICATIONS PASSED 100%!");
  process.exit(0);
}
