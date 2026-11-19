"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  parseFileMetadata,
  formatFileSize,
  MetadataResult,
} from "@/lib/tools/metadata";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import {
  Camera,
  ArrowLeft,
  Upload,
  ShieldAlert,
  Info,
  MapPin,
  Calendar,
  Layers,
} from "lucide-react";

export default function MetadataInspectorPage() {
  const [result, setResult] = useState<MetadataResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const meta = await parseFileMetadata(file);
      setResult(meta);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
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
              <Camera className="w-7 h-7 text-[var(--color-accent)]" />
              Metadata &amp; EXIF Inspector
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Periksa metadata tersembunyi, tanggal pengambilan foto, perangkat kamera, dan jejak OSINT pada file digital.
            </p>
          </div>
          <Badge variant="accent" size="md">
            OSINT &amp; Privacy Audit
          </Badge>
        </div>
      </div>

      {/* Upload Box */}
      <Card>
        <CardBody className="space-y-4">
          <div className="border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-lg p-8 text-center cursor-pointer bg-[var(--color-surface-elevated)]/30 transition-colors">
            <input
              type="file"
              id="meta-file-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label htmlFor="meta-file-upload" className="cursor-pointer block">
              <Upload className="w-10 h-10 text-[var(--color-accent)] mx-auto mb-3 opacity-80" />
              <p className="text-sm font-mono font-bold text-[var(--color-text)]">
                {loading ? "Menganalisis file..." : "Pilih File Gambar atau Dokumen"}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">
                Semua pemrosesan binary EXIF dieksekusi di browser. Foto Anda tidak pernah meninggalkan komputer.
              </p>
            </label>
          </div>
        </CardBody>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic File Info */}
            <Card>
              <CardHeader>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                  Informasi Dasar File
                </h3>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-[var(--color-border-subtle)] text-xs font-mono">
                  <div className="px-5 py-3 flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Nama File:</span>
                    <span className="text-[var(--color-text)] font-bold truncate max-w-[200px]">
                      {result.fileName}
                    </span>
                  </div>
                  <div className="px-5 py-3 flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Ukuran:</span>
                    <span className="text-[var(--color-text)] font-bold">
                      {formatFileSize(result.fileSize)} ({result.fileSize.toLocaleString()} bytes)
                    </span>
                  </div>
                  <div className="px-5 py-3 flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">MIME Type:</span>
                    <span className="text-[var(--color-accent)] font-bold">
                      {result.mimeType}
                    </span>
                  </div>
                  <div className="px-5 py-3 flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Waktu Modifikasi:</span>
                    <span className="text-slate-300">
                      {result.lastModified}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* EXIF Data */}
            <Card>
              <CardHeader>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-text)] flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[var(--color-accent)]" />
                  Tag EXIF Terdeteksi
                </h3>
              </CardHeader>
              <CardBody className="p-0">
                {result.exifTags.length > 0 ? (
                  <div className="divide-y divide-[var(--color-border-subtle)] text-xs font-mono">
                    {result.exifTags.map((tag, idx) => (
                      <div key={idx} className="px-5 py-3 flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">{tag.name}:</span>
                        <span className="text-emerald-300 font-bold">{tag.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs font-mono text-[var(--color-text-muted)]">
                    Tidak ditemukan tag EXIF tambahan (mungkin sudah dibersihkan oleh aplikasi pengirim atau bukan format JPEG berkamera).
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Privacy Warning */}
          <div className="p-4 rounded-lg border border-amber-800/80 bg-amber-950/30 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Peringatan Privasi &amp; Bahaya OSINT (Open Source Intelligence):</span>
            </div>
            <p className="text-amber-200/90 leading-relaxed">
              Foto yang diambil dari ponsel pintar seringkali menyimpan metadata lokasi GPS presisi, nomor seri perangkat, dan stempel waktu. Jika diunggah ke internet tanpa dibersihkan (sanitized), penyerang dapat mengetahui lokasi rumah, jadwal aktivitas, serta perangkat yang Anda gunakan.
            </p>
            <div className="pt-2 text-[11px] text-amber-300">
              💡 <strong>Cara Menghapus Metadata:</strong> Di terminal Linux/macOS gunakan <code>exiftool -all= namafile.jpg</code> atau gunakan aplikasi pengirim pesan yang otomatis mengompresi gambar.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
