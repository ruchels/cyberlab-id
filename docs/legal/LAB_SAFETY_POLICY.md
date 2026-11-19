# Kebijakan Keselamatan Laboratorium Virtual (Cyber Range Safety Policy)

> **Status:** Pedoman Teknis Isolasi, Eksekusi Aman, dan Batas Operasional Praktikum

---

## 1. Arsitektur Pertahanan Berlapis (Defense-in-Depth)
Setiap sesi laboratorium Cyber Range pada CyberLab-ID dirancang dengan prinsip isolasi mutlak:
1. **Container Sandboxing:** Praktikum dijalankan dalam kontainer OCI dengan root filesystem read-only dan `cap-drop ALL`.
2. **Egress Isolation:** Kontainer tidak memiliki rute keluar ke internet publik dan diblokir dari mengakses IP metadata cloud (`169.254.169.254`).
3. **Embedded Fallback Safe Runner:** Pada lingkungan pengembangan tanpa Docker, terminal dieksekusi melalui simulator state machine di memori tanpa pernah menjalankan arbitrary binary pada mesin host.
4. **Alokasi Sumber Daya Terikat:** Setiap sesi dibatasi maksimal 0.5 CPU core, 256MB - 512MB RAM, dan batas waktu 45 - 90 menit.

## 2. Penghapusan dan Pembersihan Otomatis
- Setiap sesi memiliki *Time-To-Live (TTL)* yang ketat.
- Daemon janitor secara otomatis mematikan dan membersihkan sesi yang telah kedaluwarsa atau dihentikan pengguna.
- Tidak ada data persisten yang ditinggalkan di dalam kontainer sandbox setelah sesi berakhir.

## 3. Tanggung Jawab Siswa & Praktikan
- Siswa diharapkan fokus pada tujuan pembelajaran analitis yang tertera pada panduan setiap modul.
- Hindari percobaan membuat loop tak terhingga (fork bombs) atau flooding memori yang bertujuan menguji batas stabilitas infrastruktur bersama.
