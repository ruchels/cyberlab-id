"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { calculateSubnet, SubnetResult } from "@/lib/tools/subnet";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { Network, ArrowLeft, Copy, Check, Info, ShieldAlert } from "lucide-react";

export default function SubnetCalculatorPage() {
  const [ip, setIp] = useState("192.168.1.100");
  const [cidr, setCidr] = useState<number>(24);
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const presets = [
    { label: "/8 (Kelas A)", cidr: 8 },
    { label: "/16 (Kelas B)", cidr: 16 },
    { label: "/24 (Kelas C)", cidr: 24 },
    { label: "/27 (30 Host)", cidr: 27 },
    { label: "/28 (14 Host)", cidr: 28 },
    { label: "/30 (P2P 2 Host)", cidr: 30 },
  ];

  const handleCalculate = () => {
    try {
      setError(null);
      const res = calculateSubnet(ip, cidr);
      setResult(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Input subnetting tidak valid");
      }
      setResult(null);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [ip, cidr]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Tools
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-[var(--color-text)] flex items-center gap-3">
              <Network className="w-7 h-7 text-[var(--color-accent)]" />
              Subnet Calculator (IPv4 / CIDR)
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Kalkulator subnetting presisi untuk perancangan arsitektur jaringan, segmentasi VLAN, dan analisis firewall.
            </p>
          </div>
          <Badge variant="accent" size="md">
            RFC 1918 / RFC 3021
          </Badge>
        </div>
      </div>

      {/* Input Form Card */}
      <Card>
        <CardBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <Input
                label="Alamat IP (IPv4)"
                placeholder="Contoh: 192.168.1.1"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                error={error || undefined}
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Prefix CIDR (/{cidr})
              </label>
              <select
                value={cidr}
                onChange={(e) => setCidr(Number(e.target.value))}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-3 py-2 text-sm font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                {Array.from({ length: 33 }, (_, i) => i).map((c) => (
                  <option key={c} value={c}>
                    /{c} ({Math.pow(2, 32 - c).toLocaleString()} alamat)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-xs font-mono text-[var(--color-text-muted)] mr-2">
              Preset Cepat:
            </span>
            <div className="inline-flex flex-wrap gap-2 mt-2 sm:mt-0">
              {presets.map((p) => (
                <button
                  key={p.cidr}
                  onClick={() => setCidr(p.cidr)}
                  className={`px-2.5 py-1 text-xs font-mono rounded border cursor-pointer transition-colors ${
                    cidr === p.cidr
                      ? "bg-[var(--color-accent)] text-[#05080e] font-bold border-[var(--color-accent)]"
                      : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Results Display */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Subnet Details */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                  Hasil Perhitungan Subnet
                </span>
                <div className="flex gap-2">
                  <Badge variant={result.isPrivate ? "info" : "warning"}>
                    {result.isPrivate ? "Private IP (RFC 1918)" : "Public IP"}
                  </Badge>
                  <Badge variant="default">Kelas {result.ipClass}</Badge>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-[var(--color-border-subtle)] text-xs font-mono">
                  {[
                    { label: "IP Address", val: `${result.ipAddress}/${result.cidr}`, key: "ip" },
                    { label: "Network Address", val: result.networkAddress, key: "net" },
                    { label: "Broadcast Address", val: result.broadcastAddress, key: "bcast" },
                    { label: "Subnet Mask", val: result.subnetMask, key: "mask" },
                    { label: "Wildcard Mask", val: result.wildcardMask, key: "wildcard" },
                    { label: "Rentang Host Dapat Dipakai", val: `${result.firstUsableHost} - ${result.lastUsableHost}`, key: "range" },
                    { label: "Total Alamat IP", val: result.totalHosts.toLocaleString(), key: "total" },
                    { label: "Host yang Dapat Digunakan", val: result.usableHosts.toLocaleString(), key: "usable" },
                  ].map((row) => (
                    <div
                      key={row.key}
                      className="px-5 py-3 flex items-center justify-between hover:bg-[var(--color-surface-elevated)]/40 transition-colors"
                    >
                      <span className="text-[var(--color-text-secondary)] font-medium">
                        {row.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[var(--color-text)]">{row.val}</span>
                        <button
                          onClick={() => copyToClipboard(row.val, row.key)}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] cursor-pointer"
                          title="Salin nilai"
                        >
                          {copiedKey === row.key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Binary Visualization & Architecture Card */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Visualisasi Bit Biner
                </span>
              </CardHeader>
              <CardBody className="space-y-4 font-mono text-xs">
                <div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mb-1">
                    IP Address (Biner 32-bit):
                  </div>
                  <div className="p-2.5 rounded bg-[#070b12] border border-[var(--color-border-subtle)] break-all text-[var(--color-text)] text-[11px]">
                    {result.binaryIP}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mb-1">
                    Subnet Mask (Biner 32-bit):
                  </div>
                  <div className="p-2.5 rounded bg-[#070b12] border border-[var(--color-border-subtle)] break-all text-emerald-400 text-[11px]">
                    {result.binarySubnetMask}
                  </div>
                </div>

                <div className="p-3 rounded bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border-subtle)] space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Network Bits (/CIDR):</span>
                    <span className="font-bold text-[var(--color-accent)]">{result.cidr} bits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Host Bits:</span>
                    <span className="font-bold text-amber-400">{32 - result.cidr} bits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Rumus Host:</span>
                    <span className="font-mono text-[var(--color-text-secondary)]">2^{(32 - result.cidr)} - 2</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Educational Guide */}
      <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] space-y-2">
        <h4 className="font-mono font-bold text-[var(--color-text)] flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--color-accent)]" />
          Mengapa Subnetting Krusial dalam Cybersecurity?
        </h4>
        <p>
          Subnetting bukan hanya tentang penghematan alamat IP, melainkan fondasi <strong>Network Segmentation</strong> dan <strong>Zero Trust Architecture</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded bg-[var(--color-surface-elevated)]/40 border border-[var(--color-border-subtle)]">
            <strong className="text-[var(--color-text)] block mb-1">1. Isolasi Serangan</strong>
            Mencegah pergerakan lateral (lateral movement) penyerang jika salah satu mesin di segmen DMZ atau Workstation terinfeksi.
          </div>
          <div className="p-3 rounded bg-[var(--color-surface-elevated)]/40 border border-[var(--color-border-subtle)]">
            <strong className="text-[var(--color-text)] block mb-1">2. Kontrol Firewall ACL</strong>
            Mempermudah pembuatan rule firewall berbasis blok CIDR untuk membatasi akses port sensitif (SSH, RDP, Database).
          </div>
          <div className="p-3 rounded bg-[var(--color-surface-elevated)]/40 border border-[var(--color-border-subtle)]">
            <strong className="text-[var(--color-text)] block mb-1">3. Meredam Broadcast</strong>
            Mencegah broadcast storm dan membatasi jangkauan serangan ARP spoofing atau DHCP starvation dalam satu collision domain.
          </div>
        </div>
      </div>
    </div>
  );
}
