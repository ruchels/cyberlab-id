# Panduan Kontribusi CyberLab-ID (Contribution Guide)

Selamat datang di komunitas **CyberLab-ID**! Kami menyambut kontribusi dari siapa saja — baik pelajar, mahasiswa, pengembang, pendidik, maupun praktisi cybersecurity.

> **Prinsip Utama:** CyberLab-ID adalah proyek open-source edukasi cybersecurity legal, etis, dan transparan. Semua materi, tools, dan lab didesain untuk sistem lokal yang memiliki otorisasi.

---

## 1. Cara Berkontribusi (Ways to Contribute)

Anda dapat berkontribusi dalam berbagai bentuk:
1. **Materi Pembelajaran (Content):** Menulis atau memperbarui modul dalam Bahasa Indonesia dan English (`/content/id/` dan `/content/en/`).
2. **Cybersecurity Tools:** Mengembangkan atau meningkatkan tools analisis berbasis browser (`/website/src/lib/tools/`).
3. **Challenges & Labs:** Membuat skenario praktikum dan challenge CTF yang aman dan mendidik (`/challenges/`).
4. **Pengembangan Website:** Fitur UI/UX, optimasi performa, aksesibilitas, dan responsive design (`/website/`).
5. **Perbaikan Bug & Dokumentasi:** Memperbaiki typo, referensi usang, dan dokumentasi teknis.

---

## 2. Persiapan Lingkungan Pengembangan (Development Setup)

### Prasyarat
- Node.js 18.x atau lebih baru (direkomendasikan Node.js 20+)
- npm 9+
- Git

### Langkah Instalasi
```bash
# 1. Fork dan clone repository
git clone https://github.com/cyberlab-id/cyberlab-id.git
cd cyberlab-id

# 2. Masuk ke direktori website
cd website

# 3. Install dependencies
npm install

# 4. Jalankan development server
npm run dev
```
Buka `http://localhost:3000` di browser Anda.

---

## 3. Konvensi Kode & Standar Kualitas

- **Bahasa Pemrograman:** TypeScript (strict mode).
- **Styling:** Tailwind CSS v4 dengan CSS variables token (`globals.css`).
- **Komponen UI:** Reusable, clean, accessible (ARIA), client/server component dipisahkan dengan tepat.
- **Tools Logic:** Logika murni (pure functions) diisolasi di `src/lib/tools/`, terpisah dari komponen UI (`src/app/tools/`).
- **Privasi Tools:** Semua analisis file/hash/password harus berjalan 100% di browser tanpa mengirim data ke server.

---

## 4. Standar Konten Pembelajaran (MDX / Markdown)

Setiap materi pembelajaran wajib memiliki frontmatter terstruktur:
```markdown
---
title: "Judul Modul"
module: "kategori-modul"
order: 1
difficulty: "beginner | intermediate | advanced"
objectives:
  - "Tujuan pembelajaran 1"
  - "Tujuan pembelajaran 2"
---
```

Setiap modul harus mencakup:
- **Konsep Dasar:** Penjelasan intuitif tanpa jargon berlebihan.
- **Demonstrasi / Contoh:** Code snippet atau simulasi perintah terminal.
- **Praktikum Mandiri:** Langkah-langkah latihan yang dapat diuji lokal.
- **Kuis & Refleksi:** Pertanyaan pemahaman.
- **Mitigasi & Etika:** Penjelasan risiko dan cara pengamanan.

---

## 5. Alur Kerja Git & Pull Request (Git Workflow)

1. Buat branch baru dari `main` dengan penamaan terstruktur:
   - `feat/nama-fitur` (untuk fitur baru)
   - `content/nama-modul` (untuk materi/challenge)
   - `fix/deskripsi-bug` (untuk perbaikan bug)
   - `docs/perbaikan-dokumen` (untuk dokumentasi)

2. Gunakan format Conventional Commits:
   - `feat(tools): add rot13 and xor cipher toolkit`
   - `content(linux): add linux fundamentals practical guide`
   - `fix(subnet): correct usable host calculation for /31`
   - `docs: update setup prerequisites`

3. Pastikan build berhasil sebelum submit PR:
   ```bash
   cd website
   npm run build
   ```

4. Buka Pull Request dengan deskripsi yang jelas dan isi checklist yang disediakan.

---

## 6. Etika dan Keamanan

- **Dilarang keras** mempublikasikan payload malware berbahaya, skrip DDoS, credential stealer, atau exploit terhadap layanan publik.
- Semua demonstrasi kerentanan harus menggunakan simulasi lokal, Docker container terisolasi, atau dummy target.
- Laporkan setiap celah keamanan pada repository ini sesuai prosedur di [SECURITY.md](SECURITY.md).

Terima kasih atas kontribusi Anda membangun ekosistem cybersecurity Indonesia yang lebih kuat!
