/**
 * Web Audio API Sound Synthesizer — Alertas Sonoros da Cozinha
 * 
 * PADRÃO DE PRODUÇÃO (ADR 007):
 * - Zero dependência de arquivos MP3 ou WAV externos (sem falhas de carregamento ou CORS).
 * - Sintetizador nativo no navegador via OscillatorNode e GainNode.
 * - Suporta desbloqueio de áudio (AudioContext resume) na primeira interação do usuário.
 * - Controle de mudo e volume com persistência no localStorage.
 */

class AudioNotifierService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8; // 0.0 a 1.0

  constructor() {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("kitchen_audio_muted");
      this.isMuted = savedMute === "true";
    }
  }

  private initAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {
        // Bloqueado pelo navegador até interação do usuário
      });
    }

    return this.audioCtx;
  }

  /**
   * Toca um chime sonoro suave de dois tons ("ding-dong" de cozinha italiana).
   */
  async playOrderAlert(): Promise<boolean> {
    if (this.isMuted) return false;

    const ctx = this.initAudioContext();
    if (!ctx) return false;

    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const now = ctx.currentTime;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(ctx.destination);

      // Primeiro tom: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.7, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(masterGain);

      osc1.start(now);
      osc1.stop(now + 0.5);

      // Segundo tom: C5 (523.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(523.25, now + 0.18);

      gain2.gain.setValueAtTime(0.001, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.85, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      osc2.connect(gain2);
      gain2.connect(masterGain);

      osc2.start(now + 0.18);
      osc2.stop(now + 1.0);

      return true;
    } catch {
      return false;
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("kitchen_audio_muted", String(this.isMuted));
    }
    return this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  getVolume(): number {
    return this.volume;
  }
}

export const audioNotifier = new AudioNotifierService();
