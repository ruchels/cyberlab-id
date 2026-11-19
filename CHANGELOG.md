# Changelog — CyberLab-ID Platform

All notable changes to the CyberLab-ID platform will be documented in this file.
The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
