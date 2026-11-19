"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { KeyRound, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Copy, Check } from "lucide-react";
import { useProgress } from "@/lib/progress";
import { base64Decode, xorCipher } from "@/lib/tools/cipher";

export function CryptoChallengesLab() {
  const { completeLab } = useProgress();

  // Stage 1: Base64
  const [b64Input, setB64Input] = useState("MmEgMjAgMmIgMmM=");
  const [stage1Decoded, setStage1Decoded] = useState("");
  const [stage1Done, setStage1Done] = useState(false);

  // Stage 2: XOR Decryption
  const [xorTargetHex, setXorTargetHex] = useState(
    "2a 20 2b 2c 3b 25 28 34 20 3a 36 28 3e 2c 24 2c"
  );
  const [xorKeyInput, setXorKeyInput] = useState("0x69");
  const [stage2Result, setStage2Result] = useState("");
  const [isSolved, setIsSolved] = useState(false);
  const [flagSubmitted, setFlagSubmitted] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDecodeBase64 = () => {
    try {
      const decoded = base64Decode(b64Input);
      setStage1Decoded(decoded);
      setStage1Done(true);
    } catch {
      setStage1Decoded("Error: Base64 string tidak valid");
    }
  };

  const handleTestXor = () => {
    // Parse key
    let keyChar = "i"; // 0x69 is ASCII 'i'
    if (xorKeyInput.startsWith("0x")) {
      const num = parseInt(xorKeyInput, 16);
      if (!isNaN(num)) keyChar = String.fromCharCode(num);
    } else if (xorKeyInput.length > 0) {
      keyChar = xorKeyInput;
    }

    // Convert hex stream to bytes
    const cleanHex = xorTargetHex.replace(/\s+/g, "");
    let text = "";
    for (let i = 0; i < cleanHex.length; i += 2) {
      text += String.fromCharCode(parseInt(cleanHex.substring(i, i + 2), 16));
    }

    const { ascii } = xorCipher(text, keyChar);
    setStage2Result(ascii);
  };

  const handleVerifyFlag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = flagSubmitted.trim();
    if (
      clean === "CYBERLAB_SECRET" ||
      clean === "FLAG{CYBERLAB_SECRET}" ||
      clean === "CYBERLAB{CYBERLAB_SECRET}"
    ) {
      setIsSolved(true);
      setFeedback("Flag Valid! Anda berhasil menyelesaikan pipeline kriptografi multi-tahap.");
      completeLab("crypto-challenges-lab", "Cryptography and Encoding Challenges", "cipher-breaker");
    } else {
      setFeedback("Flag belum tepat. Selesaikan XOR dengan key 0x69 untuk membaca plaintext aslinya.");
    }
  };

  return (
    <Card id="crypto-challenges-lab" className="border-[var(--color-border)] overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--color-accent)] font-bold">LAB 04</span>
            <Badge variant="default" size="sm">Menengah (Intermediate)</Badge>
          </div>
          <h2 className="text-lg font-mono font-bold text-[var(--color-text)] mt-1 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[var(--color-accent)]" />
            Multi-Stage Cryptanalysis &amp; De-obfuscation Workbench
          </h2>
        </div>
        <Badge variant={isSolved ? "success" : "warning"} size="md">
          {isSolved ? "Tantangan Selesai" : "Misi Kriptanalisis"}
        </Badge>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Scenario description */}
        <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-xs font-mono space-y-2">
          <span className="font-bold text-[var(--color-accent)] flex items-center gap-1.5 uppercase">
            <Sparkles className="w-4 h-4" /> Skenario Analisis Sinyal Terenkripsi
          </span>
          <p className="text-slate-300 leading-relaxed">
            Tim insiden meretas transmisi komunikasi malware. Data dikaburkan menggunakan dua lapis: pertama dienkripsi dengan <strong>Single-Byte XOR</strong>, lalu di-encode ke <strong>Base64</strong>. Pecahkan kedua lapis tersebut secara berurutan untuk mendapatkan pesan aslinya!
          </p>
        </div>

        {/* Stage 1: Base64 De-obfuscation */}
        <div className="p-4 rounded-lg bg-[#070b12] border border-[var(--color-border)] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--color-accent)] uppercase">
              Tahap 1: Ekstraksi Base64 Encoding
            </span>
            {stage1Done && <Badge variant="success" size="sm">Tahap 1 Selesai</Badge>}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Input
                label="String Ter-encode Base64"
                value={b64Input}
                onChange={(e) => setB64Input(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleDecodeBase64} className="whitespace-nowrap">
              Decode Base64
            </Button>
          </div>

          {stage1Decoded && (
            <div className="p-3 rounded bg-[#090e18] border border-[var(--color-border-subtle)] space-y-1">
              <span className="text-[11px] text-[var(--color-text-muted)]">Hasil Decode (Stream Hex Tersembunyi):</span>
              <div className="text-emerald-300 font-bold">{stage1Decoded}</div>
            </div>
          )}
        </div>

        {/* Stage 2: Single-Byte XOR Key Solver */}
        <div className="p-4 rounded-lg bg-[#070b12] border border-[var(--color-border)] space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 uppercase">
              Tahap 2: Pemecahan Kunci XOR (Single-Byte Brute Force)
            </span>
            {stage2Result && <Badge variant="default" size="sm">Hasil XOR Dihitung</Badge>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input
                label="Target Ciphertext Bytes (Hex)"
                value={xorTargetHex}
                onChange={(e) => setXorTargetHex(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Kunci XOR (Key: Hex atau Karakter)"
                value={xorKeyInput}
                onChange={(e) => setXorKeyInput(e.target.value)}
                placeholder="Contoh: 0x69"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Petunjuk: Huruf pertama seharusnya &apos;C&apos; (0x43). 0x2A XOR 0x43 = 0x69.
            </span>
            <Button size="sm" onClick={handleTestXor}>
              Uji Kunci XOR
            </Button>
          </div>

          {stage2Result && (
            <div className="p-3.5 rounded bg-[#090e18] border border-[var(--color-border-subtle)] space-y-1">
              <span className="text-[11px] text-[var(--color-text-muted)]">Plaintext yang Didekripsi:</span>
              <div className="text-emerald-300 font-bold text-sm select-all">{stage2Result}</div>
            </div>
          )}
        </div>

        {/* Flag Submission */}
        <form onSubmit={handleVerifyFlag} className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col sm:flex-row gap-3 items-center font-mono text-xs">
          <div className="flex-1 w-full">
            <Input
              placeholder="Masukkan pesan hasil dekripsi (misal: CYBERLAB_SECRET)..."
              value={flagSubmitted}
              onChange={(e) => setFlagSubmitted(e.target.value)}
            />
          </div>
          <Button size="md" className="whitespace-nowrap w-full sm:w-auto">
            Klaim Flag Lab
          </Button>
        </form>

        {feedback && (
          <div
            className={`p-3.5 rounded font-mono text-xs flex items-center gap-2 ${
              isSolved
                ? "bg-emerald-950/50 border border-emerald-800 text-emerald-300"
                : "bg-rose-950/50 border border-rose-800 text-rose-300"
            }`}
          >
            {isSolved ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : null}
            <span>{feedback}</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
