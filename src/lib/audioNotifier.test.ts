import { describe, it, expect, beforeEach, vi } from "vitest";
import { audioNotifier } from "./audioNotifier";

describe("audioNotifier Web Audio Service", () => {
  beforeEach(() => {
    localStorage.clear();
    audioNotifier._resetForTesting();
  });

  it("inicia com configurações padrão e permite mutar/desmutar", () => {
    expect(audioNotifier.getIsMuted()).toBe(false);

    const isNowMuted = audioNotifier.toggleMute();
    expect(isNowMuted).toBe(true);
    expect(audioNotifier.getIsMuted()).toBe(true);
    expect(localStorage.getItem("kitchen_audio_muted")).toBe("true");

    const isUnmuted = audioNotifier.toggleMute();
    expect(isUnmuted).toBe(false);
    expect(audioNotifier.getIsMuted()).toBe(false);
    expect(localStorage.getItem("kitchen_audio_muted")).toBe("false");
  });

  it("permite ajustar e obter volume respeitando limites de 0 a 1 e persistindo", () => {
    expect(audioNotifier.getVolume()).toBe(0.8);

    audioNotifier.setVolume(0.5);
    expect(audioNotifier.getVolume()).toBe(0.5);
    expect(localStorage.getItem("kitchen_audio_volume")).toBe("0.50");

    // Limites (clamping)
    audioNotifier.setVolume(1.5);
    expect(audioNotifier.getVolume()).toBe(1.0);

    audioNotifier.setVolume(-0.2);
    expect(audioNotifier.getVolume()).toBe(0.0);
  });

  it("retorna false e não toca áudio quando mutado", async () => {
    audioNotifier.toggleMute();
    const played = await audioNotifier.playOrderAlert();
    expect(played).toBe(false);
  });

  it("reproduz som com sucesso quando Web Audio está disponível e ativo", async () => {
    const mockResume = vi.fn().mockResolvedValue(undefined);
    const mockCreateGain = vi.fn().mockReturnValue({
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    });
    const mockCreateOsc = vi.fn().mockReturnValue({
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });

    const mockCtx = {
      state: "running" as AudioContextState,
      currentTime: 10,
      resume: mockResume,
      createGain: mockCreateGain,
      createOscillator: mockCreateOsc,
      destination: {},
    } as unknown as AudioContext;

    audioNotifier._resetForTesting(mockCtx);

    const played = await audioNotifier.playOrderAlert();
    expect(played).toBe(true);
    expect(mockCreateGain).toHaveBeenCalled();
    expect(mockCreateOsc).toHaveBeenCalledTimes(2); // Dois tons harmônicos
  });

  it("tenta desbloquear contexto suspenso e não quebra se o navegador bloquear", async () => {
    const mockResume = vi.fn().mockRejectedValue(new Error("Autoplay prohibited"));
    const mockCtx = {
      state: "suspended" as AudioContextState,
      currentTime: 10,
      resume: mockResume,
    } as unknown as AudioContext;

    audioNotifier._resetForTesting(mockCtx);

    const played = await audioNotifier.playOrderAlert();
    expect(played).toBe(false);
    expect(mockResume).toHaveBeenCalled();
  });

  it("desbloqueia AudioContext via unlockAudioContext()", async () => {
    let contextState: AudioContextState = "suspended";
    const mockResume = vi.fn().mockImplementation(async () => {
      contextState = "running";
    });

    const mockCtx = {
      get state() {
        return contextState;
      },
      resume: mockResume,
    } as unknown as AudioContext;

    audioNotifier._resetForTesting(mockCtx);

    const unlocked = await audioNotifier.unlockAudioContext();
    expect(unlocked).toBe(true);
    expect(mockResume).toHaveBeenCalled();
  });
});
