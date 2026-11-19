import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

let dbInstance: DatabaseSync | null = null;

export function hashString(str: string): string {
  return crypto.createHash("sha256").update(str.trim().toLowerCase()).digest("hex");
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

export function verifyPassword(password: string, expectedHash: string, salt: string): boolean {
  const hash = hashPassword(password, salt);
  const hashBuf = Buffer.from(hash, "hex");
  const expectedBuf = Buffer.from(expectedHash, "hex");
  if (hashBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, expectedBuf);
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "cyberlab.db");
  const db = new DatabaseSync(dbPath);

  // Enable foreign keys and WAL mode for reliability
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");

  initSchema(db);
  seedInitialData(db);

  dbInstance = db;
  return db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT 'Shield',
      bio TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      total_xp INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ctf_challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      points INTEGER NOT NULL,
      flag_hash TEXT NOT NULL,
      hint TEXT DEFAULT '',
      instructions TEXT DEFAULT '',
      attachment_url TEXT DEFAULT '',
      is_published INTEGER NOT NULL DEFAULT 1,
      solves_count INTEGER NOT NULL DEFAULT 0,
      author_id TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ctf_solves (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      challenge_id TEXT NOT NULL REFERENCES ctf_challenges(id) ON DELETE CASCADE,
      points_awarded INTEGER NOT NULL,
      solved_at TEXT NOT NULL,
      UNIQUE(user_id, challenge_id)
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      likes_count INTEGER NOT NULL DEFAULT 0,
      comments_count INTEGER NOT NULL DEFAULT 0,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_reported INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS community_likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS community_reports (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL,
      xp_reward INTEGER NOT NULL DEFAULT 25
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_code TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      UNIQUE(user_id, achievement_code)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      link TEXT DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      xp_reward INTEGER NOT NULL DEFAULT 50,
      cpu_limit TEXT NOT NULL DEFAULT '0.5 core',
      memory_limit TEXT NOT NULL DEFAULT '256 MB',
      storage_limit TEXT NOT NULL DEFAULT '512 MB',
      image_name TEXT NOT NULL DEFAULT 'cyberlab/sandbox:latest',
      instructions TEXT NOT NULL,
      verification_criteria TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      version TEXT NOT NULL DEFAULT '1.0.0',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_id TEXT NOT NULL REFERENCES lab_templates(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      mode TEXT NOT NULL DEFAULT 'embedded',
      terminal_endpoint TEXT DEFAULT '',
      ip_address TEXT DEFAULT '10.240.0.10',
      started_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      completed_at TEXT,
      checkpoints_state TEXT NOT NULL DEFAULT '{}',
      terminal_history TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_completions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_id TEXT NOT NULL REFERENCES lab_templates(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL REFERENCES lab_sessions(id) ON DELETE CASCADE,
      xp_awarded INTEGER NOT NULL,
      evidence_summary TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE(user_id, template_id)
    );
  `);
}

function seedInitialData(db: DatabaseSync) {
  // 1. Seed Achievements
  const achievements = [
    { code: "first-steps", title: "First Steps", desc: "Daftar dan buat akun pertama Anda di platform CyberLab-ID.", icon: "Sparkles", cat: "general", xp: 15 },
    { code: "linux-explorer", title: "Linux Explorer", desc: "Pelajari materi administrasi dan navigasi sistem operasi Linux.", icon: "Terminal", cat: "linux", xp: 30 },
    { code: "network-analyst", title: "Network Analyst", desc: "Selesaikan praktikum analisis paket jaringan dan topologi TCP/IP.", icon: "Network", cat: "network", xp: 35 },
    { code: "cryptographer", title: "Master Cryptographer", desc: "Pecahkan tantangan cipher klasik dan modern stream encoding.", icon: "KeyRound", cat: "crypto", xp: 40 },
    { code: "digital-detective", title: "Digital Detective", desc: "Rekonstruksi berkas rusak menggunakan inspeksi Magic Bytes.", icon: "Binary", cat: "forensics", xp: 35 },
    { code: "web-defender", title: "Web App Defender", desc: "Identifikasi kerentanan OWASP Top 10 (SQLi / XSS) pada sandbox.", icon: "Globe", cat: "web", xp: 40 },
    { code: "ctf-rookie", title: "CTF Rookie", desc: "Berhasil menyelesaikan submission flag CTF pertama Anda di platform.", icon: "Flag", cat: "ctf", xp: 50 },
    { code: "ctf-specialist", title: "CTF Specialist", desc: "Selesaikan minimal 5 tantangan Jeopardy CTF dari berbagai kategori.", icon: "Trophy", cat: "ctf", xp: 100 },
  ];

  const checkAch = db.prepare("SELECT count(*) as count FROM achievements").get() as { count: number };
  if (checkAch.count === 0) {
    const insertAch = db.prepare(`
      INSERT INTO achievements (id, code, title, description, icon, category, xp_reward)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of achievements) {
      insertAch.run(`ach_${a.code}`, a.code, a.title, a.desc, a.icon, a.cat, a.xp);
    }
  }

  // 2. Seed Admin & Test Users
  const checkUser = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
  if (checkUser.count === 0) {
    const now = new Date().toISOString();
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, salt, display_name, avatar, bio, role, status, total_xp, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Admin user: password = "CyberLabAdmin2026!"
    const adminSalt = crypto.randomBytes(16).toString("hex");
    const adminHash = hashPassword("CyberLabAdmin2026!", adminSalt);
    insertUser.run(
      "usr_admin",
      "admin",
      "admin@cyberlab.id",
      adminHash,
      adminSalt,
      "CyberLab Administrator",
      "Shield",
      "Lead Security Engineer & System Administrator di CyberLab-ID.",
      "admin",
      "active",
      500,
      now,
      now
    );

    // Test user: password = "CyberLabUser2026!"
    const userSalt = crypto.randomBytes(16).toString("hex");
    const userHash = hashPassword("CyberLabUser2026!", userSalt);
    insertUser.run(
      "usr_budi",
      "budi_hacker",
      "budi@cyberlab.id",
      userHash,
      userSalt,
      "Budi Santoso",
      "Terminal",
      "Siswa SMK TKJ & CTF Enthusiast. Suka belajar binary exploitation dan reverse engineering.",
      "user",
      "active",
      165,
      now,
      now
    );

    // Moderator user: password = "CyberLabMod2026!"
    const modSalt = crypto.randomBytes(16).toString("hex");
    const modHash = hashPassword("CyberLabMod2026!", modSalt);
    insertUser.run(
      "usr_citra",
      "citra_sec",
      "citra@cyberlab.id",
      modHash,
      modSalt,
      "Citra Wahyuni",
      "Globe",
      "Cybersecurity Researcher & Komunitas Moderator. Fokus pada Web App Security & OWASP.",
      "moderator",
      "active",
      320,
      now,
      now
    );
  }

  // 3. Seed CTF Challenges (Server-side hashed flags - NEVER expose plain flags!)
  const checkCtf = db.prepare("SELECT count(*) as count FROM ctf_challenges").get() as { count: number };
  if (checkCtf.count === 0) {
    const now = new Date().toISOString();
    const insertCtf = db.prepare(`
      INSERT INTO ctf_challenges (id, title, description, category, difficulty, points, flag_hash, hint, instructions, is_published, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const challenges = [
      {
        id: "caesar-salat",
        title: "Caesar Says Hello",
        desc: "Julius Caesar mengirimkan ciphertext rahasia: 'Fdhvdu flskhu lv ixq'. Pecahkan pesan asli dan serahkan flag-nya dalam format CYBERLAB{...}!",
        category: "Cryptography",
        difficulty: "Beginner",
        points: 25,
        flag: "CYBERLAB{Caesar cipher is fun}",
        hint: "Gunakan Caesar Cipher shift mundur 3 langkah atau uji di Cipher Toolkit.",
        instructions: "Gunakan fitur Brute Force di menu Tools > Cipher Toolkit untuk melihat 25 rotasi alfabet sekaligus.",
      },
      {
        id: "base64-mystery",
        title: "Base64 Encoding Basics",
        desc: "Seorang sysadmin mencurigai string berikut di file konfigurasi: 'Q3liZXJMYWItSUQ='. Temukan string teks aslinya dan bungkus dalam format CYBERLAB{...}!",
        category: "Cryptography",
        difficulty: "Beginner",
        points: 25,
        flag: "CYBERLAB{CyberLab-ID}",
        hint: "Ingat Base64 menggunakan karakter padding '=' dan merupakan encoding biner-ke-teks.",
        instructions: "Jalankan decoding Base64 di Cipher Toolkit atau via command line 'echo ... | base64 -d'.",
      },
      {
        id: "hash-collision-quiz",
        title: "MD5 Integrity Verification",
        desc: "Sebuah program mendeteksi berkas dengan checksum MD5 'a59f94ef98caeb4cac0c900c2fa730a6'. Kata kunci apa yang menghasilkan hash tersebut? Submit CYBERLAB{kata_kunci}.",
        category: "Cryptography",
        difficulty: "Beginner",
        points: 30,
        flag: "CYBERLAB{cyberlab}",
        hint: "Gunakan Hash Inspector untuk menguji string sederhana terkait nama platform ini.",
        instructions: "Hash MD5 dari kata kunci terdiri dari 8 karakter huruf kecil.",
      },
      {
        id: "subnet-sleuth-ctf",
        title: "Subnet Host Range Sleuth",
        desc: "Sebuah router memiliki interface 192.168.1.100 dengan netmask /24. Berapakah alamat broadcast resmi untuk jaringan tersebut? Format flag: CYBERLAB{broadcast_ip}.",
        category: "Networking",
        difficulty: "Beginner",
        points: 35,
        flag: "CYBERLAB{192.168.1.255}",
        hint: "Hitung host bits subnet /24 menggunakan Subnet Calculator.",
        instructions: "Subnetting /24 menyisakan 8 bit host, di mana seluruh bit host bernilai 1 adalah Broadcast Address.",
      },
      {
        id: "sqli-auth-bypass",
        title: "SQL Injection Authentication Bypass",
        desc: "Pada modul Web Security Lab, ditemukan celah query dinamis string concatenation. Input klasik apa yang membuat kondisi WHERE selalu bernilai True? Format: CYBERLAB{' OR '1'='1}",
        category: "Web Exploitation",
        difficulty: "Intermediate",
        points: 50,
        flag: "CYBERLAB{' OR '1'='1}",
        hint: "Lihat demonstrasi di Web Vulnerability Lab.",
        instructions: "Celah SQLi tipe Boolean-based Auth Bypass.",
      },
      {
        id: "png-magic-repair",
        title: "File Header Carving Quest",
        desc: "Berkas PNG bukti digital dirusak 4 byte awalnya. Berapakah nilai 4-byte Magic Bytes resmi PNG dalam hex standar tanpa spasi huruf besar? Format: CYBERLAB{89504E47}.",
        category: "Digital Forensics",
        difficulty: "Intermediate",
        points: 50,
        flag: "CYBERLAB{89504E47}",
        hint: "Periksa tabel Magic Bytes pada File Signature Checker.",
        instructions: "Header PNG standar adalah: 89 50 4E 47 (ASCII: .PNG).",
      },
      {
        id: "x86-crackme-bypass",
        title: "x86 Crackme Logic Bypass",
        desc: "Pada Reverse Engineering Lab, serial key dihitung dengan persamaan (Input XOR 0x5A) == 0x1337. Berapakah angka desimal Serial Key yang sah? Format: CYBERLAB{4867}.",
        category: "Reverse Engineering",
        difficulty: "Intermediate",
        points: 60,
        flag: "CYBERLAB{4867}",
        hint: "Hitung aljabar XOR: 0x1337 ^ 0x5A = 4919 ^ 90.",
        instructions: "Gunakan CPU Stepper & Keygen Test pada Reverse Engineering Lab.",
      },
      {
        id: "linux-privilege-audit",
        title: "Linux SUID Discovery Command",
        desc: "Perintah standar Linux apa yang digunakan sysadmin untuk mencari semua file SUID root di root filesystem? Format: CYBERLAB{find / -perm -4000 -type f}.",
        category: "Linux",
        difficulty: "Intermediate",
        points: 40,
        flag: "CYBERLAB{find / -perm -4000 -type f}",
        hint: "Perintah 'find' dengan parameter permission octal 4000.",
        instructions: "SUID bit direpresentasikan dengan nilai oktal 4xxx.",
      },
      {
        id: "multi-stage-flag-hunt",
        title: "Multi-Stage Cipher Reconstruction",
        desc: "Dapatkan flag rahasia yang tersembunyi di dalam Lab 4 (Multi-Stage Decoding Workbench). Flag diawali dengan CYBERLAB{...",
        category: "Miscellaneous",
        difficulty: "Advanced",
        points: 75,
        flag: "CYBERLAB{x0r_str34m_c1ph3r_unl0ck3d}",
        hint: "Selesaikan praktikum di Crypto Challenges Lab.",
        instructions: "Lakukan Base64 decode lalu brute force XOR single-byte 0x00 - 0xFF.",
      },
    ];

    for (const c of challenges) {
      insertCtf.run(
        c.id,
        c.title,
        c.desc,
        c.category,
        c.difficulty,
        c.points,
        hashString(c.flag),
        c.hint,
        c.instructions,
        now
      );
    }
  }

  // 4. Seed Community Discussions
  const checkPosts = db.prepare("SELECT count(*) as count FROM community_posts").get() as { count: number };
  if (checkPosts.count === 0) {
    const now = new Date().toISOString();
    const insertPost = db.prepare(`
      INSERT INTO community_posts (id, user_id, title, content, category, likes_count, comments_count, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPost.run(
      "post_welcome",
      "usr_admin",
      "Selamat Datang di Forum Komunitas CyberLab-ID!",
      "Halo teman-teman praktisi, siswa SMK TKJ/RPL, mahasiswa TI, dan antusias keamanan digital! Forum ini adalah wadah diskusi terbuka seputar pembelajaran cybersecurity, pemecahan tantangan CTF, studi kasus insiden keamanan, dan persiapan karier di bidang pertahanan siber. Mari saling berbagi ilmu dan menjaga etika profesionalisme digital.",
      "General Discussion",
      12,
      2,
      1,
      now,
      now
    );

    insertPost.run(
      "post_wireshark_tips",
      "usr_budi",
      "Tips Memfilter Paket HTTP Kredensial di Wireshark",
      "Bagi yang sedang mengerjakan Lab Network Packet Analysis, filter Wireshark yang sangat membantu mencari form login plain text adalah: 'http.request.method == \"POST\" && (http contains \"password\" || http contains \"user\")'. Sangat efektif untuk mengisolasi paket autentikasi tanpa harus membaca ribuan frame manual!",
      "Networking",
      8,
      1,
      0,
      now,
      now
    );

    insertPost.run(
      "post_sqli_prepared",
      "usr_citra",
      "Mengapa Parameterized Query Sepenuhnya Menutup SQL Injection?",
      "Sering kali pemula bertanya kenapa sanitasi karakter seperti ' atau -- saja belum cukup. Dengan parameterized query (Prepared Statements), mesin database mengkompilasi struktur AST (Abstract Syntax Tree) SQL terlebih dahulu, kemudian menganggap nilai input pengguna murni sebagai data literal tanpa interpretasi perintah. Sehingga meskipun input mengandung \"' OR '1'='1\", query tetap aman 100%.",
      "Web Security",
      15,
      3,
      0,
      now,
      now
    );

    // Comments for post_welcome
    const insertComment = db.prepare(`
      INSERT INTO community_comments (id, post_id, user_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertComment.run(
      "comm_1",
      "post_welcome",
      "usr_budi",
      "Senang sekali ada platform edukasi cybersecurity asli Indonesia yang gratis dan materi praktiknya berkualitas tinggi!",
      now,
      now
    );

    insertComment.run(
      "comm_2",
      "post_welcome",
      "usr_citra",
      "Salam kenal semuanya! Jangan ragu bertanya di kanal Web Security jika butuh bantuan memahami konsep OWASP ya.",
      now,
      now
    );
  }

  // 5. Seed Phase 4 Achievements
  const phase4Achievements = [
    { code: "range-commander", title: "Range Commander", desc: "Selesaikan minimal 3 praktikum lingkungan Cyber Range terisolasi.", icon: "Shield", cat: "general", xp: 100 },
    { code: "network-architect", title: "Network Architect", desc: "Selesaikan praktikum topologi dan konfigurasi routing jaringan di Cyber Range.", icon: "Network", cat: "network", xp: 60 },
    { code: "appsec-breaker", title: "AppSec Breaker", desc: "Eksploitasi dan remediasi kerentanan OWASP Web Range secara aman.", icon: "Globe", cat: "web", xp: 60 },
    { code: "forensics-investigator", title: "Forensic Investigator", desc: "Analisis dan pulihkan barang bukti digital pada lab forensik disk.", icon: "Binary", cat: "forensics", xp: 60 },
    { code: "binary-analyst", title: "Binary Analyst", desc: "Selesaikan analisis aliran kontrol dan disassembly pada lab Reverse Engineering.", icon: "Cpu", cat: "reverse", xp: 60 },
  ];

  const insertAch = db.prepare(`
    INSERT OR IGNORE INTO achievements (id, code, title, description, icon, category, xp_reward)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of phase4Achievements) {
    insertAch.run(`ach_${a.code}`, a.code, a.title, a.desc, a.icon, a.cat, a.xp);
  }

  // 6. Seed Official Lab Templates
  const checkTemplates = db.prepare("SELECT count(*) as count FROM lab_templates").get() as { count: number };
  if (checkTemplates.count === 0) {
    const now = new Date().toISOString();
    const insertTemplate = db.prepare(`
      INSERT INTO lab_templates (
        id, title, description, category, difficulty, duration_minutes, xp_reward,
        cpu_limit, memory_limit, storage_limit, image_name, instructions,
        verification_criteria, is_published, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, '1.0.0', ?, ?)
    `);

    const templates = [
      {
        id: "tpl-linux-core",
        title: "Linux Command Line & Privilege Audit Lab",
        description: "Lingkungan terminal Linux interaktif untuk menguji navigasi direktori, audit izin berkas chmod/chown, pelacakan proses aktif (ps/top), dan identifikasi file SUID berbahaya.",
        category: "Linux",
        difficulty: "Beginner",
        duration: 60,
        xp: 60,
        cpu: "0.5 core",
        memory: "256 MB",
        storage: "512 MB",
        image: "cyberlab/linux-base:1.0",
        instructions: "1. Jalankan `pwd` dan `ls -la` untuk meninjau struktur direktori.\n2. Temukan file rahasia di dalam direktori `/opt/secret`.\n3. Periksa izin akses file tersebut dan ubah menjadi 600 menggunakan `chmod`.\n4. Jalankan perintah `find / -perm -4000 2>/dev/null` untuk mengaudit SUID binary.",
        criteria: JSON.stringify({
          checkpoints: [
            { id: "chk_ls", description: "Inspeksi direktori /opt/secret", command_trigger: "ls /opt/secret" },
            { id: "chk_chmod", description: "Perketat izin berkas ke 600", command_trigger: "chmod 600 /opt/secret/creds.txt" },
            { id: "chk_suid", description: "Audit berkas berizin SUID", command_trigger: "find / -perm -4000" }
          ],
          completion_token: "RANGE{linux_privilege_audit_completed}"
        }),
      },
      {
        id: "tpl-net-topo",
        title: "Network Topology & Packet Routing Simulation",
        description: "Laboratorium simulasi topologi jaringan multi-node (Client, Router Gateway, DNS Server, Web Server). Konfigurasi addressing IPv4, Subnet Mask, Gateway, dan analisis alur paket ICMP/TCP.",
        category: "Networking",
        difficulty: "Intermediate",
        duration: 60,
        xp: 75,
        cpu: "0.5 core",
        memory: "256 MB",
        storage: "256 MB",
        image: "cyberlab/net-sim:1.0",
        instructions: "1. Konfigurasikan IP Client Host ke 192.168.1.15/24 dengan Gateway 192.168.1.1.\n2. Tambahkan rute statis pada Router menuju subnet Server 10.0.0.0/24.\n3. Uji konektivitas hop-by-hop menggunakan simulasi ping dan inspeksi alur paket.",
        criteria: JSON.stringify({
          checkpoints: [
            { id: "chk_ip", description: "Konfigurasi antarmuka eth0 client" },
            { id: "chk_gw", description: "Tetapkan default gateway router" },
            { id: "chk_ping", description: "Verifikasi alur paket ICMP end-to-end" }
          ],
          completion_token: "RANGE{network_routing_end_to_end_verified}"
        }),
      },
      {
        id: "tpl-web-owasp",
        title: "Web Security Range: OWASP Top 10 Sandbox",
        description: "Aplikasi web sintetis yang rentan secara terisolasi untuk mempraktikkan SQL Injection (Boolean Auth Bypass), Cross-Site Scripting (XSS PoC), dan Path Traversal dengan komparasi patch aman.",
        category: "Web Security",
        difficulty: "Intermediate",
        duration: 75,
        xp: 80,
        cpu: "1.0 core",
        memory: "512 MB",
        storage: "512 MB",
        image: "cyberlab/web-vuln:1.0",
        instructions: "1. Buka antarmuka aplikasi web target pada port sandbox.\n2. Uji payload SQL Injection `' OR '1'='1` pada login form.\n3. Masukkan payload XSS `<script>alert('CYBERLAB')</script>` pada kolom ulasan tamu.\n4. Amati respons sistem dan analisis kode remediasi pertahanan.",
        criteria: JSON.stringify({
          checkpoints: [
            { id: "chk_sqli", description: "Eksploitasi celah autentikasi SQLi" },
            { id: "chk_xss", description: "Deteksi refleksi payload script XSS" },
            { id: "chk_traversal", description: "Uji batasan path traversal ../" }
          ],
          completion_token: "RANGE{appsec_owasp_remediation_mastered}"
        }),
      },
      {
        id: "tpl-forensics-disk",
        title: "Digital Forensics: Evidence Carving & Timeline Lab",
        description: "Investigasi digital terhadap image berkas barang bukti. Lakukan ekstraksi metadata EXIF, identifikasi anomali ekstensi berkas palsu, dan rekonstruksi timeline log insiden.",
        category: "Digital Forensics",
        difficulty: "Intermediate",
        duration: 60,
        xp: 70,
        cpu: "0.5 core",
        memory: "512 MB",
        storage: "1 GB",
        image: "cyberlab/forensics-suite:1.0",
        instructions: "1. Verifikasi nilai hash SHA-256 berkas bukti untuk menjamin Chain of Custody.\n2. Gunakan Hex Inspector untuk mendeteksi berkas biner PE/EXE yang disamarkan sebagai PDF.\n3. Susun urutan kronologis kejadian berdasarkan entri access.log server web.",
        criteria: JSON.stringify({
          checkpoints: [
            { id: "chk_hash", description: "Verifikasi hash integritas barang bukti" },
            { id: "chk_magic", description: "Identifikasi magic bytes file tersamar" },
            { id: "chk_log", description: "Saring entri log akses serangan" }
          ],
          completion_token: "RANGE{forensic_chain_of_custody_intact}"
        }),
      },
      {
        id: "tpl-reverse-x86",
        title: "Reverse Engineering: x86 Binary Disassembly Lab",
        description: "Analisis berkas binary ELF/PE compiled. Lacak instruksi assembly x86_64, evaluasi alur percabangan kondisional (CMP / JE / JNE), dan pahami mekanisme proteksi software crackme.",
        category: "Reverse Engineering",
        difficulty: "Advanced",
        duration: 90,
        xp: 90,
        cpu: "0.5 core",
        memory: "512 MB",
        storage: "512 MB",
        image: "cyberlab/reverse-lab:1.0",
        instructions: "1. Ekstrak string teks menggunakan fitur String Inspector.\n2. Lacak register CPU EAX dan Zero Flag (ZF) pada simulator instruksi.\n3. Hitung serial kunci matematis atau lakukan byte patch opcode lompatan percabangan.",
        criteria: JSON.stringify({
          checkpoints: [
            { id: "chk_strings", description: "Ekstraksi string dan simbol biner" },
            { id: "chk_registers", description: "Pelacakan alur register CPU x86" },
            { id: "chk_patch", description: "Bypass validasi serial crackme" }
          ],
          completion_token: "RANGE{x86_reverse_binary_disassembly_solved}"
        }),
      },
    ];

    for (const t of templates) {
      insertTemplate.run(
        t.id, t.title, t.description, t.category, t.difficulty, t.duration, t.xp,
        t.cpu, t.memory, t.storage, t.image, t.instructions, t.criteria, now, now
      );
    }
  }
}

export function logAudit(actorId: string, action: string, targetType: string, targetId: string, details: string) {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const id = `audit_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, actorId, action, targetType, targetId, details, now);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

export function createNotification(userId: string, title: string, message: string, type: "info" | "achievement" | "ctf" | "comment" | "admin", link = "") {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    const id = `notif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, userId, title, message, type, link, now);
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
