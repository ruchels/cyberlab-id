# Daftar Periksa Rilis Produksi (Production Release Checklist)

Sebelum merilis versi baru ke lingkungan produksi publik, seluruh butir di bawah wajib diverifikasi:

### A. Keamanan & Konfigurasi Lingkungan
- [ ] File `.env.production` terpasang dengan `SESSION_SECRET` unik minimal 64 karakter heksadesimal acak.
- [ ] Nilai rahasia tidak pernah di-commit ke Git (`git status` bersih, file `.env*` masuk `.gitignore`).
- [ ] Sertifikat SSL/TLS valid terpasang pada Nginx / Ingress dengan rating minimal SSL Labs "A".
- [ ] HTTP Security Headers (HSTS, CSP strict, X-Frame-Options: DENY, X-Content-Type-Options: nosniff) aktif.
- [ ] Port basis data dan internal Docker daemon tidak terekspos ke internet publik.

### B. Kualitas Kode & Pengujian Otomatis
- [ ] Seluruh test suite lolos 100%:
  - `node test_tools.mjs` (29/29 PASS)
  - `node test_phase3.mjs` (12/12 PASS)
  - `node test_phase4.mjs` (21/21 PASS)
  - `node test_phase5.mjs` (18/18 PASS)
  - `node scripts/test_backup_restore.mjs` (14/14 PASS)
- [ ] Static type check `npx tsc --noEmit` bersih tanpa error TypeScript.
- [ ] Next.js production build (`npm run build`) sukses menghasilkan bundle standalone.

### C. Basis Data & Integritas
- [ ] Index performa telah terpasang pada tabel-tabel utama (`sessions`, `users`, `ctf_solves`, `lab_sessions`).
- [ ] Snapshot backup pra-deployment telah dieksekusi dan disimpan secara aman.
- [ ] Skrip pemulihan darurat (`scripts/restore.mjs`) telah diverifikasi.

### D. Cyber Range & Sandbox
- [ ] Proteksi isolasi egress IMDS cloud (`169.254.169.254`) aktif dan teruji.
- [ ] Batas konkurensi (1 lab aktif per pengguna) berfungsi.
- [ ] Daemon sweeper sesi kedaluwarsa berjalan normal.

### E. Observabilitas & Pasca-Rilis
- [ ] Endpoint `/api/health` mengembalikan status HTTP 200 dengan nilai `"status": "healthy"`.
- [ ] Tab Production Readiness pada `/admin` menampilkan seluruh status hijau.
- [ ] Jalur rollback telah dipersiapkan dan diuji coba.
