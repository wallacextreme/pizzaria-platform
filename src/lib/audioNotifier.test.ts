import { describe, it, expect, beforeEach } from "vitest";

import { audioNotifier } from "./audioNotifier";

describe("AudioNotifierService (Web Audio API)", () => {
  beforeEach(() => {
    localStorage.clear();
    audioNotifier.setVolume(0.8);
    if (audioNotifier.getIsMuted()) {
      audioNotifier.toggleMute();
    }
  });

  it("permite alternar mudo e persiste no localStorage", () => {
    expect(audioNotifier.getIsMuted()).toBe(false);

    const isMuted = audioNotifier.toggleMute();
    expect(isMuted).toBe(true);
    expect(audioNotifier.getIsMuted()).toBe(true);
    expect(localStorage.getItem("kitchen_audio_muted")).toBe("true");

    const unmuted = audioNotifier.toggleMute();
    expect(unmuted).toBe(false);
    expect(audioNotifier.getIsMuted()).toBe(false);
    expect(localStorage.getItem("kitchen_audio_muted")).toBe("false");
  });

  it("ajusta o volume respeitando os limites entre 0.0 e 1.0", () => {
    audioNotifier.setVolume(0.5);
    expect(audioNotifier.getVolume()).toBe(0.5);

    audioNotifier.setVolume(1.5);
    expect(audioNotifier.getVolume()).toBe(1.0);

    audioNotifier.setVolume(-0.3);
    expect(audioNotifier.getVolume()).toBe(0.0);
  });

  it("retorna false e não toca áudio quando mutado", async () => {
    audioNotifier.toggleMute();
    expect(audioNotifier.getIsMuted()).toBe(true);

    const played = await audioNotifier.playOrderAlert();
    expect(played).toBe(false);
  });
});
