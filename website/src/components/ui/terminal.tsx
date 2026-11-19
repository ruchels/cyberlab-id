"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal as TerminalIcon } from "lucide-react";
import { soundEngine } from "@/lib/sound-engine";

export interface TerminalLine {
  type: "command" | "output" | "error" | "success" | "comment";
  text: string;
}

export function Terminal({
  title = "bash - cyberlab-id",
  lines,
  className = "",
}: {
  title?: string;
  lines: TerminalLine[];
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullText = lines
      .map((l) => (l.type === "command" ? `$ ${l.text}` : l.text))
      .join("\n");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    soundEngine.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-xl border border-slate-800 bg-[#070b13]/95 backdrop-blur-md overflow-hidden text-xs font-mono shadow-[0_12px_36px_rgba(0,0,0,0.6)] relative group ${className}`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/80 bg-[#0d1424]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-slate-600 font-mono text-[10px]">|</span>
          <span className="text-[11px] font-mono text-slate-300 font-medium flex items-center gap-1.5 select-none">
            <TerminalIcon className="w-3 h-3 text-cyan-400" />
            {title}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="text-slate-400 hover:text-cyan-300 transition-colors p-1 rounded hover:bg-slate-800 cursor-pointer"
          title="Salin log terminal"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Terminal Body */}
      <div className="p-4 space-y-1.5 overflow-x-auto leading-relaxed relative">
        {lines.map((line, idx) => {
          if (line.type === "command") {
            return (
              <div key={idx} className="flex items-baseline gap-2 text-slate-100">
                <span className="text-cyan-400 font-bold select-none">$</span>
                <span className="font-semibold text-emerald-300">{line.text}</span>
              </div>
            );
          }
          if (line.type === "error") {
            return (
              <div key={idx} className="text-rose-400 pl-4 font-mono">
                {line.text}
              </div>
            );
          }
          if (line.type === "success") {
            return (
              <div key={idx} className="text-emerald-400 pl-4 font-mono">
                {line.text}
              </div>
            );
          }
          if (line.type === "comment") {
            return (
              <div key={idx} className="text-slate-500 italic select-none">
                # {line.text}
              </div>
            );
          }
          return (
            <div key={idx} className="text-slate-300 pl-4">
              {line.text}
            </div>
          );
        })}

        {/* Live Blinking Prompt Cursor */}
        <div className="flex items-center gap-1 pt-1 text-slate-400 pl-0.5">
          <span className="text-cyan-400 font-bold select-none">&gt;</span>
          <span className="w-2 h-3.5 bg-cyan-400/90 inline-block animate-pulse" />
        </div>
      </div>
    </div>
  );
}
