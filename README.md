```
 ██████╗██╗   ██╗██████╗ ███████╗██████╗ ██╗      █████╗ ██████╗       ██╗██████╗
██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██║     ██╔══██╗██╔══██╗      ██║██╔══██╗
██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║██████╔╝█████╗██║██║  ██║
██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║██╔══██╗╚════╝██║██║  ██║
╚██████╗   ██║   ██████╔╝███████╗██║  ██║███████╗██║  ██║██████╔╝      ██║██████╔╝
 ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝       ╚═╝╚═════╝
```

<div align="center">

### 🛡️ Learn. Build. Analyze. Secure.

**Platform pembelajaran keamanan siber open-source untuk Indonesia.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg)](#-contributing--kontribusi)
[![Made in Indonesia](https://img.shields.io/badge/Made%20in-Indonesia-red.svg)](https://github.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-ff69b4.svg)](https://github.com)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-orange.svg)](https://github.com)

[Bahasa Indonesia](#-tentang-cyberlab-id) · [English](#-about-cyberlab-id) · [Mulai Cepat](#-quick-start--mulai-cepat) · [Modul](#-learning-modules--modul-pembelajaran) · [Tools](#%EF%B8%8F-interactive-tools--alat-interaktif) · [Kontribusi](#-contributing--kontribusi)

</div>

---

## 🇮🇩 Tentang CyberLab-ID

**CyberLab-ID** adalah platform pembelajaran keamanan siber open-source yang dirancang khusus untuk komunitas Indonesia. Platform ini menyediakan modul pembelajaran interaktif, alat analisis keamanan berbasis web, dan laboratorium virtual yang membantu siapa saja — dari pemula hingga profesional — untuk memahami dan mempraktikkan konsep keamanan siber secara langsung.

### Mengapa CyberLab-ID?

- 🎓 **Konten Dwibahasa** — Materi tersedia dalam Bahasa Indonesia dan Inggris
- 🧪 **Laboratorium Interaktif** — Praktik langsung di lingkungan yang aman
- 🔧 **Alat Keamanan Terintegrasi** — Toolkit analisis keamanan berbasis browser
- 📖 **Kurikulum Terstruktur** — Jalur belajar dari dasar hingga mahir
- 🤝 **Komunitas Terbuka** — Dibangun oleh dan untuk komunitas keamanan siber Indonesia
- 🆓 **Sepenuhnya Gratis** — Akses penuh tanpa biaya, selamanya

## 🌏 About CyberLab-ID

**CyberLab-ID** is an open-source cybersecurity learning platform designed for the Indonesian community. It provides interactive learning modules, browser-based security analysis tools, and virtual labs that help anyone — from beginners to professionals — understand and practice cybersecurity concepts hands-on.

### Why CyberLab-ID?

- 🎓 **Bilingual Content** — Materials available in Bahasa Indonesia and English
- 🧪 **Interactive Labs** — Hands-on practice in a safe environment
- 🔧 **Integrated Security Tools** — Browser-based security analysis toolkit
- 📖 **Structured Curriculum** — Learning paths from fundamentals to advanced
- 🤝 **Open Community** — Built by and for the Indonesian cybersecurity community
- 🆓 **Completely Free** — Full access at no cost, forever

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📚 Learning Platform & Lessons
- 6 Modular learning tracks (24 structured lessons)
- Lesson reader with interactive knowledge check quizzes
- Instant answer feedback & explanatory security insights
- Bilingual (ID/EN) content with consistent typography
- Real-world case studies & defense cheat-sheets

</td>
<td width="50%">

### 🧪 Hands-on Cybersecurity Labs (`/labs`)
- 6 Safe, browser-based sandboxed practice environments:
  1. Linux Command Line & Permission Sandbox
  2. Wireshark-like Packet Stream & Credential Hunter
  3. Web Security Sandbox: SQLi Auth Bypass & XSS PoC
  4. Multi-Stage Decoding (Base64 + Single-byte XOR)
  5. File Carving & PNG Magic Byte Repair
  6. x86 Disassembly Crackme & Opcode Patcher

</td>
</tr>
<tr>
<td width="50%">

### 🔧 Security Toolkit (`/tools`)
- 100% Client-side execution (zero server transmission)
- **Hash Inspector**: MD5, SHA-1, SHA-256, SHA-512 + modern salt/bcrypt warnings
- **Subnet Calculator**: IPv4, CIDR, netmask, broadcast, binary visualization
- **Cipher Toolkit**: Caesar, ROT13, XOR, Base64, Vigenère, Hex converter
- **File Signature Checker**: Magic bytes detection & extension spoofing alert
- **Metadata Inspector**: EXIF, document metadata & privacy risk analysis
- **Password Analyzer**: Entropy score, crack-time estimation & patterns

</td>
<td width="50%">

### 🏆 Progress & Achievement Engine (`/progress`)
- Local-first persistence via `localStorage` (privacy-preserving)
- XP progression system & dynamic rank titles
- 8 Unlockable achievement badges
- Interactive real-time activity feed & JSON data export
- Track-by-track completion metrics

</td>
</tr>
<tr>
<td width="50%">

### 🚩 Server-Side CTF Platform (`/challenges`)
- Jeopardy-style Capture The Flag across 7 categories
- **Zero Client Flag Disclosure**: SHA-256 hashed server-side validation
- Constant-time comparison (`timingSafeEqual`)
- Anti-brute force rate limiting (10 submits/min)
- Solved tracking, instant XP rewards, and anti-double-dipping

</td>
<td width="50%">

### 💬 Community & Ecosystem (`/community` & `/leaderboard`)
- Discussion forum with 9 categories & search/sort
- Threaded comments, likes, and moderation reporting
- **Global Leaderboard**: Real-time rank calculation & top 3 podium
- **In-App Notifications**: Real-time notifications for solves & replies
- **Admin Dashboard (`/admin`)**: User RBAC, CTF authoring, and audit logs

</td>
</tr>
<tr>
<td colspan="2">

### 🛡️ Cyber Range & Virtual Lab Infrastructure (`/range`) — *New in Phase 4*
- **Dual-Driver Isolation Engine**: Seamless auto-detection between production **Docker Container Daemon** (OCI container sandboxing with `read-only rootfs`, `cap-drop ALL`, CPU/Memory cgroups) and the **Isolated Embedded Lab Engine** (zero host execution, in-memory virtual state).
- **Session Lifecycle & Sweeper**: Unique session IDs, live expiration countdown timer, automatic session cleanup, and concurrency bounds (1 concurrent session per user).
- **Five Interactive Range Environments**:
  1. **Linux System Hardening Terminal (`tpl-linux-core`)**: Monospace terminal emulator, SUID binary inspection, file permission auditing (`chmod 600`), and stateful checkpoints.
  2. **Network Topology & Gateway Routing (`tpl-net-topo`)**: Interactive SVG network canvas, node IP/gateway configuration, and animated packet trace hop routing.
  3. **OWASP Web Security Sandbox (`tpl-web-owasp`)**: SQL Injection (classic/bypass vs parameterized AST queries), reflected/stored XSS, and directory traversal with instant mitigation.
  4. **Disk & Log Forensics Range (`tpl-forensics-disk`)**: SHA-256 cryptographic hash integrity, Magic Bytes hex extension spoofing detector, and multi-vector attack timeline reconstructor.
  5. **x86 Reverse Engineering Stepper (`tpl-reverse-x86`)**: Hex strings extraction, x86 assembly step execution (EAX & Zero Flag), crackme serial validator, and opcode branching patcher.
- **Deterministic Server-Side Verification**: Checkpoints are verified server-side with anti-tamper completion tokens before XP or achievement awards.
- Complete documentation: [`CYBER_RANGE_ARCHITECTURE.md`](CYBER_RANGE_ARCHITECTURE.md).

</td>
</tr>
<tr>
<td colspan="2">

### 🚀 Production Readiness, Deployment & Ecosystem Launch (v2.5.0) — *New in Phase 5*
- **Enterprise Hardening & Security Headers**: HSTS (`max-age=63072000`), CSP strict whitelist, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and Cloud Metadata (IMDS `169.254.169.254`) egress blocking.
- **Production Deployment Architecture**: Multi-container Docker Compose (`deploy/docker/docker-compose.prod.yml`), hardened Nginx reverse proxy (`deploy/nginx/cyberlab.conf`), Caddyfile, and Kubernetes manifests (`deploy/kubernetes/`) with egress `NetworkPolicy`.
- **Database Reliability & ACID Transactions**: 12 performance indexes on hot query paths; `runTransaction` atomic rollback guarantees for all XP, solves, and lab completions.
- **Automated Backup & Disaster Recovery**: Online snapshot creation (`scripts/backup.mjs`) with cryptographic SHA-256 checksums, JSON metadata manifest, 7-day retention, and verified restoration (`scripts/restore.mjs`).
- **Observability & Admin Readiness Dashboard**: Real-time `/api/health` system probe, `/api/admin/metrics` telemetry, correlation ID (`x-request-id`) tracing, structured logger with automatic secret redaction, and an operational readiness audit console in `/admin`.
- **Enterprise CI/CD Workflow**: GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) executing static analysis, container builds, and 100+ automated test cases.
- **Legal & Policy Framework**: Complete policies in `docs/legal/` (Privacy Policy, Terms of Service, Acceptable Use Policy, Community Guidelines, Responsible Disclosure, Lab Safety Policy).
- Complete documentation: [`SECURITY_REMEDIATION_REPORT.md`](SECURITY_REMEDIATION_REPORT.md), [`CHANGELOG.md`](CHANGELOG.md), [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md), [`docs/DISASTER_RECOVERY.md`](docs/DISASTER_RECOVERY.md).

</td>
</tr>
</table>

---

## 🚀 Quick Start / Mulai Cepat

### Prerequisites / Prasyarat

- [Node.js](https://nodejs.org/) (v18 or later)
- [Git](https://git-scm.com/)

### Installation / Instalasi

```bash
# Clone the repository / Kloning repositori
git clone https://github.com/CyberLab-ID/cyberlab-id.git

# Navigate to the website directory / Masuk ke direktori website
cd website

# Install dependencies / Instal dependensi
npm install

# Start the development server / Jalankan server pengembangan
npm run dev
```

The application will be available at `http://localhost:3000`.

> [!TIP]
> Untuk pengalaman terbaik, gunakan browser modern seperti Chrome, Firefox, atau Edge versi terbaru.

---

## 📁 Project Structure / Struktur Proyek

```
CyberLab-ID/
├── website/                    # Main web application
│   ├── public/                 # Static assets
│   │   ├── images/             # Image resources
│   │   └── icons/              # Favicon & app icons
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components & routes
│   │   │   ├── modules/        # Learning module pages
│   │   │   └── tools/          # Security tool pages
│   │   ├── styles/             # Global styles & themes
│   │   ├── utils/              # Helper functions & utilities
│   │   ├── hooks/              # Custom React hooks
│   │   ├── data/               # Static data & module content
│   │   └── lib/                # Core libraries & logic
│   ├── package.json
│   └── README.md
├── docs/                       # Documentation
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # MIT License
├── SECURITY.md                 # Security policy
└── README.md                   # This file
```

---

## 📖 Learning Modules / Modul Pembelajaran

CyberLab-ID menyediakan enam modul pembelajaran inti yang mencakup berbagai aspek keamanan siber:

| # | Module | Description | Deskripsi |
|---|--------|-------------|-----------|
| 1 | 🐧 **Linux Fundamentals** | Master the command line, file permissions, process management, and system administration essentials for cybersecurity | Kuasai command line, hak akses file, manajemen proses, dan dasar-dasar administrasi sistem untuk keamanan siber |
| 2 | 🌐 **Networking** | Understand TCP/IP, DNS, HTTP/S, packet analysis, firewalls, and network security architecture | Pahami TCP/IP, DNS, HTTP/S, analisis paket, firewall, dan arsitektur keamanan jaringan |
| 3 | 🔒 **Web Security** | Learn OWASP Top 10, XSS, SQL injection, CSRF, authentication vulnerabilities, and secure coding practices | Pelajari OWASP Top 10, XSS, SQL injection, CSRF, kerentanan autentikasi, dan praktik pengkodean aman |
| 4 | 🔐 **Cryptography** | Explore symmetric & asymmetric encryption, hashing, digital signatures, PKI, and applied cryptanalysis | Jelajahi enkripsi simetris & asimetris, hashing, tanda tangan digital, PKI, dan kriptanalisis terapan |
| 5 | 🔍 **Digital Forensics** | Investigate disk imaging, memory forensics, log analysis, evidence handling, and incident response procedures | Investigasi disk imaging, forensik memori, analisis log, penanganan bukti, dan prosedur respon insiden |
| 6 | ⚙️ **Reverse Engineering** | Analyze binary disassembly, debugging, malware analysis, executable formats, and software protection mechanisms | Analisis disassembly biner, debugging, analisis malware, format executable, dan mekanisme proteksi perangkat lunak |

Each module includes theory, guided exercises, hands-on labs, and challenge problems.

> [!NOTE]
> Modul dirancang untuk dipelajari secara berurutan, namun peserta dengan pengalaman sebelumnya dapat langsung memilih modul yang sesuai dengan tingkat kemampuan mereka.

---

## 🛠️ Interactive Tools / Alat Interaktif

Semua alat berjalan langsung di browser — tanpa perlu instalasi tambahan.

<table>
<tr>
<td align="center" width="33%">

### 🔎 Hash Inspector
Hitung dan verifikasi hash file menggunakan MD5, SHA-1, SHA-256, dan SHA-512. Bandingkan checksum untuk memvalidasi integritas file.

</td>
<td align="center" width="33%">

### 📡 Subnet Calculator
Hitung subnet mask, jumlah host, network address, broadcast address, dan range IP yang tersedia dari notasi CIDR.

</td>
<td align="center" width="33%">

### 🔑 Cipher Toolkit
Enkripsi dan dekripsi teks menggunakan cipher klasik (Caesar, Vigenère, Atbash) dan modern (AES, Base64) dengan visualisasi proses.

</td>
</tr>
<tr>
<td align="center" width="33%">

### 📄 File Signature Checker
Identifikasi jenis file sebenarnya berdasarkan magic bytes/file signature, bukan hanya ekstensi. Deteksi file yang disamarkan.

</td>
<td align="center" width="33%">

### 🗂️ Metadata Inspector
Ekstrak dan analisis metadata tersembunyi dari gambar, dokumen, dan file lainnya. Identifikasi informasi sensitif yang tersimpan.

</td>
<td align="center" width="33%">

### 🔓 Password Analyzer
Evaluasi kekuatan password secara real-time, estimasi waktu crack, deteksi pola umum, dan dapatkan rekomendasi untuk membuat password yang lebih kuat.

</td>
</tr>
</table>

---

## 🤝 Contributing / Kontribusi

Kami sangat menyambut kontribusi dari komunitas! CyberLab-ID tumbuh berkat kontribusi dari para pengembang, peneliti keamanan, dan edukator di seluruh Indonesia.

### How to Contribute / Cara Berkontribusi

1. **Fork** repositori ini
2. **Buat branch** untuk fitur atau perbaikan Anda
   ```bash
   git checkout -b feature/nama-fitur-anda
   ```
3. **Commit** perubahan Anda dengan pesan yang jelas
   ```bash
   git commit -m "feat: tambahkan modul baru tentang forensik mobile"
   ```
4. **Push** ke branch Anda
   ```bash
   git push origin feature/nama-fitur-anda
   ```
5. **Buat Pull Request** dengan deskripsi yang lengkap

### Contribution Areas / Area Kontribusi

| Area | Contoh |
|------|--------|
| 📝 **Konten** | Menulis atau menerjemahkan modul pembelajaran |
| 💻 **Kode** | Mengembangkan fitur baru atau memperbaiki bug |
| 🎨 **Desain** | Meningkatkan UI/UX platform |
| 🧪 **Testing** | Menulis test atau melaporkan bug |
| 📖 **Dokumentasi** | Memperbaiki atau menambah dokumentasi |
| 🌐 **Terjemahan** | Menerjemahkan konten ke bahasa lain |

> [!IMPORTANT]
> Harap baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan kontribusi lengkap, termasuk code style, konvensi commit, dan proses review sebelum mengirimkan Pull Request.

---

## 📄 License / Lisensi

CyberLab-ID dilisensikan di bawah **MIT License** — Anda bebas menggunakan, memodifikasi, dan mendistribusikan proyek ini.

Lihat file [LICENSE](LICENSE) untuk detail lengkap.

```
MIT License

Copyright (c) 2026 CyberLab-ID Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🔒 Security / Keamanan

Keamanan platform ini adalah prioritas utama kami.

- 📋 Lihat [SECURITY.md](SECURITY.md) untuk kebijakan keamanan dan cara melaporkan kerentanan
- 🐛 **Jangan** laporkan kerentanan keamanan melalui issue publik
- 📧 Laporkan kerentanan secara bertanggung jawab melalui jalur yang ditentukan di SECURITY.md

> [!CAUTION]
> Semua alat dan materi di platform ini ditujukan **hanya untuk tujuan edukasi**. Penggunaan teknik yang dipelajari untuk aktivitas ilegal atau tanpa izin adalah melanggar hukum dan bertentangan dengan etika keamanan siber.

---

<div align="center">

### 🌟 Star repositori ini jika bermanfaat untuk Anda!

**Dibangun dengan ❤️ oleh komunitas keamanan siber Indonesia**

[⬆ Kembali ke atas](#)

</div>
