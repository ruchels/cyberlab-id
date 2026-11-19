"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge, Button, Input } from "@/components/ui";
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Square,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  HelpCircle,
  Copy,
  AlertCircle,
} from "lucide-react";
import { TerminalExecutionResult } from "@/lib/server/range/types";

interface TerminalRangeProps {
  sessionId: string;
  template: any;
  remainingSeconds: number;
  initialCheckpoints: Record<string, boolean>;
  onComplete: (evidenceToken?: string) => Promise<void>;
  onStop: () => Promise<void>;
  onRestart: () => Promise<void>;
}

export function TerminalRangeView({
  sessionId,
  template,
  remainingSeconds: initialSeconds,
  initialCheckpoints,
  onComplete,
  onStop,
  onRestart,
}: TerminalRangeProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [history, setHistory] = useState<
    { type: "input" | "output"; text: string; prompt?: string }[]
  >([
    {
      type: "output",
      text: "=========================================================\nCyberLab-ID Range Environment v2.4 (Isolated Safe Sandbox)\nMode: [EMBEDDED ISOLATED LAB RUNNER (SAFE HOST BOUND)]\nKetik 'help' untuk daftar perintah yang didukung.\n=========================================================",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [prompt, setPrompt] = useState("student@cyberlab-range:~$ ");
  const [checkpoints, setCheckpoints] = useState<Record<string, boolean>>(initialCheckpoints);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Append to local terminal history
    setHistory((prev) => [...prev, { type: "input", text: cmd, prompt }]);
    setCmdHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    setInputVal("");

    if (cmd === "clear") {
      setHistory([]);
      return;
    }

    try {
      const res = await fetch(`/api/range/sessions/${sessionId}/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        const result: TerminalExecutionResult = data.result;
        setHistory((prev) => [...prev, { type: "output", text: result.output }]);
        setPrompt(result.prompt);
        setCheckpoints(result.updatedCheckpoints);
      } else {
        setHistory((prev) => [
          ...prev,
          { type: "output", text: `[ERROR] ${data.error || "Gagal mengeksekusi perintah."}` },
        ]);
      }
    } catch {
      setHistory((prev) => [
        ...prev,
        { type: "output", text: "[ERROR] Koneksi ke host terminal terputus." },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx >= cmdHistory.length) {
          setHistoryIdx(-1);
          setInputVal("");
        } else {
          setHistoryIdx(nextIdx);
          setInputVal(cmdHistory[nextIdx]);
        }
      }
    }
  };

  let criteriaObj: any = {};
  try {
    criteriaObj = JSON.parse(template.verification_criteria || "{}");
  } catch {}
  const requiredCheckpoints = criteriaObj.checkpoints || [];
  const completedCount = requiredCheckpoints.filter((cp: any) => Boolean(checkpoints[cp.id])).length;
  const allPassed = requiredCheckpoints.length > 0 && completedCount === requiredCheckpoints.length;

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Session Action Header */}
      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-accent)] font-bold">
            <TerminalIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--color-text)]">
                {template.title}
              </span>
              <Badge variant="accent" size="sm">
                RUNNING
              </Badge>
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              Session ID: <code className="text-[var(--color-accent)]">{sessionId}</code>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Sisa Waktu:</span>
            <span className="font-bold text-amber-400">{formatRemaining(remaining)}</span>
          </div>

          <Button onClick={onRestart} variant="outline" size="sm" className="text-xs flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button onClick={onStop} variant="outline" size="sm" className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 flex items-center gap-1">
            <Square className="w-3.5 h-3.5" /> Hentikan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Terminal Window (Left 3 cols) */}
        <div className="lg:col-span-3 rounded-xl bg-[#070b12] border border-[var(--color-border)] shadow-2xl flex flex-col h-[520px] overflow-hidden">
          {/* Window Title Bar */}
          <div className="px-4 py-2.5 bg-[#0d131f] border-b border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)] select-none">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="ml-2 font-bold text-[var(--color-text)]">
                student@cyberlab-range:~ (xterm-256color)
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">● CONNECTED</span>
          </div>

          {/* Terminal Output Area */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex-1 p-4 overflow-y-auto space-y-2 text-[11px] leading-relaxed cursor-text"
          >
            {history.map((h, i) => (
              <div key={i} className="whitespace-pre-wrap font-mono">
                {h.type === "input" ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--color-accent)] font-bold">{h.prompt}</span>
                    <span className="text-white font-bold">{h.text}</span>
                  </div>
                ) : (
                  <div className="text-[var(--color-text-secondary)]">{h.text}</div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Terminal Input Bar */}
          <form
            onSubmit={handleCommand}
            className="px-4 py-3 bg-[#0d131f] border-t border-[var(--color-border-subtle)] flex items-center gap-2"
          >
            <span className="text-[var(--color-accent)] font-bold whitespace-nowrap">
              {prompt}
            </span>
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs placeholder-slate-600"
              placeholder="Ketik perintah di sini (e.g. ls, pwd, cat, find)..."
            />
          </form>
        </div>

        {/* Checkpoint & Instructions Sidebar (Right 1 col) */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--color-text)] text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                Kemajuan Evaluasi
              </span>
              <Badge variant={allPassed ? "success" : "default"} size="sm">
                {completedCount} / {requiredCheckpoints.length} Selesai
              </Badge>
            </div>

            <div className="space-y-2 pt-1">
              {requiredCheckpoints.map((cp: any) => {
                const isPassed = Boolean(checkpoints[cp.id]);
                return (
                  <div
                    key={cp.id}
                    className={`p-2.5 rounded-lg border transition-all text-[11px] flex items-start gap-2.5 ${
                      isPassed
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        isPassed ? "text-emerald-400" : "text-slate-600"
                      }`}
                    />
                    <div className="leading-snug">
                      <div className={isPassed ? "font-bold text-[var(--color-text)]" : ""}>
                        {cp.description}
                      </div>
                      {cp.command_trigger && (
                        <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-mono">
                          Trig: <code>{cp.command_trigger}</code>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={() => onComplete()}
              disabled={!allPassed || isSubmitting}
              variant="primary"
              size="sm"
              className="w-full text-xs font-mono py-2.5 mt-2 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Selesaikan Lab &amp; Klaim +{template.xp_reward} XP
            </Button>
          </div>

          {/* Quick Guide */}
          <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2 text-[11px] text-[var(--color-text-muted)]">
            <span className="font-bold text-[var(--color-accent)] block uppercase">
              Petunjuk Pengerjaan:
            </span>
            <p className="leading-relaxed whitespace-pre-line">
              {template.instructions}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
