"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import {
  Code,
  Key,
  ShieldAlert,
  Copy,
  Check,
  Trash2,
  PlusCircle,
  FileText,
  Terminal,
  ExternalLink,
  Lock,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface DeveloperKey {
  id: string;
  key_name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit_per_minute: number;
  total_requests: number;
  last_used_at: string | null;
  is_revoked: boolean;
  created_at: string;
}

export default function DeveloperPortalPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<DeveloperKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  // New Key Form State
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "read:modules",
    "read:events",
    "read:research",
  ]);
  const [creatingKey, setCreatingKey] = useState(false);
  const [generatedKeySecret, setGeneratedKeySecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (user) {
      fetchKeys();
    }
  }, [user]);

  const fetchKeys = async () => {
    try {
      setLoadingKeys(true);
      const res = await fetch("/api/developer/keys");
      if (res.ok) {
        const json = await res.json();
        setKeys(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      setCreatingKey(true);
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          keyName: keyName.trim(),
          scopes: selectedScopes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedKeySecret(data.apiKey);
        setKeyName("");
        fetchKeys();
      } else {
        alert(data.error || "Gagal membuat API key.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Apakah Anda yakin ingin mencabut (revoke) API Key ini? Token tidak akan dapat digunakan kembali.")) {
      return;
    }
    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", keyId }),
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      if (selectedScopes.length > 1) {
        setSelectedScopes(selectedScopes.filter((s) => s !== scope));
      }
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  return (
    <div className="space-y-12 py-6 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#101623] to-[#090d16] border border-[var(--color-border)] p-8 sm:p-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Code className="w-3.5 h-3.5" />
            Developer Platform & Public API v1 Ecosystem
          </div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[var(--color-text)]">
            CyberLab-ID <span className="text-[var(--color-accent)]">Developer Portal</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            Integrasikan aplikasi kampus, bot otomasi komunitas, atau platform evaluasi pembelajaran Anda dengan API Publik CyberLab-ID v1. Akses metadata kurikulum, jadwal turnamen CTF, webinar siber, dan publikasi riset terpercaya secara terprogram.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              REST API v1 Active (JSON)
            </span>
            <span>·</span>
            <span>Rate Limit: 60 req/min per key</span>
            <span>·</span>
            <span>Bearer / X-API-Key Auth</span>
          </div>
        </div>
      </div>

      {/* API Key Management Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2 font-mono">
              <Key className="w-5 h-5 text-[var(--color-accent)]" />
              Manajemen Developer API Key
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Kelola kunci autentikasi aman untuk skrip otomasi dan integrasi eksternal.
            </p>
          </div>
        </div>

        {!user ? (
          <Card className="p-8 text-center bg-[var(--color-surface)] border-[var(--color-border)] space-y-3">
            <Lock className="w-8 h-8 text-[var(--color-text-muted)] mx-auto" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Silakan masuk ke akun CyberLab-ID Anda untuk membuat dan mengelola Developer API Key.
            </p>
            <Link href="/auth/login">
              <Button variant="primary" size="sm">
                Masuk / Buat Akun
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Generated Secret Alert */}
            {generatedKeySecret && (
              <div className="p-5 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-mono">
                  ✓ Developer API Key Berhasil Dibuat!
                </div>
                <p className="text-xs text-emerald-200">
                  Salin token API ini sekarang. Demi alasan keamanan, token lengkap <strong>hanya ditampilkan satu kali</strong> dan tidak dapat dilihat kembali setelah Anda menutup pemberitahuan ini.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/60 border border-emerald-500/40 rounded px-3 py-2 text-xs font-mono text-emerald-300 break-all select-all">
                    {generatedKeySecret}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => copyToClipboard(generatedKeySecret)}
                    className="whitespace-nowrap"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedKey ? "Tersalin!" : "Salin Key"}
                  </Button>
                </div>
              </div>
            )}

            {/* Create Key Card */}
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] p-6">
              <form onSubmit={handleCreateKey} className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-text)] font-mono">
                  Buat Kunci API Baru
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1">
                      Nama Aplikasi / Deskripsi Key *
                    </label>
                    <Input
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="cth: Lab Portal Kampus / Discord Bot Notifier"
                      required
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[var(--color-text-secondary)] mb-1">
                      Pilih Scope Izin Akses
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { scope: "read:modules", label: "Kurikulum" },
                        { scope: "read:events", label: "Events" },
                        { scope: "read:research", label: "Riset" },
                        { scope: "read:ctf_public", label: "CTF Publik" },
                      ].map((s) => (
                        <button
                          key={s.scope}
                          type="button"
                          onClick={() => toggleScope(s.scope)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${
                            selectedScopes.includes(s.scope)
                              ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold"
                              : "bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                          }`}
                        >
                          {s.label} ({s.scope})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="sm" disabled={creatingKey}>
                    <PlusCircle className="w-3.5 h-3.5 mr-1" />
                    {creatingKey ? "Menghasilkan Token..." : "Generate API Key"}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Active Keys Table */}
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] overflow-hidden">
              <CardHeader className="pb-3 border-b border-[var(--color-border-subtle)]">
                <h3 className="text-xs font-bold font-mono uppercase text-[var(--color-text)]">
                  Daftar API Key Anda ({keys.length})
                </h3>
              </CardHeader>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] font-mono border-b border-[var(--color-border-subtle)]">
                      <tr>
                        <th className="py-2.5 px-4">Nama Key</th>
                        <th className="py-2.5 px-4">Token Prefix</th>
                        <th className="py-2.5 px-4">Scopes</th>
                        <th className="py-2.5 px-4">Permintaan</th>
                        <th className="py-2.5 px-4">Terakhir Digunakan</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                        <th className="py-2.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)]">
                      {keys.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-[var(--color-text-muted)]">
                            Belum ada API key yang dibuat.
                          </td>
                        </tr>
                      ) : (
                        keys.map((k) => (
                          <tr key={k.id} className="hover:bg-white/[0.01]">
                            <td className="py-3 px-4 font-bold text-[var(--color-text)]">{k.key_name}</td>
                            <td className="py-3 px-4 font-mono text-[var(--color-accent)]">{k.key_prefix}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {k.scopes.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-400"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono">{k.total_requests} reqs</td>
                            <td className="py-3 px-4 text-[var(--color-text-muted)] font-mono">
                              {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Belum pernah"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={k.is_revoked ? "destructive" : "accent"} size="sm">
                                {k.is_revoked ? "Revoked" : "Active"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {!k.is_revoked && (
                                <button
                                  onClick={() => handleRevokeKey(k.id)}
                                  className="text-rose-400 hover:text-rose-300 p-1 text-[11px] font-mono"
                                  title="Cabut Key"
                                >
                                  <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* Public API Reference Section */}
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2 font-mono">
            <FileText className="w-5 h-5 text-cyan-400" />
            Dokumentasi Spesifikasi Public API v1
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Spesifikasi endpoint publik, skema autentikasi, dan format payload response JSON.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Endpoint 1 */}
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                GET
              </span>
              <span className="text-[11px] font-mono text-cyan-400">Scope: read:modules</span>
            </div>
            <div className="font-mono text-xs font-bold text-[var(--color-text)]">
              /api/v1/modules
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Mengambil daftar jalur kurikulum resmi, modul praktikum, estimasi waktu belajar, dan tingkat kesulitan.
            </p>
            <div className="bg-black/60 p-3 rounded text-[11px] font-mono text-zinc-300 overflow-x-auto">
              curl -H "X-API-Key: cl_live_..." https://cyberlab.id/api/v1/modules
            </div>
          </Card>

          {/* Endpoint 2 */}
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                GET
              </span>
              <span className="text-[11px] font-mono text-cyan-400">Scope: read:events</span>
            </div>
            <div className="font-mono text-xs font-bold text-[var(--color-text)]">
              /api/v1/events
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Mengambil jadwal webinar, workshop siber, dan turnamen mendatang lengkap dengan waktu UTC dan info narasumber.
            </p>
            <div className="bg-black/60 p-3 rounded text-[11px] font-mono text-zinc-300 overflow-x-auto">
              curl -H "X-API-Key: cl_live_..." https://cyberlab.id/api/v1/events
            </div>
          </Card>

          {/* Endpoint 3 */}
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                GET
              </span>
              <span className="text-[11px] font-mono text-cyan-400">Scope: read:research</span>
            </div>
            <div className="font-mono text-xs font-bold text-[var(--color-text)]">
              /api/v1/research
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Mengambil artikel riset keamanan siber terpublikasi, ringkasan eksekutif, tag kategori, dan metadata sitasi.
            </p>
            <div className="bg-black/60 p-3 rounded text-[11px] font-mono text-zinc-300 overflow-x-auto">
              curl -H "X-API-Key: cl_live_..." https://cyberlab.id/api/v1/research
            </div>
          </Card>

          {/* Endpoint 4 */}
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                GET
              </span>
              <span className="text-[11px] font-mono text-cyan-400">Scope: read:ctf_public</span>
            </div>
            <div className="font-mono text-xs font-bold text-[var(--color-text)]">
              /api/v1/ctf
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Mengambil jadwal kompetisi CTF aktif/mendatang dan papan peringkat publik 10 besar tanpa mengekspos flag atau kunci jawaban.
            </p>
            <div className="bg-black/60 p-3 rounded text-[11px] font-mono text-zinc-300 overflow-x-auto">
              curl -H "X-API-Key: cl_live_..." https://cyberlab.id/api/v1/ctf
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
