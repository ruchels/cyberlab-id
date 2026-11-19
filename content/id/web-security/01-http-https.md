---
title: "Protokol HTTP, HTTPS & Security Headers"
module: "web-security"
order: 1
difficulty: "beginner"
objectives:
  - "Memahami arsitektur protokol HTTP (HyperText Transfer Protocol) dan sifat stateless"
  - "Menganalisis anatomi HTTP Request dan Response (Methods, Status Codes, Headers)"
  - "Memahami mekanisme enkripsi TLS/SSL pada HTTPS"
  - "Mengimplementasikan HTTP Security Headers defensif (CSP, HSTS, X-Frame-Options)"
---

# Protokol HTTP, HTTPS & Security Headers

Website dan aplikasi web modern berkomunikasi menggunakan protokol **HTTP (Hypertext Transfer Protocol)**. Sebagai analis keamanan web (*penetration tester* maupun *defensive engineer*), menguasai cara kerja aliran paket HTTP adalah prasyarat mutlak sebelum mempelajari teknik eksploitasi seperti SQL Injection atau Cross-Site Scripting (XSS).

---

## 1. Anatomi HTTP: Request & Response

HTTP adalah protokol client-server berbasis teks. Klien (browser) mengirimkan **HTTP Request**, dan server merespons dengan **HTTP Response**.

### Contoh Raw HTTP Request:
```http
POST /api/v1/login HTTP/1.1
Host: target.cyberlab.id
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Content-Type: application/json
Content-Length: 48
Cookie: session_id=xyz789

{"username": "admin", "password": "SuperSecretPassword!"}
```

Bagian penting dari request:
1. **Method:** Tindakan yang diminta (`GET` mengambil data, `POST` mengirim data baru, `PUT` mengubah data, `DELETE` menghapus data, `OPTIONS` preflight CORS).
2. **Path & Protocol:** `/api/v1/login` dengan versi protokol `HTTP/1.1`.
3. **Headers:** Metadata konfigurasi (Host, User-Agent, Autentikasi, Cookies).
4. **Body:** Payload data aktual yang dikirimkan.

### Contoh Raw HTTP Response:
```http
HTTP/1.1 200 OK
Date: Wed, 19 Nov 2026 03:00:00 GMT
Server: nginx/1.24.0
Content-Type: application/json; charset=utf-8
Set-Cookie: auth_token=abc123; Secure; HttpOnly; SameSite=Strict
Content-Security-Policy: default-src 'self'

{"status": "success", "message": "Login berhasil"}
```

---

## 2. Mengapa HTTP Biasa Berbahaya? (Man-In-The-Middle / MITM)

Pada HTTP biasa (Port 80), seluruh lalu lintas dikirim dalam bentuk **Plaintext** tanpa enkripsi.

Jika Anda mengakses website HTTP di jaringan publik (misalnya Wi-Fi kafe atau kampus):
- Penyerang yang menjalankan alat packet sniffing (seperti Wireshark atau Bettercap) dapat membaca kredensial login, nomor kartu kredit, dan sesi cookie secara langsung.
- Penyerang dapat melakukan injeksi konten palsu (*Traffic Manipulation* / ARP Spoofing).

### Solusi: HTTPS (HTTP + TLS/SSL)
HTTPS (Port 443) membungkus aliran HTTP di dalam enkripsi **Transport Layer Security (TLS)**:
1. **Confidentiality:** Data terenkripsi; eavesdropper hanya melihat data acak tak bermakna.
2. **Integrity:** Paket tidak dapat dimodifikasi di tengah jalan tanpa merusak checksum kriptografi.
3. **Authentication:** Sertifikat digital X.509 dari Certificate Authority (CA) memvalidasi keaslian server tujuan.

---

## 3. Pertahanan Penting: HTTP Security Headers

Security headers adalah instruksi keamanan dari server kepada browser untuk mengaktifkan perlindungan bawaan terhadap berbagai serangan web populer:

### 1. `Strict-Transport-Security` (HSTS)
Memaksa peramban untuk HANYA berkomunikasi melalui protokol HTTPS, mencegah serangan SSL Stripping.
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 2. `Content-Security-Policy` (CSP)
Membatasi sumber daya (skrip JavaScript, gambar, iframe) yang boleh dimuat dan dieksekusi oleh peramban. Ini adalah benteng pertahanan utama untuk meredam serangan **Cross-Site Scripting (XSS)**.
```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com;
```

### 3. `X-Frame-Options`
Mencegah halaman web Anda disematkan ke dalam tag `<iframe />` di situs lain untuk menangkal serangan **Clickjacking**.
```http
X-Frame-Options: DENY
```

### 4. `X-Content-Type-Options`
Mencegah browser melakukan MIME-sniffing terhadap file unduhan yang berpotensi mengeksekusi script terselubung.
```http
X-Content-Type-Options: nosniff
```

---

## 4. Keamanan Cookie: `HttpOnly`, `Secure`, dan `SameSite`

Saat server menyetel sesi cookie login melalui header `Set-Cookie`, tiga atribut berikut wajib dipasang:
- **`HttpOnly`:** Mencegah JavaScript browser membaca cookie (`document.cookie`), sehingga token sesi tidak dapat dicuri saat terjadi celah XSS.
- **`Secure`:** Memastikan cookie hanya dikirimkan melalui koneksi terenkripsi HTTPS.
- **`SameSite=Strict` / `Lax`:** Melindungi pengguna dari serangan **Cross-Site Request Forgery (CSRF)** dengan membatasi pengiriman cookie dari domain pihak ketiga.

---

## 5. Referensi Lanjutan
- [Mozilla Developer Network (MDN) - HTTP Headers Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [SecurityHeaders.com (Tool Audit Online)](https://securityheaders.com/)
