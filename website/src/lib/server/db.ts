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
}
