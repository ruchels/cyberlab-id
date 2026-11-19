"use client";

import React, { useState } from "react";
import { Badge, Button, Input } from "@/components/ui";
import {
  Cpu,
  FileCode,
  Play,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";

interface ReverseRangeProps {
  sessionId: string;
  template: any;
  onComplete: (evidenceToken?: string) => Promise<void>;
  onStop: () => Promise<void>;
}

export function ReverseRangeView({
  sessionId,
  template,
  onComplete,
  onStop,
}: ReverseRangeProps) {
  const [activeTab, setActiveTab] = useState<"strings" | "stepper" | "patch">("stepper");
  const [patchOpcode, setPatchOpcode] = useState<"JE" | "JNE" | "NOP">("JE");
  const [inputSerial, setInputSerial] = useState("4867");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([
    "[SYS] Disassembly termuat di memori virtual: 0x00401020.",
    "[SYS] Uji serial keygen atau lakukan byte patch pada opcode JE.",
  ]);

  const completionToken = "RANGE{x86_reverse_binary_disassembly_solved}";

  const handleRunExecution = () => {
    const num = parseInt(inputSerial, 10);
    if (isNaN(num)) {
      setExecutionLog((prev) => [...prev, "[ERR] Serial harus berupa angka desimal."]);
      return;
    }

    const xorResult = num ^ 0x5a;
    const isTargetMatch = xorResult === 0x1337;
    const zf = isTargetMatch ? 1 : 0;

    let jumpTaken = false;
    if (patchOpcode === "JE") jumpTaken = zf === 1;
    else if (patchOpcode === "JNE") jumpTaken = zf === 0;
    else if (patchOpcode === "NOP") jumpTaken = true;

    if (jumpTaken) {
      setIsUnlocked(true);
      setExecutionLog((prev) => [
        ...prev,
        `[EXEC] MOV EAX, ${num} -> XOR EAX, 0x5A -> Result: ${xorResult}`,
        `[BRANCH] Opcode ${patchOpcode} -> LOMPAT KE 0x00401032 (grant_access)`,
        `[SUCCESS] CRACKME BYPASS BERHASIL! Token: ${completionToken}`,
      ]);
    } else {
      setExecutionLog((prev) => [
        ...prev,
        `[EXEC] MOV EAX, ${num} -> XOR EAX, 0x5A -> Result: ${xorResult}`,
        `[BRANCH] Opcode ${patchOpcode} -> Gagal lompat (ZF=${zf}). Menuju print_denied.`,
        `[DENIED] Akses Ditolak: Serial tidak cocok.`,
      ]);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Bar */}
      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[var(--color-accent)]" />
          <span className="font-bold text-sm text-[var(--color-text)]">
            Reverse Engineering &amp; Binary Crackme Workbench
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab("stepper")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "stepper"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            1. CPU Stepper &amp; Keygen
          </button>
          <button
            onClick={() => setActiveTab("strings")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "strings"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            2. String Inspector
          </button>
          <button
            onClick={() => setActiveTab("patch")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "patch"
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            3. Opcode Patcher
          </button>
        </div>
      </div>

      {/* Stepper View */}
      {activeTab === "stepper" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
            <h3 className="font-bold text-sm text-[var(--color-text)]">
              Input Serial Key &amp; Trace Register
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] block text-[11px]">Serial Key (Desimal):</label>
                <Input
                  value={inputSerial}
                  onChange={(e) => setInputSerial(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleRunExecution} variant="primary" size="sm" className="text-xs font-mono">
                  <Play className="w-3.5 h-3.5 mr-1" /> Jalankan Eksekusi
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)]">
                Formula komparasi: <code>(Input XOR 90) == 4919</code>.<br />
                Solusi Keygen: <code>4919 ^ 90 = 4867</code>.
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2 text-[11px] text-[var(--color-text-muted)]">
                <span>GDB / LLDB TRACE LOG</span>
                <span>x86_64</span>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto text-[11px]">
                {executionLog.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes("[SUCCESS]")
                        ? "text-emerald-400 font-bold"
                        : log.includes("[DENIED]") || log.includes("[ERR]")
                        ? "text-red-400 font-bold"
                        : "text-[var(--color-text-muted)]"
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {isUnlocked && (
              <div className="pt-3 border-t border-[var(--color-border-subtle)]">
                <Button
                  onClick={() => onComplete(completionToken)}
                  variant="primary"
                  size="sm"
                  className="w-full text-xs font-mono flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Selesaikan Lab &amp; Klaim +{template.xp_reward} XP
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strings Inspector */}
      {activeTab === "strings" && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
          <h3 className="font-bold text-sm text-[var(--color-text)]">
            Ekstraksi String Biner (.rodata / .rdata)
          </h3>
          <div className="p-3 rounded-lg bg-[var(--color-background)] border border-[var(--color-border-subtle)] space-y-1 text-[11px] text-[var(--color-accent)]">
            <div>• /lib64/ld-linux-x86-64.so.2</div>
            <div>• __libc_start_main</div>
            <div>• [AUTH] Masukkan serial aktivasi program:</div>
            <div>• [SUCCESS] Serial Valid! Lisensi terverifikasi.</div>
            <div>• [FAIL] Akses Ditolak: Serial tidak sah.</div>
            <div>• GCC: (Ubuntu 13.2.0-23ubuntu4) 13.2.0</div>
          </div>
        </div>
      )}

      {/* Opcode Patcher */}
      {activeTab === "patch" && (
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
          <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            Hex &amp; Conditional Jump Opcode Patcher (Offset: 0x0040102B)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                setPatchOpcode("JE");
                setActiveTab("stepper");
              }}
              className={`p-3 rounded-lg border text-left ${
                patchOpcode === "JE" ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" : "bg-[var(--color-background)]"
              }`}
            >
              <div className="font-bold text-xs">JE 74 05 (Original)</div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-1">Lompat hanya bila ZF == 1.</div>
            </button>
            <button
              onClick={() => {
                setPatchOpcode("JNE");
                setActiveTab("stepper");
              }}
              className={`p-3 rounded-lg border text-left ${
                patchOpcode === "JNE" ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" : "bg-[var(--color-background)]"
              }`}
            >
              <div className="font-bold text-xs text-amber-400">JNE 75 05 (Invert)</div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-1">Lompat bila ZF == 0 (Serial salah diterima!).</div>
            </button>
            <button
              onClick={() => {
                setPatchOpcode("NOP");
                setActiveTab("stepper");
              }}
              className={`p-3 rounded-lg border text-left ${
                patchOpcode === "NOP" ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" : "bg-[var(--color-background)]"
              }`}
            >
              <div className="font-bold text-xs text-emerald-400">NOP 90 90 (Bypass)</div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-1">Selalu lewati pemeriksaan tanpa kondisi.</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
