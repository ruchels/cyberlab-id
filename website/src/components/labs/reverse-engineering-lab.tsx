"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { Cpu, CheckCircle2, ShieldAlert, Sparkles, Terminal, Play, RotateCcw, Wrench } from "lucide-react";
import { useProgress } from "@/lib/progress";

interface Instruction {
  offset: string;
  bytes: string;
  opcode: string;
  explanation: string;
}

const ORIGINAL_INSTRUCTIONS: Instruction[] = [
  {
    offset: "0x00401020",
    bytes: "8B 45 FC",
    opcode: "MOV EAX, DWORD PTR [EBP-4]",
    explanation: "Memuat nilai input pengguna (Serial Key) ke register EAX.",
  },
  {
    offset: "0x00401023",
    bytes: "83 F0 5A",
    opcode: "XOR EAX, 0x5A",
    explanation: "Melakukan operasi XOR register EAX dengan konstanta kunci 0x5A (90 desimal).",
  },
  {
    offset: "0x00401026",
    bytes: "3D 37 13 00 00",
    opcode: "CMP EAX, 0x1337",
    explanation: "Membandingkan hasil XOR EAX dengan nilai target 0x1337 (4919 desimal). Set Zero Flag (ZF=1) jika cocok.",
  },
  {
    offset: "0x0040102B",
    bytes: "74 05",
    opcode: "JE 0x00401032",
    explanation: "Lompat ke blok validasi jika ZF == 1 (kondisi sama). Jika ZF == 0, eksekusi lanjut ke Akses Ditolak.",
  },
  {
    offset: "0x0040102D",
    bytes: "E8 B2 00 00 00",
    opcode: "CALL print_denied",
    explanation: "Blok Gagal: Menampilkan pesan 'AKSES DITOLAK: Serial Tidak Sah' dan terminate program.",
  },
  {
    offset: "0x00401032",
    bytes: "E8 C4 00 00 00",
    opcode: "CALL grant_flag",
    explanation: "Blok Berhasil: Menampilkan flag aktivasi software terproteksi.",
  },
];

export function ReverseEngineeringLab() {
  const { completeLab } = useProgress();

  // Mode: "keygen" (input serial test) or "patch" (binary patching JE -> JNE or NOP)
  const [activeTab, setActiveTab] = useState<"step" | "patch">("step");
  
  // Execution state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>("1234");
  const [registers, setRegisters] = useState<{ eax: string; ebx: string; zf: number }>({
    eax: "0x00000000",
    ebx: "0x0000005A",
    zf: 0,
  });
  const [executionLog, setExecutionLog] = useState<string[]>([
    "[SYS] Binary crackme_v1.elf termuat di memori virtual.",
    "[SYS] Masukkan serial numerik atau lakukan byte-patching pada instruksi kondisional branch.",
  ]);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Patching state
  const [patchOpcode, setPatchOpcode] = useState<"JE" | "JNE" | "NOP">("JE");

  const resetSimulation = () => {
    setCurrentStep(0);
    setRegisters({ eax: "0x00000000", ebx: "0x0000005A", zf: 0 });
    setExecutionLog([
      "[SYS] State simulasi CPU direset ke initial entrypoint (0x00401020).",
    ]);
  };

  const handleStepExecution = () => {
    const numInput = parseInt(userInput, 10);
    if (isNaN(numInput) || numInput < 0) {
      setExecutionLog((prev) => [...prev, "[ERR] Input Serial harus berupa angka desimal positif."]);
      return;
    }

    if (currentStep === 0) {
      // Step 1: MOV EAX, [input]
      const hexEax = "0x" + numInput.toString(16).padStart(8, "0").toUpperCase();
      setRegisters((prev) => ({ ...prev, eax: hexEax }));
      setExecutionLog((prev) => [
        ...prev,
        `[STEP 1] MOV EAX, ${numInput} -> Register EAX sekarang bernilai ${hexEax}`,
      ]);
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Step 2: XOR EAX, 0x5A
      const xorResult = numInput ^ 0x5a;
      const hexEax = "0x" + (xorResult >>> 0).toString(16).padStart(8, "0").toUpperCase();
      setRegisters((prev) => ({ ...prev, eax: hexEax }));
      setExecutionLog((prev) => [
        ...prev,
        `[STEP 2] XOR EAX, 0x5A -> (${numInput} ^ 90) = ${xorResult} (${hexEax})`,
      ]);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 3: CMP EAX, 0x1337
      const target = 0x1337;
      const xorResult = numInput ^ 0x5a;
      const isMatch = xorResult === target;
      const zfVal = isMatch ? 1 : 0;
      setRegisters((prev) => ({ ...prev, zf: zfVal }));
      setExecutionLog((prev) => [
        ...prev,
        `[STEP 3] CMP ${registers.eax}, 0x1337 -> ${isMatch ? "MATCH! Zero Flag ZF diset ke 1" : "MISMATCH! Zero Flag ZF tetap 0"}`,
      ]);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Step 4: Conditional branch based on patch
      const zfVal = registers.zf;
      let jumpTaken = false;

      if (patchOpcode === "JE") {
        jumpTaken = zfVal === 1;
      } else if (patchOpcode === "JNE") {
        jumpTaken = zfVal === 0;
      } else if (patchOpcode === "NOP") {
        // NOP doesn't jump, falls through to next instruction. But in standard crackme flow,
        // if patched to JMP or bypassing check:
        jumpTaken = true;
      }

      if (jumpTaken) {
        setIsUnlocked(true);
        setCurrentStep(5);
        setExecutionLog((prev) => [
          ...prev,
          `[STEP 4] Conditional Branch (${patchOpcode}) -> LOMPAT KE 0x00401032 (grant_flag)`,
          `[SUCCESS] CRACKME SOLVED! Flag: CYBERLAB{x86_d154553mbly_byp455}`,
        ]);
        completeLab("reverse-engineering-lab", "Basic Reverse Engineering & Binary Patching", "reverse-apprentice");
      } else {
        setCurrentStep(4);
        setExecutionLog((prev) => [
          ...prev,
          `[STEP 4] Conditional Branch (${patchOpcode}) -> Tidak lompat (ZF=${zfVal}). Melanjutkan ke print_denied.`,
          `[FAIL] Akses Ditolak: Serial tidak valid atau branching belum dilewati.`,
        ]);
      }
    }
  };

  const handleApplyPatch = (newOpcode: "JE" | "JNE" | "NOP") => {
    setPatchOpcode(newOpcode);
    let patchDesc = "";
    if (newOpcode === "JE") patchDesc = "Original Binary: 74 05 (JE - Jump if Equal)";
    if (newOpcode === "JNE") patchDesc = "Patched Binary: 75 05 (JNE - Jump if Not Equal / Invert logic)";
    if (newOpcode === "NOP") patchDesc = "Patched Binary: 90 90 (NOP NOP - No Operation / Force Bypass)";

    setExecutionLog((prev) => [
      ...prev,
      `[PATCHER] Mengaplikasikan byte patch pada offset 0x0040102B: ${patchDesc}`,
    ]);
  };

  // Math explanation for keygen:
  // (input ^ 0x5A) == 0x1337 => input = 0x1337 ^ 0x5A = 4919 ^ 90 = 4867
  const validKey = 0x1337 ^ 0x5a; // 4867

  return (
    <Card id="reverse-engineering-lab" className="border-[var(--color-border)] overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--color-accent)] font-bold">LAB 06</span>
            <Badge variant="default" size="sm">Menengah (Intermediate)</Badge>
          </div>
          <h2 className="text-lg font-mono font-bold text-[var(--color-text)] mt-1 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[var(--color-accent)]" />
            Basic Reverse Engineering: x86 Crackme &amp; Assembly Patching
          </h2>
        </div>
        <Badge variant={isUnlocked ? "success" : "warning"} size="md">
          {isUnlocked ? "Target Bypassed / Solved" : "Binary Active"}
        </Badge>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Scenario description */}
        <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-xs font-mono space-y-2">
          <span className="font-bold text-[var(--color-accent)] flex items-center gap-1.5 uppercase">
            <Sparkles className="w-4 h-4" /> Skenario Analisis Binary Crackme
          </span>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Anda menerima berkas program <code>crackme_v1.elf</code> yang diproteksi oleh lisensi serial. 
            Melalui analisis statis (disassembly), ditemukan bahwa program memeriksa serial dengan formula: 
            <code className="text-[var(--color-accent)] mx-1">(Input XOR 0x5A) == 0x1337</code>.
          </p>
          <p className="text-[var(--color-text-muted)]">
            Terdapat dua cara menyelesaikan lab ini:
            <br />
            <strong>1. Metode Analisis / Keygen:</strong> Hitung nilai matematis serial yang memenuhi persamaan <code>input = 0x1337 ^ 0x5A</code>.
            <br />
            <strong>2. Metode Binary Patching:</strong> Ubah opcode lompatan bersyarat <code>JE</code> (Jump if Equal) menjadi <code>JNE</code> atau <code>NOP</code> agar program menerima input apa saja.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[var(--color-border-subtle)] gap-2">
          <button
            onClick={() => setActiveTab("step")}
            className={`px-4 py-2 text-xs font-mono font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "step"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            CPU Stepper &amp; Keygen Test
          </button>
          <button
            onClick={() => setActiveTab("patch")}
            className={`px-4 py-2 text-xs font-mono font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "patch"
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Hex / Assembly Patcher
          </button>
        </div>

        {/* Assembly Disassembly View & CPU Registers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Disassembly code block */}
          <div className="lg:col-span-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] p-4 font-mono text-xs">
            <div className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)] pb-2 mb-3 flex justify-between items-center">
              <span>DISASSEMBLY: .text section (x86_64)</span>
              <span className="text-[10px] text-[var(--color-accent)]">Base: 0x00401000</span>
            </div>

            <div className="space-y-1.5">
              {ORIGINAL_INSTRUCTIONS.map((inst, idx) => {
                const isCurrent = currentStep === idx;
                const isPatched = idx === 3 && patchOpcode !== "JE";

                return (
                  <div
                    key={inst.offset}
                    className={`p-2 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 border transition-all ${
                      isCurrent
                        ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)] text-[var(--color-text)]"
                        : "bg-[var(--color-background)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[var(--color-text-muted)]">{inst.offset}</span>
                      <span className="text-[11px] font-bold text-[var(--color-accent)]">
                        {idx === 3 && patchOpcode === "JNE"
                          ? "75 05"
                          : idx === 3 && patchOpcode === "NOP"
                          ? "90 90"
                          : inst.bytes}
                      </span>
                      <span className="font-bold text-[var(--color-text)]">
                        {idx === 3 ? `${patchOpcode} 0x00401032` : inst.opcode}
                      </span>
                      {isPatched && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                          PATCHED
                        </span>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-[var(--color-accent)] flex items-center gap-1">
                        ← RIP (Instruction Pointer)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CPU Registers Panel */}
          <div className="rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] p-4 font-mono text-xs space-y-3">
            <div className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)] pb-2 flex justify-between items-center">
              <span>CPU REGISTERS</span>
              <span className="text-[10px] text-emerald-400">Emulated x86</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-[var(--color-background)] border border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-accent)] font-bold">EAX</span>
                <span className="font-mono text-[var(--color-text)]">{registers.eax}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[var(--color-background)] border border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-muted)] font-bold">EBX</span>
                <span className="font-mono text-[var(--color-text)]">{registers.ebx}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[var(--color-background)] border border-[var(--color-border-subtle)]">
                <span className="text-amber-400 font-bold">ZF (Zero Flag)</span>
                <span className={`font-mono font-bold ${registers.zf === 1 ? "text-emerald-400" : "text-[var(--color-text-muted)]"}`}>
                  {registers.zf}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] space-y-1">
              <div><strong>Status Cabang:</strong></div>
              <div>• Nilai Target: <code>0x1337</code> (4919 desimal)</div>
              <div>• Kunci XOR: <code>0x5A</code> (90 desimal)</div>
              <div>• Kondisi JE: ZF == 1</div>
            </div>
          </div>
        </div>

        {/* Tab Content: Stepper or Patcher */}
        {activeTab === "step" ? (
          <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-mono text-[var(--color-text-muted)] block mb-1">
                  Input Serial Key (Angka Desimal):
                </label>
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="e.g. 1234 atau hasil perhitungan keygen..."
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex items-end gap-2 pt-4 sm:pt-0">
                <Button
                  onClick={handleStepExecution}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" />
                  {currentStep === 0 ? "Jalankan Simulasi" : `Langkah Berikut (${currentStep + 1}/4)`}
                </Button>
                <Button
                  onClick={resetSimulation}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="p-3 rounded bg-[var(--color-background)] border border-[var(--color-border-subtle)] text-xs font-mono text-[var(--color-text-muted)]">
              <span className="text-[var(--color-accent)] font-bold">Hint Keygen Reverse:</span>
              <br />
              Persamaan: <code>input XOR 90 = 4919</code>. Karena sifat aljabar XOR bolak-balik:
              <br />
              <code>input = 4919 XOR 90 = {validKey}</code>. Masukkan nilai <strong>{validKey}</strong> untuk melewati validasi tanpa patching!
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[var(--color-accent)]">
                Pilih Byte Patching untuk Instruksi Percabangan (Offset 0x0040102B):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleApplyPatch("JE")}
                  className={`p-3 rounded-lg border text-left font-mono transition-all ${
                    patchOpcode === "JE"
                      ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)] text-[var(--color-text)]"
                      : "bg-[var(--color-background)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border)]"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>JE (Default)</span>
                    <span className="text-[10px]">74 05</span>
                  </div>
                  <div className="text-[11px] mt-1 text-[var(--color-text-muted)]">
                    Lompat hanya bila ZF == 1 (Serial harus cocok persis).
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPatch("JNE")}
                  className={`p-3 rounded-lg border text-left font-mono transition-all ${
                    patchOpcode === "JNE"
                      ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)] text-[var(--color-text)]"
                      : "bg-[var(--color-background)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border)]"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between text-amber-400">
                    <span>JNE (Invert Branch)</span>
                    <span className="text-[10px]">75 05</span>
                  </div>
                  <div className="text-[11px] mt-1 text-[var(--color-text-muted)]">
                    Lompat bila ZF == 0 (Serial SALAH justru dianggap BENAR!).
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPatch("NOP")}
                  className={`p-3 rounded-lg border text-left font-mono transition-all ${
                    patchOpcode === "NOP"
                      ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)] text-[var(--color-text)]"
                      : "bg-[var(--color-background)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border)]"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between text-emerald-400">
                    <span>Bypass Force Jump</span>
                    <span className="text-[10px]">EB 05</span>
                  </div>
                  <div className="text-[11px] mt-1 text-[var(--color-text-muted)]">
                    Selalu lompat ke grant_flag tanpa peduli hasil komparasi apapun.
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={() => {
                  setActiveTab("step");
                  resetSimulation();
                }}
                variant="primary"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Uji Binary yang Dipatch di Stepper
              </Button>
            </div>
          </div>
        )}

        {/* Execution Terminal / Console Output */}
        <div className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border-subtle)] p-4 font-mono text-xs space-y-2">
          <div className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)] pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[var(--color-accent)]">
              <Terminal className="w-4 h-4" />
              GDB / LLDB Debugger Execution Log
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)]">{executionLog.length} baris dicatat</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 text-[11px]">
            {executionLog.map((log, index) => (
              <div
                key={index}
                className={
                  log.includes("[SUCCESS]")
                    ? "text-emerald-400 font-bold"
                    : log.includes("[FAIL]") || log.includes("[ERR]")
                    ? "text-red-400 font-bold"
                    : log.includes("[STEP")
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-text-muted)]"
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Solved Banner */}
        {isUnlocked && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Praktikum Reverse Engineering Selesai! Badge Terbuka: Reverse Apprentice
            </div>
            <p>
              Selamat! Anda telah memahami bagaimana instruksi assembly tingkat rendah (x86_64) memproses input,
              menggunakan register CPU, membandingkan data melalui Zero Flag, dan bagaimana sebuah binary dapat di-crack
              baik melalui perhitungan aljabar logika (keygen) maupun patching opcode lompatan kondisional.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
