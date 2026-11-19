"use client";

import React, { memo } from "react";
import { ShieldCheck, Activity, Cpu, Lock } from "lucide-react";
import { useSound } from "@/lib/sound-context";

export const CyberActivityIndicator = memo(function CyberActivityIndicator() {
  const { playClick } = useSound();

  return (
    <div
      onClick={playClick}
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0a1120]/90 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.12)] cursor-pointer hover:border-cyan-400/60 transition-all duration-200 select-none"
      title="Status Sistem Pertahanan & Lab Siber"
    >
      <div className="relative flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <span className="absolute w-3.5 h-3.5 rounded-full bg-cyan-400/40 animate-ping" />
      </div>

      <span className="text-xs font-mono font-medium text-slate-200 tracking-tight">
        CYBER DEFENSE GRID // <span className="text-cyan-400 font-bold">ONLINE</span>
      </span>

      <span className="hidden sm:inline-block w-px h-3 bg-slate-700" />

      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>100% Client-Side Safe</span>
      </span>
    </div>
  );
});
