# Changelog — CyberLab-ID Platform

All notable changes to the CyberLab-ID platform will be documented in this file.
The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.11.0] — Collapsible Sidebar Navigation & Public GitHub Release Preparation (2026-11-19)

### Added
- **Collapsible Sidebar Navigation (`components/layout/sidebar.tsx`, `components/layout/app-shell.tsx`)**:
  - Linear/Vercel-inspired responsive left navigation with expanded (260px) and collapsed icon-only (72px) modes.
  - Hover tooltips for compact mode, accessible keyboard controls (`aria-expanded`, focus rings).
  - Off-canvas mobile drawer with smooth slide-in/out, dark backdrop blur overlay, and auto-close on navigation.
  - Role-based navigation visibility (Admin console protected and restricted to administrators).
  - User profile dock with avatar, username, role badge, XP counter, profile settings link, and direct logout action.
  - Persistent state preference stored in `localStorage` (`cyberlab_sidebar_collapsed`).
- **Open-Source Repository Audit & GitHub Release Preparation**:
  - Comprehensive secret audit: zero hardcoded API keys, private tokens, or credentials in tracked files.
  - Environment templates (`.env.example` in root and `website/.env.example`) with safe defaults.
  - Database sanitization: 100% fictional demonstration data with zero real PII.
  - GitHub Actions CI/CD workflows updated for public multi-branch collaboration (`[main, master]`).
  - Professional bilingual documentation (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE`, `CODE_OF_CONDUCT.md`).

---

## [2.10.0] — Phase 10: Cyber Defense, Security Operations & Incident Response (2026-11-19)

### Added
- **Security Operations Center (SOC) Workspace (`/soc`)**:
  - High-tech Blue Team command dashboard with real-time severity metrics (Critical, High, Medium, Low), active alerts, open incidents, and Mean Time to Respond (MTTR) tracking.
  - Clear visual badges and database flags (`is_simulation = 1`) distinguishing educational simulations from operational telemetry.
- **Security Event Management & Normalization**:
  - Telemetry ingestion engine (`soc_events`) normalizing Linux Auth/sshd syslogs, Web HTTP access logs (with URL-decoded SQLi/traversal detection), DNS query logs, and JSON payloads.
  - Source IP extraction, severity attribution, and correlation tracking.
- **Configurable Detection Engine & Alert Generation**:
  - Detection rules table (`soc_detection_rules`) mapped directly to MITRE ATT&CK techniques (T1110, T1190, T1071.004, T1548.001, T1046).
  - Automated rule evaluator generating structured security alerts (`soc_alerts`).
- **Alert Triage & Investigation Workflow**:
  - 6-stage alert lifecycle (`new` -> `acknowledged` -> `investigating` -> `escalated` -> `resolved` -> `closed` -> `false_positive`).
  - Analyst investigation notes (`soc_alert_notes`) and evidence logging.
- **Incident Response Management**:
  - Formal incident declaration (`soc_incidents`) with unique identifiers (`INC-YYYY-XXX`).
  - Multi-stage IR containment, eradication, and recovery plans with human-in-the-loop requirement.
- **Threat Intelligence Center**:
  - Indicator of Compromise (IoC) table (`soc_threat_indicators`) tracking malicious IPs, domains, hashes, and CVEs with confidence scores.
  - Real-time IoC lookup engine matching incoming telemetry against threat feeds.
- **Digital Forensics Case Management & SHA-256 Hashing**:
  - Forensic case tracking (`soc_forensic_cases`) with evidence inventory.
  - Tamper-proof cryptographic SHA-256 checksum verification and chain of custody preservation.
- **Defensive Assets & Vulnerabilities**:
  - Defensive asset inventory (`soc_assets`) and tracked CVE vulnerabilities (`soc_vulnerabilities`) with remediation status.
- **Security Playbooks**:
  - Standard Operating Procedures (`soc_playbooks`) with interactive checklists for SSH Brute Force, Web SQLi, Phishing, and DNS Tunneling.
- **Procedural Web Audio Engine**:
  - 100% zero-dependency synthesized audio engine (`sound-engine.ts`) via browser Web Audio API.
  - UI micro-sounds (click, tab, hover, alert, CTF solve chime) and ambient cyber drone (disabled by default).

---

## [2.9.0] — Phase 9: Enterprise & Institutional Edition (2026-11-19)

### Added
- **Multi-Tenant Architecture & Workspace Isolation**:
  - Secure tenant workspace isolation supporting universities, vocational schools (SMK), high schools, training academies, and corporate security training departments.
  - Strict server-side authorization guard (`validateTenantAccess`) enforcing role hierarchy: `owner` > `admin` > `academic_director` > `department_admin` > `instructor` > `ta` > `auditor` > `student` / `trainee`.
  - Comprehensive Anti-IDOR (Insecure Direct Object Reference) verification (`verifyTenantResourceOwnership`) preventing cross-tenant access to courses, classes, submissions, labs, and certificates.
  - Multi-membership support enabling users to belong to different institutions with independent roles.
  - Immediate suspension enforcement blocking non-owner access for suspended institutions.
- **Academic Structure Management**:
  - Organizational hierarchy with faculties/departments (`institution_departments`), classes/cohorts (`institution_classes`), and academic terms/semesters.
  - Student enrollment and instructor assignment workflows with NIM / NIS / Employee ID tracking.
  - Bulk CSV import (`/api/institutions/[id]/import`) for rapid onboarding of student and instructor rosters with pre-validation and preview.
- **Institutional Learning Management System (LMS)**:
  - Institutional course catalog (`institution_courses`) integrated with CyberLab-ID core curriculum modules (Linux, Networking, Web, Crypto, Forensics, Reverse Engineering).
  - Course assignment delivery, student submission portal, and instructor grading queue with feedback notes.
- **Practical Cyber Range Institutional Integration**:
  - Class-scoped practical lab assignments (`institution_lab_assignments`) using pre-approved virtual templates (`tpl-net-topo`, `tpl-linux-core`, `tpl-web-vuln`).
  - Resource quota enforcement according to institutional subscription tier (concurrency limits, CPU, memory, storage).
- **Institutional Assessments & Private CTF Arena**:
  - Timed assessments and class competitions (`institution_assessments`) with configurable duration limits.
  - Anti-leak question banks with answers stored as SHA-256 cryptographic hashes without client disclosure.
  - Server-side scoring and validation engine preventing answer sniffing and score tampering.
- **Cryptographic Institutional Certification**:
  - Internal certificate issuance (`institution_certificates`) with unique codes and tamper-proof SHA-256 verification hashes.
  - Public verification support without disclosing private student emails.
  - Administrative certificate revocation workflow with preserved justification logs.
- **Real-Time Analytics & Institutional Reporting**:
  - Live computed metrics on student enrollment, department distributions, submission averages, and certification outcomes.
  - One-click CSV and JSON report exports (`/api/institutions/[id]/reports?format=csv`).
- **Enterprise AI Governance**:
  - Tenant-isolated AI tutor controls (`institution_ai_settings`) with custom institutional system prompts and domain restrictions.
  - Strict human-in-the-loop requirement: AI is prohibited from automatically issuing final grades, disciplinary actions, or graduation credentials.
- **Testing & Verification**:
  - 68 automated unit and integration tests in `test_phase9.mjs` verifying multi-tenancy, cross-tenant rejection, role hierarchies, LMS workflows, CTF scoring, certificate hashes, and audit logging.
  - Total platform regression suite: 278 / 278 tests passed (100% pass rate).
  - Next.js production compilation: 97 / 97 routes compiled successfully.

---

## [2.8.0] — Phase 8: Global Ecosystem, External Integrations & International Collaboration (2026-11-19)

### Added
- **Global Platform Localization & Region Neutrality**:
  - Full Indonesian and English translations with persistent user preference storage.
  - International timezone selector with localized timestamp rendering.
- **Institutional & Community Partnerships (`/partnerships`)**:
  - Public directory of verified academic, vocational, and research partners.
  - Online partnership application workflow with administrative review queue.
- **Open-Source Contributor Hub (`/contributors`)**:
  - Task board (`contribution_tasks`) for code, documentation, and translations with claim/PR lifecycle and XP rewards.
- **External Cybersecurity Knowledge Integrations (`/knowledge-explorer`)**:
  - MITRE ATT&CK Matrix explorer with tactic/technique mapping.
  - NIST CSF v2.0 functions navigator (Identify, Protect, Detect, Respond, Recover).
  - OWASP Top 10 risks with CWE mapping and defensive mitigations.
  - Real-time/cached NIST NVD CVE lookup with CVSS base scores and defensive guidance.
- **Public Developer API v1 (`/developers`, `/api/v1/*`)**:
  - Developer portal with SHA-256 hashed API key management, granular scopes, and sliding-window rate limiting.
  - Public endpoints for curriculum modules, upcoming events, published research, and CTF schedules with strict data minimization.
- **GDPR & Privacy Compliance**:
  - User data export in JSON (`/api/user/export-data`).
  - Permanent account deletion workflow with confirmation guard (`/api/user/delete-account`).
- **Automated Verification**:
  - 50 automated tests in `test_phase8.mjs` (210 platform tests, 100% pass rate).

---

## [2.7.0] — Phase 7: Intelligence & Advanced Automation (2026-11-19)

### Added
- **AI Learning Assistant (`/assistant`)**:
  - Interactive, bilingual (ID/EN) cybersecurity tutor with full conversation history and per-session deletion controls.
  - Grounded RAG knowledge retrieval drawing from 8 internal high-authority knowledge documents and 10 academy paths.
  - Progressive hint levels (Level 1: Konseptual, Level 2: Teknis, Level 3: Detail Langkah) preventing answer-spoiling.
  - Strict anti-leak defense: `sanitizeAntiLeak()` scrubbing raw flag patterns (`CYBERLAB{...}`) with defensive redaction placeholders.
  - User feedback mechanisms (thumbs up / thumbs down with notes) persisted to the database.
- **Personalized Learning Engine (`/learning/ai-path`)**:
  - Algorithmic domain mastery radar evaluating student performance across all 6 cybersecurity domains (Linux, Networking, Web, Cryptography, Forensics, Reverse Engineering).
  - Weakest domain detection with tailored next activity recommendations and skill-matched CTF challenge suggestions.
  - User privacy controls: student consent toggle to enable or disable personalized learning analytics.
  - Progressive milestone tracker rewarding lab completions, first CTF solves, and path certifications.
- **Defensive Security Analysis Center (`/security-center`)**:
  - **Log Analyzer**: Ingests authentication logs and Web server logs to detect SSH brute-force attempts, SQL injections, Path Traversal, and scanning tools; outputs Fail2ban jail configurations and remediation checklists.
  - **Network Traffic Analyzer**: Ingests packet metadata/summaries to detect port scans, unencrypted plaintext credentials (HTTP Basic Auth), and TCP SYN floods; generates defensive Snort/Suricata rules.
  - **File Analysis Assistant (Zero-Execution Safe)**: Inspects binary headers client-side and server-side to calculate SHA-256, SHA-1, and MD5 hashes, identify Magic Bytes (PNG, JPEG, PE32, ELF, PDF, ZIP), flag extension spoofing attacks, and compute Shannon entropy.
- **Adaptive AI Quiz Engine (`/quizzes`)**:
  - Interactive domain-specific quizzes with instant explanation feedback and +15 XP rewards.
  - Admin quiz curation and review queue to approve or reject community/AI generated draft questions before publication.
- **AI Administration & Governance (`/admin` -> AI Tab)**:
  - Multi-provider model configuration supporting Google Gemini, OpenAI, Anthropic Claude, and Local Offline RAG.
  - Masked API key management, request counters, and total token usage tracking.
  - RAG knowledge document CRUD management with live index toggle.
- **Automated Verification**:
  - 45 automated unit and integration tests in `test_phase7.mjs` verifying RAG grounding, safety guards, personalization, defensive analyzers, quizzes, and admin workflows (total 160 platform tests, 100% pass rate).

---

## [2.6.0] — Phase 6: Open Source Ecosystem, Cybersecurity Academy & Global Community (2026-11-19)

### Added
- **CyberLab-ID Academy (`/academy`)**:
  - 10 structured practical learning paths across Beginner, Intermediate, and Advanced tiers: Cyber Basics, Linux Admin, Networking, Web AppSec, Cryptography, Digital Forensics, Reverse Engineering, SecOps, Defensive Security, and Ethical Hacking.
  - Interactive path syllabus viewer (`/academy/[pathId]`) with modular checkoffs, progress calculation, and completion certificate claiming.
- **Cryptographic Digital Certificate Verification (`/verify/[certId]`)**:
  - Verifiable digital certificates issued upon 100% path completion with unique format `CERT-<HEX>`.
  - Deterministic SHA-256 verification hash generated server-side from holder ID, path ID, and issue timestamp.
  - Public verification lookup interface with QR code graphic representation and administrative revocation detection.
  - Plain-text educational disclaimer emphasizing non-accredited open-source digital competency badges.
- **CTF Competitive Arena & Squad Infrastructure (`/arena`, `/arena/teams`)**:
  - Scheduled individual and team-based tournament competitions with real-time scoreboard.
  - Team creation, membership management, and unique 6-character squad invitation codes (`CYB***`).
  - Deterministic tie-breaking rules ordering tied scores by the earlier solve timestamp (`ORDER BY total_points DESC, solved_at ASC`).
  - Anti-duplicate challenge solve guards enforcing unique `(competition_id, challenge_id, team_id)` constraints.
- **Contributor Hub & Creator Workflows (`/contributors`)**:
  - Community-driven submission pipeline for modules, CTF challenges, interactive labs, tutorials, write-ups, and tools.
  - Administrative review queue and approval lifecycle (`submitted`, `in_review`, `approved`, `published`, `rejected`).
  - Automated `community-contributor` achievement badge and XP award upon publication.
- **Research Hub & Technical Write-ups (`/research`, `/research/[slug]`)**:
  - Technical article reader supporting citations, tag filtering, and interactive likes.
  - Automated anti-leak flag scanner detecting raw active CTF flag strings during article submission.
  - Interactive anti-spoiler blur overlay for write-ups with solution gating.
- **Community Mentorship & Event Operations (`/mentorship`, `/events`)**:
  - Verified mentor directory with specialty tags and 1-on-1 consultation request flow.
  - Community event calendar for webinars, workshops, study groups, and CTF gatherings with live capacity tracking and 1-click registration.
- **Open-Source Hub & SEO (`/opensource`, `sitemap.xml`, `robots.txt`)**:
  - Dedicated open-source governance portal with local development guidelines, Contributor Covenant Code of Conduct, and responsible disclosure policy.
  - Dynamic `sitemap.xml` indexing all Academy paths, research articles, and public portals.
  - Dynamic `robots.txt` protecting administrative and API endpoints.
- **Automated Verification**:
  - Phase 6 automated test suite (`test_phase6.mjs`) verifying all 14 ecosystem criteria.
  - Zero regression across all 115 test cases (29 Phase 1/2, 12 Phase 3, 21 Phase 4, 25 Phase 5, 14 Backup/Restore, 14 Phase 6).
  - Clean production build with Turbopack compiling 77 routes without warnings.

---

## [2.5.0] — Phase 5: Production Readiness, Deployment & Ecosystem Launch (2026-11-19)

### Added
- **Production Observability & Telemetry**:
  - Endpoint `/api/health` with comprehensive sub-checks (database ping, memory RSS/heap, range driver status, table row counts).
  - Endpoint `/api/admin/metrics` for administrator observability and Prometheus scraping.
  - Dedicated "Production Readiness" audit tab in Admin Dashboard (`/admin`) displaying live telemetry and a security checklist.
- **Production Hardening & Reverse Proxy**:
  - Strict HTTP Security Headers: HSTS (63,072,000s), Content Security Policy, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy.
  - Next.js Standalone build output (`output: 'standalone'`) in `next.config.ts`.
  - Comprehensive Nginx configuration (`deploy/nginx/cyberlab.conf`) with rate-limiting zones, SSL termination, and WebSocket support.
  - Caddy configuration (`deploy/caddy/Caddyfile`) with automatic Let's Encrypt TLS.
  - Kubernetes production manifests (`deploy/kubernetes/`) with strict egress NetworkPolicy blocking IMDS metadata (`169.254.169.254`).
- **Database Performance & Reliability**:
  - 12 High-performance SQLite database indexes across `sessions`, `users(total_xp)`, `community_posts`, `community_comments`, `ctf_solves`, `lab_sessions`, and `audit_logs`.
  - Atomic database transactions helper `runTransaction` wrapping CTF solves and Cyber Range lab completions.
  - Automated database backup script (`scripts/backup.mjs`) with SHA-256 checksums, JSON metadata manifest, and 7-day retention policy.
  - Database restoration script (`scripts/restore.mjs`) with cryptographic checksum verification and page integrity validation.
  - Automated test restoration script (`scripts/test_backup_restore.mjs`) verifying non-destructive snapshot restoration.
- **Cyber Range Egress & SSRF Protection**:
  - Blocked requests to cloud instance metadata services (`169.254.169.254`, `metadata.google.internal`) in `driver.ts`.
  - Enforced egress boundaries on virtual terminal runner.
- **Enterprise CI/CD Automation**:
  - GitHub Actions workflow (`.github/workflows/ci-cd.yml`) executing static analysis, 4 test suites (80+ automated tests), production build verification, and container smoke test.
- **Legal & Policy Framework**:
  - Drafts in `docs/legal/`: Privacy Policy, Terms of Service, Acceptable Use Policy, Community Guidelines, Responsible Disclosure Policy, and Lab Safety Policy.
- **API Reference Specification**:
  - Comprehensive documentation in `docs/API_REFERENCE.md` detailing request/response formats, authentication, and rate limits.

---

## [2.4.0] — Phase 4: Advanced Cyber Range & Virtual Lab Infrastructure (2026-11-19)

### Added
- **Cyber Range Portal (`/range`)**:
  - Dual-mode execution engine: Docker OCI Container Daemon with seccomp/cap-drop ALL, and Embedded Isolated Runner fallback for environments without Docker.
  - 5 Interactive practical range templates: Linux System Hardening, Network Topology & Gateway Routing, OWASP Web Security Sandbox, Digital Forensics & Log Timeline, x86 Reverse Engineering Stepper.
  - Stateful session lifecycle with countdown timers, concurrency management, and background expiration sweep.
  - Deterministic server-side checkpoint verification and anti double-dipping XP awarding.
  - Cyber Range management tab in Admin console.

---

## [2.3.0] — Phase 3: Community Ecosystem, CTF Platform & User Infrastructure (2026-11-19)

### Added
- **User Authentication & Profiles**:
  - PBKDF2 password hashing with cryptographically random salts (10,000 iterations).
  - Secure HTTP-only session cookies.
  - Profile management, avatar selection, bio editing, and password reset flow.
- **Capture The Flag (CTF) Platform (`/challenges`)**:
  - Server-side flag verification with zero client flag disclosure via SHA-256 hash comparison.
  - Constant-time hash verification (`crypto.timingSafeEqual`).
  - Anti-brute force rate limiting (10 attempts/minute).
- **Community Forum & Gamification (`/community` & `/leaderboard`)**:
  - Threaded discussion topics, comments, upvotes, and moderation reporting.
  - Global leaderboard with real-time rank calculation.
  - In-app notification center.
  - Admin dashboard (`/admin`) with User RBAC, CTF authoring, and audit logging.

---

## [2.0.0] — Phase 1 & Phase 2: Foundational Learning Platform & Security Toolkit (2026-11-19)

### Added
- Bilingual (Indonesian & English) curriculum with 24 structured cybersecurity lessons across 6 tracks.
- 6 Client-side Interactive Cybersecurity Tools: Hash Inspector, Subnet Calculator, Cipher Toolkit, File Signature Checker, Metadata Inspector, Password Analyzer.
- Progress & Achievement Engine with local persistence and export.
