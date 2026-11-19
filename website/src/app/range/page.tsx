"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import {
  Shield,
  Terminal,
  Network,
  Globe,
  Binary,
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Activity,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_minutes: number;
  xp_reward: number;
  cpu_limit: string;
  memory_limit: string;
  isCompleted: boolean;
}

export default function CyberRangeDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [tRes, sRes, hRes] = await Promise.all([
        fetch("/api/range/templates"),
        fetch("/api/range/sessions"),
        fetch("/api/range/health"),
      ]);

      if (tRes.ok) {
        const tData = await tRes.json();
        setTemplates(tData.templates || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setActiveSession(sData.activeSession || null);
      }
      if (hRes.ok) {
        const hData = await hRes.json();
        setHealth(hData.health || null);
      }
    } catch (err) {
      console.error("Failed to load range data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleStartSession = async (templateId: string) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setLaunchingId(templateId);
    setLaunchError(null);

    try {
      const res = await fetch("/api/range/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();

      if (res.ok && data.session) {
        router.push(`/range/${data.session.id}`);
      } else {
        setLaunchError(data.error || "Gagal meluncurkan lab.");
      }
    } catch {
      setLaunchError("Tidak dapat terhubung ke Lab Execution Service.");
    } finally {
      setLaunchingId(null);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Linux":
        return <Terminal className="w-5 h-5 text-[var(--color-accent)]" />;
      case "Networking":
        return <Network className="w-5 h-5 text-amber-400" />;
      case "Web Security":
        return <Globe className="w-5 h-5 text-purple-400" />;
      case "Digital Forensics":
        return <Binary className="w-5 h-5 text-emerald-400" />;
      case "Reverse Engineering":
        return <Cpu className="w-5 h-5 text-sky-400" />;
      default:
        return <Shield className="w-5 h-5 text-[var(--color-accent)]" />;
    }
  };

  const filteredTemplates = templates.filter(
    (t) => category === "all" || t.category.toLowerCase() === category.toLowerCase()
  );

  return (
    <div className="min-h-screen py-8 space-y-8 max-w-7xl mx-auto font-mono text-xs">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm">
            <Activity className="w-3.5 h-3.5 mr-1" />
            CYBER RANGE &amp; VIRTUAL LABS
          </Badge>
          <span className="text-xs text-[var(--color-text-muted)]">
            Lingkungan Hands-on Terisolasi • Resource Bounded
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)]">
              Cyber Range Training Platform
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
              Latih keterampilan pertahanan dan analisis keamanan siber di lingkungan virtual terisolasi.
              Setiap sesi memiliki batas waktu, kuota sumber daya (CPU &amp; Memori), dan validasi kriteria otomatis.
            </p>
          </div>

          {/* Engine Status Health Pill */}
          {health && (
            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="font-bold text-[var(--color-text)] text-xs">
                  {health.activeDriver}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)]">
                  {health.totalActiveSessions} Sesi Aktif • Batas: {health.systemResourceLimits.defaultCpuLimit} / {health.systemResourceLimits.defaultMemoryLimit}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Session Notification Banner */}
      {activeSession && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--color-accent)]/15 via-[var(--color-surface)] to-[var(--color-surface)] border border-[var(--color-accent)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-[var(--color-accent)]/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 flex items-center justify-center text-[var(--color-accent)]">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--color-text)]">
                  Sesi Lab Anda Sedang Berjalan: {activeSession.template_title}
                </span>
                <Badge variant="accent" size="sm">
                  RUNNING
                </Badge>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Alamat IP: <code className="text-[var(--color-accent)]">{activeSession.ip_address}</code> • Berakhir:{" "}
                {new Date(activeSession.expires_at).toLocaleTimeString("id-ID")}
              </div>
            </div>
          </div>

          <Link href={`/range/${activeSession.id}`}>
            <Button variant="primary" size="sm" className="font-mono text-xs flex items-center gap-1.5 whitespace-nowrap">
              <Play className="w-3.5 h-3.5" /> Buka Sesi Lab
            </Button>
          </Link>
        </div>
      )}

      {/* Error Banner */}
      {launchError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{launchError}</span>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "Linux", "Networking", "Web Security", "Digital Forensics", "Reverse Engineering"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
              category.toLowerCase() === cat.toLowerCase()
                ? "bg-[var(--color-accent)] text-[var(--color-background)] font-bold shadow"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {cat === "all" ? "Semua Template Lab" : cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[var(--color-text-muted)]">
          Memuat template Cyber Range dari registry...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((t) => (
            <Card
              key={t.id}
              className={`border transition-all flex flex-col justify-between ${
                t.isCompleted
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
              }`}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center">
                    {getCategoryIcon(t.category)}
                  </div>
                  <Badge variant={t.isCompleted ? "success" : "default"} size="sm">
                    {t.isCompleted ? "SELESAI" : t.difficulty}
                  </Badge>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-[var(--color-accent)] uppercase">
                    {t.category} LAB
                  </div>
                  <h3 className="font-bold text-base text-[var(--color-text)] mt-0.5">
                    {t.title}
                  </h3>
                </div>
              </CardHeader>

              <CardBody className="space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs">
                  {t.description}
                </p>

                <div className="p-2.5 rounded bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-1 text-[11px] text-[var(--color-text-muted)]">
                  <div className="flex justify-between">
                    <span>Durasi Sesi:</span>
                    <span className="text-[var(--color-text)] font-bold">{t.duration_minutes} Menit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alokasi Resource:</span>
                    <span>{t.cpu_limit} / {t.memory_limit}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-[var(--color-border-subtle)]">
                    <span>Reward Penyelesaian:</span>
                    <span>+{t.xp_reward} XP</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                  {activeSession && activeSession.template_id === t.id ? (
                    <Link href={`/range/${activeSession.id}`}>
                      <Button variant="primary" size="sm" className="w-full text-xs font-mono">
                        Lanjutkan Sesi
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      onClick={() => handleStartSession(t.id)}
                      disabled={launchingId === t.id}
                      variant="primary"
                      size="sm"
                      className="w-full text-xs font-mono flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {launchingId === t.id ? "Menginisialisasi Sesi..." : "Luncurkan Lab"}
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
