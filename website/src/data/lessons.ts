export interface LessonSection {
  title: string;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
    filename?: string;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  moduleId: "linux" | "networking" | "web-security" | "cryptography" | "digital-forensics" | "reverse-engineering";
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  objectives: string[];
  sections: LessonSection[];
  knowledgeCheck: QuizQuestion[];
  relatedLabId?: string;
  relatedToolId?: string;
}

export const LESSONS_DATABASE: Lesson[] = [
  // ==========================================
  // TRACK 1: LINUX & SYSTEM ADMINISTRATION
  // ==========================================
  {
    id: "linux-fundamentals",
    moduleId: "linux",
    title: "Linux Fundamentals & Arsitektur OS",
    description: "Pahami peran kernel Linux, arsitektur GNU/Linux, standar direktori FHS, dan alasan mengapa Linux menjadi sistem operasi standar cybersecurity.",
    difficulty: "beginner",
    durationMinutes: 15,
    objectives: [
      "Memahami perbedaan kernel Linux dengan distribusi GNU/Linux",
      "Menguasai Filesystem Hierarchy Standard (FHS) seperti /etc, /var/log, /tmp",
      "Mengenal hak akses superuser (root) vs unprivileged user",
      "Mengoperasikan perintah identifikasi sistem dasar",
    ],
    sections: [
      {
        title: "1. Mengapa Praktisi Cybersecurity Menggunakan Linux?",
        content: `Lebih dari 80% server komputasi awan, infrastruktur internet, dan perangkat keamanan (firewall, router, IDS/IPS) beroperasi di atas sistem Linux. 
Sifat open-source memungkinkan peneliti keamanan mengaudit kode sumber kernel secara transparan tanpa bergantung pada vendor pihak ketiga. 
Selain itu, konsep desain Unix "Everything is a file" mempermudah automasi scripting dan analisis log menggunakan command-line interface.`,
      },
      {
        title: "2. Struktur Direktori Inti (FHS)",
        content: `Di Linux, semua media penyimpanan bermuara pada satu titik akar tunggal yaitu root directory (/). Berikut direktori paling krusial untuk investigasi keamanan:
• /etc : Menyimpan seluruh berkas konfigurasi sistem dan layanan (misal /etc/passwd dan /etc/shadow).
• /var/log : Arsip utama aktivitas sistem dan autentikasi (/var/log/auth.log, syslog).
• /tmp : Direktori bersama dengan izin world-writable; sering menjadi tempat awal mendaratnya payload malware.
• /proc : Virtual filesystem yang memetakan proses yang sedang aktif di RAM secara real-time.`,
        codeSnippet: {
          language: "bash",
          filename: "terminal_recon.sh",
          code: `# Periksa identitas user aktif
whoami

# Tampilkan informasi kernel dan arsitektur CPU
uname -a

# Periksa direktori kerja saat ini
pwd

# Tampilkan isi direktori /etc dengan detail permission
ls -la /etc | head -n 10`,
        },
      },
    ],
    knowledgeCheck: [
      {
        id: "q1_linux_fhs",
        question: "Direktori manakah yang menyimpan konfigurasi hash password akun Linux yang hanya dapat diakses oleh superuser (root)?",
        options: ["/etc/passwd", "/etc/shadow", "/var/log/auth", "/home/root/.ssh"],
        correctIndex: 1,
        explanation: "/etc/passwd menyimpan metadata user (UID, GID, shell), sedangkan hash password rahasia disimpan terpisah di /etc/shadow dengan proteksi permission ketat (0640 atau 0600 milik root:shadow).",
      },
      {
        id: "q2_linux_tmp",
        question: "Mengapa folder /tmp sering dijadikan target pertama oleh penyerang untuk mengunduh skrip eksploitasi mereka?",
        options: [
          "Karena /tmp terenkripsi otomatis oleh kernel",
          "Karena direktori /tmp memiliki permission world-writable (siapa saja bisa menulis)",
          "Karena file di /tmp tidak terdeteksi oleh sistem antivirus",
          "Karena file di /tmp otomatis berjalan saat sistem dinyalakan ulang",
        ],
        correctIndex: 1,
        explanation: "/tmp secara default memiliki izin rwxrwxrwt (world-writable dengan sticky bit), memungkinkan user unprivileged menulis file baru di sana.",
      },
    ],
    relatedLabId: "linux-cli-lab",
  },
  {
    id: "linux-command-line",
    moduleId: "linux",
    title: "Navigasi Terminal & Command Line Mastery",
    description: "Kuasai manipulasi teks, pipa data (pipes), redirection, pencarian file, dan utilitas filter seperti grep, find, dan awk.",
    difficulty: "beginner",
    durationMinutes: 20,
    objectives: [
      "Menguasai pipeline data dengan operator pipe (|) dan redirect (> dan >>)",
      "Mencari file di seluruh sistem menggunakan perintah find berdasarkan izin dan ukuran",
      "Memfilter pola teks log menggunakan grep dan regex sederhana",
    ],
    sections: [
      {
        title: "Pipes & Filter Teks",
        content: `Pipeline (|) menghubungkan output standar (stdout) dari suatu perintah langsung menjadi input standar (stdin) bagi perintah berikutnya. 
Ini adalah pondasi analisis log security: memadukan cat, grep, sort, dan uniq untuk menemukan pola anomali seperti percobaan brute force login.`,
        codeSnippet: {
          language: "bash",
          filename: "log_hunting.sh",
          code: `# Cari percobaan login SSH yang gagal di auth.log
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -nr

# Cari file di sistem dengan bit SUID aktif (potensi privilege escalation)
find / -perm -4000 -type f 2>/dev/null`,
        },
      },
    ],
    knowledgeCheck: [
      {
        id: "q_cli_redirect",
        question: "Apa perbedaan antara operator redirection > dan >> di terminal Linux?",
        options: [
          "> menimpa (overwrite) isi file tujuan, sedangkan >> menambahkan (append) data di akhir file",
          ">> mengirim data ke background, sedangkan > menjalankan perintah secara sinkron",
          "> hanya berlaku untuk file biner, sedangkan >> untuk teks",
          "Keduanya memiliki fungsi identik tanpa perbedaan",
        ],
        correctIndex: 0,
        explanation: "Operator > akan menghapus isi file lama jika sudah ada (overwrite), sedangkan >> mempertahankan isi berkas lama dan menambahkan baris baru di ujungnya (append).",
      },
    ],
    relatedLabId: "linux-cli-lab",
  },
  {
    id: "file-permissions",
    moduleId: "linux",
    title: "File Permissions, Chmod & Chown Security",
    description: "Pahami model izin berkas Unix (Read, Write, Execute), notasi oktal chmod, kepemilikan chown, serta bahaya bit spesial SUID/SGID.",
    difficulty: "intermediate",
    durationMinutes: 20,
    objectives: [
      "Membaca string permission rwxrwxrwx dan mengkonversinya ke notasi oktal (misal: 755, 644)",
      "Mengubah kepemilikan user dan group menggunakan chown",
      "Menganalisis bahaya bit SUID (Set User ID) terhadap privilege escalation",
    ],
    sections: [
      {
        title: "Struktur Model Izin Unix",
        content: `Izin berkas terdiri dari 3 blok entitas: User (Owner), Group, dan Others (World).
Setiap entitas memiliki 3 mode hak akses:
• Read (r = 4): Izin membaca konten file atau melihat isi direktori.
• Write (w = 2): Izin memodifikasi/menghapus file atau membuat file di direktori.
• Execute (x = 1): Izin mengeksekusi file sebagai program atau memasuki direktori.`,
        codeSnippet: {
          language: "bash",
          filename: "permissions_demo.sh",
          code: `# Ubah izin skrip agar hanya owner yang bisa membaca, menulis, dan mengeksekusi
chmod 700 deploy.sh

# Atur berkas rahasia agar hanya root yang bisa membaca
chmod 600 id_rsa_backup
chown root:root id_rsa_backup

# Menemukan executable dengan SUID bit (dijalankan sebagai owner file)
ls -l /usr/bin/passwd
# Output: -rwsr-xr-x 1 root root ... (huruf 's' menandakan SUID aktif)`,
        },
      },
    ],
    knowledgeCheck: [
      {
        id: "q_chmod_calc",
        question: "Jika sebuah file memiliki permission -rw-r--r--, berapakah nilai representasi angka oktalnya?",
        options: ["755", "644", "777", "600"],
        correctIndex: 1,
        explanation: "Owner = rw- (4+2+0 = 6), Group = r-- (4+0+0 = 4), Others = r-- (4+0+0 = 4). Hasilnya adalah 644.",
      },
      {
        id: "q_suid_risk",
        question: "Mengapa biner custom milik root yang memiliki bit SUID (s) berbahaya jika memiliki celah command injection?",
        options: [
          "Karena file tersebut tidak dapat dihapus oleh administrator",
          "Karena saat biner itu dijalankan oleh user biasa, ia dieksekusi dengan hak istimewa superuser (root)",
          "Karena SUID mengenkripsi seluruh filesystem",
          "Karena SUID otomatis membuka port SSH keluar",
        ],
        correctIndex: 1,
        explanation: "Bit SUID (SetUID) menyebabkan program dijalankan dengan wewenang pemilik file (owner). Jika owner-nya adalah root dan program dapat dimanipulasi, attacker biasa bisa langsung memperoleh shell root (Privilege Escalation).",
      },
    ],
    relatedLabId: "linux-cli-lab",
  },
  {
    id: "system-hardening",
    moduleId: "linux",
    title: "Linux Server Hardening & Audit Keamanan",
    description: "Terapkan prinsip Defense-in-Depth untuk mengamankan server Linux: konfigurasi SSH yang aman, ufw firewall, fail2ban, dan disable root login.",
    difficulty: "intermediate",
    durationMinutes: 25,
    objectives: [
      "Mengamankan konfigurasi SSH daemon (/etc/ssh/sshd_config)",
      "Mengaktifkan autentikasi Public Key dan mematikan Password Authentication",
      "Mengkonfigurasi firewall host berbasis UFW",
      "Memahami prinsip Least Privilege pada akun sudoers",
    ],
    sections: [
      {
        title: "Hardening Layanan SSH",
        content: `Port 22 SSH adalah target konstan serangan brute-force otomatis di internet publik. 
Langkah pengamanan wajib untuk server produksi:
1. Matikan login langsung user root: PermitRootLogin no
2. Nonaktifkan otentikasi password biasa: PasswordAuthentication no
3. Wajibkan penggunaan SSH Keypair (Ed25519 atau RSA 4096-bit).
4. Batasi pengguna yang boleh login via SSH menggunakan direktif AllowUsers.`,
        codeSnippet: {
          language: "bash",
          filename: "/etc/ssh/sshd_config",
          code: `# Rekomendasi Hardening sshd_config
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2`,
        },
      },
    ],
    knowledgeCheck: [
      {
        id: "q_ssh_hardening",
        question: "Manakah tindakan pengamanan SSH paling efektif untuk menangkal serangan credential stuffing dan automated brute-force?",
        options: [
          "Mengganti teks pesan banner MOTD",
          "Menonaktifkan PasswordAuthentication dan hanya mengizinkan SSH Public Key Authentication",
          "Menginstall software antivirus desktop di server",
          "Menghapus user root dari file /etc/passwd",
        ],
        correctIndex: 1,
        explanation: "Kunci kriptografi SSH (khususnya Ed25519 atau RSA 4096-bit) memiliki entropi matematis yang mustahil ditebak oleh serangan kamus kata sandi (brute force).",
      },
    ],
  },

  // ==========================================
  // TRACK 2: COMPUTER NETWORKING
  // ==========================================
  {
    id: "networking-fundamentals",
    moduleId: "networking",
    title: "Networking Fundamentals & Topologi Jaringan",
    description: "Pahami dasar komunikasi data, klasifikasi LAN/WAN, topologi star vs mesh, peran switch vs router, dan utilitas ping/traceroute.",
    difficulty: "beginner",
    durationMinutes: 15,
    objectives: [
      "Membedakan topologi jaringan dan titik kegagalan tunggal (SPOF)",
      "Memahami perbedaan cara kerja switch (MAC layer 2) dan router (IP layer 3)",
      "Mengoperasikan diagnostik jaringan menggunakan ICMP (ping) dan route tracing",
    ],
    sections: [
      {
        title: "Perangkat Jaringan: Hub vs Switch vs Router",
        content: `• Hub (Layer 1): Menyiarkan (broadcast) semua frame ke setiap port secara buta. Sangat rentan sniffing pasif dan sudah usang.
• Switch (Layer 2): Mempelajari alamat MAC pengirim dan meneruskan frame secara selektif ke port tujuan. Menangkal sniffing pasif biasa, namun rentan ARP Spoofing jika tidak dilindungi Dynamic ARP Inspection.
• Router (Layer 3): Menghubungkan jaringan yang berbeda subnet menggunakan alamat IP logis. Bertindak sebagai gerbang isolasi broadcast domain dan batas firewall.`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_net_hub_switch",
        question: "Mengapa perangkat Hub sudah ditinggalkan dan dilarang dalam arsitektur jaringan yang aman?",
        options: [
          "Karena Hub tidak mendukung kabel serat optik",
          "Karena Hub membroadcast seluruh paket data ke semua komputer, sehingga paket mudah disadap (sniffing) oleh siapa saja di jaringan yang sama",
          "Karena Hub mengonsumsi daya listrik terlalu besar",
          "Karena Hub hanya bekerja pada protokol IPv6",
        ],
        correctIndex: 1,
        explanation: "Hub menduplikasi setiap bit sinyal listrik ke semua port tanpa memeriksa siapa penerima aslinya, sehingga setiap perangkat dalam jaringan bisa menyadap trafik perangkat lain secara pasif.",
      },
    ],
    relatedLabId: "network-packet-lab",
    relatedToolId: "subnet-calculator",
  },
  {
    id: "osi-tcp-ip",
    moduleId: "networking",
    title: "Model OSI 7 Layer & Protokol TCP/IP",
    description: "Pelajari fungsi tiap lapisan OSI (Physical s.d Application), enkapsulasi PDU (Frame, Packet, Segment), dan 3-Way Handshake TCP.",
    difficulty: "beginner",
    durationMinutes: 20,
    objectives: [
      "Menghafal dan memahami 7 lapisan OSI dan padanannya di model TCP/IP",
      "Memahami proses enkapsulasi dan de-enkapsulasi data saat melintasi jaringan",
      "Menganalisis TCP 3-Way Handshake (SYN, SYN-ACK, ACK) dan serangan SYN Flood",
    ],
    sections: [
      {
        title: "TCP 3-Way Handshake & Relevansi Keamanan",
        content: `Sebelum transmisi data andal (reliable) dimulai melalui TCP, klien dan server melakukan jabat tangan 3 tahap:
1. Client -> Server : [SYN] (Synchronize flag dengan nomor urut acak Seq=X)
2. Server -> Client : [SYN-ACK] (Server mengakui nomor urut Ack=X+1 dan mengirim Seq=Y)
3. Client -> Server : [ACK] (Client mengkonfirmasi Ack=Y+1, koneksi ESTABLISHED)

Celah Keamanan Terkenal: SYN Flood Attack. Penyerang mengirim ribuan paket SYN dengan IP palsu (spoofed) tanpa pernah mengirim paket ACK balasan, membanjiri antrean memori connection backlog server hingga lumpuh (Denial of Service).`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_tcp_handshake",
        question: "Paket flag TCP apakah yang dikirimkan oleh server untuk merespons paket awal SYN dari klien?",
        options: ["ACK", "SYN-ACK", "FIN", "RST"],
        correctIndex: 1,
        explanation: "Server merespons paket permintaan koneksi SYN klien dengan paket yang memuat dua flag aktif sekaligus: SYN dan ACK.",
      },
    ],
    relatedLabId: "network-packet-lab",
  },
  {
    id: "ip-addressing-subnetting",
    moduleId: "networking",
    title: "Pengalamatan IPv4, CIDR & Subnetting",
    description: "Kuasai kalkulasi pembagian jaringan (subnetting), bit mask biner, notasi CIDR, rentang host yang dapat digunakan, dan isolasi segmen VLAN.",
    difficulty: "intermediate",
    durationMinutes: 25,
    objectives: [
      "Mengkonversi alamat desimal bertitik (dotted-decimal) ke biner 32-bit",
      "Menghitung Network Address, Broadcast Address, dan Usable Host Range dari prefix CIDR",
      "Menerapkan segmentasi jaringan defensif untuk membatasi pergerakan lateral (lateral movement)",
    ],
    sections: [
      {
        title: "Formula Perhitungan Host Usable",
        content: `IPv4 terdiri dari 32 bit yang terbagi menjadi bagian Network Bits dan Host Bits.
Panjang prefix CIDR (/n) menentukan berapa banyak bit yang dicadangkan untuk alamat jaringan.
Sisa bit adalah h = (32 - n) bit host.

Rumus Total Alamat: 2^h
Rumus Usable Hosts: 2^h - 2
(Dikurangi 2 karena alamat pertama dialokasikan sebagai Network Identifier dan alamat terakhir sebagai Broadcast Identifier).`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_subnet_calc",
        question: "Berapa banyak host usable yang dapat dialokasikan pada blok subnet 192.168.10.0/26?",
        options: ["64", "62", "30", "126"],
        correctIndex: 1,
        explanation: "/26 menyisakan 32 - 26 = 6 bit host. 2^6 = 64 total alamat. Host usable = 64 - 2 = 62 alamat.",
      },
    ],
    relatedToolId: "subnet-calculator",
  },
  {
    id: "firewall-acl",
    moduleId: "networking",
    title: "Firewall, IPTables & Security ACLs",
    description: "Pelajari perbedaan Packet Filtering, Stateful Inspection, Next-Gen Firewall (NGFW), serta konfigurasi rule defensif.",
    difficulty: "intermediate",
    durationMinutes: 20,
    objectives: [
      "Membedakan Stateless vs Stateful firewall",
      "Memahami aksi default DROP vs REJECT",
      "Menyusun aturan firewall ingress dan egress untuk membatasi traffic malware",
    ],
    sections: [
      {
        title: "Stateless vs Stateful Filtering",
        content: `• Stateless Firewall: Memeriksa setiap paket secara terisolasi berdasarkan header IP dan port tanpa mengingat konteks sesi sebelumnya.
• Stateful Firewall: Mencatat state tabel koneksi aktif (NEW, ESTABLISHED, RELATED). Jika klien internal melakukan request keluar, paket balasan dari server tujuan otomatis diizinkan tanpa harus membuka port ke seluruh dunia.`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_fw_default",
        question: "Prinsip terbaik (best practice) dalam perancangan rule firewall adalah menerapkan Default Policy berupa:",
        options: ["ACCEPT ALL (Izinkan semua, blokir yang mencurigakan)", "DROP / DENY ALL (Blokir semua secara default, izinkan hanya yang dibutuhkan)", "REWRITE HEADERS", "BYPASS"],
        correctIndex: 1,
        explanation: "Prinsip Least Privilege dan Zero Trust mewajibkan Default Policy bernilai DROP/DENY ALL. Hanya traffic yang secara eksplisit didefinisikan dan dibutuhkan yang diberi izin masuk.",
      },
    ],
  },

  // ==========================================
  // TRACK 3: WEB APPLICATION SECURITY
  // ==========================================
  {
    id: "http-https",
    moduleId: "web-security",
    title: "Protokol HTTP, HTTPS & Security Headers",
    description: "Bedah anatomi HTTP Request/Response, mitigasi Man-in-the-Middle dengan TLS/SSL, cookie security flags, dan implementasi HTTP Security Headers.",
    difficulty: "beginner",
    durationMinutes: 20,
    objectives: [
      "Menganalisis anatomi request HTTP: method, headers, cookies, dan payload",
      "Memahami cara kerja enkripsi HTTPS dan sertifikat X.509",
      "Menerapkan atribut cookie HttpOnly, Secure, dan SameSite",
      "Mengkonfigurasi Security Headers (CSP, HSTS, X-Frame-Options)",
    ],
    sections: [
      {
        title: "Cookie Security Flags",
        content: `Ketika server mengirimkan session cookie via header Set-Cookie, tiga flag berikut wajib dipasang:
1. HttpOnly: Melarang JavaScript peramban mengakses dokumen cookie (document.cookie), memitigasi pencurian sesi saat terjadi celah XSS.
2. Secure: Memastikan cookie hanya dikirimkan melalui transmisi terenkripsi HTTPS.
3. SameSite=Strict/Lax: Mencegah browser menyertakan cookie saat request berasal dari situs pihak ketiga (mitigasi serangan CSRF).`,
        codeSnippet: {
          language: "http",
          filename: "secure_response.http",
          code: `HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Set-Cookie: session_id=s3cur3t0k3n; Path=/; Secure; HttpOnly; SameSite=Strict
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY`,
        },
      },
    ],
    knowledgeCheck: [
      {
        id: "q_cookie_httponly",
        question: "Apa fungsi utama penambahan atribut 'HttpOnly' pada cookie sesi autentikasi?",
        options: [
          "Memaksa cookie hanya bisa dikirimkan melalui protokol HTTP port 80",
          "Mencegah skrip JavaScript (document.cookie) membaca cookie tersebut, menangkal pencurian sesi via XSS",
          "Mencegah cookie kedaluwarsa selamanya",
          "Mengompresi ukuran cookie agar lebih cepat dikirim",
        ],
        correctIndex: 1,
        explanation: "Flag HttpOnly memblokir API JavaScript peramban untuk membaca cookie tersebut. Jika web memiliki celah XSS, attacker tidak bisa dengan mudah mengeksekusi payload document.cookie untuk mencuri sesi login.",
      },
    ],
    relatedLabId: "web-vuln-lab",
  },
  {
    id: "sql-injection",
    moduleId: "web-security",
    title: "SQL Injection (SQLi) & Mitigasi Prepared Statements",
    description: "Pelajari bagaimana input pengguna yang tidak disanitasi dapat memanipulasi logika query basis data, serta implementasikan Parameterized Queries.",
    difficulty: "intermediate",
    durationMinutes: 25,
    objectives: [
      "Memahami mekanisme dasar SQL Injection (In-band, Error-based, Blind SQLi)",
      "Menganalisis payload klasik seperti ' OR 1=1 --",
      "Menerapkan Prepared Statements (Parameterized Queries) sebagai mitigasi definitif",
    ],
    sections: [
      {
        title: "Anatomi Kerentanan SQL Injection",
        content: `SQL Injection terjadi ketika input dari pengguna digabungkan langsung (string concatenation) ke dalam perintah SQL tanpa sanitasi atau pemisahan antara kode perintah dan data.
Contoh kode rentan:
query = "SELECT * FROM users WHERE username = '" + inputUser + "' AND password = '" + inputPass + "'";

Jika attacker memasukkan: admin' --
Query berubah menjadi:
SELECT * FROM users WHERE username = 'admin' --' AND password = '...'
Tanda '--' menganggap sisa query sebagai komentar, sehingga pemeriksaan password dilewati!

Mitigasi Definitif: Parameterized Queries (Prepared Statements). Data input diperlakukan murni sebagai nilai parameter literal, bukan kode executable.`,
        codeSnippet: {
          language: "typescript",
          filename: "secure_db.ts",
          code: `// MITIGASI AMAN: Prepared Statement (Parameterized Query)
// Input pengguna tidak pernah di-concatenate ke string SQL
const query = "SELECT id, username, role FROM users WHERE username = ? AND password_hash = ?";
const [rows] = await db.execute(query, [usernameInput, hashedPassword]);`,
        },
      },
    ],
    knowledgeCheck: [
      {
        id: "q_sqli_mitigation",
        question: "Manakah metode paling efektif dan diakui industri untuk mencegah serangan SQL Injection secara tuntas?",
        options: [
          "Memfilter kata 'SELECT' dan 'UNION' menggunakan regex sederhana",
          "Menggunakan Prepared Statements (Parameterized Queries)",
          "Mengenkripsi seluruh database dengan AES",
          "Menonaktifkan logging pada server database",
        ],
        correctIndex: 1,
        explanation: "Prepared Statements memisahkan query blueprint dari nilai data. Apapun yang diketikkan pengguna (termasuk tanda petik atau kode SQL) hanya akan dianggap sebagai data string biasa dan tidak dieksekusi sebagai perintah database.",
      },
    ],
    relatedLabId: "web-vuln-lab",
  },
  {
    id: "xss",
    moduleId: "web-security",
    title: "Cross-Site Scripting (Stored, Reflected & DOM XSS)",
    description: "Pahami bagaimana peretas menyuntikkan skrip berbahaya ke dalam browser korban, jenis-jenis XSS, dan pertahanan Context-Aware Output Encoding.",
    difficulty: "intermediate",
    durationMinutes: 20,
    objectives: [
      "Mengklasifikasikan Reflected XSS, Stored XSS, dan DOM-based XSS",
      "Memahami dampak XSS: pembajakan sesi, defacement, dan keylogger",
      "Menerapkan Context-aware HTML entity encoding dan Content Security Policy (CSP)",
    ],
    sections: [
      {
        title: "Tiga Varian XSS",
        content: `• Reflected XSS: Payload skrip disematkan di parameter URL (query string) dan langsung dipantulkan server ke halaman respon.
• Stored XSS (Paling Berbahaya): Payload berbahaya disimpan permanen di database server (misal kolom komentar, nama profil) dan dieksekusi setiap kali korban membuka halaman tersebut.
• DOM-based XSS: Kerentanan terjadi murni di sisi peramban (client-side JS) saat membaca sumber tidak terpercaya (seperti location.hash) dan menulisnya ke DOM sink yang tidak aman (seperti innerHTML).`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_xss_stored",
        question: "Jenis Cross-Site Scripting (XSS) apakah yang menyimpan payload skrip berbahaya secara permanen di database server?",
        options: ["Reflected XSS", "Stored / Persistent XSS", "DOM-based XSS", "Blind XSS"],
        correctIndex: 1,
        explanation: "Stored XSS menyimpan skrip penyerang langsung di media penyimpanan aplikasi (database, komentar, forum) sehingga akan menyerang semua pengguna lain yang membuka data tersebut.",
      },
    ],
    relatedLabId: "web-vuln-lab",
  },
  {
    id: "owasp-top-10",
    moduleId: "web-security",
    title: "Studi Komprehensif OWASP Top 10",
    description: "Eksplorasi 10 kategori risiko keamanan aplikasi web paling kritis di dunia: Broken Access Control, Cryptographic Failures, Injection, dan Security Misconfiguration.",
    difficulty: "intermediate",
    durationMinutes: 25,
    objectives: [
      "Memahami taksonomi OWASP Top 10 edisi terkini",
      "Menganalisis Broken Access Control (IDOR, privilege escalation)",
      "Mengidentifikasi Security Misconfiguration pada server cloud & header",
    ],
    sections: [
      {
        title: "Broken Access Control (Peringkat #1 OWASP)",
        content: `Broken Access Control adalah kelemahan di mana sistem gagal membatasi hak akses pengguna terhadap data atau fungsionalitas di luar wewenangnya.
Contoh umum: Insecure Direct Object Reference (IDOR).
Pengguna biasa dapat mengganti URL:
GET /api/documents/1042
menjadi:
GET /api/documents/1043
Jika server hanya memeriksa apakah pengguna sudah login tetapi tidak memverifikasi apakah dokumen 1043 benar-benar miliknya, maka terjadi pelanggaran otorisasi horizontal!`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_owasp_idor",
        question: "Seorang pengguna dapat melihat faktur tagihan milik pelanggan lain hanya dengan mengubah parameter id di URL (/invoice?id=88 menjadi id=89). Kerentanan ini disebut:",
        options: ["SQL Injection", "IDOR (Insecure Direct Object Reference) / Broken Access Control", "CSRF", "Clickjacking"],
        correctIndex: 1,
        explanation: "IDOR adalah bentuk Broken Access Control di mana referensi langsung objek internal diekspos tanpa verifikasi izin kepemilikan oleh backend.",
      },
    ],
    relatedLabId: "web-vuln-lab",
  },

  // ==========================================
  // TRACK 4: CRYPTOGRAPHY
  // ==========================================
  {
    id: "encoding-encryption-hashing",
    moduleId: "cryptography",
    title: "Encoding vs Encryption vs Hashing",
    description: "Pelajari perbedaan fundamental antara encoding untuk format data, enkripsi untuk kerahasiaan berkunci, dan hashing untuk integritas satu arah.",
    difficulty: "beginner",
    durationMinutes: 15,
    objectives: [
      "Membedakan sifat reversible vs irreversible",
      "Menjelaskan mengapa Base64 bukan algoritma keamanan",
      "Memahami 4 sifat wajib fungsi hash kriptografi",
    ],
    sections: [
      {
        title: "Tabel Perbandingan Definitif",
        content: `• Encoding (Base64, Hex): Mengubah representasi format biner ke teks. Tidak memerlukan kunci rahasia, bersifat dua arah dan dapat dibalik secara instan oleh siapa saja.
• Encryption (AES, RSA): Mengubah plaintext menjadi ciphertext acak menggunakan kunci rahasia. Bersifat dua arah hanya bagi pemilik kunci yang sah.
• Hashing (SHA-256, Bcrypt): Fungsi matematika satu arah (one-way). Menghasilkan digest berukuran tetap dari input sembarang panjang. Tidak dapat dikembalikan ke teks semula secara komputasi.`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_crypto_diff",
        question: "Jika sebuah sistem web menyimpan kata sandi pengguna menggunakan format Base64, mengapa hal ini dianggap sebagai kesalahan fatal?",
        options: [
          "Karena Base64 hanya bisa di-decode di sistem operasi Linux",
          "Karena Base64 adalah skema encoding publik tanpa kunci, siapapun dapat mengembalikannya ke teks biasa secara instan",
          "Karena Base64 membutuhkan resource memori yang terlalu besar",
          "Karena Base64 selalu menambahkan karakter acak",
        ],
        correctIndex: 1,
        explanation: "Base64 adalah representasi format data, bukan algoritma keamanan. Men-decode Base64 tidak membutuhkan kunci rahasia sama sekali.",
      },
    ],
    relatedLabId: "crypto-challenges-lab",
    relatedToolId: "cipher-toolkit",
  },
  {
    id: "caesar-cipher",
    moduleId: "cryptography",
    title: "Caesar Cipher & Analisis Frekuensi Huruf",
    description: "Pahami algoritma substitusi monoalfabetik klasik, ruang kunci 26 variasi, dan cara memecahkannya menggunakan Frequency Analysis.",
    difficulty: "beginner",
    durationMinutes: 15,
    objectives: [
      "Memahami pergeseran modular alfabet: C = (P + k) mod 26",
      "Melakukan teknik brute force 25 kemungkinan kunci",
      "Memahami kelemahan cipher substitusi klasik terhadap analisis frekuensi huruf alami",
    ],
    sections: [
      {
        title: "Matematika Caesar Shift & Kelemahan Analisis Frekuensi",
        content: `Caesar cipher menggeser setiap karakter alfabet sejauh k langkah.
Rumus Enkripsi: E(x) = (x + k) mod 26
Rumus Dekripsi: D(x) = (x - k + 26) mod 26

Mengapa tidak aman?
1. Ruang kunci (key space) sangat sempit: hanya ada 25 kemungkinan pergeseran.
2. Mempertahankan pola statistik bahasa alami. Pada bahasa Inggris, huruf 'E' dan 'T' muncul paling sering (~12%). Huruf ciphertext yang paling sering muncul hampir pasti merupakan representasi huruf 'E'.`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_caesar_keyspace",
        question: "Berapa banyak kunci pergeseran unik yang mungkin ada pada cipher substitusi Caesar standar alfabet A-Z?",
        options: ["256", "25", "1024", "Tak terhingga"],
        correctIndex: 1,
        explanation: "Alfabet memiliki 26 huruf. Shift 0 dan shift 26 mengembalikan huruf ke posisi semula (tanpa perubahan), sehingga hanya ada 25 pergeseran aktif unik (1 s.d 25).",
      },
    ],
    relatedLabId: "crypto-challenges-lab",
    relatedToolId: "cipher-toolkit",
  },
  {
    id: "symmetric-asymmetric",
    moduleId: "cryptography",
    title: "Enkripsi Simetris (AES) vs Asimetris (RSA/ECC)",
    description: "Bandingkan algoritma kunci bersama (AES-GCM) dengan kriptografi kunci publik (RSA dan Elliptic Curve), serta infrastruktur PKI dan TLS.",
    difficulty: "intermediate",
    durationMinutes: 20,
    objectives: [
      "Memahami trade-off kecepatan komputasi simetris vs fleksibilitas asimetris",
      "Menjelaskan Key Distribution Problem pada enkripsi simetris",
      "Memahami pasangan Public Key & Private Key pada tanda tangan digital dan pertukaran kunci",
    ],
    sections: [
      {
        title: "Kriptografi Hibrida pada TLS Modern",
        content: `Enkripsi simetris (seperti AES-256) sangat cepat dalam mengenkripsi data berukuran gigabyte, namun memiliki masalah distribusi kunci: bagaimana cara mengirim kunci simetris ke pihak lain dengan aman jika saluran komunikasi belum terenkripsi?
Solusinya: Enkripsi Asimetris (RSA / ECDHE) digunakan saat handshake awal untuk menegosiasikan kunci rahasia bersama (session key). Setelah kunci bersama disepakati, seluruh transfer data berkecepatan tinggi berikutnya diamankan menggunakan enkripsi simetris AES.`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_crypto_keys",
        question: "Pada sistem enkripsi kunci publik (Asymmetric), kunci manakah yang digunakan untuk mendekripsi pesan yang dikirimkan kepada Anda?",
        options: ["Public Key pengirim", "Private Key milik Anda sendiri", "Public Key penerima lain", "Master password ISP"],
        correctIndex: 1,
        explanation: "Pengirim mengenkripsi pesan menggunakan Public Key milik Anda. Hanya Private Key milik Anda yang disimpan rahasia yang mampu mendekripsi pesan tersebut.",
      },
    ],
    relatedToolId: "cipher-toolkit",
  },
  {
    id: "hash-functions",
    moduleId: "cryptography",
    title: "Fungsi Hash Kriptografi & Salted Password Storage",
    description: "Pahami collision attack, bahaya MD5/SHA-1, fenomena Rainbow Table, dan implementasi Salted Slow Hashing (Bcrypt/Argon2id).",
    difficulty: "intermediate",
    durationMinutes: 20,
    objectives: [
      "Menganalisis serangan tabrakan (Collision Attacks) pada MD5 dan SHA-1",
      "Memahami bahaya Rainbow Table terhadap hash password tanpa salt",
      "Menerapkan Cryptographic Salt dan Work Factor (Key Stretching)",
    ],
    sections: [
      {
        title: "Mengapa SHA-256 Biasa Tidak Cocok untuk Menyimpan Password?",
        content: `SHA-256 didesain sangat cepat untuk menghitung integritas file dan transaksi blockchain. 
Namun untuk penyimpanan password, algoritma yang terlalu cepat adalah bencana keamanan! Rig GPU cluster penyerang (Hashcat) dapat mencoba miliaran kalkulasi SHA-256 per detik untuk memecahkan password pengguna.
Solusi: Slow Password Hashing Algorithms seperti Bcrypt, PBKDF2, dan Argon2id. Algoritma ini memiliki parameter work factor (cost) dan memory hardness yang membuat komputasi brute force GPU menjadi sangat lambat dan tidak ekonomis.`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_salt_purpose",
        question: "Apakah fungsi utama penambahan Salt (string acak unik) sebelum melakukan hashing pada password pengguna?",
        options: [
          "Mempercepat waktu komputasi login server",
          "Mencegah penggunaan Rainbow Table (tabel lookup hash siap pakai) dan memastikan dua user dengan password sama menghasilkan hash berbeda",
          "Mengizinkan administrator membaca password kembali jika user lupa",
          "Mengubah hash menjadi enkripsi simetris",
        ],
        correctIndex: 1,
        explanation: "Salt yang unik untuk setiap user memastikan bahwa password yang sama (misal 'rahasia123') akan menghasilkan hash yang sama sekali berbeda di database, menggagalkan serangan precomputed rainbow table.",
      },
    ],
    relatedToolId: "hash-inspector",
  },

  // ==========================================
  // TRACK 5: DIGITAL FORENSICS
  // ==========================================
  {
    id: "digital-evidence",
    moduleId: "digital-forensics",
    title: "Prinsip Bukti Digital & Chain of Custody",
    description: "Pelajari prosedur legal penanganan barang bukti elektronik, integritas bit-stream image (forensic imaging), dan pemeliharaan Chain of Custody.",
    difficulty: "beginner",
    durationMinutes: 15,
    objectives: [
      "Memahami aturan penerimaan bukti di pengadilan (Locard's Exchange Principle)",
      "Menerapkan prosedur Chain of Custody tanpa memodifikasi media asli",
      "Memverifikasi keaslian disk clone menggunakan cryptographic hash",
    ],
    sections: [
      {
        title: "Aturan Emas Forensik Digital: Do Not Modify Original Evidence",
        content: `Investigasi forensik tidak pernah dilakukan pada drive atau sistem asli!
Langkah standar:
1. Pasang perangkat Hardware Write-Blocker untuk mencegah sistem operasi menulis metadata stempel waktu saat disk dihubungkan.
2. Buat salinan identik bit-demi-bit (Bit-stream Image) dari media penyimpanan menggunakan alat seperti dd atau FTK Imager.
3. Hitung nilai hash verifikasi (SHA-256) dari drive fisik dan file image clone. Keduanya wajib identik!
4. Lakukan seluruh investigasi, ukiran berkas, dan ekstraksi data pada salinan image tersebut.`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_dfir_hash",
        question: "Mengapa investigator forensik digital selalu mencatat nilai hash SHA-256 dari barang bukti penyimpanan digital?",
        options: [
          "Untuk mempercepat proses booting komputer",
          "Untuk membuktikan di persidangan bahwa data bukti tidak mengalami modifikasi 1 bit pun sejak disita (Integritas Bukti)",
          "Untuk memulihkan password akun Windows",
          "Untuk mengompresi ukuran disk",
        ],
        correctIndex: 1,
        explanation: "Nilai hash adalah sidik jari matematis. Jika nilai hash image di laboratorium sama persis dengan hash saat disk disita di TKP, terbukti data asli tidak terkontaminasi atau dimanipulasi.",
      },
    ],
    relatedLabId: "file-forensics-lab",
  },
  {
    id: "file-signatures",
    moduleId: "digital-forensics",
    title: "Analisis File Signatures & Header Biner",
    description: "Pelajari bagaimana sistem operasi mendeteksi tipe file menggunakan Magic Bytes, mendeteksi manipulasi ekstensi, dan teknik file carving.",
    difficulty: "intermediate",
    durationMinutes: 20,
    objectives: [
      "Membaca representasi heksadesimal dari header berkas digital",
      "Mengenal magic bytes populer: PNG (89 50 4E 47), PDF (25 50 44 46), PE (4D 5A), ZIP (50 4B 03 04)",
      "Mendeteksi teknik malware evasion melalui extension spoofing",
    ],
    sections: [
      {
        title: "Ekstensi File vs Magic Bytes",
        content: `Ekstensi nama file (.jpg, .pdf, .exe) hanyalah label visual untuk antarmuka pengguna grafis. Sistem operasi modern dan software analisis forensik memeriksa byte pertama dari file (disebut Magic Bytes) untuk mengetahui format sebenarnya.
Teknik Penyerang: Mengganti nama malware payload.exe menjadi invoice.pdf. Jika korban menggunakan sistem tanpa proteksi, file mungkin dieksekusi atau peramban dapat mengidentifikasi header biner aslinya (MZ / Portable Executable).`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_magic_png",
        question: "Sebuah berkas memiliki 4 byte pertama heksadesimal '89 50 4E 47'. Berkas tersebut berformat:",
        options: ["Dokumen PDF", "Gambar PNG", "File Audio MP3", "Arsip ZIP"],
        correctIndex: 1,
        explanation: "89 50 4E 47 adalah signature resmi format citra PNG. Pada ASCII, 50 4E 47 terbaca sebagai 'PNG'.",
      },
    ],
    relatedLabId: "file-forensics-lab",
    relatedToolId: "file-signature-checker",
  },
  {
    id: "metadata-analysis",
    moduleId: "digital-forensics",
    title: "Metadata Analysis & Ekstraksi Jejak Digital",
    description: "Pahami informasi tersembunyi di dalam berkas: EXIF pada foto kamera, revisi dokumen PDF/Office, serta ancaman kebocoran OSINT.",
    difficulty: "intermediate",
    durationMinutes: 15,
    objectives: [
      "Mengekstrak data EXIF (Exchangeable Image File Format) dari gambar JPEG",
      "Mengidentifikasi koordinat GPS presisi, stempel waktu, dan perangkat pembuat",
      "Menerapkan teknik sanitasi metadata untuk melindungi privasi",
    ],
    sections: [
      {
        title: "Bahaya Kebocoran Jejak Metadata (OSINT)",
        content: `Metadata adalah 'data tentang data'. Saat mengambil foto dengan kamera ponsel cerdas, sensor kamera secara otomatis menyisipkan:
• Koordinat lintang dan bujur GPS tempat foto diambil.
• Merek, tipe model kamera, dan versi firmware.
• Waktu dan tanggal presisi hingga detik.
Jika foto diunggah ke internet tanpa dibersihkan, analis intelijen open-source (OSINT) dapat melacak lokasi rumah atau kantor pemilik foto dengan mudah.`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_meta_exif",
        question: "Tag metadata apakah pada foto ponsel yang berpotensi membocorkan lokasi fisik tempat pengambilan gambar?",
        options: ["ImageWidth", "GPS Latitude & Longitude", "ColorSpace", "FlashStatus"],
        correctIndex: 1,
        explanation: "Tag EXIF GPS menyimpan koordinat derajat, menit, dan detik lokasi satelit di mana foto tersebut diambil.",
      },
    ],
    relatedToolId: "metadata-inspector",
  },
  {
    id: "log-analysis",
    moduleId: "digital-forensics",
    title: "Analisis Log Keamanan (Auth, Web, Syslog)",
    description: "Investigasi jejak insiden peretasan melalui analisis log web server (Nginx/Apache), log SSH, dan deteksi anomali serangan web.",
    difficulty: "intermediate",
    durationMinutes: 25,
    objectives: [
      "Membaca format Common Log Format (CLF) web server",
      "Mendeteksi indikasi serangan SQL Injection, Directory Traversal, dan Web Shell di access log",
      "Melacak timeline aktivitas penyerang (Incident Reconstruction)",
    ],
    sections: [
      {
        title: "Mendeteksi Jejak Serangan Web di Log",
        content: `Access log web mencatat IP pengirim, stempel waktu, method, path URL, status kode HTTP, dan User-Agent.
Contoh baris mencurigakan:
192.168.1.55 - - [19/Nov/2026:02:14:10] "GET /product.php?id=1%20UNION%20SELECT%20null,username,password%20FROM%20users HTTP/1.1" 200 4812
Baris di atas menunjukkan upaya nyata eksploitasi Union-based SQL Injection terhadap parameter id dengan respon HTTP 200 (berhasil dieksekusi).`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_log_status",
        question: "Status code HTTP manakah di access log yang menunjukkan bahwa permintaan penyerang berhasil diproses oleh web server?",
        options: ["404 Not Found", "200 OK", "403 Forbidden", "502 Bad Gateway"],
        correctIndex: 1,
        explanation: "HTTP 200 OK mengindikasikan server sukses memproses permintaan klien dan mengembalikan payload konten respon.",
      },
    ],
  },

  // ==========================================
  // TRACK 6: REVERSE ENGINEERING
  // ==========================================
  {
    id: "binary-fundamentals",
    moduleId: "reverse-engineering",
    title: "Fondasi Format Biner & Representasi Komputer",
    description: "Pelajari bagaimana kode sumber tingkat tinggi dikompilasi menjadi instruksi mesin biner, representasi Little Endian vs Big Endian, dan struktur memori.",
    difficulty: "intermediate",
    durationMinutes: 20,
    objectives: [
      "Memahami proses kompilasi: Source Code -> Assembly -> Machine Code (Binary)",
      "Membaca notasi byte Little Endian pada arsitektur x86/x64",
      "Membedakan segmen memori: Text/Code, Data, BSS, Heap, dan Stack",
    ],
    sections: [
      {
        title: "Endianness: Little Endian vs Big Endian",
        content: `Endianness adalah urutan penyimpanan byte dari suatu data multi-byte di alamat memori komputer:
• Little Endian (Digunakan oleh prosesor Intel dan AMD x86/x64): Byte paling rendah nilainya (Least Significant Byte / LSB) disimpan di alamat memori paling rendah.
Contoh: Nilai heksadesimal 0x12345678 disimpan di memori sebagai urutan:
[0x78] [0x56] [0x34] [0x12]
• Big Endian (Digunakan pada protokol jaringan TCP/IP): Byte paling tinggi nilainya disimpan lebih dulu (urutan alami manusia).`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_re_endian",
        question: "Pada arsitektur prosesor x86-64 (Little Endian), bagaimanakah nilai 32-bit 0xAABBCCDD disimpan di memori?",
        options: [
          "[AA] [BB] [CC] [DD]",
          "[DD] [CC] [BB] [AA]",
          "[BB] [AA] [DD] [CC]",
          "[DD] [AA] [CC] [BB]",
        ],
        correctIndex: 1,
        explanation: "Little Endian menaruh Least Significant Byte (0xDD) di alamat memori paling awal, diikuti 0xCC, 0xBB, dan terakhir 0xAA.",
      },
    ],
    relatedLabId: "reverse-engineering-lab",
  },
  {
    id: "assembly-intro",
    moduleId: "reverse-engineering",
    title: "Pengenalan Arsitektur Register & Assembly x86/x64",
    description: "Kuasai register CPU serbaguna (RAX, RBX, RCX, RDX, RSP, RBP, RIP) dan instruksi dasar perakitan (MOV, ADD, CMP, JMP, JZ/JE).",
    difficulty: "advanced",
    durationMinutes: 30,
    objectives: [
      "Mengenal fungsi register umum dan pointer (RSP untuk top of stack, RIP untuk instruction pointer)",
      "Membaca instruksi kontrol alur (CMP, JE, JNE, CALL, RET)",
      "Memahami bagaimana percabangan logika if/else diimplementasikan di tingkat assembly",
    ],
    sections: [
      {
        title: "Instruksi Pembanding & Percabangan Kondisional",
        content: `Di dalam biner yang dikompilasi, pemeriksaan password seringkali berupa:
CMP EAX, EBX    ; Bandingkan nilai di register EAX dengan EBX
JE  login_ok    ; Jump if Equal: Jika nilainya sama, lompat ke blok sukses
JMP login_fail  ; Lompat ke blok gagal

Keahlian Reverse Engineering: Analis dapat memodifikasi instruksi JE (0x74) menjadi JNE (0x75) atau NOP (0x90) untuk mem-bypass validasi serial key pada program crackme!`,
        codeSnippet: {
          language: "nasm",
          filename: "check_password.asm",
          code: `; Contoh Assembly x86 pemeriksaan password
mov eax, [user_input_hash]  ; Muat hash input pengguna
cmp eax, 0x1337c0de         ; Bandingkan dengan hash rahasia
je  valid_license           ; Jika cocok, izinkan akses program
mov edi, str_invalid_key
call print_error
ret

valid_license:
mov edi, str_welcome
call print_success
ret`,
        },
      },
    ],
    knowledgeCheck: [
      {
        id: "q_asm_rip",
        question: "Register prosesor apakah yang selalu menunjuk ke alamat memori instruksi berikutnya yang akan dieksekusi oleh CPU?",
        options: ["RAX (Accumulator)", "RSP (Stack Pointer)", "RIP / EIP (Instruction Pointer)", "RBP (Base Pointer)"],
        correctIndex: 2,
        explanation: "RIP (Instruction Pointer pada arsitektur 64-bit) memegang alamat memori dari instruksi selanjutnya yang akan di-fetch dan dijalankan oleh CPU.",
      },
    ],
    relatedLabId: "reverse-engineering-lab",
  },
  {
    id: "static-analysis",
    moduleId: "reverse-engineering",
    title: "Analisis Statis dengan Strings & Disassembler",
    description: "Periksa biner executable tanpa menjalankannya: ekstraksi embedded strings, tabel import/export fungsi API, dan dekompilasi dengan Ghidra.",
    difficulty: "advanced",
    durationMinutes: 25,
    objectives: [
      "Menggunakan utilitas command-line strings untuk menemukan hardcoded credentials",
      "Menganalisis tabel Import Address Table (IAT) untuk memprediksi kapabilitas malware",
      "Membuka alur fungsi biner menggunakan decompiler Ghidra / IDA Pro",
    ],
    sections: [
      {
        title: "Mendeteksi Indikator Kapabilitas dari Import API",
        content: `Pada berkas Windows Portable Executable (PE), fungsi API yang diimpor dari DLL sistem mencerminkan perilaku program:
• Mengimpor URLDownloadToFileA atau InternetOpenA : Program melakukan koneksi jaringan / download payload.
• Mengimpor RegSetValueExA di Software\\Microsoft\\Windows\\CurrentVersion\\Run : Program memasang autostart persistence.
• Mengimpor CryptEncrypt / CryptDecrypt : Program memiliki kapabilitas kriptografi (potensi ransomware).`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_re_strings",
        question: "Perintah terminal Linux apakah yang dapat digunakan dengan cepat untuk mengekstrak teks ASCII yang tertanam di dalam sebuah file biner?",
        options: ["cat", "strings", "grep -bin", "hexdump -ascii"],
        correctIndex: 1,
        explanation: "Utilitas 'strings' mencari dan mencetak deretan karakter printable berurutan (panjang default minimal 4 karakter) di dalam berkas biner.",
      },
    ],
    relatedLabId: "reverse-engineering-lab",
  },
  {
    id: "dynamic-analysis",
    moduleId: "reverse-engineering",
    title: "Analisis Dinamis dengan GDB & Debugger",
    description: "Pelajari eksekusi terkontrol menggunakan GNU Debugger (GDB): pasang breakpoints, inspeksi isi register, dan telusuri alur eksekusi baris-demi-baris.",
    difficulty: "advanced",
    durationMinutes: 30,
    objectives: [
      "Mengoperasikan GDB untuk mengeksekusi biner Linux ELF",
      "Menyetel breakpoint pada fungsi target (break main)",
      "Menginspeksi nilai register (info registers) dan memori stack (x/10xw $rsp)",
      "Melakukan patching memori saat runtime",
    ],
    sections: [
      {
        title: "Perintah Esensial GNU Debugger (GDB)",
        content: `Debugger memungkinkan kita menghentikan jalannya CPU tepat pada instruksi yang kita inginkan:
• gdb ./program : Membuka file biner ke lingkungan debugger.
• break main : Memasang titik henti (breakpoint) pada fungsi utama.
• run : Memulai eksekusi hingga mencapai breakpoint.
• stepi (si) : Menjalankan tepat satu instruksi assembly mesin berikutnya.
• info registers : Menampilkan nilai terkini dari seluruh register CPU.
• x/16xb $rsp : Menampilkan 16 byte heksadesimal yang berada di pucuk stack.`,
      },
    ],
    knowledgeCheck: [
      {
        id: "q_gdb_breakpoint",
        question: "Apa tujuan memasang 'breakpoint' saat melakukan analisis dinamis pada debugger seperti GDB atau x64dbg?",
        options: [
          "Menghapus program dari hard disk",
          "Menghentikan sementara eksekusi program pada instruksi tertentu agar analis dapat mengamati isi register dan memori",
          "Mengenkripsi memori biner",
          "Mencegah program menggunakan koneksi internet",
        ],
        correctIndex: 1,
        explanation: "Breakpoint menghentikan eksekusi CPU pada alamat yang ditentukan sehingga analis dapat memeriksa status register, isi variabel di stack, dan alur percabangan.",
      },
    ],
    relatedLabId: "reverse-engineering-lab",
  },
];
