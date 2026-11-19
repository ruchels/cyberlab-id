"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Award,
  Activity,
  FileText,
  Settings,
  Shield,
  PlusCircle,
  Search,
  CheckCircle2,
  Download,
  ExternalLink,
  Lock,
  ChevronRight,
  HelpCircle,
  Upload,
  BarChart3,
  Bot,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

type PortalTab =
  | "overview"
  | "academic"
  | "courses"
  | "assignments"
  | "labs"
  | "assessments"
  | "certificates"
  | "members"
  | "reports"
  | "settings";

export default function InstitutionPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<PortalTab>("overview");
  const [institution, setInstitution] = useState<any>(null);
  const [myMembership, setMyMembership] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab Data States
  const [departments, setDepartments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any>(null);
  const [aiSettings, setAiSettings] = useState<any>(null);

  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState<any | null>(null);

  // Form states
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("student");
  const [newMemberNIM, setNewMemberNIM] = useState("");

  const [newClassName, setNewClassName] = useState("");
  const [newClassTerm, setNewClassTerm] = useState("2026/2027 Ganjil");
  const [newClassDept, setNewClassDept] = useState("");

  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  const [certStudentId, setCertStudentId] = useState("");
  const [certTitle, setCertTitle] = useState("");

  const [csvText, setCsvText] = useState("");
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examResult, setExamResult] = useState<any | null>(null);

  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/institutions/${slug}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memuat portal institusi");
      }
      const data = await res.json();
      setInstitution(data.institution);
      setMyMembership(data.myMembership);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [slug, user]);

  // Load sub-tab data on demand
  useEffect(() => {
    if (!institution) return;

    if (activeTab === "academic") {
      fetch(`/api/institutions/${institution.id}/academic`)
        .then((r) => r.json())
        .then((d) => {
          setDepartments(d.departments || []);
          setClasses(d.classes || []);
        });
    } else if (activeTab === "courses") {
      fetch(`/api/institutions/${institution.id}/courses`)
        .then((r) => r.json())
        .then((d) => setCourses(d.courses || []));
    } else if (activeTab === "assignments") {
      fetch(`/api/institutions/${institution.id}/assignments`)
        .then((r) => r.json())
        .then((d) => setAssignments(d.assignments || []));
    } else if (activeTab === "labs") {
      fetch(`/api/institutions/${institution.id}/labs`)
        .then((r) => r.json())
        .then((d) => setLabs(d.labs || []));
    } else if (activeTab === "assessments") {
      fetch(`/api/institutions/${institution.id}/assessments`)
        .then((r) => r.json())
        .then((d) => setAssessments(d.assessments || []));
    } else if (activeTab === "certificates") {
      fetch(`/api/institutions/${institution.id}/certificates`)
        .then((r) => r.json())
        .then((d) => setCertificates(d.certificates || []));
    } else if (activeTab === "members") {
      fetch(`/api/institutions/${institution.id}/members`)
        .then((r) => r.json())
        .then((d) => setMembers(d.members || []));
    } else if (activeTab === "reports") {
      fetch(`/api/institutions/${institution.id}/reports`)
        .then((r) => r.json())
        .then((d) => setReportsData(d));
    } else if (activeTab === "settings") {
      fetch(`/api/institutions/${institution.id}/ai-settings`)
        .then((r) => r.json())
        .then((d) => setAiSettings(d.settings));
    }
  }, [activeTab, institution]);

  const isInstructorOrAdmin =
    user?.role === "admin" ||
    ["owner", "admin", "academic_director", "department_admin", "instructor", "ta"].includes(
      myMembership?.role || ""
    );

  const isAdminOrOwner =
    user?.role === "admin" || ["owner", "admin", "academic_director"].includes(myMembership?.role || "");

  // Handlers
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/institutions/${institution.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: newMemberEmail,
          role: newMemberRole,
          student_id_number: newMemberNIM,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ type: "success", text: data.message });
      setShowMemberModal(false);
      setNewMemberEmail("");
      // Refresh members
      const r = await fetch(`/api/institutions/${institution.id}/members`);
      const d = await r.json();
      setMembers(d.members || []);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/institutions/${institution.id}/academic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "class",
          name: newClassName,
          academic_term: newClassTerm,
          department_id: newClassDept || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ type: "success", text: data.message });
      setShowClassModal(false);
      setNewClassName("");
      const r = await fetch(`/api/institutions/${institution.id}/academic`);
      const d = await r.json();
      setClasses(d.classes || []);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/institutions/${institution.id}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCourseTitle,
          code: newCourseCode,
          description: newCourseDesc,
          syllabus: ["Pengenalan & Ancaman Siber", "Konfigurasi Hardening", "Evaluasi Akhir"],
          module_ids: ["networking", "web-security"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ type: "success", text: data.message });
      setShowCourseModal(false);
      setNewCourseTitle("");
      setNewCourseCode("");
      const r = await fetch(`/api/institutions/${institution.id}/courses`);
      const d = await r.json();
      setCourses(d.courses || []);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/institutions/${institution.id}/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: certStudentId,
          title: certTitle,
          criteria: "Menyelesaikan seluruh kurikulum praktikum dan evaluasi nilai kelulusan institusi.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ type: "success", text: data.message });
      setShowCertModal(false);
      setCertTitle("");
      const r = await fetch(`/api/institutions/${institution.id}/certificates`);
      const d = await r.json();
      setCertificates(d.certificates || []);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleImportCSV = async () => {
    if (!csvText.trim()) return;
    try {
      const lines = csvText.trim().split("\n");
      const rows = lines.map((l) => {
        const parts = l.split(",");
        return {
          email_or_username: parts[0]?.trim(),
          role: parts[1]?.trim() || "student",
          student_id_number: parts[2]?.trim() || "",
        };
      });

      const res = await fetch(`/api/institutions/${institution.id}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ type: "success", text: data.message });
      setShowImportModal(false);
      setCsvText("");
      const r = await fetch(`/api/institutions/${institution.id}/members`);
      const d = await r.json();
      setMembers(d.members || []);
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleSubmitExam = async () => {
    if (!showExamModal) return;
    try {
      const res = await fetch(`/api/institutions/${institution.id}/assessments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_id: showExamModal.id,
          answers: examAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExamResult(data);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-mono text-[var(--color-text-muted)] space-y-3">
        <Building2 className="w-8 h-8 mx-auto animate-pulse text-[var(--color-accent)]" />
        <p>Memuat portal workspace institusi...</p>
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="py-24 max-w-md mx-auto text-center space-y-4">
        <Building2 className="w-12 h-12 mx-auto text-red-400" />
        <h2 className="text-xl font-bold font-mono text-[var(--color-text)]">Institusi Tidak Ditemukan</h2>
        <p className="text-xs text-[var(--color-text-secondary)]">{error || "Institusi dengan slug ini tidak terdaftar."}</p>
        <Link href="/institutions">
          <Button variant="secondary" className="font-mono text-xs">
            Kembali ke Direktori Institusi
          </Button>
        </Link>
      </div>
    );
  }

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

      {/* Institution Branding Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0d121f] border border-[var(--color-border)] p-6 sm:p-8">
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ backgroundColor: institution.brand_color || "#00ff9d" }}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl border border-[var(--color-border)] flex items-center justify-center font-mono font-bold text-2xl shadow-xl shrink-0"
              style={{
                backgroundColor: "#101623",
                color: institution.brand_color || "#00ff9d",
              }}
            >
              {institution.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-text)]">
                  {institution.name}
                </h1>
                {institution.is_verified === 1 && (
                  <Badge variant="accent" size="sm" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </Badge>
                )}
                <Badge variant="secondary" size="sm">
                  PAKET {institution.plan_tier.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                {institution.description || institution.welcome_message}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--color-text-muted)] pt-1">
                <span>Slug: <strong className="text-zinc-300">/{institution.slug}</strong></span>
                {institution.website_url && (
                  <a
                    href={institution.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    {institution.website_url.replace(/^https?:\/\//, "")} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {myMembership ? (
              <div className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono text-right">
                <span className="text-[10px] text-[var(--color-text-muted)] block uppercase">Peran Anda</span>
                <span className="font-bold text-[var(--color-accent)] uppercase">{myMembership.role}</span>
              </div>
            ) : (
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  if (!user) window.location.href = "/auth/login";
                  else setShowMemberModal(true);
                }}
                className="font-mono text-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Gabung Institusi
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[var(--color-border)] overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max pb-2">
          {[
            { id: "overview" as const, label: "Ikhtisar", icon: Building2 },
            { id: "academic" as const, label: "Departemen & Kelas", icon: GraduationCap },
            { id: "courses" as const, label: "Kurikulum & LMS", icon: BookOpen },
            { id: "assignments" as const, label: "Tugas", icon: FileText },
            { id: "labs" as const, label: "Cyber Range", icon: Activity },
            { id: "assessments" as const, label: "CTF & Ujian", icon: Shield },
            { id: "certificates" as const, label: "Sertifikat", icon: Award },
            { id: "members" as const, label: "Anggota", icon: Users },
            { id: "reports" as const, label: "Analitik & Laporan", icon: BarChart3 },
            { id: "settings" as const, label: "Pengaturan & AI", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Anggota</span>
              <p className="text-2xl font-bold font-mono text-[var(--color-text)]">{stats.total_members}</p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Departemen</span>
              <p className="text-2xl font-bold font-mono text-cyan-400">{stats.total_departments}</p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Kelas/Kohort</span>
              <p className="text-2xl font-bold font-mono text-indigo-400">{stats.total_classes}</p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Kursus LMS</span>
              <p className="text-2xl font-bold font-mono text-[var(--color-accent)]">{stats.total_courses}</p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Tugas</span>
              <p className="text-2xl font-bold font-mono text-amber-400">{stats.total_assignments}</p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center space-y-1">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Sertifikat</span>
              <p className="text-2xl font-bold font-mono text-emerald-400">{stats.total_certificates}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                <h3 className="font-bold text-sm font-mono text-[var(--color-text)]">Pesan Sambutan Institusi</h3>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border-subtle)] font-mono">
                &ldquo;{institution.welcome_message || "Selamat datang di platform pembelajaran cybersecurity terpadu."}&rdquo;
              </p>
              <div className="pt-2 text-xs font-mono text-[var(--color-text-muted)] flex items-center justify-between">
                <span>Narahubung: {institution.contact_email}</span>
                <span className="text-[var(--color-accent)]">✓ Status Aktif</span>
              </div>
            </Card>

            <Card className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm font-mono text-[var(--color-text)]">Akses Cepat Pembelajaran</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("courses")}
                  className="w-full p-3 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-left transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--color-text)]">
                    <BookOpen className="w-4 h-4 text-[var(--color-accent)]" /> Buka Kurikulum Kursus LMS
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
                <button
                  onClick={() => setActiveTab("labs")}
                  className="w-full p-3 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-left transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--color-text)]">
                    <Activity className="w-4 h-4 text-cyan-400" /> Praktikum Cyber Range Kelas
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
                <button
                  onClick={() => setActiveTab("assessments")}
                  className="w-full p-3 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-between text-xs font-mono text-left transition-colors"
                >
                  <span className="flex items-center gap-2 text-[var(--color-text)]">
                    <Shield className="w-4 h-4 text-amber-400" /> Asesmen Ujian & CTF Tertutup
                  </span>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: ACADEMIC (DEPARTMENTS & CLASSES) */}
      {activeTab === "academic" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Struktur Akademik</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Fakultas/Departemen, Kelas/Kohort, dan Semester</p>
            </div>
            {isInstructorOrAdmin && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => setShowClassModal(true)}
                className="font-mono text-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Buat Kelas Baru
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departments List */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase text-[var(--color-text-muted)] font-bold">
                Departemen / Fakultas ({departments.length})
              </h4>
              <div className="space-y-2">
                {departments.map((dept) => (
                  <Card key={dept.id} className="bg-[#0d121f] border-[var(--color-border)] p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-cyan-400 font-bold">
                        {dept.code}
                      </span>
                      <h5 className="font-bold text-sm text-[var(--color-text)] mt-1">{dept.name}</h5>
                      <span className="text-xs text-[var(--color-text-muted)] font-mono">
                        Kepala: {dept.head_name || "Belum Ditugaskan"}
                      </span>
                    </div>
                    <div className="text-right text-xs font-mono">
                      <span className="block text-zinc-300 font-bold">{dept.class_count} Kelas</span>
                      <span className="text-[var(--color-text-muted)]">{dept.member_count} Anggota</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Classes List */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase text-[var(--color-text-muted)] font-bold">
                Kelas & Kohort Aktif ({classes.length})
              </h4>
              <div className="space-y-2">
                {classes.map((cls) => (
                  <Card key={cls.id} className="bg-[#0d121f] border-[var(--color-border)] p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] font-bold">
                        {cls.academic_term}
                      </span>
                      <h5 className="font-bold text-sm text-[var(--color-text)] mt-1">{cls.name}</h5>
                      <span className="text-xs text-[var(--color-text-muted)] font-mono">
                        Instruktur: {cls.instructor_name || "Belum Ditugaskan"}
                      </span>
                    </div>
                    <div className="text-right text-xs font-mono">
                      <span className="block text-cyan-400 font-bold">{cls.student_count} Siswa Terdaftar</span>
                      <span className="text-emerald-400 text-[10px] uppercase font-bold">✓ {cls.status}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LMS COURSES */}
      {activeTab === "courses" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Kurikulum & Kursus LMS Institusi</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Materi terintegrasi dengan modul CyberLab-ID dan silabus khusus</p>
            </div>
            {isInstructorOrAdmin && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => setShowCourseModal(true)}
                className="font-mono text-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Buat Kursus Baru
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="bg-[#0d121f] border-[var(--color-border)] p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]">
                    {course.code}
                  </span>
                  <Badge variant="secondary" size="sm">
                    {course.visibility.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-bold text-base text-[var(--color-text)]">{course.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">{course.description}</p>
                </div>

                {course.module_ids && course.module_ids.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[var(--color-text-muted)] block mb-1">
                      Modul Praktikum CyberLab-ID Terintegrasi:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {course.module_ids.map((mod: string, idx: number) => (
                        <Link key={idx} href={`/learning#${mod}`}>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:underline">
                            {mod}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--color-text-muted)]">Instruktur: {course.instructor_name || "Staff"}</span>
                  <span className="text-amber-400 font-bold">{course.assignment_count} Tugas Aktif</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Tugas & Evaluasi Pembelajaran</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Pengumpulan tugas, review kode, dan penilaian instruktur</p>
            </div>
          </div>

          <div className="space-y-3">
            {assignments.map((asg) => (
              <Card key={asg.id} className="bg-[#0d121f] border-[var(--color-border)] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-cyan-400 font-bold">
                      {asg.course_code}
                    </span>
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">Kelas: {asg.class_name || "Semua"}</span>
                  </div>
                  <h4 className="font-bold text-sm text-[var(--color-text)]">{asg.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">{asg.instructions}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div className="text-right">
                    <span className="block text-[var(--color-text-muted)]">Tenggat Waktu:</span>
                    <span className="text-amber-400 font-bold">{new Date(asg.due_date).toLocaleDateString()}</span>
                  </div>
                  {asg.my_score !== null ? (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                      Nilai: {asg.my_score}/100
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => alert(`Kumpulkan tugas "${asg.title}" via formulir pengumpulan siswa.`)}
                      className="font-mono text-xs"
                    >
                      Kumpulkan Tugas
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CYBER RANGE LABS */}
      {activeTab === "labs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Praktikum Cyber Range Terisolasi</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Lingkungan virtual khusus kelas dengan alokasi CPU & memori terproteksi</p>
            </div>
            <Link href="/range">
              <Button variant="secondary" size="sm" className="font-mono text-xs flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Buka Platform Range
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labs.map((lab) => (
              <Card key={lab.id} className="bg-[#0d121f] border-[var(--color-border)] p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-accent)] font-bold">
                    TEMPLATE: {lab.template_id}
                  </span>
                  <span className="text-xs font-mono text-amber-400 font-bold">Due: {new Date(lab.due_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-text)]">{lab.title}</h4>
                  <span className="text-xs text-[var(--color-text-muted)] font-mono">Ditugaskan untuk: {lab.class_name}</span>
                </div>
                <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400">✓ Isolated Environment Ready</span>
                  <Link href={`/range`}>
                    <Button variant="accent" size="sm" className="font-mono text-xs">
                      Luncurkan Lab
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ASSESSMENTS & PRIVATE CTF */}
      {activeTab === "assessments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Asesmen & CTF Tertutup Institusi</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Ujian evaluasi berbatas waktu dengan validasi server-side anti-bocor</p>
            </div>
          </div>

          <div className="space-y-4">
            {assessments.map((ass) => (
              <Card key={ass.id} className="bg-[#0d121f] border-[var(--color-border)] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-indigo-400 font-bold">
                      DURASI: {ass.time_limit_minutes} MENIT
                    </span>
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">{ass.questions.length} Soal Evaluasi</span>
                  </div>
                  <h4 className="font-bold text-base text-[var(--color-text)]">{ass.title}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] max-w-2xl">{ass.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {ass.my_score !== null ? (
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-[var(--color-text-muted)] block">Skor Selesai</span>
                      <strong className="text-base text-emerald-400 font-bold">{ass.my_score}/100</strong>
                    </div>
                  ) : (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => {
                        setShowExamModal(ass);
                        setExamAnswers({});
                        setExamResult(null);
                      }}
                      className="font-mono text-xs"
                    >
                      Mulai Asesmen
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: CERTIFICATES */}
      {activeTab === "certificates" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Sertifikat Kelulusan Resmi Institusi</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Kredensial berverifikasi hash SHA-256 tahan manipulasi</p>
            </div>
            {isAdminOrOwner && (
              <Button
                variant="accent"
                size="sm"
                onClick={() => setShowCertModal(true)}
                className="font-mono text-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Terbitkan Sertifikat
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <Card key={cert.id} className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">{cert.certificate_code}</span>
                  <Badge variant={cert.is_revoked === 0 ? "success" : "destructive"} size="sm">
                    {cert.is_revoked === 0 ? "VALID" : "REVOKED"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-bold text-base text-[var(--color-text)]">{cert.title}</h4>
                  <span className="text-xs text-[var(--color-text-secondary)] block mt-0.5">Penerima: <strong className="text-cyan-400">{cert.student_name}</strong></span>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 font-mono">{cert.criteria}</p>
                </div>
                <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-1.5 text-xs font-mono">
                  <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                    SHA-256 Hash: <code className="text-zinc-400">{cert.verification_hash}</code>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[var(--color-text-muted)]">Tanggal: {cert.issue_date}</span>
                    <Link
                      href={`/verify/${cert.certificate_code}`}
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      Verifikasi Publik <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: MEMBERS */}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Roster Anggota Institusi ({members.length})</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Instruktur, Asisten, dan Siswa/Mahasiswa terdaftar</p>
            </div>
            {isInstructorOrAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImportModal(true)}
                  className="font-mono text-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Impor CSV
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => setShowMemberModal(true)}
                  className="font-mono text-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Tambah Anggota
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-[var(--color-border)] rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] uppercase">
                <tr>
                  <th className="px-4 py-3">Nama / Identitas</th>
                  <th className="px-4 py-3">Peran (Role)</th>
                  <th className="px-4 py-3">No. Induk (NIM/NIS)</th>
                  <th className="px-4 py-3">Departemen</th>
                  <th className="px-4 py-3">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[#0d121f]">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-[var(--color-surface)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[var(--color-text)]">{m.display_name}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">{m.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--color-surface-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]">
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{m.student_id_number || "-"}</td>
                    <td className="px-4 py-3 text-zinc-300">{m.department_code || "-"}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {new Date(m.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: REPORTS & ANALYTICS */}
      {activeTab === "reports" && reportsData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Laporan & Analitik Akademik Institusi</h3>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">Statistik riil efektivitas pembelajaran, nilai tugas, dan sertifikasi</p>
            </div>
            <a
              href={`/api/institutions/${institution.id}/reports?format=csv`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Unduh Laporan CSV
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Rata-rata Nilai Tugas</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {reportsData.summary?.average_assignment_score || 0} / 100
              </p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Total Pengumpulan</span>
              <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {reportsData.summary?.total_submissions || 0}
              </p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Mahasiswa Terdaftar</span>
              <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                {reportsData.summary?.total_students || 0}
              </p>
            </Card>
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-4 text-center">
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Sertifikat Kelulusan</span>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {reportsData.summary?.issued_certificates || 0}
              </p>
            </Card>
          </div>

          {/* Department Distribution */}
          <Card className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
            <h4 className="font-bold text-sm font-mono text-[var(--color-text)]">Distribusi per Departemen</h4>
            <div className="space-y-2">
              {reportsData.department_stats?.map((dept: any) => (
                <div key={dept.id} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-[var(--color-surface)]">
                  <span className="text-[var(--color-text)] font-bold">{dept.code} — {dept.name}</span>
                  <span className="text-[var(--color-accent)]">{dept.member_count} Siswa / {dept.class_count} Kelas</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 10: SETTINGS & AI */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold font-mono text-[var(--color-text)]">Pengaturan Institusi & Kontrol AI</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">Manajemen kuota paket, kebijakan AI Tutor, dan integritas data</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Control Card */}
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[var(--color-accent)]" />
                <h4 className="font-bold text-sm font-mono text-[var(--color-text)]">Tutor AI Akademik Institusi</h4>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Konfigurasikan asisten AI agar membimbing siswa sesuai kurikulum Anda tanpa membocorkan jawaban ujian.
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded bg-[var(--color-surface)]">
                  <span>Status Asisten AI:</span>
                  <span className="text-emerald-400 font-bold">AKTIF</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-[var(--color-surface)]">
                  <span>Human-in-the-Loop Grading:</span>
                  <span className="text-emerald-400 font-bold">DIWAJIBKAN</span>
                </div>
              </div>
            </Card>

            {/* Plan Quotas Card */}
            <Card className="bg-[#0d121f] border-[var(--color-border)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-sm font-mono text-[var(--color-text)]">Alokasi Kuota Paket ({institution.plan_tier.toUpperCase()})</h4>
              </div>
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Maksimal Pengguna</span>
                    <strong className="text-[var(--color-accent)]">{stats?.total_members} / {institution.plan_max_users}</strong>
                  </div>
                  <div className="w-full bg-[var(--color-surface)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--color-accent)] h-full"
                      style={{ width: `${Math.min(100, ((stats?.total_members || 0) / institution.plan_max_users) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Alokasi Storage Lab</span>
                    <strong className="text-cyan-400">{institution.plan_max_storage_mb / 1024} GB</strong>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEMBER */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold font-mono text-base text-[var(--color-text)]">Tambah Anggota Institusi</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Email / Username Pengguna *</label>
                <input
                  type="text"
                  required
                  placeholder="budi@student.ui.ac.id"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Peran (Role) *</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono"
                >
                  <option value="student">Mahasiswa / Siswa</option>
                  <option value="trainee">Trainee</option>
                  <option value="instructor">Instruktur / Dosen</option>
                  <option value="ta">Teaching Assistant (TA)</option>
                  <option value="auditor">Auditor Akademik</option>
                  {isAdminOrOwner && <option value="admin">Administrator Institusi</option>}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Nomor Induk (NIM/NIS/NIP)</label>
                <input
                  type="text"
                  placeholder="NIM-210600123"
                  value={newMemberNIM}
                  onChange={(e) => setNewMemberNIM(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowMemberModal(false)} className="font-mono text-xs">
                  Batal
                </Button>
                <Button type="submit" variant="accent" size="sm" className="font-mono text-xs">
                  Tambahkan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CLASS */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold font-mono text-base text-[var(--color-text)]">Buat Kelas / Kohort Baru</h3>
            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="CS-401 Network Penetration Testing"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Semester / Periode Akademik *</label>
                <input
                  type="text"
                  required
                  placeholder="2026/2027 Ganjil"
                  value={newClassTerm}
                  onChange={(e) => setNewClassTerm(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowClassModal(false)} className="font-mono text-xs">
                  Batal
                </Button>
                <Button type="submit" variant="accent" size="sm" className="font-mono text-xs">
                  Buat Kelas
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE COURSE */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold font-mono text-base text-[var(--color-text)]">Buat Kursus LMS Institusi</h3>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Judul Kursus *</label>
                <input
                  type="text"
                  required
                  placeholder="Security Operations Center (SOC) Fundamentals"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Kode Mata Kuliah *</label>
                <input
                  type="text"
                  required
                  placeholder="SOC101"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi kurikulum dan kompetensi akhir..."
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowCourseModal(false)} className="font-mono text-xs">
                  Batal
                </Button>
                <Button type="submit" variant="accent" size="sm" className="font-mono text-xs">
                  Simpan Kursus
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE CERTIFICATE */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold font-mono text-base text-[var(--color-text)]">Terbitkan Sertifikat Kelulusan</h3>
            <form onSubmit={handleIssueCertificate} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Pilih Mahasiswa / Siswa *</label>
                <select
                  required
                  value={certStudentId}
                  onChange={(e) => setCertStudentId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] font-mono"
                >
                  <option value="">-- Pilih Anggota --</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.display_name} ({m.student_id_number || m.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-[var(--color-text-secondary)]">Judul Kompetensi Sertifikat *</label>
                <input
                  type="text"
                  required
                  placeholder="Sertifikat Kompetensi: Advanced Network Security"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowCertModal(false)} className="font-mono text-xs">
                  Batal
                </Button>
                <Button type="submit" variant="accent" size="sm" className="font-mono text-xs">
                  Terbitkan Sertifikat
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK CSV IMPORT */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold font-mono text-base text-[var(--color-text)]">Impor Roster Anggota (CSV)</h3>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">
              Format: <code>email_or_username,role,student_id_number</code> (1 baris per pengguna)
            </p>
            <textarea
              rows={6}
              placeholder="budi@student.ui.ac.id,student,NIM-2106001&#10;citra@student.ui.ac.id,student,NIM-2106002"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowImportModal(false)} className="font-mono text-xs">
                Batal
              </Button>
              <Button type="button" variant="accent" size="sm" onClick={handleImportCSV} className="font-mono text-xs">
                Mulai Impor
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXAM / ASSESSMENT RUNNER */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0d121f] border border-[var(--color-border)] rounded-2xl p-6 space-y-6 my-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold font-mono text-lg text-[var(--color-text)]">{showExamModal.title}</h3>
                <span className="text-xs font-mono text-indigo-400 font-bold">
                  Batas Waktu: {showExamModal.time_limit_minutes} Menit
                </span>
              </div>
              <button onClick={() => setShowExamModal(null)} className="text-zinc-500 hover:text-white font-mono">
                ✕
              </button>
            </div>

            {examResult ? (
              <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center space-y-3 font-mono">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                <h4 className="text-base font-bold text-[var(--color-text)]">Hasil Ujian Terverifikasi</h4>
                <p className="text-3xl font-extrabold text-[var(--color-accent)]">{examResult.score} / 100</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{examResult.message}</p>
                <Button variant="secondary" size="sm" onClick={() => setShowExamModal(null)} className="font-mono text-xs mt-2">
                  Tutup
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {showExamModal.questions.map((q: any, idx: number) => (
                  <div key={q.id} className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-3">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                      Pertanyaan #{idx + 1} ({q.points || 10} Poin)
                    </span>
                    <p className="text-xs font-mono text-[var(--color-text)] font-medium leading-relaxed">{q.prompt}</p>
                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt: string, oIdx: number) => (
                        <label
                          key={oIdx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 cursor-pointer text-xs font-mono text-zinc-300 transition-colors"
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt}
                            checked={examAnswers[q.id] === opt}
                            onChange={() => setExamAnswers({ ...examAnswers, [q.id]: opt })}
                            className="text-[var(--color-accent)]"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">
                    Terjawab: {Object.keys(examAnswers).length} dari {showExamModal.questions.length} soal
                  </span>
                  <Button variant="accent" size="sm" onClick={handleSubmitExam} className="font-mono text-xs">
                    Kirim Jawaban Ujian
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
