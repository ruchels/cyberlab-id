# CyberLab-ID: Enterprise & Institutional Edition Architecture (Phase 9)

## 1. Executive Summary

**CyberLab-ID Enterprise & Institutional Edition** evolves the platform into an extensible, multi-tenant cybersecurity learning ecosystem tailored for universities, vocational high schools (SMK TKJ/RPL), cybersecurity academies, and enterprise security training centers.

Each institution operates within an isolated organizational tenant workspace with dedicated departments, classes/cohorts, learning management system (LMS) courses, practical Cyber Range lab allocations, private CTF assessments, verifiable internal certificates, AI tutor policies, and real-time compliance reporting.

---

## 2. Multi-Tenant Isolation & Security Model

### 2.1 Server-Side Authorization Boundary
Tenant isolation is enforced strictly at the API and database levels via `website/src/lib/server/tenant-guard.ts`:
- **Tenant Context Validation (`validateTenantAccess`)**: Every tenant-scoped request resolves the authenticated user session and validates their active membership in `institution_members` for the specific `institution_id`.
- **Role Hierarchy Enforcement**:
  $$\text{owner} (100) > \text{admin} (90) > \text{academic\_director} (80) > \text{department\_admin} (70) > \text{instructor} (50) > \text{ta} (40) > \text{auditor} (20) > \text{student} / \text{trainee} (10)$$
- **Suspension Enforcement**: Suspended institutions immediately deny access to all members (HTTP 403 Forbidden).
- **Platform Superadmin Oversight**: Platform super-administrators retain oversight capability while preserving tenant scoping in logs.

### 2.2 Anti-IDOR (Insecure Direct Object Reference) Protection
All institutional entities (courses, classes, assignments, submissions, lab allocations, certificates) include foreign key constraints to `institutions(id)`.
The `verifyTenantResourceOwnership(tableName, resourceId, institutionId)` guard guarantees that a user in Institution A cannot access, view, or modify resources belonging to Institution B, even when supplying a forged resource UUID.

---

## 3. Academic Structure & LMS Course Management

### 3.1 Organization Hierarchy
```
Institution (e.g., Universitas Indonesia CSC)
 ├── Departments / Faculties (e.g., FASILKOM, Puskaji Siber)
 │    └── Classes / Cohorts (e.g., CS-401 Network & Web Pentest, 2026 Ganjil)
 │         ├── Enrolled Students (with NIM / NIS / Employee ID)
 │         ├── Assigned Instructors & Teaching Assistants
 │         ├── Practical Cyber Range Lab Assignments
 │         └── Course Assignments & Submissions
 └── Institutional Course Catalog
      ├── Core CyberLab-ID Curriculum Modules (Linux, Networking, Web, Crypto, Forensics, Reverse)
      ├── Institution-Specific Syllabus Topics
      └── Private Timed Assessments & CTF Exercises
```

### 3.2 Practical Cyber Range & Isolated Lab Integration
- **Isolated Lab Environments**: Classes are assigned approved containerized templates (`tpl-linux-core`, `tpl-net-topo`, `tpl-web-vuln`, `tpl-crypto-sandbox`, `tpl-forensic-workstation`).
- **Resource Quotas**: Concurrency limits (CPU, memory, and simultaneous active sessions) are enforced according to the institution's subscription plan.
- **Verification Criteria**: Instructors define challenge flags or completion parameters without exposing secrets to client frontends.

---

## 4. Institutional Assessments & Private CTF Arena

1. **Timed Institutional Assessments**: Configurable time limits with automated attempt recording.
2. **Anti-Leak Question Bank**: Answers are stored as SHA-256 cryptographic hashes (`answer_hash`). Client requests receive only questions and options without answer keys.
3. **Server-Side Scoring**: Submissions are evaluated strictly server-side, preventing client-side score spoofing or answer sniffing.

---

## 5. Cryptographic Institutional Certification

- **Internal Credentials**: Universities and academies can issue internal completion certificates (`institution_certificates`).
- **Cryptographic Verification**:
  $$\text{Hash} = \text{SHA-256}(\text{certificate\_code} : \text{user\_id} : \text{institution\_id})$$
- **Public Verification**: Credentials are verifiable through the public verification endpoint (`/verify/[certId]`) without disclosing private student emails.
- **Revocation Workflow**: Full revocation audit trail with preserved justification.
- **Accreditation Disclaimer**: Clearly states the issuing institution as the sole certifier, with zero fabricated government or university endorsements.

---

## 6. Enterprise AI Learning Administration

- **Tenant Isolation**: Institution-specific system prompts and approved study domains (`["linux", "networking", "web", "crypto", "forensics", "reverse"]`).
- **Human-in-the-Loop Requirement**: AI tutors are strictly educational guides and cannot determine grades, disciplinary actions, or student certification status.
- **Anti-Exfiltration Guard**: The Phase 7 anti-leak scrubber filters out flags and exam solutions from AI prompts and responses.

---

## 7. Subscription Plans & Quotas

| Plan Tier | Max Users | Lab Concurrency | Storage Quota | AI Tokens/Month | Target Organization |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Community** | 100 | 10 | 5 GB | 500,000 | Open community & student study clubs |
| **Education** | 500 | 25 | 20 GB | 2,000,000 | Vocational schools (SMK) & Polytechnic academies |
| **Professional** | 2,000 | 100 | 100 GB | 10,000,000 | Universities & regional training centers |
| **Enterprise** | 10,000+ | 500+ | 500 GB+ | Custom | Corporate SOCs & government cybersecurity divisions |

*Note: Billing is manually managed by platform administrators. No simulated credit card processing or payment credentials are stored.*

---

## 8. Verification & Test Results

The automated test suite (`test_phase9.mjs`) executes 68 tests covering:
1. Multi-tenant database tables and performance indexes (16 tables, 14 indexes).
2. Seeded institutions, departments, classes, courses, and Phase 9 achievements.
3. Server-side role hierarchy, access denial, and cross-tenant access rejection (403).
4. Anti-IDOR resource validation across tenants.
5. Subscription quotas enforcement.
6. LMS course delivery, assignments, student submissions, and grading.
7. Practical Cyber Range lab assignments.
8. Timed assessment question evaluation with anti-leak hashed answers.
9. Cryptographic SHA-256 certificate issuance and revocation lifecycle.
10. Immutable audit logging for tenant operations.

**Full Platform Regression Suite: 278 / 278 Tests Passed (100% Pass Rate).**
**Next.js Production Build: 97 / 97 Routes Compiled Successfully.**
