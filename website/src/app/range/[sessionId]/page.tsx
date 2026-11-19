"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui";
import {
  TerminalRangeView,
  NetworkRangeView,
  WebRangeView,
  ForensicsRangeView,
  ReverseRangeView,
} from "@/components/range";
import {
  Terminal,
  Network,
  Globe,
  Binary,
  Cpu,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Square,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SessionRunnerPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Completion modal state
  const [completionResult, setCompletionResult] = useState<any>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/range/sessions/${sessionId}`);
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
      } else {
        setError(data.error || "Gagal memuat sesi lab.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server lab.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId, user]);

  const handleStopSession = async () => {
    if (!confirm("Apakah Anda yakin ingin menghentikan sesi lab ini?")) return;
    try {
      const res = await fetch(`/api/range/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/range");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestartSession = async () => {
    if (!confirm("Reset lingkungan lab ke kondisi awal? Seluruh progres sesi akan dimulai ulang.")) return;
    try {
      const res = await fetch(`/api/range/sessions/${sessionId}`, { method: "POST" });
      if (res.ok) {
        fetchSession();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteSession = async (evidenceToken?: string) => {
    try {
      const res = await fetch(`/api/range/sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCompletionResult(data);
        await refreshUser();
      } else {
        alert(data.error || "Kriteria evaluasi belum terpenuhi.");
      }
    } catch {
      alert("Gagal memvalidasi penyelesaian sesi lab.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-mono text-xs text-[var(--color-text-muted)]">
        Menghubungkan ke instance Cyber Range...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto font-mono text-xs">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h1 className="text-base font-bold text-[var(--color-text)]">
          Sesi Tidak Tersedia
        </h1>
        <p className="text-[var(--color-text-muted)] leading-relaxed">
          {error || "Sesi lab tidak ditemukan, telah kedaluwarsa, atau Anda tidak memiliki akses ke sesi ini."}
        </p>
        <Link href="/range">
          <Button variant="primary" size="sm" className="font-mono text-xs">
            Kembali ke Daftar Range
          </Button>
        </Link>
      </div>
    );
  }

  const template = session.template;

  let parsedCheckpoints: Record<string, boolean> = {};
  try {
    parsedCheckpoints = JSON.parse(session.checkpoints_state || "{}");
  } catch {}

  const renderLabView = () => {
    switch (template.category) {
      case "Linux":
        return (
          <TerminalRangeView
            sessionId={sessionId}
            template={template}
            remainingSeconds={session.remainingSeconds || 3600}
            initialCheckpoints={parsedCheckpoints}
            onComplete={handleCompleteSession}
            onStop={handleStopSession}
            onRestart={handleRestartSession}
          />
        );
      case "Networking":
        return (
          <NetworkRangeView
            sessionId={sessionId}
            template={template}
            onComplete={handleCompleteSession}
            onStop={handleStopSession}
          />
        );
      case "Web Security":
        return (
          <WebRangeView
            sessionId={sessionId}
            template={template}
            onComplete={handleCompleteSession}
            onStop={handleStopSession}
          />
        );
      case "Digital Forensics":
        return (
          <ForensicsRangeView
            sessionId={sessionId}
            template={template}
            onComplete={handleCompleteSession}
            onStop={handleStopSession}
          />
        );
      case "Reverse Engineering":
        return (
          <ReverseRangeView
            sessionId={sessionId}
            template={template}
            onComplete={handleCompleteSession}
            onStop={handleStopSession}
          />
        );
      default:
        return (
          <TerminalRangeView
            sessionId={sessionId}
            template={template}
            remainingSeconds={session.remainingSeconds || 3600}
            initialCheckpoints={parsedCheckpoints}
            onComplete={handleCompleteSession}
            onStop={handleStopSession}
            onRestart={handleRestartSession}
          />
        );
    }
  };

  return (
    <div className="min-h-screen py-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
        <Link
          href="/range"
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Portal Cyber Range
        </Link>
        <span className="text-[11px] text-[var(--color-accent)]">
          Host Isolated Runner • IP: {session.ip_address}
        </span>
      </div>

      {/* Main Dynamic Range Component */}
      {renderLabView()}

      {/* Completion Modal */}
      {completionResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface)] border border-emerald-500/50 p-6 space-y-4 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[var(--color-text)]">
                Praktikum Lab Selesai!
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                {completionResult.message}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border-subtle)] space-y-2 text-xs">
              <div className="flex justify-between font-bold text-amber-400">
                <span>XP Diperoleh:</span>
                <span>+{completionResult.xpAwarded} XP</span>
              </div>
              {completionResult.badgesUnlocked && completionResult.badgesUnlocked.length > 0 && (
                <div className="pt-2 border-t border-[var(--color-border-subtle)] text-purple-300">
                  <div className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">
                    Lencana Baru Terbuka:
                  </div>
                  <div className="font-bold mt-0.5">
                    {completionResult.badgesUnlocked.join(", ")}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link href="/range">
                <Button variant="primary" size="sm" className="w-full text-xs font-mono">
                  Kembali ke Dashboard Range
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
