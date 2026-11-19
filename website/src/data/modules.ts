export interface Topic {
  id: string;
  title: string;
  order: number;
  status: "ready" | "coming_soon";
  durationMinutes?: number;
}

export interface ModuleTrack {
  id: "linux" | "networking" | "web-security" | "cryptography" | "digital-forensics" | "reverse-engineering";
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  level: string;
  estimatedHours: string;
  topicsCount: number;
  topics: Topic[];
}

export const MODULES_DATA: ModuleTrack[] = [
  {
    id: "linux",
    title: "Linux & System Administration",
    description: "Fondasi sistem operasi Linux, navigasi terminal, perizinan berkas, manajemen user/proses, automasi Bash, dan teknik hardening server.",
    difficulty: "beginner",
    level: "Dasar s.d Menengah",
    estimatedHours: "4-6 Jam",
    topicsCount: 7,
    topics: [
      { id: "linux-fundamentals", title: "Linux Fundamentals & Arsitektur OS", order: 1, status: "ready", durationMinutes: 15 },
      { id: "linux-command-line", title: "Navigasi Terminal & Command Line Mastery", order: 2, status: "ready", durationMinutes: 20 },
      { id: "file-permissions", title: "File Permissions, Chmod & Chown Security", order: 3, status: "ready", durationMinutes: 20 },
      { id: "user-group-management", title: "User, Group & Sudoers Privilege Management", order: 4, status: "coming_soon", durationMinutes: 25 },
      { id: "process-management", title: "Process Management, Daemons & Signals", order: 5, status: "coming_soon", durationMinutes: 20 },
      { id: "bash-scripting", title: "Automasi Bash Scripting untuk Sysadmin", order: 6, status: "coming_soon", durationMinutes: 30 },
      { id: "system-hardening", title: "Linux Server Hardening & Audit Keamanan", order: 7, status: "ready", durationMinutes: 25 },
    ],
  },
  {
    id: "networking",
    title: "Computer Networking",
    description: "Pemahaman protokol jaringan, pemodelan OSI dan TCP/IP, addressing IPv4/IPv6, subnetting, DNS/DHCP, firewall, dan packet analysis.",
    difficulty: "beginner",
    level: "Dasar s.d Menengah",
    estimatedHours: "5-7 Jam",
    topicsCount: 8,
    topics: [
      { id: "networking-fundamentals", title: "Networking Fundamentals & Topologi Jaringan", order: 1, status: "ready", durationMinutes: 15 },
      { id: "osi-tcp-ip", title: "Model OSI 7 Layer & Protokol TCP/IP", order: 2, status: "ready", durationMinutes: 20 },
      { id: "ip-addressing-subnetting", title: "Pengalamatan IPv4, CIDR & Subnetting", order: 3, status: "ready", durationMinutes: 25 },
      { id: "dns-dhcp", title: "Infrastruktur Inti: DNS & DHCP", order: 4, status: "coming_soon", durationMinutes: 20 },
      { id: "routing-switching", title: "Routing, Switching & VLAN Segmentation", order: 5, status: "coming_soon", durationMinutes: 30 },
      { id: "firewall-acl", title: "Firewall, IPTables & Security ACLs", order: 6, status: "ready", durationMinutes: 20 },
      { id: "packet-analysis", title: "Packet Analysis dengan Wireshark & Tcpdump", order: 7, status: "coming_soon", durationMinutes: 30 },
      { id: "network-troubleshooting", title: "Troubleshooting & Diagnosa Jaringan", order: 8, status: "coming_soon", durationMinutes: 20 },
    ],
  },
  {
    id: "web-security",
    title: "Web Application Security",
    description: "Eksplorasi keamanan aplikasi web modern, protokol HTTP/HTTPS, kerentanan kritis OWASP Top 10, autentikasi, dan strategi defensif.",
    difficulty: "intermediate",
    level: "Menengah",
    estimatedHours: "6-8 Jam",
    topicsCount: 8,
    topics: [
      { id: "http-https", title: "Protokol HTTP, HTTPS & Security Headers", order: 1, status: "ready", durationMinutes: 20 },
      { id: "authentication-authorization", title: "Autentikasi, Sesi, Cookie & JWT Security", order: 2, status: "coming_soon", durationMinutes: 25 },
      { id: "sql-injection", title: "SQL Injection (SQLi) & Mitigasi Prepared Statements", order: 3, status: "ready", durationMinutes: 25 },
      { id: "xss", title: "Cross-Site Scripting (Stored, Reflected & DOM XSS)", order: 4, status: "ready", durationMinutes: 20 },
      { id: "csrf", title: "Cross-Site Request Forgery (CSRF) & SameSite Tokens", order: 5, status: "coming_soon", durationMinutes: 20 },
      { id: "idor", title: "Insecure Direct Object References (IDOR)", order: 6, status: "coming_soon", durationMinutes: 20 },
      { id: "security-headers", title: "Content Security Policy (CSP) & Defense-in-Depth", order: 7, status: "coming_soon", durationMinutes: 20 },
      { id: "owasp-top-10", title: "Studi Komprehensif OWASP Top 10", order: 8, status: "ready", durationMinutes: 25 },
    ],
  },
  {
    id: "cryptography",
    title: "Cryptography & Data Protection",
    description: "Konsep matematis dan praktis di balik pengamanan data: encoding vs encryption vs hashing, cipher simetris & asimetris, dan RSA.",
    difficulty: "intermediate",
    level: "Dasar s.d Menengah",
    estimatedHours: "5-6 Jam",
    topicsCount: 8,
    topics: [
      { id: "encoding-encryption-hashing", title: "Encoding vs Encryption vs Hashing", order: 1, status: "ready", durationMinutes: 15 },
      { id: "caesar-cipher", title: "Caesar Cipher & Analisis Frekuensi Huruf", order: 2, status: "ready", durationMinutes: 15 },
      { id: "xor-cipher", title: "XOR Bitwise Cipher & Stream Ciphers", order: 3, status: "coming_soon", durationMinutes: 20 },
      { id: "base64", title: "Base64 & Skema Encoding Data Biner", order: 4, status: "coming_soon", durationMinutes: 15 },
      { id: "hash-functions", title: "Fungsi Hash Kriptografi & Salted Password Storage", order: 5, status: "ready", durationMinutes: 20 },
      { id: "symmetric-asymmetric", title: "Enkripsi Simetris (AES) vs Asimetris (RSA/ECC)", order: 6, status: "ready", durationMinutes: 20 },
      { id: "asymmetric-encryption", title: "Infrastruktur Kunci Publik (PKI) & Sertifikat Digital", order: 7, status: "coming_soon", durationMinutes: 25 },
      { id: "rsa-fundamentals", title: "Matematika RSA & Operasi Kunci Digital", order: 8, status: "coming_soon", durationMinutes: 30 },
    ],
  },
  {
    id: "digital-forensics",
    title: "Digital Forensics & Incident Response",
    description: "Prinsip rantai bukti (chain of custody), investigasi file system, identifikasi magic bytes, analisis metadata, log auditing, dan memory triage.",
    difficulty: "intermediate",
    level: "Menengah",
    estimatedHours: "5-7 Jam",
    topicsCount: 7,
    topics: [
      { id: "digital-evidence", title: "Prinsip Bukti Digital & Chain of Custody", order: 1, status: "ready", durationMinutes: 15 },
      { id: "file-systems", title: "Struktur File System (Ext4, NTFS, FAT32)", order: 2, status: "coming_soon", durationMinutes: 25 },
      { id: "file-signatures", title: "Analisis File Signatures & Header Biner", order: 3, status: "ready", durationMinutes: 20 },
      { id: "metadata-analysis", title: "Metadata Analysis & Ekstraksi Jejak Digital", order: 4, status: "ready", durationMinutes: 15 },
      { id: "file-recovery", title: "File Carving & Dasar Pemulihan Data Terhapus", order: 5, status: "coming_soon", durationMinutes: 25 },
      { id: "log-analysis", title: "Analisis Log Keamanan (Auth, Web, Syslog)", order: 6, status: "ready", durationMinutes: 25 },
      { id: "memory-forensics", title: "Dasar Memory Forensics dengan Volatility", order: 7, status: "coming_soon", durationMinutes: 30 },
    ],
  },
  {
    id: "reverse-engineering",
    title: "Reverse Engineering & Binary Analysis",
    description: "Dekomposisi biner perangkat lunak, pengenalan bahasa Assembly x86/x64, analisis statis, analisis dinamis dengan debugger, dan file PE/ELF.",
    difficulty: "advanced",
    level: "Menengah s.d Mahir",
    estimatedHours: "6-8 Jam",
    topicsCount: 6,
    topics: [
      { id: "binary-fundamentals", title: "Fondasi Format Biner & Representasi Komputer", order: 1, status: "ready", durationMinutes: 20 },
      { id: "assembly-intro", title: "Pengenalan Arsitektur Register & Assembly x86/x64", order: 2, status: "ready", durationMinutes: 30 },
      { id: "static-analysis", title: "Analisis Statis dengan Strings & Disassembler", order: 3, status: "ready", durationMinutes: 25 },
      { id: "dynamic-analysis", title: "Analisis Dinamis dengan GDB & Debugger", order: 4, status: "ready", durationMinutes: 30 },
      { id: "executable-analysis", title: "Dekomposisi Struktur File PE & ELF", order: 5, status: "coming_soon", durationMinutes: 30 },
      { id: "basic-re-challenges", title: "Praktikum Pemecahan Crackme & Tantangan RE", order: 6, status: "coming_soon", durationMinutes: 35 },
    ],
  },
];
