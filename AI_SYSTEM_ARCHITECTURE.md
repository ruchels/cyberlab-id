# CyberLab-ID: AI System & Automation Architecture
## Phase 7: Intelligence, Defensive Analysis & Controlled Automation

---

## 1. Executive Architecture Overview

CyberLab-ID Phase 7 transforms the educational platform into an intelligent, AI-assisted learning and defensive security analysis ecosystem. The system is designed with strict **zero-leak defensive boundaries**, **fail-safe offline RAG fallbacks**, and **zero-execution safe static inspection**.

```
+-----------------------------------------------------------------------------------+
|                              CYBERLAB-ID ECOSYSTEM                                |
+-----------------------------------------------------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
        v                                 v                                 v
+-----------------------+     +-----------------------+     +-----------------------+
|  AI Learning Tutor    |     | Personalized Learning |     | Defensive Security    |
|  (/assistant)         |     | Engine (/ai-path)     |     | Center (/security)    |
+-----------------------+     +-----------------------+     +-----------------------+
        |                                 |                                 |
        +---------------------------------+---------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             CORE AI PIPELINE & GUARDS                             |
+-----------------------------------------------------------------------------------+
|  1. Prompt Injection Defense (DAN / Jailbreak / System Prompt extraction blocker) |
|  2. Grounded RAG Knowledge Retrieval (BM25 tokenization, relevance scoring)       |
|  3. Flag Anti-Leak Guard (Regex interceptor, redaction of raw CTF flags)         |
|  4. Multi-Provider Router (Google Gemini, OpenAI, Claude, Local Fallback)         |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        DATABASE & PERSISTENCE (SQLite + WAL)                      |
+-----------------------------------------------------------------------------------+
|  - ai_conversations & ai_messages (User-controlled chat history & feedback)       |
|  - ai_knowledge_docs (High-authority domain reference corpus)                    |
|  - ai_quiz_drafts (Admin-curated adaptive question bank)                         |
|  - ai_user_preferences (Privacy consent & study goals)                            |
|  - ai_security_analyses (Immutable defensive investigation audit logs)            |
|  - ai_provider_config (Masked API keys, rate limits & provider status)            |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Capabilities & Components

### 2.1. AI Learning Assistant (`/assistant`)
- **Bilingual Interface:** Real-time conversational tutor in Bahasa Indonesia and English.
- **RAG Grounding:** Queries are enriched with relevant context extracted from 8 internal knowledge documents and 10 curriculum pathways before reaching the LLM, eliminating hallucinations.
- **Progressive Hinting:** Instead of providing direct answers or solutions, students can select hint tiers:
  - *Level 1 (Konseptual):* Explains underlying principles (e.g., how SUID or prepared statements function).
  - *Level 2 (Teknis):* Highlights specific tools or commands (e.g., `find / -perm -4000`, `UNION SELECT`).
  - *Level 3 (Detail Langkah):* Step-by-step guidance without disclosing exact answers or flags.
- **Flag Anti-Leak Enforcement:** Every assistant output passes through `sanitizeAntiLeak()`. Any match matching active or simulated flags (e.g., `CYBERLAB{...}`) is redacted to `CYBERLAB{REDACTED_BY_DEFENSIVE_GUARD}`.
- **Conversation Controls:** Persistent sessions with per-conversation deletion, bulk history wipeout, and thumbs up/down user feedback logging.

### 2.2. Personalized Learning Engine (`/learning/ai-path`)
- **Domain Mastery Scoring:** Computes performance across 6 cybersecurity domains:
  1. *Linux System Administration & Hardening*
  2. *Computer Networking & TCP/IP*
  3. *Web Application Security & OWASP*
  4. *Cryptography & Data Protection*
  5. *Digital Forensics & Incident Response*
  6. *Reverse Engineering & Binary Analysis*
- **Algorithmic Signal Analysis:** Weighs completed lab checkpoints, CTF solves, and quiz scores to calculate mastery percentages (0-100%) and skill tiers (*Novice, Apprentice, Practitioner, Specialist*).
- **Targeted Recommendations:** Recommends specific lessons and CTF challenges aimed at strengthening the student's weakest domain.
- **User Privacy Consent:** Fully adheres to data privacy standards; students can toggle personalized analytics on or off at any time.

### 2.3. Defensive Security Analysis Center (`/security-center`)
- **Log Analyzer:**
  - Ingests Linux authentication logs (`auth.log`, `secure`) and Web server logs (`Nginx`, `Apache`).
  - Detects brute-force SSH attempts, SQL injection payloads (`UNION`, quotes, sleep), Path Traversal (`../`, `/etc/passwd`), and automated reconnaissance scanners (`Nmap`, `Nikto`, `WPScan`).
  - Generates ready-to-use defensive mitigations (e.g., Fail2ban jail configurations, prepared statements).
- **Network Traffic Analyzer:**
  - Analyzes network packet summaries and flow metadata.
  - Detects vertical and horizontal port scanning across sequential destination ports.
  - Identifies unencrypted plaintext credential transmission (HTTP Basic Auth, Telnet, FTP).
  - Evaluates TCP SYN flood anomalies and outputs defensive **Snort / Suricata** detection rules.
- **File Analysis Assistant (Zero-Execution Safe):**
  - Evaluates binary headers client-side and server-side without executing code.
  - Computes SHA-256, SHA-1, and MD5 cryptographic hashes.
  - Inspects Magic Bytes to identify true file types (PNG, JPEG, PE32 Executable, ELF, PDF, ZIP).
  - Flags **Extension Spoofing** attacks (e.g., Windows executable disguised as `.pdf` or `.png`).
  - Calculates **Shannon Entropy** (0 to 8 bits) to detect packers, obfuscation, or encryption.

### 2.4. Adaptive Quizzes (`/quizzes`)
- Multiple-choice and scenario-based assessments across all 6 cybersecurity domains.
- Immediate evaluation with educational rationales and instant feedback.
- Rewarding +15 XP per correct answer with anti-farming controls.

### 2.5. AI Administration & Knowledge Governance (`/admin` -> AI Tab)
- Configure live LLM providers (Google Gemini, OpenAI, Anthropic, Local RAG) with masked API key storage.
- Manage RAG Knowledge Base corpus: add new reference documentation, toggle RAG indexing, delete documents.
- Review and approve AI-generated quiz drafts before publishing them to the learner curriculum.
- Monitor live operational metrics (total tokens, total analyses, request counts).

---

## 3. Security & Safety Model

1. **Zero Exploit Execution:** All security analysis tools operate strictly in static analysis mode. Binaries are never executed, network packets are parsed as structured text, and log inputs are treated as untrusted strings.
2. **Prompt Injection Hardening:** Ingestion filters intercept common prompt injection and jailbreak phrases (`ignore previous instructions`, `reveal system prompt`, `dan mode`) before LLM forwarding.
3. **Graceful Failover:** In air-gapped environments or when external API quotas are exceeded, the AI engine seamlessly falls back to the internal RAG knowledge corpus, ensuring uninterrupted education.

---

## 4. Automated Verification Matrix

The Phase 7 implementation is verified by 45 specialized automated tests in `test_phase7.mjs`, contributing to a total project test suite of **160 tests with 100% pass rate**:

| Suite | Component Tested | Test Count | Status |
| :--- | :--- | :---: | :---: |
| `test_phase7.mjs` | AI RAG, Guards, Security Analyzers, Path & Quizzes | 45 | PASS (100%) |
| `test_phase6.mjs` | Ecosystem, Academy, Arena CTF & Certificates | 14 | PASS (100%) |
| `test_phase5.mjs` | Production Readiness, ACID, SSRF Range Defense | 25 | PASS (100%) |
| `test_backup_restore.mjs` | Automated Backup & Disaster Recovery | 14 | PASS (100%) |
| `test_phase4.mjs` | Cyber Range, Terminal Execution, Checkpoints | 21 | PASS (100%) |
| `test_phase3.mjs` | PBKDF2 Auth, Rate Limiting, CTF Engine | 12 | PASS (100%) |
| `test_tools.mjs` | Security Tools (Cipher, Hash, Subnet, File) | 29 | PASS (100%) |
| **TOTAL** | **Full CyberLab-ID Platform Test Coverage** | **160** | **100% PASS** |
