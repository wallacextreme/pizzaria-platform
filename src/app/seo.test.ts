import { describe, it, expect } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";
import { metadata, viewport } from "./layout";

describe("SEO & Indexação", () => {
  it("deve configurar regras de robots.txt com proteção para /admin e /api", () => {
    const robotsConfig = robots();

    expect(robotsConfig.rules).toBeDefined();
    const rules = Array.isArray(robotsConfig.rules)
      ? robotsConfig.rules[0]
      : robotsConfig.rules;

    expect(rules).toBeDefined();
    expect(rules?.allow).toContain("/");
    expect(rules?.allow).toContain("/pedido/*");
    expect(rules?.disallow).toContain("/admin");
    expect(rules?.disallow).toContain("/api/*");
    expect(robotsConfig.sitemap).toContain("/sitemap.xml");
  });

  it("deve gerar sitemap.xml com prioridade máxima na raiz", () => {
    const sitemapEntries = sitemap();

    expect(Array.isArray(sitemapEntries)).toBe(true);
    expect(sitemapEntries.length).toBeGreaterThan(0);

    const rootEntry = sitemapEntries[0];
    expect(rootEntry.url).toBeDefined();
    expect(rootEntry.priority).toBe(1.0);
    expect(rootEntry.changeFrequency).toBe("daily");
  });

  it("deve exportar viewport com theme-color e responsive scale", () => {
    expect(viewport.themeColor).toBe("#C84B31");
    expect(viewport.width).toBe("device-width");
    expect(viewport.initialScale).toBe(1);
  });

  it("deve conter metadados Open Graph e Twitter Cards completos", () => {
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
    expect(metadata.openGraph).toBeDefined();
    expect((metadata.openGraph as Record<string, unknown>)?.type).toBe("website");
    expect(metadata.openGraph?.locale).toBe("pt_BR");
    expect((metadata.twitter as Record<string, unknown>)?.card).toBe("summary_large_image");
    expect(metadata.alternates?.canonical).toBe("/");
  });
});
