"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { soundEngine } from "./sound-engine";

export interface SoundSettings {
  isMuted: boolean;
  sfxEnabled: boolean;
  ambientEnabled: boolean;
  masterVolume: number;
  sfxVolume: number;
  ambientVolume: number;
}

interface SoundContextType extends SoundSettings {
  toggleMute: () => void;
  toggleSfx: () => void;
  toggleAmbient: () => void;
  setMasterVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
  setAmbientVolume: (vol: number) => void;
  playClick: () => void;
  playHover: () => void;
  playTab: () => void;
  playSuccess: () => void;
  playAlert: () => void;
  playKeypress: () => void;
}

const defaultSettings: SoundSettings = {
  isMuted: false,
  sfxEnabled: false, // OFF by default as required
  ambientEnabled: false, // OFF by default as required
  masterVolume: 0.5,
  sfxVolume: 0.5,
  ambientVolume: 0.25,
};

const SoundContext = createContext<SoundContextType>({
  ...defaultSettings,
  toggleMute: () => {},
  toggleSfx: () => {},
  toggleAmbient: () => {},
  setMasterVolume: () => {},
  setSfxVolume: () => {},
  setAmbientVolume: () => {},
  playClick: () => {},
  playHover: () => {},
  playTab: () => {},
  playSuccess: () => {},
  playAlert: () => {},
  playKeypress: () => {},
});

const STORAGE_KEY = "cyberlab_sound_settings";

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => {
          const next = { ...prev, ...parsed };
          soundEngine.updateConfig(next);
          return next;
        });
      }
    } catch {}
  }, []);

  const saveSettings = useCallback((newSettings: SoundSettings) => {
    setSettings(newSettings);
    soundEngine.updateConfig(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {}
  }, []);

  const toggleMute = useCallback(() => {
    saveSettings({ ...settings, isMuted: !settings.isMuted });
  }, [settings, saveSettings]);

  const toggleSfx = useCallback(() => {
    const nextVal = !settings.sfxEnabled;
    saveSettings({ ...settings, sfxEnabled: nextVal });
    if (nextVal) {
      setTimeout(() => soundEngine.playClick(), 50);
    }
  }, [settings, saveSettings]);

  const toggleAmbient = useCallback(() => {
    saveSettings({ ...settings, ambientEnabled: !settings.ambientEnabled });
  }, [settings, saveSettings]);

  const setMasterVolume = useCallback((masterVolume: number) => {
    saveSettings({ ...settings, masterVolume });
  }, [settings, saveSettings]);

  const setSfxVolume = useCallback((sfxVolume: number) => {
    saveSettings({ ...settings, sfxVolume });
  }, [settings, saveSettings]);

  const setAmbientVolume = useCallback((ambientVolume: number) => {
    saveSettings({ ...settings, ambientVolume });
  }, [settings, saveSettings]);

  const playClick = useCallback(() => soundEngine.playClick(), []);
  const playHover = useCallback(() => soundEngine.playHover(), []);
  const playTab = useCallback(() => soundEngine.playTab(), []);
  const playSuccess = useCallback(() => soundEngine.playSuccess(), []);
  const playAlert = useCallback(() => soundEngine.playAlert(), []);
  const playKeypress = useCallback(() => soundEngine.playKeypress(), []);

  return (
    <SoundContext.Provider
      value={{
        ...settings,
        toggleMute,
        toggleSfx,
        toggleAmbient,
        setMasterVolume,
        setSfxVolume,
        setAmbientVolume,
        playClick,
        playHover,
        playTab,
        playSuccess,
        playAlert,
        playKeypress,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
