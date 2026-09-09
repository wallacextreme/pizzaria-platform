import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

// Helper para criar buffer com cabeçalho WebP válido
function createMockWebPBuffer(size = 32): Buffer {
  const buf = Buffer.alloc(size);
  // 'RIFF'
  buf[0] = 0x52;
  buf[1] = 0x49;
  buf[2] = 0x46;
  buf[3] = 0x46;
  // File size placeholder
  buf[4] = size - 8;
  buf[5] = 0x00;
  buf[6] = 0x00;
  buf[7] = 0x00;
  // 'WEBP'
  buf[8] = 0x57;
  buf[9] = 0x45;
  buf[10] = 0x42;
  buf[11] = 0x50;

  return buf;
}

describe("API Route: /api/upload", () => {
  it("rejeita requisições sem arquivo anexado com status 400", async () => {
    const formData = new FormData();
    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Nenhum arquivo enviado");
  });

  it("rejeita arquivos que não declaram MIME type image/webp com status 415", async () => {
    const formData = new FormData();
    const mockFile = new File(["fake-content"], "test.pdf", { type: "application/pdf" });
    formData.append("file", mockFile);

    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(415);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Formato inválido");
  });

  it("rejeita arquivo com extensão/mime .webp mas magic bytes corrompidos/falsos (Anti-Tampering)", async () => {
    const formData = new FormData();
    // Conteúdo falso com MIME type forjado
    const fakeWebP = new File(["NOT_A_REAL_RIFF_WEBP_FILE"], "hacker.webp", {
      type: "image/webp",
    });
    formData.append("file", fakeWebP);

    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Assinatura de arquivo inválida");
  });

  it("rejeita arquivo WebP excedendo 5MB com status 413", async () => {
    const formData = new FormData();
    // Simula tamanho > 5MB
    const bigBuffer = createMockWebPBuffer(5.5 * 1024 * 1024);
    const bigFile = new File([new Uint8Array(bigBuffer)], "huge.webp", { type: "image/webp" });
    formData.append("file", bigFile);

    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(413);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Tamanho excede o limite");
  });

  it("processa com sucesso um arquivo WebP válido com magic bytes corretos", async () => {
    const formData = new FormData();
    const validBuffer = createMockWebPBuffer(64);
    const validFile = new File([new Uint8Array(validBuffer)], "margherita.webp", { type: "image/webp" });
    formData.append("file", validFile);


    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.url).toBeDefined();
    expect(data.fileName).toMatch(/^prod-\d+-[a-z0-9]+\.webp$/);
    expect(data.sizeBytes).toBe(64);
  });
});
