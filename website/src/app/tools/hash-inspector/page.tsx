"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  hashText,
  hashBuffer,
  compareHashes,
  HashAlgorithm,
} from "@/lib/tools/hash";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  Hash,
  FileText,
  Upload,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

interface AlgoOption {
  id: HashAlgorithm;
  label: string;
  bits: number;
  useCase: string;
}

const ALGORITHMS: AlgoOption[] = [
  { id: "md5", label: "MD5", bits: 128, useCase: "Checksum file lama (Kriptografi tidak aman, rentan collision)" },
  { id: "sha1", label: "SHA-1", bits: 160, useCase: "Git commit klasik (Deprecated untuk sertifikat)" },
  { id: "sha256", label: "SHA-256", bits: 256, useCase: "Standar industri saat ini (TLS, Bitcoin, integritas)" },
  { id: "sha512", label: "SHA-512", bits: 512, useCase: "Keamanan ekstra tinggi, arsitektur 64-bit" },
];

export default function HashInspectorPage() {
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("");
  const [selectedAlgos, setSelectedAlgos] = useState<HashAlgorithm[]>([
    "md5",
    "sha1",
    "sha256",
    "sha512",
  ]);
  const [results, setResults] = useState<{ [key: string]: { hash: string; time: number } }>({});
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // File hashing state
  const [file, setFile] = useState<File | null>(null);

  // Comparison state
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  const toggleAlgo = (algo: HashAlgorithm) => {
    setSelectedAlgos((prev) =>
      prev.includes(algo) ? prev.filter((a) => a !== algo) : [...prev, algo]
    );
  };

  const handleComputeTextHash = async () => {
    if (!inputText) return;
    setLoading(true);
    const newResults: { [key: string]: { hash: string; time: number } } = {};

    for (const algo of selectedAlgos) {
      const start = performance.now();
      try {
        const hash = await hashText(inputText, algo);
        const duration = Math.round((performance.now() - start) * 100) / 100;
        newResults[algo] = { hash, time: duration };
      } catch (e) {
        newResults[algo] = { hash: `Error: ${e}`, time: 0 };
      }
    }

    setResults(newResults);
    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    setLoading(true);
    const newResults: { [key: string]: { hash: string; time: number } } = {};

    try {
      const buffer = await selected.arrayBuffer();
      for (const algo of selectedAlgos) {
        const start = performance.now();
        const hash = await hashBuffer(buffer, algo);
        const duration = Math.round((performance.now() - start) * 100) / 100;
        newResults[algo] = { hash, time: duration };
      }
      setResults(newResults);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isMatching = compareA && compareB ? compareHashes(compareA, compareB) : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb & Header */}
      <div>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Tools
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-[var(--color-text)] flex items-center gap-3">
              <Hash className="w-7 h-7 text-[var(--color-accent)]" />
              Hash Inspector
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Hitung digest kriptografi (MD5, SHA-1, SHA-256, SHA-512) dari teks maupun file dengan aman di peramban.
            </p>
          </div>
          <Badge variant="accent" size="md">
            100% Client-Side Privacy
          </Badge>
        </div>
      </div>

      {/* Main Calculation Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setActiveTab("text");
                setResults({});
              }}
              className={`px-3 py-1.5 rounded font-mono text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "text"
                  ? "bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Hash Teks
            </button>
            <button
              onClick={() => {
                setActiveTab("file");
                setResults({});
              }}
              className={`px-3 py-1.5 rounded font-mono text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "file"
                  ? "bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Hash File
            </button>
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Algorithm Checkboxes */}
          <div>
            <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
              Pilih Algoritma Hashing
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALGORITHMS.map((algo) => {
                const checked = selectedAlgos.includes(algo.id);
                return (
                  <label
                    key={algo.id}
                    className={`flex items-start gap-2.5 p-3 rounded border text-xs font-mono cursor-pointer transition-colors ${
                      checked
                        ? "border-[var(--color-accent)] bg-[var(--color-surface-elevated)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAlgo(algo.id)}
                      className="mt-0.5 accent-[var(--color-accent)]"
                    />
                    <div>
                      <div className="font-bold text-[var(--color-text)]">{algo.label}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">{algo.bits} bit</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Input Section */}
          {activeTab === "text" ? (
            <div className="space-y-3">
              <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                Masukkan Teks
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ketik atau tempel teks yang ingin di-hash di sini..."
                rows={4}
                className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md p-3 text-sm font-mono text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <Button
                onClick={handleComputeTextHash}
                disabled={!inputText || selectedAlgos.length === 0}
                isLoading={loading}
              >
                Hitung Hash
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                Unggah File untuk Checksum
              </label>
              <div className="border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-lg p-6 text-center cursor-pointer bg-[var(--color-surface-elevated)]/30 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-[var(--color-accent)] mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-mono text-[var(--color-text)]">
                    {file ? file.name : "Klik untuk memilih file dari komputer Anda"}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">
                    {file
                      ? `${(file.size / 1024).toFixed(2)} KB · Diproses langsung di RAM lokal`
                      : "File tidak diunggah ke server mana pun (0% outbound network)"}
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Hash Results Display */}
          {Object.keys(results).length > 0 && (
            <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Hasil Hash (Hexadecimal Digest)
              </h3>
              <div className="space-y-3">
                {selectedAlgos.map((algoId) => {
                  const res = results[algoId];
                  if (!res) return null;
                  const algoInfo = ALGORITHMS.find((a) => a.id === algoId);
                  return (
                    <div
                      key={algoId}
                      className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--color-accent)] uppercase">
                            {algoInfo?.label}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                            ({algoInfo?.bits} bit)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[var(--color-text-muted)] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {res.time} ms
                          </span>
                          <button
                            onClick={() => copyToClipboard(res.hash, algoId)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--color-surface)] hover:bg-[#202b3f] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] border border-[var(--color-border)] cursor-pointer"
                          >
                            {copiedKey === algoId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Disalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-[var(--color-text)] break-all bg-[#090d16] p-2.5 rounded border border-[var(--color-border-subtle)]">
                        {res.hash}
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        {algoInfo?.useCase}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Hash Comparison Tool */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-mono font-bold text-[var(--color-text)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" />
            Hash Comparator (Verifikasi Integritas)
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Bandingkan dua hash (misalnya checksum unduhan dengan checksum dari rilis resmi) untuk memastikan file tidak rusak atau dimodifikasi oleh peretas (Man-in-the-Middle).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hash Asli / Referensi"
              placeholder="Contoh: e5d565a2b68c2a0eb1caa35a081c3261..."
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
            />
            <Input
              label="Hash yang Dihitung / Diuji"
              placeholder="Tempel hash hasil pengujian Anda..."
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
            />
          </div>

          {isMatching !== null && (
            <div
              className={`p-3.5 rounded-lg border flex items-center gap-3 font-mono text-xs ${
                isMatching
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-rose-950/40 border-rose-800 text-rose-300"
              }`}
            >
              {isMatching ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong>HASH COCOK (MATCH):</strong> Integritas file atau teks terverifikasi. Tidak ada perbedaan data.
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <strong>HASH BERBEDA (MISMATCH):</strong> Data telah berubah, korup, atau algoritma hash yang dibandingkan tidak sama.
                  </div>
                </>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Educational Note */}
      <div className="p-5 rounded-lg border border-amber-800/80 bg-amber-950/25 text-xs text-[var(--color-text-secondary)] space-y-3 font-mono">
        <h4 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
          ⚠️ Peringatan Keamanan Kritis: Kelemahan MD5 &amp; SHA-1
        </h4>
        <p className="leading-relaxed text-amber-200/90">
          <strong>MD5 (1991)</strong> dan <strong>SHA-1 (1995)</strong> telah terbukti secara praktis rentan terhadap <em>Collision Attacks</em> (dua berkas berbeda dapat direkayasa untuk menghasilkan hash yang identik). Keduanya <strong>SAMA SEKALI TIDAK BOLEH DIGUNAKAN</strong> untuk otentikasi kata sandi, tanda tangan digital, atau sertifikat TLS.
        </p>
        <p className="leading-relaxed text-slate-300">
          Untuk verifikasi integritas berkas umum, gunakan minimal <strong>SHA-256</strong> atau <strong>SHA-512</strong>. Untuk penyimpanan kata sandi di basis data, jangan pernah menggunakan fungsi hash cepat biasa; wajib gunakan <strong>Salted Memory-Hard Password Hash</strong> seperti <em>Argon2id</em>, <em>Bcrypt</em>, atau <em>PBKDF2</em>.
        </p>
      </div>

      <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] space-y-2">
        <h4 className="font-mono font-bold text-[var(--color-text)] flex items-center gap-2">
          💡 Catatan Keamanan Siber: Sifat Fungsi Hash Kriptografi
        </h4>
        <p>
          <strong>Fungsi Hash Kriptografi</strong> adalah operasi matematika satu arah (one-way). Sifat penting fungsi hash yang baik:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>Deterministic:</strong> Pesan yang sama selalu menghasilkan hash yang identik.</li>
          <li><strong>Avalanche Effect:</strong> Perubahan 1 bit saja pada input akan mengubah lebih dari 50% bit output secara acak.</li>
          <li><strong>Pre-image Resistance:</strong> Komputasi sangat sulit untuk mencari input pesan asli jika hanya diketahui nilai hash-nya.</li>
          <li><strong>Collision Resistance:</strong> Mustahil secara praktis menemukan dua pesan berbeda yang menghasilkan hash yang sama.</li>
        </ul>
      </div>
    </div>
  );
}
