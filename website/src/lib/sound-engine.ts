/**
 * CyberLab-ID Procedural Web Audio Sound Engine
 * 
 * Features:
 * - 100% Procedural & Synthesized via standard Web Audio API
 * - Zero external MP3/WAV dependencies (zero copyright issues, zero network payload, zero 404s)
 * - Ultra-low latency, lightweight, non-blocking
 * - DISABLED by default. Requires explicit user opt-in.
 * - Gentle, harmonic, non-fatiguing UI sounds and ambient generative cyber soundscape.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  
  // Ambient oscillators
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  
  private isMuted: boolean = false;
  private sfxEnabled: boolean = false;
  private ambientEnabled: boolean = false;
  private masterVol: number = 0.5;
  private sfxVol: number = 0.5;
  private ambientVol: number = 0.3;

  private initContext() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVol : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Ambient Gain
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientEnabled ? this.ambientVol : 0, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public updateConfig(config: {
    muted?: boolean;
    sfxEnabled?: boolean;
    ambientEnabled?: boolean;
    masterVolume?: number;
    sfxVolume?: number;
    ambientVolume?: number;
  }) {
    if (config.muted !== undefined) this.isMuted = config.muted;
    if (config.sfxEnabled !== undefined) this.sfxEnabled = config.sfxEnabled;
    if (config.ambientEnabled !== undefined) this.ambientEnabled = config.ambientEnabled;
    if (config.masterVolume !== undefined) this.masterVol = config.masterVolume;
    if (config.sfxVolume !== undefined) this.sfxVol = config.sfxVolume;
    if (config.ambientVolume !== undefined) this.ambientVol = config.ambientVolume;

    if (!this.ctx) {
      if (this.sfxEnabled || this.ambientEnabled) {
        this.initContext();
      } else {
        return;
      }
    }

    const now = this.ctx?.currentTime || 0;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVol, now, 0.05);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? this.sfxVol : 0, now, 0.05);
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientEnabled ? this.ambientVol : 0, now, 0.05);
    }

    // Handle ambient audio state
    if (this.ambientEnabled && !this.isMuted) {
      this.startAmbient();
    } else {
      this.stopAmbient();
    }
  }

  // UI Sound Effects
  public playClick() {
    if (!this.sfxEnabled || this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playHover() {
    if (!this.sfxEnabled || this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(520, now + 0.03);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playTab() {
    if (!this.sfxEnabled || this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06); // A5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playSuccess() {
    if (!this.sfxEnabled || this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Harmonic Major Arpeggio: C5 -> E5 -> G5 -> C6
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + i * 0.07;
      const duration = 0.25;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + duration);
    });
  }

  public playAlert() {
    if (!this.sfxEnabled || this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(280, now + 0.15);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playKeypress() {
    if (!this.sfxEnabled || this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Soft mechanical tactile click
    const pitch = 1400 + (Math.random() * 200 - 100);
    osc.type = "square";
    osc.frequency.setValueAtTime(pitch, now);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.015);
  }

  // Generative Cyber Ambient Drone (Low-Pass Filtered Multi-Oscillator)
  private startAmbient() {
    if (!this.ctx || !this.ambientGain || this.ambientOsc1) return;

    try {
      const now = this.ctx.currentTime;

      // Filter: warm low-pass
      this.ambientFilter = this.ctx.createBiquadFilter();
      this.ambientFilter.type = "lowpass";
      this.ambientFilter.frequency.setValueAtTime(260, now);
      this.ambientFilter.Q.setValueAtTime(1.8, now);

      // Low frequency drone 1: 55Hz (A1)
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = "sawtooth";
      this.ambientOsc1.frequency.setValueAtTime(55, now);

      // Low frequency drone 2: 110Hz (A2) slightly detuned
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = "sine";
      this.ambientOsc2.frequency.setValueAtTime(110.4, now);

      // LFO for filter sweep
      this.ambientLfo = this.ctx.createOscillator();
      this.ambientLfo.frequency.setValueAtTime(0.12, now); // Slow 8.3s cycle
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(120, now);
      this.ambientLfo.connect(lfoGain);
      lfoGain.connect(this.ambientFilter.frequency);

      this.ambientOsc1.connect(this.ambientFilter);
      this.ambientOsc2.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);

      this.ambientOsc1.start(now);
      this.ambientOsc2.start(now);
      this.ambientLfo.start(now);
    } catch {
      // In case browser policy restricts
    }
  }

  private stopAmbient() {
    if (this.ambientOsc1) {
      try {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
      } catch {}
      this.ambientOsc1 = null;
    }
    if (this.ambientOsc2) {
      try {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
      } catch {}
      this.ambientOsc2 = null;
    }
    if (this.ambientLfo) {
      try {
        this.ambientLfo.stop();
        this.ambientLfo.disconnect();
      } catch {}
      this.ambientLfo = null;
    }
  }
}

export const soundEngine = new SoundEngine();
