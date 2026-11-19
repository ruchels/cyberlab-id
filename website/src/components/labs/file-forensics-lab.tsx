"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { Binary, CheckCircle2, ShieldAlert, Sparkles, FileSearch, ShieldCheck } from "lucide-react";
import { useProgress } from "@/lib/progress";

export function FileForensicsLab() {
  const { completeLab } = useProgress();

  const [magicByte1, setMagicByte1] = useState("00");
  const [magicByte2, setMagicByte2] = useState("00");
  const [magicByte3, setMagicByte3] = useState("00");
  const [magicByte4, setMagicByte4] = useState("00");

  const [isRepaired, setIsRepaired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRepair = () => {
    const b1 = magicByte1.trim().toUpperCase();
    const b2 = magicByte2.trim().toUpperCase();
    const b3 = magicByte3.trim().toUpperCase();
    const b4 = magicByte4.trim().toUpperCase();

    if (b1 === "89" && b2 === "50" && b3 === "4E" && b4 === "47") {
      setIsRepaired(true);
      setErrorMessage(null);
      completeLab("file-forensics-lab", "Digital File Forensics & Carving", "forensic-sleuth");
    } else {
      setIsRepaired(false);
      setErrorMessage(
        `Byte [${b1} ${b2} ${b3} ${b4}] bukan Magic Bytes resmi file PNG. Periksa tabel referensi signature: 89 50 4E 47.`
      );
    }
  };

  return (
    <Card id="file-forensics-lab" className="border-[var(--color-border)] overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--color-accent)] font-bold">LAB 05</span>
            <Badge variant="default" size="sm">Menengah (Intermediate)</Badge>
          </div>
          <h2 className="text-lg font-mono font-bold text-[var(--color-text)] mt-1 flex items-center gap-2">
            <Binary className="w-5 h-5 text-[var(--color-accent)]" />
            File Carving &amp; Corrupted Header Reconstruction Lab
          </h2>
        </div>
        <Badge variant={isRepaired ? "success" : "warning"} size="md">
          {isRepaired ? "Berkas Berhasil Dipulihkan" : "Hex Rekonstruksi"}
        </Badge>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Scenario description */}
        <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-xs font-mono space-y-2">
          <span className="font-bold text-[var(--color-accent)] flex items-center gap-1.5 uppercase">
            <Sparkles className="w-4 h-4" /> Skenario Investigasi Anti-Forensik
          </span>
          <p className="text-slate-300 leading-relaxed">
            Seorang pelaku kejahatan siber sengaja merusak 4 byte pertama file citra rahasia menjadi <code>00 00 00 00</code> untuk mengelabui alat antivirus dan forensic carver. Periksa sisa struktur chunck di bawah (terdapat <code>IHDR</code>), isi 4 byte magic bytes asli untuk format PNG, lalu pulihkan berkas tersebut!
          </p>
        </div>

        {/* Hex Editor View */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[#070b12] p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2 text-[var(--color-text-muted)] text-[11px]">
            <span>OFFSET (HEX)</span>
            <span className="hidden sm:inline">BYTE STREAM DUMP (HEX)</span>
            <span>ASCII</span>
          </div>

          <div className="space-y-1.5 text-slate-300 text-xs leading-relaxed">
            {/* Row 00000000 with interactive inputs for first 4 bytes */}
            <div className="flex items-center justify-between bg-[var(--color-surface-elevated)]/40 p-1.5 rounded">
              <span className="text-[var(--color-text-muted)] w-20">00000000</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={2}
                  value={magicByte1}
                  onChange={(e) => setMagicByte1(e.target.value)}
                  className="w-8 h-7 text-center rounded bg-[#090e18] border border-amber-500/80 text-amber-300 font-bold focus:border-[var(--color-accent)] focus:outline-none uppercase"
                />
                <input
                  type="text"
                  maxLength={2}
                  value={magicByte2}
                  onChange={(e) => setMagicByte2(e.target.value)}
                  className="w-8 h-7 text-center rounded bg-[#090e18] border border-amber-500/80 text-amber-300 font-bold focus:border-[var(--color-accent)] focus:outline-none uppercase"
                />
                <input
                  type="text"
                  maxLength={2}
                  value={magicByte3}
                  onChange={(e) => setMagicByte3(e.target.value)}
                  className="w-8 h-7 text-center rounded bg-[#090e18] border border-amber-500/80 text-amber-300 font-bold focus:border-[var(--color-accent)] focus:outline-none uppercase"
                />
                <input
                  type="text"
                  maxLength={2}
                  value={magicByte4}
                  onChange={(e) => setMagicByte4(e.target.value)}
                  className="w-8 h-7 text-center rounded bg-[#090e18] border border-amber-500/80 text-amber-300 font-bold focus:border-[var(--color-accent)] focus:outline-none uppercase"
                />
                <span className="text-slate-400 ml-2">0D 0A 1A 0A</span>
              </div>
              <span className="text-slate-400 w-24 text-right">
                {isRepaired ? ".PNG...." : "........"}
              </span>
            </div>

            {/* Row 00000010 (IHDR Chunk) */}
            <div className="flex items-center justify-between p-1.5">
              <span className="text-[var(--color-text-muted)] w-20">00000010</span>
              <span className="text-slate-400">00 00 00 0D 49 48 44 52 00 00 01 00</span>
              <span className="text-slate-400 w-24 text-right">....IHDR....</span>
            </div>

            {/* Row 00000020 */}
            <div className="flex items-center justify-between p-1.5">
              <span className="text-[var(--color-text-muted)] w-20">00000020</span>
              <span className="text-slate-400">00 00 00 80 08 06 00 00 00 E4 52 8C</span>
              <span className="text-slate-400 w-24 text-right">.........R.</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--color-border-subtle)]">
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Ketikkan byte 89, 50, 4E, 47 (Magic Bytes PNG) pada 4 kolom di atas.
            </span>
            <Button size="sm" onClick={handleRepair} className="w-full sm:w-auto">
              Terapkan Patch Biner
            </Button>
          </div>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="p-3.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 font-mono text-xs">
            {errorMessage}
          </div>
        )}

        {/* Success recovery preview */}
        {isRepaired && (
          <div className="p-5 rounded-lg bg-emerald-950/30 border border-emerald-800 text-xs font-mono space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>BERKAS CITRA PNG BERHASIL DIPULIHKAN!</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Magic Bytes <code>89 50 4E 47</code> cocok secara sempurna dengan spesifikasi W3C PNG. File carver kini dapat membaca seluruh chunk header <code>IHDR</code> dan mengekstrak data gambar tersembunyi.
            </p>
            <div className="p-3 rounded bg-[#090d16] border border-emerald-800/80 text-emerald-300 font-bold">
              Flag Forensik Terbuka: <code>FLAG&#123;MAGIC_BYTES_PNG_RECOVERED_2026&#125;</code>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
