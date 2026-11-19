---
title: "Networking Fundamentals & Topologi Jaringan"
module: "networking"
order: 1
difficulty: "beginner"
objectives:
  - "Memahami arsitektur komunikasi data dan terminologi dasar jaringan komputer"
  - "Membedakan klasifikasi jaringan (LAN, MAN, WAN, Internet)"
  - "Menganalisis karakteristik dan kelemahan topologi jaringan fisik"
  - "Menguasai perangkat keras jaringan (Switch, Router, Firewall)"
  - "Mengoperasikan utilitas diagnosis jaringan (ping, traceroute, netstat/ss)"
---

# Networking Fundamentals & Topologi Jaringan

Keamanan siber (*Cybersecurity*) berakar kuat pada jaringan komputer (*Computer Networking*). Hampir setiap serangan peretasan terjadi melalui jaringan. Tanpa pemahaman mendalam tentang bagaimana paket berpindah dari pengirim ke penerima, seorang analis tidak akan mampu mendeteksi intrusi, menganalisis paket anomali, atau mengkonfigurasi arsitektur pertahanan yang kokoh.

---

## 1. Apa itu Jaringan Komputer?

Jaringan komputer adalah kumpulan node (komputer, server, smartphone, router, saklar jaringan) yang saling terhubung menggunakan media transmisi kabel (tembaga/fiber optik) atau nirkabel (gelombang radio Wi-Fi) untuk berbagi sumber daya, data, dan layanan.

### Klasifikasi Jaringan Berdasarkan Cakupan Geografis:
1. **PAN (Personal Area Network):** Jangkauan sangat dekat (beberapa meter), seperti koneksi Bluetooth antar perangkat pribadi.
2. **LAN (Local Area Network):** Jangkauan lokal terbatas (ruangan, kantor, gedung, sekolah/kampus). Kecepatan tinggi dengan latensi sangat rendah.
3. **MAN (Metropolitan Area Network):** Menghubungkan beberapa LAN dalam satu wilayah perkotaan (misal jaringan antarkantor instansi pemerintah daerah).
4. **WAN (Wide Area Network):** Cakupan geografis luas lintas pulau, negara, dan benua. Contoh WAN publik terbesar di dunia adalah **Internet**.

---

## 2. Topologi Jaringan & Analisis Kerentanan

Topologi mendefinisikan struktur fisik maupun logika bagaimana perangkat-perangkat saling terhubung.

### A. Topologi Star (Bintang) - Standar Modern
Semua node terhubung secara independen ke satu konsentrator pusat (Switch).
- **Kelebihan:** Jika satu kabel putus, hanya komputer tersebut yang terisolasi; jaringan lain tetap berjalan normal.
- **Kerentanan Cybersecurity:** Titik kegagalan tunggal (*Single Point of Failure*) berada pada Switch pusat. Jika penyerang berhasil melumpuhkan Switch dengan *MAC Flooding* atau *DHCP Starvation*, seluruh jaringan kantor bisa terganggu.

### B. Topologi Ring (Cincin)
Setiap komputer terhubung ke dua komputer tetangga membentuk lingkaran tertutup. Paket token berputar searah.
- **Kelemahan:** Jika satu kabel atau node mati, seluruh sirkuit jaringan runtuh. Sangat rentan terhadap serangan fisik pemutusan kabel.

### C. Topologi Mesh (Jala)
Setiap node memiliki jalur langsung ke setiap node lainnya (Full Mesh) atau beberapa node (Partial Mesh).
- **Kelebihan:** Redundansi data dan ketahanan tertinggi (*Fault Tolerance*). Sering digunakan pada infrastruktur data center militer dan backbone ISP.
- **Kekurangan:** Biaya perkabelan sangat mahal dan konfigurasi routing sangat kompleks.

---

## 3. Perangkat Jaringan: Hub vs Switch vs Router

Seringkali pemula menganggap ketiga perangkat ini sama, padahal fungsinya sangat berbeda pada layer OSI:

| Perangkat | Layer OSI | Cara Mengirimkan Paket | Implikasi Keamanan |
| :--- | :--- | :--- | :--- |
| **Hub** | Layer 1 (Physical) | *Broadcast* membabi buta ke semua port. | **Sangat Buruk.** Setiap komputer dapat membaca paket milik komputer lain (*Eavesdropping* pasif). Hub sudah usang dan dilarang di lingkungan modern. |
| **Switch** | Layer 2 (Data Link) | *Unicast* selektif berdasarkan **MAC Address** tabel forwarding. | Aman dari sniffing pasif biasa. Namun masih rentan terhadap **ARP Spoofing / Poisoning** jika tidak mengaktifkan fitur *Dynamic ARP Inspection (DAI)*. |
| **Router** | Layer 3 (Network) | Meneruskan paket antar jaringan berbeda berdasarkan **IP Address**. | Mengatur batasan subnet, NAT, dan bertindak sebagai garis pertahanan pertama dengan Access Control Lists (ACL). |

---

## 4. Praktikum: Utilitas Diagnosa Jaringan Dasar

Uji konektivitas jaringan Anda melalui perintah-perintah berikut di terminal:

```bash
# 1. Menguji respons dan latensi ke host target (menggunakan protokol ICMP)
ping -c 4 1.1.1.1

# 2. Melacak jalur lompatan router (hops) dari mesin Anda ke server tujuan
# Di Linux:
traceroute google.com
# Di Windows:
tracert google.com

# 3. Menampilkan daftar soket dan port yang sedang terbuka (listening ports) di komputer lokal
# Periksa apakah ada program mencurigakan yang membuka port:
ss -tulpn
# atau:
netstat -tuln
```

---

## 5. Referensi Lanjutan
- [RFC 791 - Internet Protocol Specification](https://datatracker.ietf.org/doc/html/rfc791)
- [Cisco Networking Academy - Network Basics](https://www.netacad.com/)
- [Wireshark Official Documentation & Sample Packet Captures](https://wiki.wireshark.org/SampleCaptures)
