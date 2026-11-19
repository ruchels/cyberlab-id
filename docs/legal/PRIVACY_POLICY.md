# Kebijakan Privasi (Privacy Policy) — CyberLab-ID

> **Status:** DRAFT (Memerlukan peninjauan hukum sebelum publikasi komersial)  
> **Terakhir Diperbarui:** 19 November 2026  
> **Versi:** 1.0.0

---

## 1. Pendahuluan
CyberLab-ID adalah proyek platform edukasi cybersecurity open-source Indonesia. Kebijakan ini menjelaskan bagaimana data pengguna dikumpulkan, disimpan, diproses, dan dilindungi saat mengakses situs web dan layanan laboratorium virtual kami.

## 2. Informasi yang Kami Kumpulkan
Kami menganut prinsip *Data Minimization* (pengumpulan data seminimal mungkin untuk fungsi esensial):
- **Informasi Akun:** Username, nama tampilan (display name), alamat email, dan ringkasan bio singkat.
- **Kredensial Autentikasi:** Password **tidak pernah** disimpan dalam bentuk teks biasa (plaintext). Password di-hash menggunakan algoritma PBKDF2 dengan salt unik acak kriptografis (10.000 iterasi).
- **Progres Pembelajaran & Gamifikasi:** Poin XP, lencana pencapaian (achievements), riwayat submit flag CTF, status modul belajar, dan sesi Cyber Range.
- **Konten Komunitas:** Topik diskusi, balasan komentar, dan reaksi yang Anda publikasikan di forum komunitas.
- **Log Keamanan (Audit Logs):** Alamat IP, User-Agent, riwayat login, dan timestamp aktivitas untuk tujuan pencegahan brute-force dan keamanan operasional.

## 3. Data yang TIDAK Kami Kumpulkan
- Kami tidak mengumpulkan nomor KTP, nomor telepon, atau data kependudukan pribadi.
- Kami tidak mengumpulkan informasi kartu kredit, rekening bank, atau data keuangan apa pun (platform ini 100% gratis).
- Alat analisis keamanan berbasis browser (Hash Inspector, Subnet Calculator, Cipher Toolkit) beroperasi 100% pada sisi klien (client-side) tanpa mentransmisikan data teks Anda ke server.

## 4. Cara Kami Menggunakan Informasi Anda
Informasi digunakan semata-mata untuk:
1. Mengotentikasi sesi Anda dan menjaga keamanan akun.
2. Menghitung peringkat leaderboard secara adil dan transparan.
3. Menyediakan sesi Cyber Range dan memverifikasi kelulusan praktikum.
4. Mendeteksi dan mencegah serangan siber, penyalahgunaan bot, dan peretasan akun.

## 5. Retensi Data & Hak Penghapusan Akun
- Pengguna berhak meminta ekspor data dan penghapusan akun secara permanen (Right to Erasure).
- Setelah akun dihapus, kredensial dan sesi akan dimusnahkan secara permanen dari basis data aktif. Log audit keamanan disimpan selama maksimal 90 hari untuk tujuan kepatuhan forensik dan pencegahan kejahatan digital.

## 6. Kontak Perlindungan Data
Jika Anda memiliki pertanyaan terkait privasi data, hubungi tim maintainer kami melalui email pengelola proyek: `security@cyberlab.id`.
