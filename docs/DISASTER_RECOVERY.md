# CyberLab-ID — Disaster Recovery & Incident Response Runbook

> **Target Audience:** DevOps Engineers, Platform Administrators, On-Call Responders  
> **Recovery Time Objective (RTO):** < 15 Menit  
> **Recovery Point Objective (RPO):** < 24 Jam (sesuai siklus backup otomatis harian)

---

## 1. Prosedur Pemulihan Basis Data (Database Recovery)

Jika terjadi kerusakan data (data corruption), kegagalan disk, atau insiden keamanan:

### Langkah 1: Hentikan Sesi Aktif
```bash
# Hentikan kontainer aplikasi untuk mencegah penulisan data baru
docker-compose -f deploy/docker/docker-compose.prod.yml stop cyberlab-app
```

### Langkah 2: Identifikasi Snapshot Backup Terakhir
```bash
# Periksa daftar backup snapshot dan manifest integritasnya
ls -l backups/
```

### Langkah 3: Verifikasi Integritas Checksum SHA-256
```bash
# Jalankan skrip restore dengan menargetkan file backup yang dipilih
node scripts/restore.mjs backups/cyberlab_backup_<TIMESTAMP>.sqlite data/cyberlab.db
```

Output yang diharapkan:
```
[RESTORE SUCCESS] Database restored to: data/cyberlab.db
Verified user records count: N
```

### Langkah 4: Hidupkan Kembali Layanan & Verifikasi Health Check
```bash
docker-compose -f deploy/docker/docker-compose.prod.yml up -d
curl http://localhost:3000/api/health
```

---

## 2. Prosedur Rollback Aplikasi (Application Rollback)

Jika release versi baru mengalami kegagalan regresi kritis:

1. **Rollback Container Image ke Versi Stabil Sebelumnya:**
   ```bash
   docker pull cyberlab-id/web:2.4.0
   docker tag cyberlab-id/web:2.4.0 cyberlab-id/web:latest
   docker-compose -f deploy/docker/docker-compose.prod.yml up -d --force-recreate cyberlab-app
   ```
2. **Rollback Kubernetes Deployment:**
   ```bash
   kubectl rollout undo deployment/cyberlab-web -n cyberlab-prod
   kubectl rollout status deployment/cyberlab-web -n cyberlab-prod
   ```

---

## 3. Isolasi Darurat Cyber Range (Range Emergency Quarantine)

Jika terdeteksi upaya eksploitasi berbahaya atau aktivitas anomali dari kontainer lab:

```bash
# 1. Hentikan paksa seluruh sesi kontainer yang aktif
docker kill $(docker ps -q --filter "name=cyberlab-runner")

# 2. Sweep status database
sqlite3 data/cyberlab.db "UPDATE lab_sessions SET status = 'failed' WHERE status = 'running';"

# 3. Karantina jaringan dan restart daemon
systemctl restart docker
```
