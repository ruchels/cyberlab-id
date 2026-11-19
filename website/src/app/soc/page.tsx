"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Flame,
  Activity,
  Crosshair,
  Search,
  BookOpen,
  Server,
  Layers,
  Bot,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileText,
  Lock,
  ArrowRight,
  Database,
  Radio,
  Download,
  Upload,
} from "lucide-react";
import { Card, CardHeader, CardBody, Badge, Button, Input, SecurityRadar } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useSound } from "@/lib/sound-context";

type SocTab =
  | "overview"
  | "events"
  | "alerts"
  | "incidents"
  | "threat_intel"
  | "mitre"
  | "forensics"
  | "assets"
  | "playbooks"
  | "training";

export default function SocOperationsCenterPage() {
  const { user } = useAuth();
  const { playTab, playClick, playSuccess, playAlert } = useSound();
  const [activeTab, setActiveTab] = useState<SocTab>("overview");
  const [loading, setLoading] = useState(true);

  // Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [mitreMatrix, setMitreMatrix] = useState<any[]>([]);
  const [forensicCases, setForensicCases] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);

  // Modals & Active Selections
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [rawLogInput, setRawLogInput] = useState("");
  const [sourceTypeInput, setSourceTypeInput] = useState("web");

  const [activeAlertDetail, setActiveAlertDetail] = useState<any | null>(null);
  const [alertNoteText, setAlertNoteText] = useState("");
  const [aiAssistantData, setAiAssistantData] = useState<any | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [newIncTitle, setNewIncTitle] = useState("");
  const [newIncCategory, setNewIncCategory] = useState("account_compromise");
  const [newIncSeverity, setNewIncSeverity] = useState("high");
  const [newIncContainment, setNewIncContainment] = useState("");

  const [showForensicModal, setShowForensicModal] = useState(false);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseDesc, setCaseDesc] = useState("");
  const [evidenceName, setEvidenceName] = useState("");

  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch metrics on mount
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/soc/overview");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to load SOC overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Fetch tab data on demand
  useEffect(() => {
    if (activeTab === "events") {
      fetch("/api/soc/events")
        .then((r) => r.json())
        .then((d) => setEvents(d.events || []));
    } else if (activeTab === "alerts") {
      fetch("/api/soc/alerts")
        .then((r) => r.json())
        .then((d) => setAlerts(d.alerts || []));
    } else if (activeTab === "incidents") {
      fetch("/api/soc/incidents")
        .then((r) => r.json())
        .then((d) => setIncidents(d.incidents || []));
    } else if (activeTab === "threat_intel") {
      fetch("/api/soc/threat-intel")
        .then((r) => r.json())
        .then((d) => setIndicators(d.indicators || []));
    } else if (activeTab === "mitre") {
      fetch("/api/soc/mitre")
        .then((r) => r.json())
        .then((d) => setMitreMatrix(d.matrix || []));
    } else if (activeTab === "forensics") {
      fetch("/api/soc/forensics")
        .then((r) => r.json())
        .then((d) => setForensicCases(d.cases || []));
    } else if (activeTab === "assets") {
      fetch("/api/soc/assets")
        .then((r) => r.json())
        .then((d) => setAssets(d.assets || []));
    } else if (activeTab === "playbooks") {
      fetch("/api/soc/playbooks")
        .then((r) => r.json())
        .then((d) => setPlaybooks(d.playbooks || []));
    } else if (activeTab === "training") {
      fetch("/api/soc/scenarios")
        .then((r) => r.json())
        .then((d) => setScenarios(d.scenarios || []));
    }
  }, [activeTab]);

  // Handlers
  const handleIngestLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawLogInput.trim()) return;

    try {
      const res = await fetch("/api/soc/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_log: rawLogInput,
          source_type: sourceTypeInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActionMessage({ type: "success", text: data.message });
      setShowIngestModal(false);
      setRawLogInput("");
      fetchOverview();
      if (activeTab === "events") {
        const evRes = await fetch("/api/soc/events");
        const evData = await evRes.json();
        setEvents(evData.events || []);
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleOpenAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/soc/alerts/${alertId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveAlertDetail(data);
        setAiAssistantData(null);
      }
    } catch (err) {
      console.error("Failed to load alert detail:", err);
    }
  };

  const handleAddAlertNote = async () => {
    if (!activeAlertDetail || !alertNoteText.trim()) return;
    try {
      const res = await fetch(`/api/soc/alerts/${activeAlertDetail.alert.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: alertNoteText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ type: "success", text: "Catatan investigasi berhasil dicatat (+40 XP)" });
      setAlertNoteText("");
      handleOpenAlert(activeAlertDetail.alert.id);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleAskAiAssistant = async () => {
    if (!activeAlertDetail) return;
    setLoadingAi(true);
    try {
      const res = await fetch("/api/soc/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: activeAlertDetail.alert.id, query_type: "triage" }),
      });
      const data = await res.json();
      if (res.ok) setAiAssistantData(data.analysis);
    } catch (err) {
      console.error("AI SOC error:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/soc/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newIncTitle,
          category: newIncCategory,
          severity: newIncSeverity,
          containment_plan: newIncContainment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActionMessage({ type: "success", text: `${data.incident_number} berhasil dideklarasikan (+50 XP)` });
      setShowIncidentModal(false);
      setNewIncTitle("");
      setNewIncContainment("");
      if (activeTab === "incidents") {
        const r = await fetch("/api/soc/incidents");
        const d = await r.json();
        setIncidents(d.incidents || []);
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleLaunchScenario = async (scenarioId: string) => {
    try {
      const res = await fetch("/api/soc/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActionMessage({ type: "success", text: data.message });
      setActiveTab("alerts");
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateForensicCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/soc/forensics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: caseTitle,
          description: caseDesc,
          evidence_items: [{ name: evidenceName || "memory_dump.raw", type: "raw_image" }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActionMessage({ type: "success", text: `${data.case_number} berhasil dibuat dengan hash SHA-256 (+50 XP)` });
      setShowForensicModal(false);
      setCaseTitle("");
      setCaseDesc("");
      const r = await fetch("/api/soc/forensics");
      const d = await r.json();
      setForensicCases(d.cases || []);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-mono flex items-center justify-between ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#101623] to-[#090d16] border border-[var(--color-border)] p-6 sm:p-10">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                SECURITY OPERATIONS CENTER (SOC)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                SIMULATION & TELEMETRY ENGINE READY
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--color-text)]">
              Blue Team & Cyber Defense Operations
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Pusat pemantauan keamanan siber bertahan terpadu. Lakukan triase alert, deteksi anomali jaringan,
              investigasi insiden secara terstruktur, analisis intelijen ancaman MITRE ATT&CK, dan praktik penanganan insiden di lingkungan simulasi aman.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2.5 shrink-0">
            <Button
              variant="accent"
              size="sm"
              onClick={() => setShowIngestModal(true)}
              className="font-mono text-xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Ingest Log Telemetri
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowIncidentModal(true)}
              className="font-mono text-xs flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" /> Deklarasikan Insiden
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab("training")}
              className="font-mono text-xs flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Lab Simulasi SOC
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[var(--color-border)] overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max pb-2">
          {[
            { id: "overview" as const, label: "Ikhtisar SOC", icon: Activity },
            { id: "events" as const, label: "Stream Log Event", icon: Terminal },
            { id: "alerts" as const, label: "Alert & Triase", icon: ShieldAlert },
            { id: "incidents" as const, label: "Incident Response", icon: Flame },
            { id: "threat_intel" as const, label: "Threat Intel (IoC)", icon: Crosshair },
            { id: "mitre" as const, label: "MITRE ATT&CK", icon: Layers },
            { id: "forensics" as const, label: "Digital Forensik", icon: Search },
            { id: "assets" as const, label: "Aset & Kerentanan", icon: Server },
            { id: "playbooks" as const, label: "Playbook Respons", icon: BookOpen },
            { id: "training" as const, label: "Lab Simulasi", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  playTab();
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Total Event</span>
              <p className="text-2xl font-bold font-mono text-[var(--color-text)]">{metrics.summary.total_events}</p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Alert Aktif</span>
              <p className="text-2xl font-bold font-mono text-cyan-400">{metrics.summary.active_alerts}</p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-rose-400 uppercase font-bold">Kritis (Critical)</span>
              <p className="text-2xl font-bold font-mono text-rose-400">{metrics.summary.critical_alerts}</p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Tinggi (High)</span>
              <p className="text-2xl font-bold font-mono text-amber-400">{metrics.summary.high_alerts}</p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Insiden Terbuka</span>
              <p className="text-2xl font-bold font-mono text-indigo-400">{metrics.summary.open_incidents}</p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">MTTR Rata-rata</span>
              <p className="text-2xl font-bold font-mono text-emerald-400">
                {metrics.summary.mttd_mttr_measurable ? `${metrics.summary.mttr_minutes}m` : "N/A"}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Severity Distribution */}
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm font-mono text-[var(--color-text)] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> Distribusi Tingkat Keparahan Alert
                </h3>
              </div>
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-rose-400 font-bold">CRITICAL</span>
                    <strong>{metrics.severity_distribution.critical}</strong>
                  </div>
                  <div className="w-full bg-[var(--color-surface)] h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: `${Math.min(100, metrics.severity_distribution.critical * 20)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-amber-400 font-bold">HIGH</span>
                    <strong>{metrics.severity_distribution.high}</strong>
                  </div>
                  <div className="w-full bg-[var(--color-surface)] h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, metrics.severity_distribution.high * 20)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-cyan-400 font-bold">MEDIUM</span>
                    <strong>{metrics.severity_distribution.medium}</strong>
                  </div>
                  <div className="w-full bg-[var(--color-surface)] h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full" style={{ width: `${Math.min(100, metrics.severity_distribution.medium * 20)}%` }} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Perimeter Radar Centerpiece */}
            <Card className="bg-[#0b101c]/90 border-cyan-900/40 p-6 flex flex-col items-center justify-center space-y-3 cyber-glow-cyan">
              <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-cyan-400" /> Perimeter Defense Radar
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SCANNING
                </span>
              </div>
              <SecurityRadar size="sm" threatLevel="active" />
              <span className="text-[10px] font-mono text-slate-400 text-center">
                Simulasi 360° Threat Telemetry &amp; HoneyPot Ingress
              </span>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--color-accent)]" />
                <h3 className="font-bold text-sm font-mono text-[var(--color-text)]">Aksi Cepat Analis SOC</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("alerts")}
                  className="w-full p-3 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-left transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--color-text)]">
                    <ShieldAlert className="w-4 h-4 text-rose-400" /> Buka Antrean Alert & Triase Investigasi
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
                <button
                  onClick={() => setActiveTab("playbooks")}
                  className="w-full p-3 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-left transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--color-text)]">
                    <BookOpen className="w-4 h-4 text-cyan-400" /> Tinjau SOP & Playbook Respons Keamanan
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
                <button
                  onClick={() => setActiveTab("training")}
                  className="w-full p-3 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-left transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--color-text)]">
                    <Sparkles className="w-4 h-4 text-[var(--color-accent)]" /> Jalankan Simulasi Pelatihan Blue Team
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: EVENTS */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Stream Telemetri Log Keamanan ({events.length})</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Normalisasi log multi-sumber (Auth, Web, Network, DNS, Syslog)</p>
            </div>
            <Button variant="accent" size="sm" onClick={() => setShowIngestModal(true)} className="font-mono text-xs">
              + Ingest Log Baru
            </Button>
          </div>

          <div className="overflow-x-auto border border-[var(--color-border)] rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] uppercase">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Sumber / IP</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Payload Ringkas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[#0d121f]">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[var(--color-surface)] transition-colors">
                    <td className="px-4 py-3 text-[var(--color-text-muted)] truncate max-w-[130px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-cyan-400">{evt.source_host}</td>
                    <td className="px-4 py-3 text-zinc-300 uppercase">{evt.source_type}</td>
                    <td className="px-4 py-3 text-zinc-300">{evt.event_category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          evt.severity === "critical"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : evt.severity === "high"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] font-mono text-[11px] truncate max-w-[280px]">
                      {evt.raw_payload}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALERTS & TRIAGE */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Antrean Alert & Triase Investigasi ({alerts.length})</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Alert terdeteksi oleh SOC Detection Engine berbasis pola MITRE ATT&CK</p>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.map((alr) => (
              <Card
                key={alr.id}
                className="bg-[#0d121f] border-[var(--color-border)] hover:border-cyan-500/50 transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => handleOpenAlert(alr.id)}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        alr.severity === "critical"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : alr.severity === "high"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      }`}
                    >
                      {alr.severity}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)] uppercase">
                      STATUS: {alr.status}
                    </span>
                    {alr.mitre_technique_id && (
                      <span className="text-[10px] font-mono text-zinc-400">ATT&CK {alr.mitre_technique_id}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-[var(--color-text)]">{alr.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">{alr.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div className="text-right">
                    <span className="block text-[var(--color-text-muted)]">Aset Terdampak:</span>
                    <span className="text-cyan-400 font-bold">{alr.affected_asset}</span>
                  </div>
                  <Button variant="secondary" size="sm" className="font-mono text-xs flex items-center gap-1">
                    Investigasi <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INCIDENTS */}
      {activeTab === "incidents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Pusat Tanggap Darurat Insiden ({incidents.length})</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Manajemen siklus hidup insiden (Deteksi, Penahanan, Eradikasi, Pemulihan)</p>
            </div>
            <Button variant="accent" size="sm" onClick={() => setShowIncidentModal(true)} className="font-mono text-xs">
              + Deklarasikan Insiden Baru
            </Button>
          </div>

          <div className="space-y-4">
            {incidents.map((inc) => (
              <Card key={inc.id} className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-rose-400">{inc.incident_number}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-cyan-400 uppercase font-bold">
                        FASE: {inc.status}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">Kategori: {inc.category}</span>
                    </div>
                    <h4 className="font-bold text-base text-[var(--color-text)]">{inc.title}</h4>
                  </div>
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">
                    Lead: {inc.lead_analyst_name || "Staff"}
                  </span>
                </div>

                {inc.containment_plan && (
                  <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs font-mono space-y-1">
                    <span className="text-[10px] uppercase text-amber-400 font-bold block">Rencana Penahanan (Containment):</span>
                    <p className="text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">{inc.containment_plan}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--color-text-muted)]">
                  <span>Dideklarasikan: {new Date(inc.declared_at).toLocaleDateString()}</span>
                  <span className="text-emerald-400 font-bold">✓ Human Approval Enforced</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: THREAT INTEL */}
      {activeTab === "threat_intel" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Pusat Intelijen Ancaman (Threat Intelligence IoC)</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">Katalog indikator kompromi (IoC) teratribusi sumber CISA, MITRE, dan honeypot</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {indicators.map((ioc) => (
              <Card key={ioc.id} className="bg-[#0d121f] border-[var(--color-border)] p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] font-bold">
                    {ioc.indicator_type}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">Keyakinan: {ioc.confidence_score}%</span>
                </div>
                <div>
                  <code className="text-sm font-bold font-mono text-[var(--color-text)] block truncate">{ioc.indicator_value}</code>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{ioc.context_notes}</p>
                </div>
                <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)]">
                  <span>Sumber: {ioc.source_attribution}</span>
                  <span className="text-emerald-400">✓ Aktif</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MITRE ATT&CK */}
      {activeTab === "mitre" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Matriks Cakupan MITRE ATT&CK Enterprise</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">Pemetaan deteksi alert dan aturan defensif terhadap taktik siber penyerang</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mitreMatrix.map((tactic) => (
              <Card key={tactic.id} className="bg-[#0d121f] border-[var(--color-border)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold" style={{ color: tactic.color }}>
                    {tactic.name}
                  </span>
                  <Badge variant={tactic.rule_count > 0 ? "accent" : "secondary"} size="sm">
                    {tactic.rule_count} Rule
                  </Badge>
                </div>
                {tactic.techniques_covered && tactic.techniques_covered.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {tactic.techniques_covered.map((tech: any, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs font-mono">
                        <span className="text-cyan-400 font-bold block">{tech.technique_id}</span>
                        <span className="text-[var(--color-text)] truncate block">{tech.rule_name}</span>
                        <span className="text-[10px] text-zinc-400">{tech.alerts_count} Alert Terpicu</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-mono text-[var(--color-text-muted)]">Belum ada rule yang dipetakan</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: DIGITAL FORENSICS */}
      {activeTab === "forensics" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Kasus Digital Forensik & Chain of Custody ({forensicCases.length})</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Manajemen barang bukti digital, preservasi read-only, dan verifikasi hash SHA-256</p>
            </div>
            <Button variant="accent" size="sm" onClick={() => setShowForensicModal(true)} className="font-mono text-xs">
              + Buat Kasus Forensik
            </Button>
          </div>

          <div className="space-y-4">
            {forensicCases.map((fcase) => (
              <Card key={fcase.id} className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400">{fcase.case_number}</span>
                    <h4 className="font-bold text-base text-[var(--color-text)] mt-1">{fcase.title}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{fcase.description}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] uppercase font-bold">
                    {fcase.status}
                  </span>
                </div>

                {fcase.evidence_inventory && fcase.evidence_inventory.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] block">Inventaris Bukti Digital:</span>
                    {fcase.evidence_inventory.map((evd: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--color-text)]">{evd.name} ({evd.type})</span>
                          <span className="text-[10px] text-emerald-400">✓ SHA-256 Verified</span>
                        </div>
                        <code className="text-[10px] text-zinc-400 block truncate">Hash: {evd.sha256}</code>
                        <span className="text-[10px] text-[var(--color-text-muted)] block">Rantai Bukti: {evd.custody_log}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: ASSETS & VULNERABILITIES */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Inventaris Aset Defensif & Mitigasi CVE ({assets.length})</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">Pemetaan server, firewall gateway, dan riwayat mitigasi kerentanan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset) => (
              <Card key={asset.id} className="bg-[#0d121f] border-[var(--color-border)] p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-cyan-400 font-bold uppercase">
                    {asset.category}
                  </span>
                  <Badge variant={asset.criticality === "critical" ? "destructive" : "accent"} size="sm">
                    {asset.criticality.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-text)]">{asset.name}</h4>
                  <div className="text-xs font-mono text-[var(--color-text-muted)] flex items-center gap-3 mt-1">
                    <span>IP: {asset.ip_address}</span>
                    <span>Host: {asset.hostname}</span>
                  </div>
                </div>

                {asset.vulnerabilities && asset.vulnerabilities.length > 0 && (
                  <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-1.5 text-xs font-mono">
                    <span className="text-[10px] text-zinc-400 uppercase block font-bold">Kerentanan Terdaftar:</span>
                    {asset.vulnerabilities.map((v: any, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-[var(--color-surface)] flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-400">{v.cve_id} (CVSS {v.cvss_score})</span>
                        <span className="text-[10px] text-emerald-400 uppercase font-bold">{v.remediation_status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: PLAYBOOKS */}
      {activeTab === "playbooks" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Pustaka Playbook Respons Keamanan ({playbooks.length})</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">Panduan investigasi taktis, penahanan sistem, dan pemulihan insiden bertaraf standar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playbooks.map((ply) => (
              <Card key={ply.id} className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] font-bold uppercase">
                    {ply.category}
                  </span>
                  <h4 className="font-bold text-base text-[var(--color-text)] mt-2">{ply.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{ply.objective}</p>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                    <strong className="text-cyan-400 block mb-1">Langkah Penahanan (Containment):</strong>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                      {ply.containment_steps?.map((step: string, sIdx: number) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--color-text-muted)]">
                  <span>Checklist Terstruktur ({ply.checklist?.length || 4} item)</span>
                  <span className="text-emerald-400 font-bold">✓ SOP Resmi</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 10: TRAINING LABS */}
      {activeTab === "training" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Lab Simulasi SOC & Skenario Blue Team ({scenarios.length})</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">Praktikkan triase telemetri nyata, formulasi respons, dan mitigasi insiden di lingkungan terkendali</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {scenarios.map((scn) => (
              <Card key={scn.id} className="bg-[#0d121f] border-[var(--color-border)] p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-cyan-400 font-bold uppercase">
                      {scn.category}
                    </span>
                    <Badge variant="accent" size="sm">
                      {scn.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-base text-[var(--color-text)]">{scn.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{scn.briefing}</p>

                  {scn.objectives && scn.objectives.length > 0 && (
                    <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs font-mono space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold uppercase block">Target Analis:</span>
                      <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                        {scn.objectives.map((obj: string, oIdx: number) => (
                          <li key={oIdx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">Hadiah: +40 XP</span>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleLaunchScenario(scn.id)}
                    className="font-mono text-xs flex items-center gap-1.5"
                  >
                    <Terminal className="w-3.5 h-3.5" /> Luncurkan Skenario
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: INGEST LOG */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold font-mono text-base text-[var(--color-text)]">Ingest Log Telemetri Keamanan</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">
              Masukkan string log (Syslog, Nginx access log, Linux auth log, atau JSON security event) untuk dianalisis oleh Detection Engine.
            </p>
            <form onSubmit={handleIngestLog} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Tipe Sumber Log</label>
                <select
                  value={sourceTypeInput}
                  onChange={(e) => setSourceTypeInput(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] font-mono focus:outline-none"
                >
                  <option value="web">Web Server (HTTP/HTTPS / Nginx / Apache)</option>
                  <option value="auth">Authentication (Linux /var/log/auth.log)</option>
                  <option value="network">Network Traffic (TCP SYN / Port Scan)</option>
                  <option value="dns">DNS Resolver Query Stream</option>
                  <option value="endpoint">Endpoint / Process Execution</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Payload Log Mentah (Raw Log) *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Contoh: Failed password for root from 198.51.100.23 port 51102 ssh2"
                  value={rawLogInput}
                  onChange={(e) => setRawLogInput(e.target.value)}
                  className="w-full mt-1 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowIngestModal(false)} className="font-mono text-xs">
                  Batal
                </Button>
                <Button type="submit" variant="accent" size="sm" className="font-mono text-xs">
                  Proses & Evaluasi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALERT DETAIL & TRIAGE INVESTIGATION */}
      {activeAlertDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 space-y-6 my-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                  {activeAlertDetail.alert.severity} ALERT
                </span>
                <h3 className="font-bold font-mono text-lg text-[var(--color-text)] mt-0.5">
                  {activeAlertDetail.alert.title}
                </h3>
              </div>
              <button onClick={() => setActiveAlertDetail(null)} className="text-zinc-500 hover:text-white font-mono">
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2 text-xs font-mono">
              <div><strong className="text-zinc-400">Deskripsi:</strong> {activeAlertDetail.alert.description}</div>
              <div><strong className="text-zinc-400">Aset Sasaran:</strong> <span className="text-cyan-400 font-bold">{activeAlertDetail.alert.affected_asset}</span></div>
              {activeAlertDetail.alert.mitre_technique_id && (
                <div><strong className="text-zinc-400">MITRE ATT&CK:</strong> <span className="text-amber-400">{activeAlertDetail.alert.mitre_technique_id} ({activeAlertDetail.alert.mitre_tactic})</span></div>
              )}
            </div>

            {/* AI SOC Assistant Guidance */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                  <Bot className="w-4 h-4" /> Bimbingan AI SOC Analyst Assistant
                </div>
                {!aiAssistantData && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={loadingAi}
                    onClick={handleAskAiAssistant}
                    className="font-mono text-xs"
                  >
                    {loadingAi ? "Menganalisis..." : "Minta Rekomendasi AI"}
                  </Button>
                )}
              </div>

              {aiAssistantData && (
                <div className="space-y-2.5 text-xs font-mono text-zinc-300">
                  <p className="leading-relaxed">{aiAssistantData.summary}</p>
                  <div className="p-2.5 rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                    <strong className="text-emerald-400 block mb-1">Rekomendasi Penahanan Defensif:</strong>
                    <ul className="list-disc pl-4 space-y-1">
                      {aiAssistantData.recommended_actions?.map((act: string, aIdx: number) => (
                        <li key={aIdx}>{act}</li>
                      ))}
                    </ul>
                  </div>
                  <span className="text-[10px] text-zinc-500 block italic">
                    * {aiAssistantData.human_in_the_loop_notice}
                  </span>
                </div>
              )}
            </div>

            {/* Analyst Investigation Notes */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs font-mono uppercase text-[var(--color-text-muted)]">
                Catatan Analis & Rantai Bukti ({activeAlertDetail.notes?.length || 0})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeAlertDetail.notes?.map((n: any) => (
                  <div key={n.id} className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                      <span className="font-bold text-cyan-400">{n.author_name}</span>
                      <span>{new Date(n.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[var(--color-text)]">{n.note_text}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Tuliskan temuan investigasi atau tindakan containment..."
                  value={alertNoteText}
                  onChange={(e) => setAlertNoteText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] font-mono focus:outline-none"
                />
                <Button variant="accent" size="sm" onClick={handleAddAlertNote} className="font-mono text-xs">
                  Simpan Catatan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DECLARE INCIDENT */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold font-mono text-base text-[var(--color-text)]">Deklarasikan Tiket Insiden Keamanan</h3>
            <form onSubmit={handleCreateIncident} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Judul Insiden *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Terdeteksi Percobaan Penetrasi SSH & SQLi Terkoordinasi"
                  value={newIncTitle}
                  onChange={(e) => setNewIncTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[var(--color-text-secondary)]">Kategori Insiden</label>
                  <select
                    value={newIncCategory}
                    onChange={(e) => setNewIncCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] font-mono focus:outline-none"
                  >
                    <option value="account_compromise">Kompromi Akun (Brute Force / Credential)</option>
                    <option value="web_appsec">Serangan Aplikasi Web (SQLi, XSS)</option>
                    <option value="suspicious_network">Aktivitas Jaringan Mencurigakan (C2)</option>
                    <option value="malware_infection">Infeksi Malware / Trojan</option>
                    <option value="data_exposure">Kebocoran Data Sensitif</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-[var(--color-text-secondary)]">Tingkat Keparahan</label>
                  <select
                    value={newIncSeverity}
                    onChange={(e) => setNewIncSeverity(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] font-mono focus:outline-none"
                  >
                    <option value="high">HIGH</option>
                    <option value="critical">CRITICAL</option>
                    <option value="medium">MEDIUM</option>
                    <option value="low">LOW</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Rencana Penahanan Awal (Containment Plan)</label>
                <textarea
                  rows={3}
                  placeholder="1. Drop subnet IP sumber pada perimeter firewall&#10;2. Nonaktifkan otentikasi password SSH pada host target"
                  value={newIncContainment}
                  onChange={(e) => setNewIncContainment(e.target.value)}
                  className="w-full mt-1 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text)] focus:outline-none resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowIncidentModal(false)} className="font-mono text-xs">
                  Batal
                </Button>
                <Button type="submit" variant="accent" size="sm" className="font-mono text-xs">
                  Deklarasikan Tiket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE FORENSIC CASE */}
      {showForensicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold font-mono text-base text-[var(--color-text)]">Buat Kasus Digital Forensik Baru</h3>
            <form onSubmit={handleCreateForensicCase} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Judul Kasus *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Analisis Memory Dump & PCAP Traffic C2 Server"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Nama Berkas Bukti Awal</label>
                <input
                  type="text"
                  placeholder="suspicious_c2_traffic.pcap"
                  value={evidenceName}
                  onChange={(e) => setEvidenceName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Deskripsi Investigasi</label>
                <textarea
                  rows={2}
                  placeholder="Tujuan analisis forensik dan preservasi rantai bukti..."
                  value={caseDesc}
                  onChange={(e) => setCaseDesc(e.target.value)}
                  className="w-full mt-1 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text)] focus:outline-none resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowForensicModal(false)} className="font-mono text-xs">
                  Batal
                </Button>
                <Button type="submit" variant="accent" size="sm" className="font-mono text-xs">
                  Buka Kasus Forensik
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
