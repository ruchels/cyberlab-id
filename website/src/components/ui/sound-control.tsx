"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Sparkles, Radio, Music, Sliders, Check } from "lucide-react";
import { useSound } from "@/lib/sound-context";

export function SoundControl() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    isMuted,
    sfxEnabled,
    ambientEnabled,
    masterVolume,
    sfxVolume,
    ambientVolume,
    toggleMute,
    toggleSfx,
    toggleAmbient,
    setMasterVolume,
    setSfxVolume,
    setAmbientVolume,
    playClick,
    playSuccess,
    playAlert,
  } = useSound();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const hasAudioActive = (!isMuted && (sfxEnabled || ambientEnabled));

  return (
    <div className="relative" ref={panelRef}>
      {/* Sound Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          playClick();
        }}
        aria-label="Sound & Audio Settings"
        title="Pengaturan Audio & Suara"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs transition-all duration-200 border cursor-pointer ${
          hasAudioActive
            ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
            : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-slate-700"
        }`}
      >
        {isMuted || (!sfxEnabled && !ambientEnabled) ? (
          <VolumeX className="w-3.5 h-3.5" />
        ) : (
          <div className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            {ambientEnabled && (
              <span className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 h-2 bg-cyan-400 animate-pulse" />
                <span className="w-0.5 h-3 bg-cyan-400 animate-pulse delay-75" />
                <span className="w-0.5 h-1.5 bg-cyan-400 animate-pulse delay-150" />
              </span>
            )}
          </div>
        )}
        <span className="hidden sm:inline text-[11px]">
          {isMuted ? "Muted" : sfxEnabled || ambientEnabled ? "Audio On" : "Audio"}
        </span>
      </button>

      {/* Futuristic Command Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#0b101c]/95 backdrop-blur-xl border border-cyan-900/40 shadow-[0_12px_36px_rgba(0,0,0,0.6)] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono text-xs font-bold text-slate-200 tracking-wide">
                CYBERLAB AUDIO ENGINE
              </span>
            </div>
            <button
              onClick={toggleMute}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                isMuted
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              {isMuted ? "UNMUTE" : "MUTE ALL"}
            </button>
          </div>

          <div className="space-y-4 py-3">
            {/* SFX Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>UI Micro-Sounds</span>
                </div>
                <div className="text-[10px] text-slate-400">Suara klik, hover, & feedback taktil</div>
              </div>
              <button
                onClick={toggleSfx}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  sfxEnabled ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    sfxEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Ambient Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ambient Drone</span>
                </div>
                <div className="text-[10px] text-slate-400">Suasana lab cyber procedural sintetis</div>
              </div>
              <button
                onClick={toggleAmbient}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  ambientEnabled ? "bg-cyan-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    ambientEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Master Volume Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Master Volume</span>
                <span>{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Test Sounds */}
            {sfxEnabled && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500 block mb-2 uppercase tracking-wider">
                  Test UI Feedback
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={playClick}
                    className="text-[10px] font-mono py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    Click
                  </button>
                  <button
                    onClick={playSuccess}
                    className="text-[10px] font-mono py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 transition-colors"
                  >
                    Success
                  </button>
                  <button
                    onClick={playAlert}
                    className="text-[10px] font-mono py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 transition-colors"
                  >
                    Alert
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Web Audio Procedural</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Zero MP3 Trackers
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
