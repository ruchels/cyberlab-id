"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, CardFooter, Badge, Button, Input } from "@/components/ui";
import {
  Wrench,
  Hash,
  Network,
  KeyRound,
  Binary,
  Camera,
  Lock,
  ArrowRight,
  Shield,
  Search,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface ToolItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  category: "Cryptography" | "Networking" | "Forensics" | "Defensive";
  description: string;
  features: string[];
}

const TOOLS_LIST: ToolItem[] = [
  {
    id: "hash-inspector",
    name: "Hash Inspector",
    href: "/tools/hash-inspector",
    icon: Hash,
    category: "Cryptography",
    description:
      "Hitung digest kriptografi MD5, SHA-1, SHA-256, dan SHA-512 secara instan. Bandingkan dua hash untuk memverifikasi integritas file.",
    features: ["MD5, SHA-1, SHA-256, SHA-512", "Hash Text & File", "Integritas Checksum Matcher"],
  },
  {
    id: "subnet-calculator",
    name: "Subnet Calculator",
    href: "/tools/subnet-calculator",
    icon: Network,
    category: "Networking",
    description:
      "Kalkulator presisi IPv4 & CIDR (/0 s.d /32). Menghitung network address, broadcast address, rentang host usable, dan bitmask biner.",
    features: ["Prefix CIDR & Subnet Mask", "Rentang Usable Host", "Visualisasi 32-bit Biner"],
  },
  {
    id: "cipher-toolkit",
    name: "Cipher Toolkit",
    href: "/tools/cipher-toolkit",
    icon: KeyRound,
    category: "Cryptography",
    description:
      "Toolkit pemecah cipher klasik & encoding. Dilengkapi Caesar Cipher (dengan CTF Brute-Force), ROT13, XOR bitwise, Base64, dan Vigenère.",
    features: ["Caesar & Brute Force Matrix", "XOR Stream Cipher", "Base64 & Vigenère"],
  },
  {
    id: "file-signature-checker",
    name: "File Signature Checker",
    href: "/tools/file-signature-checker",
    icon: Binary,
    category: "Forensics",
    description:
      "Analisis Magic Bytes (header biner) untuk mengungkap tipe file sebenarnya dan mendeteksi teknik extension spoofing pada malware.",
    features: ["Database 20+ Magic Bytes", "Hex & ASCII Stream Dump", "Deteksi Ekstensi Palsu"],
  },
  {
    id: "metadata-inspector",
    name: "Metadata Inspector",
    href: "/tools/metadata-inspector",
    icon: Camera,
    category: "Forensics",
    description:
      "Inspeksi metadata tersembunyi dan tag EXIF gambar untuk audit privasi digital dan investigasi OSINT tanpa mengunggah ke server.",
    features: ["Parser EXIF JPEG Murni", "Analisis Jejak Kamera & Tanggal", "Edukasi Bahaya OSINT"],
  },
  {
    id: "password-analyzer",
    name: "Password Analyzer",
    href: "/tools/password-analyzer",
    icon: Lock,
    category: "Defensive",
    description:
      "Evaluasi kekuatan kata sandi berbasis entropi informasi Shannon, deteksi kebiasaan buruk, dan estimasi waktu retas GPU cluster.",
    features: ["Kalkulasi Entropi Bit", "Deteksi Pola Kamus & Keyboard", "100% Zero-Leak di Browser"],
  },
];

export default function ToolsPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Cryptography", "Networking", "Forensics", "Defensive"];

  const filteredTools = TOOLS_LIST.filter((tool) => {
    const matchesCategory =
      selectedCategory === "All" || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase()) ||
      tool.features.some((f) => f.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] uppercase tracking-wider mb-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>Interactive Security Tools</span>
          </div>
          <h1 className="text-3xl font-mono font-bold text-[var(--color-text)]">
            Cybersecurity Tools
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
            Kumpulan utilitas analisis keamanan siber berbasis web. Seluruh tools berjalan murni secara lokal di sisi klien peramban Anda.
          </p>
        </div>
        <Badge variant="accent" size="md">
          6 Active Tools
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[var(--color-accent)] text-[#05080e] font-bold"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Cari tools atau kapabilitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              variant="interactive"
              className="flex flex-col justify-between"
            >
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="default">{tool.category}</Badge>
                </div>

                <div>
                  <h3 className="font-mono text-base font-bold text-[var(--color-text)]">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed line-clamp-3">
                    {tool.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[var(--color-border-subtle)]">
                  {tool.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] font-mono text-[var(--color-text-muted)] flex items-center gap-1.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </CardBody>

              <CardFooter className="pt-3">
                <Link
                  href={tool.href}
                  className="w-full inline-flex items-center justify-between text-xs font-mono font-bold text-[var(--color-accent)] hover:text-emerald-300 transition-colors"
                >
                  <span>Jalankan Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex items-start sm:items-center gap-3">
        <Shield className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-xs text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text)]">Jaminan Privasi &amp; Keamanan Data:</strong>{" "}
          Semua alat pada halaman ini memproses file, string, dan input secara eksklusif menggunakan Web APIs peramban Anda. Tidak ada satu pun bit data yang dikirimkan ke server jarak jauh.
        </div>
      </div>
    </div>
  );
}
