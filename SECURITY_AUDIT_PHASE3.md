# CYBERLAB-ID — PHASE 3 SECURITY AUDIT & THREAT MODEL REPORT
## Standar Keamanan Aplikasi, Manajemen Identitas & Proteksi Flag CTF

Dokumen ini disusun sebagai bagian dari proses audit keamanan menyeluruh (*Security Review & Hardening*) untuk rilis Fase 3 platform pembelajaran **CyberLab-ID**.

---

## 1. IKHTISAR POSTUR KEAMANAN

| Parameter Keamanan | Implementasi di CyberLab-ID | Standar Industri / Rekomendasi | Status |
| :--- | :--- | :--- | :---: |
| **Password Hashing** | PBKDF2 (HMAC-SHA512), 100.000 iterasi, 16-byte cryptographically secure random salt unik per user | NIST SP 800-63B / OWASP Password Storage Cheat Sheet | **KOMPLIAN** |
| **Password Comparison** | `crypto.timingSafeEqual` (pencegahan serangan *Timing Attack*) | Constant-time execution | **KOMPLIAN** |
| **Session Management** | Random 32-byte (256-bit) cryptographically strong token, disimpan di HTTP-only, SameSite=Lax cookie, masa berlaku 14 hari | OWASP Session Management Cheat Sheet | **KOMPLIAN** |
| **SQL Injection (SQLi)** | 100% Prepared Statements berparameter pada engine SQLite (`node:sqlite`). Nol penggunaan string concatenation query | OWASP Top 10 A03:2021-Injection | **KOMPLIAN** |
| **CTF Flag Protection** | Flag rahasia **TIDAK PERNAH** dikirimkan ke frontend bundle maupun respons API publik. Disimpan dalam bentuk hash SHA-256 satu arah di server dan dicocokkan secara constant-time | CTF Competition Infrastructure Standard | **KOMPLIAN** |
| **Brute-Force Defense** | In-memory sliding window rate limiter pada endpoint autentikasi (`/api/auth/*`) dan submission flag (`/api/ctf/submit`) | OWASP Automated Threats (OAT-007) | **KOMPLIAN** |
| **Access Control (RBAC)** | Validasi peran sisi server (`requireAuth`, `requireAdmin`) sebelum eksekusi mutasi atau akses data administratif | OWASP A01:2021-Broken Access Control | **KOMPLIAN** |
| **Cross-Site Scripting (XSS)** | Sanitasi input karakter pada judul/konten, escaping bawaan React JSX, larangan penggunaan `dangerouslySetInnerHTML` pada input pengguna | OWASP A03:2021-XSS Prevention | **KOMPLIAN** |

---

## 2. ANALISIS VULNERABILITAS & REMEDIASI SPESIFIK

### A. Broken Access Control (OWASP A01:2021)
- **Risiko Potensial:** Pengguna biasa mengakses fungsi admin atau mengedit/menghapus postingan pengguna lain dengan mengubah parameter ID di peramban.
- **Mitigasi:**
  - Fungsi `requireAdmin(request)` memeriksa session token langsung ke tabel `users` dan memverifikasi `role === 'admin'`. Jika bukan admin, server langsung merespons dengan HTTP status 403 Forbidden.
  - Pada endpoint modifikasi diskusi (`PATCH /api/community/posts/[id]` & `DELETE`), server mencocokkan `post.user_id === user.id || user.role === 'admin'`. Input ID pengguna dari sisi klien tidak dipercaya.

### B. Proteksi Flag CTF (Zero Client-Side Disclosure)
- **Kelemahan Fase 1:** Pada prototipe awal Fase 1, array `CHALLENGES_DATA` memuat flag dalam kode frontend JavaScript. Pengguna dapat membaca flag melalui fitur "Inspect Element" atau memeriksa memori React state.
- **Remediasi Fase 3:**
  - Seluruh flag telah dipindahkan ke database server (`ctf_challenges`).
  - Query publik pada `/api/ctf/challenges` secara eksplisit **mengecualikan kolom `flag_hash`**:
    ```sql
    SELECT id, title, description, category, difficulty, points, hint, instructions, attachment_url, solves_count
    FROM ctf_challenges WHERE is_published = 1;
    ```
  - Verifikasi dilakukan murni di server (`/api/ctf/submit`) menggunakan komparasi hash `timingSafeEqual`.
  - Poin XP dihitung dan dikreditkan langsung ke tabel `users` oleh server, mencegah manipulasi skor dari sisi peramban.

### C. Pencegahan Double-Dipping & Manipulasi XP
- **Risiko Potensial:** Pengguna mengirimkan ulang flag yang sama berulang kali untuk menggandakan skor XP secara curang.
- **Mitigasi:**
  - Tabel `ctf_solves` memiliki constraint `UNIQUE(user_id, challenge_id)`.
  - Sebelum memproses submission, server mengecek keberadaan entri solusi sebelumnya:
    ```sql
    SELECT id FROM ctf_solves WHERE user_id = ? AND challenge_id = ?;
    ```
  - Jika sudah diselesaikan, server menolak permintaan dan mengembalikan pesan bahwa tantangan telah diselesaikan sebelumnya.

### D. Rate Limiting pada Endpoint Sensitif
- **Implementasi:** Modul `rate-limit.ts` membatasi:
  - Registrasi: Maksimal 5 permintaan / menit per IP.
  - Login: Maksimal 5 percobaan gagal / menit per IP (mencegah *credential stuffing*).
  - CTF Flag Submission: Maksimal 10 percobaan / menit per user (mencegah otomasi kamus brute-force flag).
- Ketika limit terlampaui, server merespons dengan HTTP status 429 Too Many Requests.

---

## 3. AUDIT TRAIL & LOG KEAMANAN
Setiap aktivitas sensitif dicatat ke tabel `audit_logs` dengan kolom:
- `actor_id`: ID pengguna yang melakukan aksi
- `action`: Jenis tindakan (LOGIN, UPDATE_USER, CREATE_CHALLENGE, MODERATE_DELETE_POST, CTF_SOLVED, CTF_INCORRECT)
- `target_type`: Objek yang dipengaruhi (user, ctf_challenge, community_post)
- `target_id`: ID objek
- `details`: Keterangan teknis dan konteks audit
- `created_at`: Stempel waktu ISO 8601

Log ini dapat ditinjau langsung oleh tim pengelola platform melalui panel **Admin Dashboard > Audit Trail**.
