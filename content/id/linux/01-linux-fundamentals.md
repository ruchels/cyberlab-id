---
title: "Linux Fundamentals & Arsitektur OS"
module: "linux"
order: 1
difficulty: "beginner"
objectives:
  - "Memahami sejarah, filosofi open-source, dan peran Linux dalam cybersecurity"
  - "Mengenal hierarki File System Hierarchy Standard (FHS)"
  - "Menguasai perintah navigasi dasar dan manipulasi file"
  - "Melakukan inspeksi sistem dan lingkungan kerja terminal"
---

# Linux Fundamentals & Arsitektur OS

Selamat datang di modul pembuka **CyberLab-ID: Linux & System Administration**. Dalam dunia cybersecurity, Linux adalah sistem operasi standar industri. Lebih dari 80% server internet, cloud computing, infrastruktur firewall, router enterprise, hingga sistem pertahanan militer dijalankan di atas kernel Linux.

---

## 1. Apa itu Linux?

Secara teknis, **Linux** sebenarnya hanyalah sebuah **Kernel** — jembatan inti antara perangkat keras (*hardware*) komputer dengan perangkat lunak (*software*). Kernel ini pertama kali dikembangkan oleh **Linus Torvalds** pada tahun 1991 sebagai proyek open-source hobi saat masih berstatus mahasiswa di Universitas Helsinki, Finlandia.

Ketika kernel Linux digabungkan dengan utilitas sistem dari **GNU Project** (compiler, coreutils, shell bash), terciptalah sebuah sistem operasi lengkap yang secara akurat disebut sebagai sistem **GNU/Linux**.

### Mengapa Linux Krusial bagi Praktisi Keamanan Siber?
1. **Transparansi Penuh (Open Source):** Tidak ada kode biner tersembunyi. Setiap baris kode kernel dapat diaudit untuk mencari celah keamanan (vulnerability research).
2. **Kontrol Hak Akses yang Ketat (Granular Permissions):** Konsep pemisahan *root* (superuser) dan pengguna reguler membatasi dampak eksploitasi malware.
3. **Automasi Berbasis Teks (CLI-first):** Semua konfigurasi sistem disimpan dalam file teks biasa (*plain text*), memungkinkan analisis log dan automasi pertahanan dilakukan secara masif menggunakan skrip.
4. **Ekosistem Tools Penetrasi & Forensik:** Distribusi spesialis seperti **Kali Linux**, **Parrot Security OS**, dan **SANS SIFT** menyediakan ribuan perkakas keamanan bawaan.

---

## 2. Struktur Direktori Linux (Filesystem Hierarchy Standard / FHS)

Berbeda dengan Windows yang menggunakan pemisahan drive letter seperti `C:\` dan `D:\`, Linux menyatukan seluruh media penyimpanan dalam satu struktur pohon (*hierarchical tree*) yang bermuara pada satu titik akar tunggal bernama **Root Directory (`/`)**.

Berikut adalah direktori-direktori penting yang wajib dipahami oleh setiap analis keamanan:

| Direktori | Deskripsi & Fungsi Kritis | Relevansi Cybersecurity |
| :--- | :--- | :--- |
| `/` | Titik akar (*Root*) seluruh hierarki berkas. | Batas tertinggi izin sistem; penyerang menargetkan akses tulis di sini. |
| `/bin` & `/usr/bin` | Berisi file biner/eksekusi perintah esensial (`ls`, `cat`, `cp`, `ping`). | Target injeksi backdoor atau rootkit biner. |
| `/sbin` & `/usr/sbin` | Perintah administrasi sistem khusus root (`iptables`, `fdisk`, `reboot`). | Memerlukan eskalasi hak istimewa (*privilege escalation*). |
| `/etc` | Pusat file konfigurasi sistem dan layanan (`passwd`, `shadow`, `ssh/sshd_config`). | Target utama *credential harvesting* dan audit miskonfigurasi. |
| `/var/log` | Catatan aktivitas (*logs*) sistem dan aplikasi (`auth.log`, `syslog`, `nginx/access.log`). | Titik investigasi utama bagi Digital Forensics & Incident Response (DFIR). |
| `/home` | Direktori dokumen kerja untuk pengguna biasa (`/home/user/`). | Sering menjadi lokasi penyimpanan file SSH key pengguna (`~/.ssh/id_rsa`). |
| `/root` | Direktori *home* khusus untuk superuser (root). | Terlindungi secara ketat; tidak boleh sembarang diakses. |
| `/tmp` | Tempat penyimpanan file sementara (world-writable). | Sering dijadikan tempat pendaratan pertama payload malware oleh attacker. |
| `/proc` & `/sys` | Virtual filesystem yang memetakan status kernel dan proses aktif di RAM. | Sangat berguna untuk mendeteksi *hidden processes* dan injeksi memori. |

---

## 3. Praktikum Mandiri: Navigasi & Eksplorasi Terminal

Buka terminal lokal Anda (Linux native, WSL2 di Windows, atau macOS terminal) dan ikuti langkah praktikum berikut.

### Langkah 1: Periksa Identitas & Lokasi
```bash
# Siapakah user saya saat ini?
whoami

# Berada di direktori manakah saya saat ini?
pwd

# Periksa informasi kernel dan arsitektur mesin
uname -a
```

### Langkah 2: Eksplorasi Direktori dengan Parameter Flags
Perintah `ls` (list) memiliki berbagai parameter krusial:
```bash
# Menampilkan file standar
ls

# Menampilkan semua file termasuk file tersembunyi (hidden dotfiles)
ls -a

# Menampilkan informasi detail hak akses, kepemilikan, ukuran, dan tanggal
ls -la

# Menampilkan ukuran file dalam format yang mudah dibaca manusia (KB, MB)
ls -lh /var/log
```

### Langkah 3: Berpindah Direktori Secara Cepat
```bash
# Berpindah ke direktori /etc
cd /etc

# Naik satu tingkat ke direktori di atasnya
cd ..

# Kembali langsung ke direktori home Anda
cd ~

# Kembali ke direktori sebelumnya yang baru saja Anda kunjungi
cd -
```

---

## 4. Evaluasi Pemahaman (Kuis Singkat)

1. **Direktori manakah di sistem Linux yang menyimpan konfigurasi hash password akun pengguna yang hanya dapat dibaca oleh root?**
   - A. `/etc/passwd`
   - B. `/etc/shadow` *(Kunci Jawaban: B - `/etc/passwd` menyimpan informasi user, sedangkan hash rahasia diisolasi di `/etc/shadow`)*
   - C. `/var/log/auth`
   - D. `/root/keys`

2. **Mengapa folder `/tmp` sering digunakan oleh penyerang untuk mengunduh exploit script mereka?**
   - A. Karena `/tmp` dienkripsi secara otomatis
   - B. Karena `/tmp` memiliki permission *world-writable* (semua user dapat menulis file di sana) *(Kunci: B)*
   - C. Karena `/tmp` tidak dapat diaudit oleh antivirus
   - D. Karena file di `/tmp` berjalan otomatis saat reboot

---

## 5. Referensi Lanjutan
- [The Linux Foundation - Linux Training Catalog](https://training.linuxfoundation.org/)
- [Filesystem Hierarchy Standard (FHS) 3.0 Documentation](https://refspecs.linuxfoundation.org/FHS_3.0/fhs-3.0.html)
- [OverTheWire: Bandit (Praktik Wargame CLI Linux untuk Pemula)](https://overthewire.org/wargames/bandit/)
