---
title: "Encoding vs Encryption vs Hashing"
module: "cryptography"
order: 1
difficulty: "beginner"
objectives:
  - "Memahami perbedaan fundamental antara encoding, enkripsi, dan hashing"
  - "Mengenal use case dan risiko fatal akibat salah memilih teknik keamanan"
  - "Mempraktikkan pembuatan digest hash dan encoding Base64 di terminal"
  - "Mengidentifikasi output biner dan karakteristik tiap teknik"
---

# Encoding vs Encryption vs Hashing

Salah satu kesalahan paling fatal dan sering ditemui pada pengembang pemula dalam keamanan siber adalah menyamakan antara **Encoding**, **Enkripsi**, dan **Hashing**. Tidak sedikit aplikasi yang menyimpan password pengguna menggunakan format Base64 karena dikira sudah aman!

Mari kita bedah perbedaan ketiganya secara tuntas.

---

## 1. Perbandingan Cepat

| Kategori | Definisi Inti | Apakah Reversible (Bisa Dibalik)? | Membutuhkan Kunci Rahasia? | Tujuan Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Encoding** | Transformasi format data agar kompatibel dengan sistem transmisi. | **YA** (Sangat Mudah) | **TIDAK** (Algoritma Publik) | Kompatibilitas data biner ke teks |
| **Encryption** | Transformasi data rahasia menjadi ciphertext yang tidak terbaca tanpa kunci. | **YA** (Dengan Kunci yang Tepat) | **YA** (Kunci Simetris/Asimetris) | Menjaga Kerahasiaan (*Confidentiality*) |
| **Hashing** | Pemetaan data sembarang panjang menjadi string acak berpanjang tetap (*digest*). | **TIDAK** (Fungsi Satu Arah) | **TIDAK** (Fungsi Matematika Deterministik) | Menjaga Integritas (*Integrity*) & Auth Password |

---

## 2. Encoding: BUKAN Keamanan!

**Encoding** adalah proses mengubah format data agar data biner dapat dikirim dengan aman melalui media transmisi berbasis teks (misalnya email melalui SMTP, URL pada peramban, atau payload JSON) tanpa rusak oleh batasan karakter khusus.

- **Karakteristik:** Algoritma encoding bersifat publik, tidak ada rahasia, dan siapapun dapat mengembalikannya ke bentuk asli (*decode*) dalam hitungan milidetik.
- **Contoh Populer:**
  - **Base64:** Merepresentasikan data 8-bit menjadi karakter ASCII yang dapat dicetak (A-Z, a-z, 0-9, +, /, dan padding =).
  - **URL Encoding (Percent-encoding):** Mengubah spasi menjadi `%20` atau karakter khusus menjadi `%XX`.
  - **Hexadecimal (Base16):** Merepresentasikan byte sebagai pasangan karakter 0-9 dan A-F.

```bash
# Contoh Encoding Base64 di Linux:
echo -n "CyberLab-ID" | base64
# Output: Q3liZXJMYWItSUQ=

# Siapapun dapat melakukan decode secara instan tanpa password:
echo -n "Q3liZXJMYWItSUQ=" | base64 -d
# Output: CyberLab-ID
```

> **Aturan Keamanan:** Jangan pernah menggunakan Base64, Hex, atau ROT13 untuk menyembunyikan password, token API, atau data rahasia!

---

## 3. Encryption (Enkripsi): Perlindungan Kerahasiaan

**Enkripsi** adalah proses matematis mengubah data yang dapat dibaca (*plaintext*) menjadi data acak yang tidak dapat dimengerti (*ciphertext*) menggunakan sebuah **Kunci Rahasia (*Key*)**. Data hanya bisa dikembalikan ke bentuk semula jika pemilik memiliki kunci dekripsi yang valid.

### Klasifikasi Enkripsi:
1. **Symmetric Encryption (Kunci Simetris):**
   - Menggunakan satu kunci yang sama untuk mengenkripsi dan mendekripsi.
   - Sangat cepat dan efisien untuk data bervolume besar.
   - Contoh: **AES-256** (Advanced Encryption Standard), ChaCha20.
2. **Asymmetric Encryption (Kunci Asimetris / Kriptografi Kunci Publik):**
   - Menggunakan sepasang kunci: **Public Key** (disebarkan bebas untuk enkripsi) dan **Private Key** (disimpan rahasia untuk dekripsi).
   - Menghilangkan masalah pertukaran kunci rahasia (*Key Distribution Problem*).
   - Contoh: **RSA**, ECC (Elliptic Curve Cryptography).

```bash
# Contoh Enkripsi file menggunakan OpenSSL (AES-256-CBC):
openssl enc -aes-256-cbc -salt -in rahasia.txt -out rahasia.enc

# Mendekripsi kembali membutuhkan kata sandi:
openssl enc -d -aes-256-cbc -in rahasia.enc -out didekripsi.txt
```

---

## 4. Hashing: Verifikasi Integritas & Sidik Jari Digital

**Fungsi Hash Kriptografi** adalah algoritma matematis satu arah (*one-way mathematical function*) yang memetakan data dengan ukuran berapa pun menjadi string berukuran tetap (*hash digest*).

### 4 Sifat Wajib Fungsi Hash Kriptografi:
1. **Deterministik:** Input yang sama akan selalu menghasilkan hash digest yang persis sama.
2. **One-Way (Pre-image Resistance):** Sangat mustahil menghitung balik data awal dari nilai hash yang diketahui.
3. **Avalanche Effect:** Mengubah satu koma atau satu huruf saja akan mengubah lebih dari 50% karakter hash secara drastis.
4. **Collision Resistance:** Secara komputasi mustahil menemukan dua input berbeda ($A \neq B$) yang menghasilkan nilai hash yang sama ($H(A) = H(B)$).

```bash
# Uji efek longsoran (Avalanche Effect) pada SHA-256:
echo -n "password123" | sha256sum
# ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f

echo -n "password124" | sha256sum  # Hanya beda 1 angka terakhir!
# b2b8e390c9b0c2669e984f18b3236e84be49f4817a02db66ff051786c52bb882
```

---

## 5. Ringkasan Kasus Nyata

- **Kasus 1: Mengirim gambar avatar melalui payload JSON** $\rightarrow$ Gunakan **Encoding (Base64)**.
- **Kasus 2: Mengamankan kartu kredit di database e-commerce** $\rightarrow$ Gunakan **Enkripsi (AES-256-GCM)**.
- **Kasus 3: Memastikan file installer ISO Linux tidak disisipi malware** $\rightarrow$ Gunakan **Hashing (SHA-256 Checksum)**.
- **Kasus 4: Menyimpan password login pengguna di database** $\rightarrow$ Gunakan **Salted Slow Hashing (Bcrypt / Argon2id)**, bukan enkripsi dua arah!

---

## 6. Referensi Lanjutan
- [NIST Special Publication 800-175B: Guideline for Using Cryptographic Standards in the Federal Government](https://csrc.nist.gov/)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [CryptoPals Cryptography Challenges](https://cryptopals.com/)
