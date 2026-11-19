"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { Shield, Sparkles, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    router.push("/profile");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Kata sandi minimal harus 8 karakter.");
      return;
    }

    setLoading(true);
    const res = await register(username, email, password, displayName);
    setLoading(false);

    if (res.success) {
      router.push("/profile");
    } else {
      setError(res.error || "Gagal mendaftar.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-mono font-bold text-[var(--color-text)]">
            Daftar Akun CyberLab-ID
          </h1>
          <p className="text-xs font-mono text-[var(--color-text-muted)]">
            Bergabung dengan ekosistem pertahanan siber Indonesia &amp; raih badge pertama Anda
          </p>
        </div>

        {/* Card */}
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
                  Username (Wajib, Huruf/Angka/_)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. cyber_ninja"
                    className="font-mono text-xs pl-9"
                  />
                  <User className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--color-text-muted)] block">
                  Nama Tampilan (Opsional)
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Andi Pratama"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--color-text-muted)] block">
                  Alamat Email (Wajib)
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="font-mono text-xs pl-9"
                  />
                  <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[var(--color-text-muted)] block">
                  Kata Sandi (Minimal 8 Karakter)
                </label>
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
                {loading ? "Mendaftarkan Akun..." : "Buat Akun & Klaim 15 XP"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Login link */}
        <div className="text-center text-xs font-mono text-[var(--color-text-muted)]">
          Sudah memiliki akun?{" "}
          <Link href="/auth/login" className="text-[var(--color-accent)] hover:underline font-bold">
            Masuk ke akun Anda
          </Link>
        </div>
      </div>
    </div>
  );
}
