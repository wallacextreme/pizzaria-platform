/**
 * Web Audio API Sound Synthesizer — Alertas Sonoros da Cozinha
 * 
 * PADRÃO DE PRODUÇÃO (ADR 007 & 010):
 * - Zero dependência de arquivos MP3 ou WAV externos (sem falhas de carregamento ou CORS).
 * - Sintetizador nativo no navegador via OscillatorNode e GainNode com harmônicos suaves.
 * - Desbloqueio seguro do AudioContext após primeira interação do operador (sem listener leaks).
 * - Persistência de preferências (mute e volume) no localStorage.
 * - Tratamento resiliente de bloqueios de autoplay do navegador sem quebrar a aplicação.
 */

class AudioNotifierService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8; // 0.0 a 1.0
  private unlockListenerAttached: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("kitchen_audio_muted");
      if (savedMute !== null) {
        this.isMuted = savedMute === "true";
      }

      const savedVol = localStorage.getItem("kitchen_audio_volume");
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }

      // Adiciona listener único para desbloqueio no primeiro gesto do usuário
      this.attachUnlockListener();
    }
  }

  private attachUnlockListener(): void {
    if (typeof window === "undefined" || this.unlockListenerAttached) return;

    const unlockHandler = () => {
      this.unlockAudioContext();
      window.removeEventListener("pointerdown", unlockHandler);
      window.removeEventListener("keydown", unlockHandler);
      this.unlockListenerAttached = false;
    };

    window.addEventListener("pointerdown", unlockHandler, { once: true });
    window.addEventListener("keydown", unlockHandler, { once: true });
    this.unlockListenerAttached = true;
  }

  /**
   * Inicializa ou reutiliza a instância única de AudioContext.
   */
  private getOrCreateContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        try {
          this.audioCtx = new AudioContextClass();
        } catch {
          return null;
        }
      }
    }

    return this.audioCtx;
  }

  /**
   * Desbloqueia o AudioContext se estiver suspenso por políticas de autoplay.
   */
  async unlockAudioContext(): Promise<boolean> {
    const ctx = this.getOrCreateContext();
    if (!ctx) return false;

    if ((ctx.state as AudioContextState) === "suspended") {
      try {
        await ctx.resume();
        return (ctx.state as AudioContextState) === "running";
      } catch {
        return false;
      }
    }

    return (ctx.state as AudioContextState) === "running";
  }

  /**
   * Toca o chime sonoro de dois tons ("ding-dong" de cozinha italiana).
   * Retorna true se executado com sucesso ou false se bloqueado/mutado.
   */
  async playOrderAlert(): Promise<boolean> {
    if (this.isMuted) return false;

    const ctx = this.getOrCreateContext();
    if (!ctx) return false;

    try {
      if ((ctx.state as AudioContextState) === "suspended") {
        await ctx.resume();
      }

      // Se ainda permanecer suspenso após tentativa, retorna silenciosamente
      if ((ctx.state as AudioContextState) !== "running") {
        return false;
      }

      const now = ctx.currentTime;

      // Master Gain baseado no volume configurado
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
      // Bloqueio do navegador ou restrição de hardware: nunca crasha a interface
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
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    if (typeof window !== "undefined") {
      localStorage.setItem("kitchen_audio_volume", clamped.toFixed(2));
    }
  }

  getVolume(): number {
    return this.volume;
  }

  getContextState(): AudioContextState | "unsupported" {
    return this.audioCtx ? this.audioCtx.state : "unsupported";
  }

  // Utilitário para isolamento na suíte de testes
  _resetForTesting(customCtx?: AudioContext): void {
    this.audioCtx = customCtx || null;
    this.isMuted = false;
    this.volume = 0.8;
    this.unlockListenerAttached = false;
  }
}

export const audioNotifier = new AudioNotifierService();
