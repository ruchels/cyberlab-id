"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import {
  Shield,
  Heart,
  Users,
  Target,
  Sparkles,
  GitFork,
  CheckCircle2,
  FileCode2,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent)]">
          <Shield className="w-3.5 h-3.5" />
          <span>Tentang Proyek Inisiatif</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold text-[var(--color-text)]">
          Membangun Fondasi Talenta Digital &amp; Pertahanan Siber Indonesia
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
          CyberLab-ID adalah ekosistem pembelajaran open-source non-profit yang menggabungkan materi kurikulum terstruktur, perkakas analisis lokal, dan tantangan praktikum berbasis web.
        </p>
      </div>

      {/* Identity & Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-base font-mono font-bold text-[var(--color-text)] flex items-center gap-2">
              <Target className="w-4 h-4 text-[var(--color-accent)]" />
              Misi Kami
            </h3>
          </CardHeader>
          <CardBody className="space-y-3 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              Menyediakan kurikulum keamanan siber berbahasa Indonesia yang komprehensif, berbasis fakta teknik, dan mudah diakses oleh siapa saja tanpa hambatan biaya atau infrastruktur komputasi yang mahal.
            </p>
            <p>
              Kami ingin menghilangkan mitos bahwa cybersecurity adalah aktivitas mistis &quot;hacker bertudung hitam&quot;. Cybersecurity adalah ilmu sains komputer terapan yang berpijak pada pemahaman sistem, protokol, dan kode perangkat lunak.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-mono font-bold text-[var(--color-text)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--color-accent)]" />
              Target Pengguna
            </h3>
          </CardHeader>
          <CardBody className="space-y-2 text-xs font-mono text-[var(--color-text-secondary)]">
            {[
              "Pelajar SMK jurusan Teknik Komputer Jaringan (TKJ) & Rekayasa Perangkat Lunak (RPL)",
              "Mahasiswa Teknologi Informasi dan Ilmu Komputer",
              "Pengembang perangkat lunak yang ingin memahami aspek keamanan aplikasi",
              "Peserta kompetisi Capture The Flag (CTF) tingkat pemula hingga menengah",
              "Komunitas riset dan praktisi keamanan digital Indonesia",
            ].map((tgt, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{tgt}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Why Indonesian Language */}
      <Card>
        <CardHeader>
          <h3 className="text-base font-mono font-bold text-[var(--color-text)]">
            Mengapa Bahasa Indonesia Menjadi Bahasa Utama?
          </h3>
        </CardHeader>
        <CardBody className="space-y-3 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <p>
            Mayoritas literatur keamanan siber berkualitas tinggi ditulis dalam Bahasa Inggris. Kesenjangan bahasa seringkali menjadi hambatan pertama bagi siswa SMK dan mahasiswa di berbagai daerah di Indonesia untuk memahami konsep mendalam seperti perizinan berkas Linux, alokasi memori, atau kriptografi kunci publik.
          </p>
          <p>
            CyberLab-ID menerjemahkan dan mengemas konsep-konsep rumit ini ke dalam Bahasa Indonesia yang baku, akurat secara teknis, dan dilengkapi padanan istilah internasional agar pembelajar siap bersaing di kancah global.
          </p>
        </CardBody>
      </Card>

      {/* Ethics & Security Notice */}
      <div id="ethics" className="p-6 rounded-lg border border-emerald-800/80 bg-emerald-950/20 space-y-3 text-xs text-[var(--color-text-secondary)]">
        <h3 className="text-sm font-mono font-bold text-emerald-300 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Komitmen Etika &amp; Hukum Siber (White-Hat Ethics)
        </h3>
        <p className="leading-relaxed">
          Semua materi, demonstrasi kerentanan, dan tantangan yang dipublikasikan di CyberLab-ID dirancang eksklusif untuk tujuan edukasi defensif (*defensive security*). Praktikum ditargetkan pada sistem lokal virtual atau simulasi aman.
        </p>
        <p className="leading-relaxed">
          Kami menolak dan melarang keras penyalahgunaan pengetahuan ini untuk menyerang, merusak, atau menyusup ke sistem komputer publik tanpa izin tertulis dari pemilik sistem yang bersangkutan (melanggar UU ITE dan regulasi hukum terkait).
        </p>
      </div>

      {/* Contributing & Community */}
      <div id="contribute" className="text-center space-y-4 pt-4 border-t border-[var(--color-border)]">
        <h3 className="text-xl font-mono font-bold text-[var(--color-text)]">
          Mari Berkontribusi Membangun CyberLab-ID
        </h3>
        <p className="text-xs text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
          CyberLab-ID adalah proyek open-source sejati di bawah naungan Lisensi MIT. Anda dapat berkontribusi menulis modul materi, menambahkan tool analisis baru, atau menerjemahkan konten.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a
            href="https://github.com/cyberlab-id/cyberlab-id"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-bold bg-[var(--color-accent)] text-[#05080e] hover:bg-emerald-400 transition-colors"
          >
            <GitFork className="w-3.5 h-3.5" />
            Fork di GitHub
          </a>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-bold bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Baca Panduan Kontribusi
          </Link>
        </div>
      </div>
    </div>
  );
}
