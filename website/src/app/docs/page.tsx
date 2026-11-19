"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody, Badge, CodeBlock } from "@/components/ui";
import {
  FileText,
  BookOpen,
  Terminal,
  Code2,
  Shield,
  Layers,
  ChevronRight,
  GitBranch,
} from "lucide-react";

type DocSection = "getting-started" | "architecture" | "content-guide" | "tools-api" | "labs-guide" | "ethics";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>("getting-started");

  const menuItems: { id: DocSection; label: string; icon: React.ElementType }[] = [
    { id: "getting-started", label: "Memulai & Instalasi", icon: Terminal },
    { id: "architecture", label: "Arsitektur Repository", icon: Layers },
    { id: "content-guide", label: "Panduan Kontribusi Modul", icon: BookOpen },
    { id: "tools-api", label: "Pengembangan Tools", icon: Code2 },
    { id: "labs-guide", label: "Praktikum Lab & Progres", icon: GitBranch },
    { id: "ethics", label: "Prinsip Etika & Keamanan", icon: Shield },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider mb-1">
          <FileText className="w-3.5 h-3.5" />
          <span>Documentation &amp; Contributor Guide</span>
        </div>
        <h1 className="text-3xl font-mono font-bold text-[var(--color-text)]">
          Dokumentasi Teknis CyberLab-ID
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
          Panduan teknis arsitektur proyek, instalasi lingkungan pengembang, penulisan konten pembelajaran, dan standar rekayasa tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-1 font-mono text-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-3 mb-2">
            Daftar Dokumentasi
          </div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer ${
                activeSection === item.id
                  ? "bg-[var(--color-surface-elevated)] text-[var(--color-accent)] font-bold border border-[var(--color-border)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Section 1: Getting Started */}
          {activeSection === "getting-started" && (
            <div className="space-y-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <Card>
                <CardHeader>
                  <h2 className="text-base font-mono font-bold text-[var(--color-text)]">
                    Persiapan Lingkungan &amp; Menjalankan Website
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p>
                    CyberLab-ID dibangun menggunakan <strong>Next.js 16 (App Router)</strong>, <strong>TypeScript</strong>, dan <strong>Tailwind CSS v4</strong>. Proyek ini dioptimalkan sebagai static export atau serverless deployment dengan footprint memori sangat rendah.
                  </p>

                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)] pt-2">
                    Prasyarat Sistem:
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs font-mono">
                    <li>Node.js v18.x, v20.x, atau v24.x (LTS direkomendasikan)</li>
                    <li>npm v9.x atau v11.x</li>
                    <li>Git v2.30+</li>
                  </ul>

                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)] pt-2">
                    Langkah Instalasi Mandiri:
                  </h3>
                  <CodeBlock
                    language="bash"
                    code={`# 1. Clone repository
git clone https://github.com/cyberlab-id/cyberlab-id.git
cd cyberlab-id

# 2. Masuk ke direktori web
cd website

# 3. Install seluruh paket dependencies
npm install

# 4. Jalankan development server
npm run dev`}
                  />
                  <p className="text-xs text-[var(--color-text-muted)] font-mono">
                    Buka peramban di <code>http://localhost:3000</code>.
                  </p>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Section 2: Architecture */}
          {activeSection === "architecture" && (
            <div className="space-y-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <Card>
                <CardHeader>
                  <h2 className="text-base font-mono font-bold text-[var(--color-text)]">
                    Struktur Folder Repository
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p>
                    Repository CyberLab-ID memisahkan konten kurikulum berbasis Markdown dari implementasi antarmuka peramban untuk menjamin portabilitas konten jangka panjang:
                  </p>
                  <CodeBlock
                    language="plaintext"
                    code={`CyberLab-ID/
├── README.md               # Dokumentasi utama proyek
├── LICENSE                 # Lisensi MIT
├── CONTRIBUTING.md          # Panduan kontribusi komunitas
├── CODE_OF_CONDUCT.md      # Kode etik kontributor
├── SECURITY.md             # Kebijakan pelaporan kerentanan
├── content/                # Materi pembelajaran Markdown
│   ├── id/                 # Versi Bahasa Indonesia (Utama)
│   └── en/                 # Versi English (Alternatif)
├── challenges/             # Definisi skenario CTF & Labs (JSON)
│   ├── beginner/
│   ├── intermediate/
│   └── advanced/
├── website/                # Sumber kode aplikasi Next.js
│   ├── src/app/            # App Router pages (Home, Tools, Learning, dll)
│   ├── src/components/     # UI reusable components & Layouts
│   ├── src/lib/tools/      # Logika murni kalkulasi cybersecurity
│   └── src/lib/i18n.tsx    # Sistem bilingual (ID/EN)
└── .github/                # CI workflows & Issue templates`}
                  />
                </CardBody>
              </Card>
            </div>
          )}

          {/* Section 3: Content Guide */}
          {activeSection === "content-guide" && (
            <div className="space-y-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <Card>
                <CardHeader>
                  <h2 className="text-base font-mono font-bold text-[var(--color-text)]">
                    Standar Penulisan Modul Pembelajaran
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p>
                    Setiap modul diwajibkan menyertakan blok <strong>frontmatter</strong> standar dan membagi artikel menjadi 5 bagian:
                  </p>
                  <CodeBlock
                    language="markdown"
                    code={`---
title: "Nama Judul Modul"
module: "linux | networking | web-security | cryptography | forensics | reverse"
order: 1
difficulty: "beginner | intermediate | advanced"
objectives:
  - "Tujuan pembelajaran terukur 1"
  - "Tujuan pembelajaran terukur 2"
---

# 1. Konsep Dasar & Teori Intuitif
Jelaskan konsep dengan analogi jelas tanpa jargon berbelit-belit.

# 2. Anatomi / Cara Kerja Sistem
Gunakan tabel perbandingan, diagram alur, atau flow paket.

# 3. Praktikum Mandiri
Langkah-langkah perintah terminal yang dapat diuji pada sistem lokal.

# 4. Kuis Evaluasi Pemahaman
Pertanyaan refleksi pemahaman konsep.

# 5. Referensi Lanjutan (RFC, OWASP, NIST)`}
                  />
                </CardBody>
              </Card>
            </div>
          )}

          {/* Section 4: Tools API */}
          {activeSection === "tools-api" && (
            <div className="space-y-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <Card>
                <CardHeader>
                  <h2 className="text-base font-mono font-bold text-[var(--color-text)]">
                    Prinsip Arsitektur Security Tools
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p>
                    Tools di CyberLab-ID wajib mematuhi aturan ketat berikut:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-xs font-mono">
                    <li>
                      <strong>Pemisahan Logic &amp; UI:</strong> Fungsi murni algoritma ditempatkan di <code>website/src/lib/tools/</code>, sedangkan komponen presentasi di <code>website/src/app/tools/</code>.
                    </li>
                    <li>
                      <strong>Zero Server Transmission:</strong> Dilarang membuat endpoint API backend yang menerima password, file pengguna, atau hash. Semua eksekusi harus menggunakan <strong>Web Crypto API</strong> atau fungsi komputasi lokal.
                    </li>
                    <li>
                      <strong>Penanganan Error &amp; Validasi Input:</strong> Jangan biarkan aplikasi crash saat pengguna memasukkan input biner korup atau format IP salah.
                    </li>
                  </ul>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Section 5: Labs & Progress */}
          {activeSection === "labs-guide" && (
            <div className="space-y-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <Card>
                <CardHeader>
                  <h2 className="text-base font-mono font-bold text-[var(--color-text)]">
                    Standar Praktikum Lab &amp; Sistem Progres Local-First
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p>
                    CyberLab-ID menyediakan 6 laboratorium simulasi interaktif yang berjalan 100% pada lingkungan peramban pengguna tanpa ketergantungan server:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-accent)] font-bold">1. Linux Command Line Lab</span>
                      <p className="text-[var(--color-text-muted)] mt-1">Terminal emulasi interaktif (ls, cat, chmod, grep, bash).</p>
                    </div>
                    <div className="p-3 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-accent)] font-bold">2. Network Packet Sniffer</span>
                      <p className="text-[var(--color-text-muted)] mt-1">Inspeksi layer TCP/IP, filter protokol, &amp; unmasking credential HTTP.</p>
                    </div>
                    <div className="p-3 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-accent)] font-bold">3. Web Vulnerability Sandbox</span>
                      <p className="text-[var(--color-text-muted)] mt-1">Eksploitasi SQLi ' OR '1'='1 dan XSS payload dengan komparasi patch aman.</p>
                    </div>
                    <div className="p-3 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-accent)] font-bold">4. Multi-Stage Cryptography</span>
                      <p className="text-[var(--color-text-muted)] mt-1">Pipeline decoding Base64 + single-byte XOR key stream.</p>
                    </div>
                    <div className="p-3 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-accent)] font-bold">5. Corrupted Header Forensics</span>
                      <p className="text-[var(--color-text-muted)] mt-1">Rekonstruksi hex magic bytes PNG (89 50 4E 47) untuk memulihkan file.</p>
                    </div>
                    <div className="p-3 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
                      <span className="text-[var(--color-accent)] font-bold">6. x86 Reverse Engineering</span>
                      <p className="text-[var(--color-text-muted)] mt-1">Pelacakan register EAX/ZF dan patching instruksi lompatan bersyarat (JE -&gt; JNE/NOP).</p>
                    </div>
                  </div>
                  <div className="pt-2 text-xs font-mono text-[var(--color-text-muted)] leading-relaxed">
                    Sistem kemajuan dan lencana (Badges) dikelola oleh <code>src/lib/progress.ts</code> menggunakan penyimpanan lokal browser (<code>localStorage</code>) tanpa melacak data pribadi pengguna.
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Section 5: Ethics */}
          {activeSection === "ethics" && (
            <div className="space-y-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <Card>
                <CardHeader>
                  <h2 className="text-base font-mono font-bold text-[var(--color-text)]">
                    Prinsip Etika &amp; Hukum Cybersecurity
                  </h2>
                </CardHeader>
                <CardBody className="space-y-3">
                  <p>
                    CyberLab-ID berkomitmen teguh membangun komunitas pertahanan siber yang beretika:
                  </p>
                  <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] space-y-2 text-xs font-mono">
                    <div className="text-emerald-400 font-bold">
                      ✓ Target Otorisasi Saja:
                    </div>
                    <p className="text-slate-300">
                      Seluruh demonstrasi kerentanan dilakukan pada simulasi lokal (Localhost, Docker container terisolasi) atau sistem yang memiliki izin tertulis resmi.
                    </p>

                    <div className="text-rose-400 font-bold pt-2">
                      ✗ Dilarang Menyerang Infrastruktur Publik:
                    </div>
                    <p className="text-slate-300">
                      CyberLab-ID tidak menyediakan modul DoS/DDoS, ransomware, credential stealer, malware persistence berbahaya, atau alat otomatis perusak sistem.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
