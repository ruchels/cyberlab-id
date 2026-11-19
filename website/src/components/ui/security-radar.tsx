"use client";

import React, { memo } from "react";
import { Shield, Radio, Activity } from "lucide-react";

interface SecurityRadarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  threatLevel?: "nominal" | "elevated" | "active";
}

export const SecurityRadar = memo(function SecurityRadar({
  size = "md",
  className = "",
  threatLevel = "nominal",
}: SecurityRadarProps) {
  const sizeMap = {
    sm: "w-44 h-44",
    md: "w-64 h-64",
    lg: "w-80 h-80",
  };

  const blipColors = {
    nominal: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
    elevated: "bg-amber-400 shadow-[0_0_8px_#fbbf24]",
    active: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
  };

  return (
    <div
      className={`relative rounded-full border border-cyan-500/20 bg-[#090e1a]/80 backdrop-blur-sm flex items-center justify-center overflow-hidden ${sizeMap[size]} ${className}`}
      aria-label="Decorative Security Radar Simulation"
    >
      {/* Concentric Grid Rings */}
      <div className="absolute inset-2 rounded-full border border-cyan-500/15" />
      <div className="absolute inset-8 rounded-full border border-cyan-500/20" />
      <div className="absolute inset-16 rounded-full border border-cyan-500/25" />
      <div className="absolute inset-24 rounded-full border border-cyan-500/30" />

      {/* Axis Crosshairs */}
      <div className="absolute inset-x-0 h-px bg-cyan-500/20" />
      <div className="absolute inset-y-0 w-px bg-cyan-500/20" />

      {/* Diagonal Markers */}
      <div className="absolute inset-x-0 h-px bg-cyan-500/10 rotate-45" />
      <div className="absolute inset-x-0 h-px bg-cyan-500/10 -rotate-45" />

      {/* Sweeping Beam */}
      <div
        className="absolute inset-0 rounded-full animate-radar-sweep will-change-transform"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.35) 0deg, rgba(6, 182, 212, 0.08) 45deg, transparent 90deg, transparent 360deg)",
        }}
      />

      {/* Center Reticle */}
      <div className="relative z-10 w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
      </div>

      {/* Simulated Telemetry Blips */}
      <div className="absolute top-[28%] left-[62%] flex items-center gap-1 z-10">
        <span className={`w-2 h-2 rounded-full ${blipColors[threatLevel]} animate-pulse`} />
        <span className="text-[9px] font-mono text-cyan-300/80 bg-[#070a13]/90 px-1 rounded border border-cyan-500/30">
          NODE:8080
        </span>
      </div>

      <div className="absolute bottom-[32%] left-[26%] flex items-center gap-1 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
        <span className="text-[9px] font-mono text-emerald-300/80 bg-[#070a13]/90 px-1 rounded border border-emerald-500/30">
          SEC_GATEWAY
        </span>
      </div>

      <div className="absolute top-[68%] right-[30%] flex items-center gap-1 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8] animate-pulse" />
        <span className="text-[9px] font-mono text-indigo-300/80 bg-[#070a13]/90 px-1 rounded border border-indigo-500/30">
          SOC_SIEM
        </span>
      </div>

      {/* Radar Overlay Metadata */}
      <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
        <span className="text-[8px] font-mono text-cyan-500/60 uppercase tracking-widest bg-[#070a13]/80 px-2 py-0.5 rounded border border-cyan-900/30">
          RADAR SIM // 360° DEFENSE SCAN
        </span>
      </div>
    </div>
  );
});
