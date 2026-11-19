# Kebijakan Pengungkapan Bertanggung Jawab (Responsible Disclosure Policy)

> **Status:** Pedoman Pelaporan Kerentanan Keamanan pada Platform CyberLab-ID

---

## 1. Komitmen Keamanan
Sebagai platform edukasi keamanan siber, CyberLab-ID berkomitmen menjaga standar keamanan aplikasi dan infrastruktur kami pada tingkat tertinggi. Kami menyambut kontribusi dari para peneliti keamanan dan komunitas untuk melaporkan celah keamanan secara bertanggung jawab.

## 2. Ruang Lingkup (Scope)
Target yang masuk dalam cakupan program pengungkapan kerentanan:
- Aplikasi web utama: `https://cyberlab.id`
- REST API: `https://cyberlab.id/api/*`
- Infrastruktur orkestrasi Cyber Range dan terminal runner
- Repositori kode sumber resmi di GitHub

### Di Luar Cakupan (Out of Scope):
- Celah kerentanan sengaja pada kontainer target lab praktikum (karena memang dirancang rentan untuk pembelajaran).
- Serangan Denial of Service (DoS / DDoS) terhadap infrastruktur.
- Serangan Social Engineering atau Phishing terhadap staf pengelola platform.

## 3. Tata Cara Pelaporan
Jika Anda menemukan kerentanan keamanan:
1. Kirimkan laporan terperinci ke email keamanan: `security@cyberlab.id`.
2. Sertakan langkah reproduksi langkah-demi-langkah (Proof of Concept), dampak potensial, dan rekomendasi mitigasi.
3. Berikan waktu minimal **30 hari** bagi tim pengembang untuk mereview, memvalidasi, dan merilis patch perbaikan sebelum mempublikasikan temuan ke publik (Coordinated Vulnerability Disclosure).

## 4. Perlindungan Safe Harbor
Kami berkomitmen tidak akan mengambil tindakan hukum terhadap peneliti keamanan yang bertindak dengan itikad baik (Good Faith), tidak merusak atau mengekspos data pribadi pengguna lain, dan mematuhi pedoman responsible disclosure ini.
