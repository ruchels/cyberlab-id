# CyberLab-ID Ecosystem Architecture (Phase 6)
## Open Source Ecosystem, Cybersecurity Academy & Global Community

---

### 1. Executive Summary

Phase 6 evolves CyberLab-ID from a production-ready learning and cyber range system into an interconnected, community-driven cybersecurity education ecosystem. It introduces:

1. **CyberLab-ID Academy:** 10 curated learning paths with progress tracking and verifiable digital certificates.
2. **Cryptographic Certificate Verification:** Verifiable credentials featuring deterministic SHA-256 checksums, unique IDs (`CERT-CYBER-...`), public verification page (`/verify/[certId]`), dynamic QR representation, and revocation lifecycle.
3. **CTF Competition Arena:** Team-based competitive tournaments with 6-character squad invite codes, real-time scoreboards, tie-breaking ordering, and anti-duplicate guards.
4. **Contributor Hub & Creator Workflows:** Community-driven submissions for modules, CTF challenges, interactive labs, and tools with administrator peer review.
5. **Research Hub & Technical Write-ups:** In-depth technical articles with automated anti-leak active flag inspection and interactive spoiler overlays.
6. **Community Mentorship & Event Operations:** Verified mentor directory with 1-on-1 session requests and live webinar/workshop registration.
7. **Open-Source Governance & SEO:** Integrated GitHub guidelines, Code of Conduct, dynamic `sitemap.xml`, and `robots.txt`.

---

### 2. Architectural Overview

```
                      +------------------------------------------+
                      |         CyberLab-ID Platform UI          |
                      | Next.js 16 + React 19 + Tailwind CSS v4  |
                      +--------------------+---------------------+
                                           |
        +------------------+---------------+------------------+------------------+
        |                  |                                  |                  |
        v                  v                                  v                  v
+---------------+  +---------------+                  +---------------+  +---------------+
|  Academy Hub  |  |   CTF Arena   |                  | Research Hub  |  | Community &   |
| 10 Curricula  |  | Squads/Teams  |                  | Anti-Leak PoC |  | Mentorship    |
| Cert Issuance |  | Tie-Breaking  |                  | Spoiler Guard |  | Workshops     |
+-------+-------+  +-------+-------+                  +-------+-------+  +-------+-------+
        |                  |                                  |                  |
        +------------------+---------------+------------------+------------------+
                                           |
                                           v
                             +---------------------------+
                             |   Server & Security Core  |
                             | - Cryptographic Hasher    |
                             | - Anti-Leak Validator     |
                             | - ACID Transactions       |
                             | - Role Authorization      |
                             +-------------+-------------+
                                           |
                                           v
                             +---------------------------+
                             | SQLite + WAL Database     |
                             | 10 Performance Indexes    |
                             +---------------------------+
```

---

### 3. CyberLab-ID Academy & Verifiable Credentials

#### 3.1. 10 Structured Learning Paths
- `path-cyber-basics`: Dasar Keamanan Siber & Hygiene Digital (Beginner, 12h)
- `path-linux-admin`: Linux Server Administration & Hardening (Beginner, 18h)
- `path-networking`: Protokol Jaringan, Wireshark & Packet Analysis (Beginner, 20h)
- `path-web-appsec`: Web Application Security & OWASP Top 10 (Intermediate, 24h)
- `path-cryptography`: Kriptografi Terapan & Analisis Cipher (Intermediate, 16h)
- `path-digital-forensics`: Investigasi Forensik & Incident Response (Intermediate, 22h)
- `path-reverse-engineering`: Reverse Engineering & Binary Exploitation (Advanced, 30h)
- `path-secops`: Security Operations (SOC) & Threat Hunting (Intermediate, 20h)
- `path-defensive-sec`: Blue Team Defense, SIEM & Detection (Intermediate, 25h)
- `path-ethical-hacking`: Ethical Hacking & Penetration Testing (Advanced, 35h)

#### 3.2. Cryptographic Certificate Verification
- **Unique Identification:** Formatted as `CERT-<8-HEX-CHARS>` (e.g., `CERT-A1B2C3D4`).
- **Deterministic SHA-256 Hash:**
  $$\text{Hash} = \text{SHA256}(\text{CertId} \parallel \text{UserId} \parallel \text{PathId} \parallel \text{Timestamp})$$
- **Public Verification Route:** `/verify/[certId]` with immediate database validity lookup.
- **Revocation Protocol:** Administrators can revoke certificates with audited reasons; status immediately updates to `revoked` on the public verification page.
- **Educational Integrity Disclaimer:** Explicitly stated as open-source non-accredited badges for demonstrable practical skills.

---

### 4. CTF Competitive Arena & Squad Infrastructure

#### 4.1. Team Operations & Collaboration
- **Squad Formation:** Any registered user can establish a team, becoming Team Captain.
- **Invite Codes:** System generates unique 6-character alphanumeric invite codes (`CYB***`) for squad invitations.
- **Anti-Duplicate Solves:** Solves are recorded with unique composite index `(competition_id, challenge_id, team_id)` to prevent score padding.
- **Deterministic Tie-Breaking:** If two teams achieve the same score, ranking is determined by timestamp of the earliest solve (`ORDER BY total_points DESC, solved_at ASC`).

---

### 5. Research Hub & Contributor Ecosystem

#### 5.1. Anti-Leak Flag Detection
When community members submit technical write-ups, the content is scanned against active CTF challenge flags. If raw unredacted flags are identified, the submission is rejected with an actionable warning prompt to sanitize sensitive solution strings.

#### 5.2. Spoiler Protection
Articles flagged with `has_spoilers = 1` are rendered with an obfuscating blur filter and explicit warning card, requiring active user confirmation to reveal the full exploit methodology.

#### 5.3. Contributor Recognition
Approved proposals automatically reward the author with the `community-contributor` badge and XP boost, showcasing community creators across the platform.

---

### 6. Verification & Automated Test Matrix

The platform is guarded by **115 automated tests** across 6 independent suites:

| Test Suite | Focus Area | Status |
| :--- | :--- | :--- |
| `test_tools.mjs` | Client-Side Cryptographic & Security Utilities | **29 / 29 PASS (100%)** |
| `test_phase3.mjs` | PBKDF2 Auth, Server Flag Validation & Rate Limiting | **12 / 12 PASS (100%)** |
| `test_phase4.mjs` | Cyber Range Containers, Checkpoints & SSRF Isolation | **21 / 21 PASS (100%)** |
| `test_phase5.mjs` | ACID Transactions, Next.js Security Headers & Monitoring | **25 / 25 PASS (100%)** |
| `test_backup_restore.mjs` | Disaster Recovery & Database Snapshot Checksums | **14 / 14 PASS (100%)** |
| `test_phase6.mjs` | Academy, Verifiable Certs, Arena, Research & Events | **14 / 14 PASS (100%)** |
| **Total Verified** | **Full System Regression & Phase 6 Matrix** | **115 / 115 PASS (100%)** |
