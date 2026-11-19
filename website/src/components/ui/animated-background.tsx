"use client";

import React, { memo } from "react";

export const AnimatedBackground = memo(function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* 1. Deep Base Atmosphere */}
      <div className="absolute inset-0 bg-[#070a13]" />

      {/* 2. Soft Ambient Drift Orbs (CSS Keyframe GPU-accelerated) */}
      <div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[130px] animate-ambient-drift will-change-transform"
        style={{ transform: "translate3d(0, 0, 0)" }}
      />
      <div
        className="absolute top-1/3 -left-48 w-[550px] h-[550px] rounded-full bg-indigo-600/10 blur-[140px] animate-ambient-drift will-change-transform"
        style={{ animationDelay: "-6s", transform: "translate3d(0, 0, 0)" }}
      />
      <div
        className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[130px] animate-ambient-drift will-change-transform"
        style={{ animationDelay: "-12s", transform: "translate3d(0, 0, 0)" }}
      />

      {/* 3. Cyber Grid Overlay */}
      <div className="absolute inset-0 bg-grid-cyber opacity-70 mask-radial-fade" />

      {/* 4. Subtle Top Horizon Glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* 5. Minimalist Cyber Crosshairs (Decorative) */}
      <div className="hidden lg:block absolute top-24 left-12 text-[10px] font-mono text-cyan-500/20 select-none">
        + 0x7F001 // SEC_GRID
      </div>
      <div className="hidden lg:block absolute top-24 right-12 text-[10px] font-mono text-cyan-500/20 select-none text-right">
        NODE_STATUS // ONLINE +
      </div>
      <div className="hidden lg:block absolute bottom-12 left-12 text-[10px] font-mono text-slate-700/40 select-none">
        [CYBERLAB-ID: PROTOCOL_V2]
      </div>
    </div>
  );
});
