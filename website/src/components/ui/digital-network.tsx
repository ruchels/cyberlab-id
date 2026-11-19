"use client";

import React, { memo, useState } from "react";
import { Shield, Server, Database, Radio, Laptop, Lock, ArrowUpRight } from "lucide-react";

interface NodeItem {
  id: string;
  name: string;
  role: string;
  ip: string;
  status: "secure" | "monitoring" | "isolated";
  x: number;
  y: number;
  icon: any;
}

const NODES: NodeItem[] = [
  { id: "fw", name: "Border FW", role: "Perimeter Inspection", ip: "10.0.0.1", status: "secure", x: 14, y: 50, icon: Shield },
  { id: "gw", name: "App Gateway", role: "TLS Reverse Proxy", ip: "10.0.1.10", status: "secure", x: 38, y: 30, icon: Server },
  { id: "hp", name: "Honeypot", role: "Decoy Telemetry", ip: "10.0.99.5", status: "monitoring", x: 38, y: 75, icon: Radio },
  { id: "db", name: "Vault DB", role: "Encrypted Storage", ip: "10.0.2.50", status: "secure", x: 65, y: 30, icon: Database },
  { id: "soc", name: "SOC SIEM", role: "Threat Analytics", ip: "10.0.10.1", status: "monitoring", x: 65, y: 75, icon: Lock },
  { id: "ws", name: "Analyst Terminal", role: "SOC Console", ip: "10.0.10.24", status: "secure", x: 88, y: 50, icon: Laptop },
];

const EDGES = [
  { from: "fw", to: "gw" },
  { from: "fw", to: "hp" },
  { from: "gw", to: "db" },
  { from: "gw", to: "soc" },
  { from: "hp", to: "soc" },
  { from: "db", to: "soc" },
  { from: "soc", to: "ws" },
];

export const DigitalNetworkVisualizer = memo(function DigitalNetworkVisualizer() {
  const [selectedNode, setSelectedNode] = useState<NodeItem>(NODES[1]);

  return (
    <div className="relative rounded-xl border border-slate-800 bg-[#0b101c]/90 backdrop-blur-md p-4 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-bold text-slate-200">
            NETWORK TOPOLOGY SIMULATOR
          </span>
          <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
            DEFENSIVE SEGMENTATION
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          6 Enclaves Active
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative h-64 w-full my-2">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Connection Lines */}
          {EDGES.map((edge, idx) => {
            const n1 = NODES.find((n) => n.id === edge.from)!;
            const n2 = NODES.find((n) => n.id === edge.to)!;
            return (
              <g key={idx}>
                <line
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  stroke="rgba(6, 182, 212, 0.25)"
                  strokeWidth="0.8"
                  strokeDasharray="1.5 1.5"
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {NODES.map((node) => {
          const isSelected = selectedNode.id === node.id;
          const IconComp = node.icon;
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={`absolute group p-2 rounded-lg border transition-all duration-200 cursor-pointer flex flex-col items-center z-10 ${
                isSelected
                  ? "bg-cyan-950/80 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.4)] scale-110"
                  : "bg-slate-900/90 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800"
              }`}
            >
              <div className={`p-1.5 rounded ${isSelected ? "text-cyan-300" : "text-slate-300 group-hover:text-cyan-400"}`}>
                <IconComp className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-mono font-medium text-slate-200 whitespace-nowrap mt-0.5">
                {node.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Node Inspector Drawer */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Node: <strong className="text-cyan-300">{selectedNode.name}</strong></span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">IP: <span className="text-slate-200">{selectedNode.ip}</span></span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Role: <span className="text-slate-300">{selectedNode.role}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Zero-Trust Verified
          </span>
        </div>
      </div>
    </div>
  );
});
