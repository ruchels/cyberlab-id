"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { Shield, KeyRound, User, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in
  if (user) {
    router.push("/profile");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      router.push("/profile");
    } else {
      setError(res.error || "Gagal masuk.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-mono font-bold text-[var(--color-text)]">
            Masuk ke CyberLab-ID
          </h1>
          <p className="text-xs font-mono text-[var(--color-text-muted)]">
            Akses portofolio belajar, submission flag CTF, dan forum komunitas
          </p>
        </div>

        {/* Demo Credentials Alert */}
        <div className="p-3.5 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-xs font-mono text-[var(--color-text-muted)] space-y-1">
          <div className="font-bold text-[var(--color-accent)]">Akun Demo Praktikum:</div>
          <div>• Admin: <code>admin</code> | Sandi: <code>CyberLabAdmin2026!</code></div>
          <div>• Pengguna: <code>budi_hacker</code> | Sandi: <code>CyberLabUser2026!</code></div>
        </div>

        {/* Form Card */}
        <Card className="border-[var(--color-border)]">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--color-text-muted)] block">
                  Username atau Email
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. budi_hacker atau budi@cyberlab.id"
                    className="font-mono text-xs pl-9"
                  />
                  <User className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono text-[var(--color-text-muted)] block">
                    Kata Sandi
                  </label>
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="font-mono text-xs pl-9"
                  />
                  <Lock className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full font-mono text-xs py-2.5 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? "Memverifikasi Kredensial..." : "Masuk ke Akun"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Register link */}
        <div className="text-center text-xs font-mono text-[var(--color-text-muted)]">
          Belum memiliki akun?{" "}
          <Link href="/auth/register" className="text-[var(--color-accent)] hover:underline font-bold">
            Daftar sekarang (+15 XP)
          </Link>
        </div>
      </div>
    </div>
  );
}
