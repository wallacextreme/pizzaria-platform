import { describe, it, expect } from "vitest";
import manifest from "./manifest";

describe("PWA Manifest", () => {
  it("deve retornar a configuração válida do manifesto PWA", () => {
    const config = manifest();

    expect(config.name).toBe("Pizzaria Artesanal — Forno a Lenha");
    expect(config.short_name).toBe("Pizzaria.io");
    expect(config.display).toBe("standalone");
    expect(config.theme_color).toBe("#C84B31");
    expect(config.background_color).toBe("#181514");
    expect(config.start_url).toBe("/");

    expect(config.icons).toBeDefined();
    expect(Array.isArray(config.icons)).toBe(true);
    expect(config.icons?.length).toBeGreaterThanOrEqual(1);

    const icon = config.icons?.[0];
    expect(icon?.src).toContain("icon");
  });
});
