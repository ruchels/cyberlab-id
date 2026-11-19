"use client";

import React, { useState } from "react";
import { Badge, Button, Input } from "@/components/ui";
import {
  Network,
  Server,
  Laptop,
  Router as RouterIcon,
  Globe,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface NetworkRangeProps {
  sessionId: string;
  template: any;
  onComplete: (evidenceToken?: string) => Promise<void>;
  onStop: () => Promise<void>;
}

export function NetworkRangeView({
  sessionId,
  template,
  onComplete,
  onStop,
}: NetworkRangeProps) {
  // Configuration states
  const [clientIp, setClientIp] = useState("192.168.1.15");
  const [clientNetmask, setClientNetmask] = useState("255.255.255.0");
  const [clientGateway, setClientGateway] = useState("192.168.1.1");
  const [routerRouteEnabled, setRouterRouteEnabled] = useState(true);

  // Simulation state
  const [packetHop, setPacketHop] = useState<number>(0);
  const [isTracing, setIsTracing] = useState(false);
  const [traceLogs, setTraceLogs] = useState<string[]>([
    "[NET] Topologi simulasi jaringan multi-subnet dimuat.",
    "[NET] Hubungkan Client (Subnet A) menuju Web Server (Subnet B) melalui Router Gateway.",
  ]);
  const [isSuccess, setIsSuccess] = useState(false);

  const completionToken = "RANGE{network_routing_end_to_end_verified}";

  const handleRunPingTrace = () => {
    setIsTracing(true);
    setPacketHop(1);
    setTraceLogs([`[TRACE] Memulai ping dari Client (${clientIp}) menuju Server (10.0.0.5)...`]);

    setTimeout(() => {
      // Step 1: Check client IP & Netmask
      if (clientIp !== "192.168.1.15" || clientNetmask !== "255.255.255.0") {
        setTraceLogs((prev) => [
          ...prev,
          "[ERR] IP Client atau Netmask tidak berada dalam Subnet 192.168.1.0/24 yang benar.",
        ]);
        setIsTracing(false);
        setPacketHop(0);
        return;
      }

      setTraceLogs((prev) => [
        ...prev,
        "[HOP 1] Paket dikirim melalui antarmuka eth0. Menghubungi Default Gateway: " + clientGateway,
      ]);
      setPacketHop(2);

      setTimeout(() => {
        // Step 2: Check Gateway
        if (clientGateway !== "192.168.1.1") {
          setTraceLogs((prev) => [
            ...prev,
            `[ERR] Gateway ${clientGateway} tidak dapat dihubungi: Destination Host Unreachable.`,
          ]);
          setIsTracing(false);
          setPacketHop(0);
          return;
        }

        setTraceLogs((prev) => [
          ...prev,
          "[HOP 2] Router Gateway (192.168.1.1 / 10.0.0.1) menerima paket. Mengecek tabel routing...",
        ]);
        setPacketHop(3);

        setTimeout(() => {
          if (!routerRouteEnabled) {
            setTraceLogs((prev) => [
              ...prev,
              "[ERR] Router tidak memiliki rute menuju subnet 10.0.0.0/24: Network is unreachable.",
            ]);
            setIsTracing(false);
            setPacketHop(0);
            return;
          }

          setTraceLogs((prev) => [
            ...prev,
            "[HOP 3] Rute statis ditemukan: 10.0.0.0/24 via eth1. Meneruskan paket ke Web Server (10.0.0.5).",
            "[SUCCESS] ICMP Echo Reply diterima dari 10.0.0.5! RTT = 1.42 ms. 0% Packet Loss.",
            `[TOKEN] Token Penyelesaian Lab: ${completionToken}`,
          ]);
          setPacketHop(4);
          setIsTracing(false);
          setIsSuccess(true);
        }, 800);
      }, 800);
    }, 800);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Topology Canvas */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[var(--color-accent)]" />
            <span className="font-bold text-sm text-[var(--color-text)]">
              Simulasi Topologi Jaringan Terisolasi
            </span>
          </div>
          <Badge variant={isSuccess ? "success" : "default"} size="sm">
            {isSuccess ? "Konektivitas End-to-End Terverifikasi" : "Topologi Aktif"}
          </Badge>
        </div>

        {/* Nodes Diagram Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-4 relative">
          {/* Node 1: Client */}
          <div
            className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
              packetHop === 1
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 scale-105"
                : "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)]"
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] mx-auto">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="font-bold text-[var(--color-text)]">Client PC (eth0)</div>
            <div className="text-[10px] text-[var(--color-text-muted)]">{clientIp}</div>
            <div className="text-[10px] text-[var(--color-accent)]">Subnet A (/24)</div>
          </div>

          {/* Node 2: Router Gateway */}
          <div
            className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
              packetHop === 2 || packetHop === 3
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 scale-105"
                : "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)]"
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-amber-400 mx-auto">
              <RouterIcon className="w-5 h-5" />
            </div>
            <div className="font-bold text-[var(--color-text)]">Router Gateway</div>
            <div className="text-[10px] text-[var(--color-text-muted)]">eth0: 192.168.1.1</div>
            <div className="text-[10px] text-[var(--color-text-muted)]">eth1: 10.0.0.1</div>
          </div>

          {/* Node 3: DNS Resolver */}
          <div
            className={`p-4 rounded-xl border text-center space-y-2 bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)] opacity-80`}
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-purple-400 mx-auto">
              <Globe className="w-5 h-5" />
            </div>
            <div className="font-bold text-[var(--color-text)]">Internal DNS Server</div>
            <div className="text-[10px] text-[var(--color-text-muted)]">10.0.0.2</div>
            <div className="text-[10px] text-purple-400">ns1.cyberlab.internal</div>
          </div>

          {/* Node 4: Target Web Server */}
          <div
            className={`p-4 rounded-xl border text-center space-y-2 transition-all ${
              packetHop === 4
                ? "border-emerald-400 bg-emerald-500/15 scale-105"
                : "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)]"
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-emerald-400 mx-auto">
              <Server className="w-5 h-5" />
            </div>
            <div className="font-bold text-[var(--color-text)]">Target Web Server</div>
            <div className="text-[10px] text-[var(--color-text-muted)]">10.0.0.5</div>
            <div className="text-[10px] text-emerald-400">Subnet B (/24)</div>
          </div>
        </div>
      </div>

      {/* Configuration & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings form */}
        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
          <h3 className="font-bold text-[var(--color-text)] text-xs flex items-center gap-2">
            <Laptop className="w-4 h-4 text-[var(--color-accent)]" />
            Konfigurasi Antarmuka Client (eth0)
          </h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[var(--color-text-muted)] block text-[11px]">IPv4 Address:</label>
              <Input
                value={clientIp}
                onChange={(e) => setClientIp(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[var(--color-text-muted)] block text-[11px]">Subnet Mask:</label>
              <Input
                value={clientNetmask}
                onChange={(e) => setClientNetmask(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[var(--color-text-muted)] block text-[11px]">Default Gateway:</label>
              <Input
                value={clientGateway}
                onChange={(e) => setClientGateway(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={routerRouteEnabled}
                  onChange={(e) => setRouterRouteEnabled(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-accent)]"
                />
                <span>Aktifkan Rute Statis Router Subnet B (10.0.0.0/24)</span>
              </label>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleRunPingTrace}
                disabled={isTracing}
                variant="primary"
                size="sm"
                className="w-full text-xs font-mono flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                {isTracing ? "Mentransmisikan Paket..." : "Uji Ping & Trace Route"}
              </Button>
            </div>
          </div>
        </div>

        {/* Packet Trace Log */}
        <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2 text-[11px] text-[var(--color-text-muted)]">
              <span>PACKET FLOW &amp; ICMP LOG</span>
              <span>Protocol: ICMP/IP</span>
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto text-[11px]">
              {traceLogs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.includes("[SUCCESS]") || log.includes("[TOKEN]")
                      ? "text-emerald-400 font-bold"
                      : log.includes("[ERR]")
                      ? "text-red-400 font-bold"
                      : log.includes("[HOP")
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-text-muted)]"
                  }
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Completion button */}
          {isSuccess && (
            <div className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2">
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
    </div>
  );
}
