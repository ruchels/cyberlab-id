"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody, Badge, Button, Input } from "@/components/ui";
import { Network, Search, CheckCircle2, ShieldAlert, Sparkles, Filter } from "lucide-react";
import { useProgress } from "@/lib/progress";

interface Packet {
  no: number;
  time: string;
  source: string;
  destination: string;
  protocol: "ARP" | "DNS" | "TCP" | "HTTP" | "TLS";
  length: number;
  info: string;
  payload?: string;
  details: {
    layer2: string;
    layer3: string;
    layer4: string;
    layer7?: string;
  };
}

const PACKETS_MOCK: Packet[] = [
  {
    no: 1,
    time: "0.000000",
    source: "192.168.1.45",
    destination: "Broadcast",
    protocol: "ARP",
    length: 42,
    info: "Who has 192.168.1.1? Tell 192.168.1.45",
    details: {
      layer2: "Ethernet II, Src: 00:1a:2b:3c:4d:5e, Dst: ff:ff:ff:ff:ff:ff",
      layer3: "Address Resolution Protocol (request)",
      layer4: "Target IP: 192.168.1.1, Sender IP: 192.168.1.45",
    },
  },
  {
    no: 2,
    time: "0.001240",
    source: "192.168.1.1",
    destination: "192.168.1.45",
    protocol: "ARP",
    length: 42,
    info: "192.168.1.1 is at 00:50:56:c0:00:01",
    details: {
      layer2: "Ethernet II, Src: 00:50:56:c0:00:01, Dst: 00:1a:2b:3c:4d:5e",
      layer3: "Address Resolution Protocol (reply)",
      layer4: "Sender MAC: 00:50:56:c0:00:01, Target MAC: 00:1a:2b:3c:4d:5e",
    },
  },
  {
    no: 3,
    time: "0.014520",
    source: "192.168.1.45",
    destination: "192.168.1.1",
    protocol: "DNS",
    length: 74,
    info: "Standard query 0x1a2b A auth.corp.internal",
    details: {
      layer2: "Ethernet II, Src: 00:1a:2b:3c:4d:5e, Dst: 00:50:56:c0:00:01",
      layer3: "IPv4, Src: 192.168.1.45, Dst: 192.168.1.1",
      layer4: "User Datagram Protocol (UDP), Src Port: 54128, Dst Port: 53",
      layer7: "DNS Query: auth.corp.internal (Type A, Class IN)",
    },
  },
  {
    no: 4,
    time: "0.016210",
    source: "192.168.1.1",
    destination: "192.168.1.45",
    protocol: "DNS",
    length: 90,
    info: "Standard query response 0x1a2b A auth.corp.internal A 10.0.5.20",
    details: {
      layer2: "Ethernet II, Src: 00:50:56:c0:00:01, Dst: 00:1a:2b:3c:4d:5e",
      layer3: "IPv4, Src: 192.168.1.1, Dst: 192.168.1.45",
      layer4: "User Datagram Protocol (UDP), Src Port: 53, Dst Port: 54128",
      layer7: "DNS Answer: auth.corp.internal IP Address = 10.0.5.20",
    },
  },
  {
    no: 5,
    time: "0.021000",
    source: "192.168.1.45",
    destination: "10.0.5.20",
    protocol: "TCP",
    length: 66,
    info: "52140 → 80 [SYN] Seq=0 Win=64240 Len=0 MSS=1460",
    details: {
      layer2: "Ethernet II, Src: 00:1a:2b:3c:4d:5e, Dst: 00:50:56:c0:00:01",
      layer3: "IPv4, Src: 192.168.1.45, Dst: 10.0.5.20",
      layer4: "Transmission Control Protocol (TCP), Flags: [SYN], Seq: 0",
    },
  },
  {
    no: 6,
    time: "0.023400",
    source: "10.0.5.20",
    destination: "192.168.1.45",
    protocol: "TCP",
    length: 66,
    info: "80 → 52140 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0",
    details: {
      layer2: "Ethernet II, Src: 00:50:56:c0:00:01, Dst: 00:1a:2b:3c:4d:5e",
      layer3: "IPv4, Src: 10.0.5.20, Dst: 192.168.1.45",
      layer4: "Transmission Control Protocol (TCP), Flags: [SYN, ACK], Ack: 1",
    },
  },
  {
    no: 7,
    time: "0.023490",
    source: "192.168.1.45",
    destination: "10.0.5.20",
    protocol: "TCP",
    length: 54,
    info: "52140 → 80 [ACK] Seq=1 Ack=1 Win=64240 Len=0",
    details: {
      layer2: "Ethernet II, Src: 00:1a:2b:3c:4d:5e, Dst: 00:50:56:c0:00:01",
      layer3: "IPv4, Src: 192.168.1.45, Dst: 10.0.5.20",
      layer4: "Transmission Control Protocol (TCP), Flags: [ACK], Seq: 1, Ack: 1",
    },
  },
  {
    no: 8,
    time: "0.035120",
    source: "192.168.1.45",
    destination: "10.0.5.20",
    protocol: "HTTP",
    length: 312,
    info: "POST /api/v1/auth/login HTTP/1.1 (application/x-www-form-urlencoded)",
    payload: "POST /api/v1/auth/login HTTP/1.1\r\nHost: auth.corp.internal\r\nUser-Agent: Mozilla/5.0\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 48\r\n\r\nusername=admin_sys&password=SuperSecretP@ssw0rd2026!",
    details: {
      layer2: "Ethernet II, Src: 00:1a:2b:3c:4d:5e, Dst: 00:50:56:c0:00:01",
      layer3: "IPv4, Src: 192.168.1.45, Dst: 10.0.5.20",
      layer4: "Transmission Control Protocol (TCP), Src Port: 52140, Dst Port: 80",
      layer7: "Hypertext Transfer Protocol (HTTP/1.1) POST /api/v1/auth/login [PLAINTEXT CREDENTIAL LEAK!]",
    },
  },
  {
    no: 9,
    time: "0.041000",
    source: "10.0.5.20",
    destination: "192.168.1.45",
    protocol: "HTTP",
    length: 198,
    info: "HTTP/1.1 200 OK (application/json)",
    payload: "HTTP/1.1 200 OK\r\nServer: nginx\r\nContent-Type: application/json\r\n\r\n{\"status\":\"authenticated\",\"role\":\"admin\",\"token\":\"FLAG{HTTP_PLAINTEXT_LEAK_EXPOSED}\"}",
    details: {
      layer2: "Ethernet II, Src: 00:50:56:c0:00:01, Dst: 00:1a:2b:3c:4d:5e",
      layer3: "IPv4, Src: 10.0.5.20, Dst: 192.168.1.45",
      layer4: "TCP Port 80 -> 52140",
      layer7: "HTTP Response 200 OK with Flag Token payload",
    },
  },
  {
    no: 10,
    time: "0.105000",
    source: "192.168.1.45",
    destination: "104.16.12.3",
    protocol: "TLS",
    length: 517,
    info: "Client Hello (TLSv1.3, SNI: cloud.securebank.com)",
    details: {
      layer2: "Ethernet II",
      layer3: "IPv4, Dst: 104.16.12.3 (Port 443)",
      layer4: "TCP Port 443",
      layer7: "Transport Layer Security (TLS 1.3 Handshake Client Hello) - Payload terenkripsi aman",
    },
  },
];

export function NetworkPacketLab() {
  const { completeLab } = useProgress();
  const [filterText, setFilterText] = useState("");
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(PACKETS_MOCK[7]);
  const [flagInput, setFlagInput] = useState("");
  const [labStatus, setLabStatus] = useState<"in_progress" | "solved" | "wrong">("in_progress");

  const filteredPackets = PACKETS_MOCK.filter((p) => {
    if (!filterText) return true;
    const f = filterText.toLowerCase().trim();
    if (f === "http") return p.protocol === "HTTP";
    if (f === "dns") return p.protocol === "DNS";
    if (f === "tcp") return p.protocol === "TCP";
    if (f === "arp") return p.protocol === "ARP";
    return (
      p.protocol.toLowerCase().includes(f) ||
      p.info.toLowerCase().includes(f) ||
      p.source.includes(f) ||
      p.destination.includes(f)
    );
  });

  const handleSubmitFlag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = flagInput.trim();
    if (
      clean === "SuperSecretP@ssw0rd2026!" ||
      clean === "FLAG{HTTP_PLAINTEXT_LEAK_EXPOSED}" ||
      clean === "admin_sys"
    ) {
      setLabStatus("solved");
      completeLab("network-packet-lab", "Network Packet Analysis Fundamentals", "packet-detective");
    } else {
      setLabStatus("wrong");
    }
  };

  return (
    <Card id="network-packet-lab" className="border-[var(--color-border)] overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--color-accent)] font-bold">LAB 02</span>
            <Badge variant="default" size="sm">Pemula s.d Menengah</Badge>
          </div>
          <h2 className="text-lg font-mono font-bold text-[var(--color-text)] mt-1 flex items-center gap-2">
            <Network className="w-5 h-5 text-[var(--color-accent)]" />
            Network Packet Analysis (Wireshark-Style) Lab
          </h2>
        </div>
        <Badge variant={labStatus === "solved" ? "success" : "warning"} size="md">
          {labStatus === "solved" ? "Tantangan Selesai" : "Misi Analisis"}
        </Badge>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Scenario description */}
        <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-xs font-mono space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Skenario Investigasi Insiden:</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Seorang karyawan mengakses server internal tanpa enkripsi HTTPS (port 80). Periksa rekaman paket di bawah menggunakan filter (misal: <code>http</code>), temukan paket transmisi login yang bocor, dan ketikkan password admin atau flag token yang ditemukan.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Filter paket (contoh: http, dns, tcp, 10.0.5.20)..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-1.5 font-mono text-xs">
            {["semua", "http", "dns", "tcp"].map((btn) => (
              <button
                key={btn}
                onClick={() => setFilterText(btn === "semua" ? "" : btn)}
                className="px-2.5 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] cursor-pointer"
              >
                {btn.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Wireshark Packet List */}
        <div className="rounded-lg border border-[var(--color-border)] overflow-hidden font-mono text-xs">
          <div className="overflow-x-auto max-h-56">
            <table className="w-full text-left">
              <thead className="bg-[#0b101c] text-[var(--color-text-muted)] border-b border-[var(--color-border)] sticky top-0">
                <tr>
                  <th className="px-3 py-2 w-12">No.</th>
                  <th className="px-3 py-2 w-20">Time</th>
                  <th className="px-3 py-2 w-32">Source</th>
                  <th className="px-3 py-2 w-32">Destination</th>
                  <th className="px-3 py-2 w-16">Protocol</th>
                  <th className="px-3 py-2">Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[#070a12]">
                {filteredPackets.map((pkt) => {
                  const isSelected = selectedPacket?.no === pkt.no;
                  const isHttp = pkt.protocol === "HTTP";

                  return (
                    <tr
                      key={pkt.no}
                      onClick={() => setSelectedPacket(pkt)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-semibold"
                          : isHttp
                          ? "hover:bg-[var(--color-surface-elevated)] text-emerald-300"
                          : "hover:bg-[var(--color-surface-elevated)]/40 text-slate-300"
                      }`}
                    >
                      <td className="px-3 py-1.5">{pkt.no}</td>
                      <td className="px-3 py-1.5 opacity-60">{pkt.time}</td>
                      <td className="px-3 py-1.5">{pkt.source}</td>
                      <td className="px-3 py-1.5">{pkt.destination}</td>
                      <td className="px-3 py-1.5 font-bold">
                        <span
                          className={`px-1 rounded text-[10px] ${
                            pkt.protocol === "HTTP"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : pkt.protocol === "DNS"
                              ? "bg-sky-950 text-sky-400 border border-sky-800"
                              : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
                          }`}
                        >
                          {pkt.protocol}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 truncate max-w-xs">{pkt.info}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Packet Inspection Details */}
        {selectedPacket && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)]/70 border border-[var(--color-border)] space-y-2">
              <div className="font-bold text-[var(--color-accent)] uppercase">
                Packet Breakdown #{selectedPacket.no} ({selectedPacket.protocol})
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="p-1.5 rounded bg-[#090d16] border border-[var(--color-border-subtle)]">
                  <strong>Layer 2:</strong> {selectedPacket.details.layer2}
                </div>
                <div className="p-1.5 rounded bg-[#090d16] border border-[var(--color-border-subtle)]">
                  <strong>Layer 3:</strong> {selectedPacket.details.layer3}
                </div>
                <div className="p-1.5 rounded bg-[#090d16] border border-[var(--color-border-subtle)]">
                  <strong>Layer 4:</strong> {selectedPacket.details.layer4}
                </div>
                {selectedPacket.details.layer7 && (
                  <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-800/80 text-emerald-300">
                    <strong>Layer 7 (App):</strong> {selectedPacket.details.layer7}
                  </div>
                )}
              </div>
            </div>

            {/* Payload Stream */}
            <div className="p-4 rounded-lg bg-[#070b12] border border-[var(--color-border)] space-y-2 flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-300 uppercase mb-2">
                  Raw Payload Stream (Reconstructed)
                </div>
                {selectedPacket.payload ? (
                  <pre className="p-3 rounded bg-[#090e18] border border-[var(--color-border-subtle)] text-[11px] text-emerald-300 whitespace-pre-wrap break-all leading-relaxed max-h-36 overflow-y-auto">
                    {selectedPacket.payload}
                  </pre>
                ) : (
                  <div className="p-4 text-center text-[var(--color-text-muted)] italic">
                    Paket ini tidak memuat payload data aplikasi (Control / Handshake Segment).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Flag Submission Form */}
        <form onSubmit={handleSubmitFlag} className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 w-full">
            <Input
              placeholder="Masukkan password yang bocor atau flag (misal: SuperSecretP@ssw0rd2026!)..."
              value={flagInput}
              onChange={(e) => setFlagInput(e.target.value)}
            />
          </div>
          <Button size="md" className="font-mono whitespace-nowrap w-full sm:w-auto">
            Verifikasi Hasil
          </Button>
        </form>

        {labStatus === "solved" && (
          <div className="p-3.5 rounded bg-emerald-950/50 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <strong>Luar biasa!</strong> Anda berhasil mendeteksi kredensial plaintext yang bocor pada aliran HTTP. Badge <em>Packet Detective</em> telah terbuka!
            </div>
          </div>
        )}

        {labStatus === "wrong" && (
          <div className="p-3.5 rounded bg-rose-950/50 border border-rose-800 text-rose-300 font-mono text-xs">
            Password atau flag belum tepat. Buka paket No. 8 (HTTP POST /api/v1/auth/login) dan lihat parameter <code>password</code> di raw payload stream.
          </div>
        )}
      </CardBody>
    </Card>
  );
}
