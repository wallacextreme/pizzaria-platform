import { describe, it, expect } from "vitest";
import {
  validateImageFile,
  calculateTargetDimensions,
  ImageProcessingError,
  MAX_DIMENSION,
} from "./imageProcessor";

describe("Client-Side Image Processing Suite", () => {
  describe("Validação de Arquivos", () => {
    it("deve aceitar formatos suportados (JPEG, PNG, WebP)", () => {
      const validJpeg = new Blob(["test"], { type: "image/jpeg" });
      const validPng = new Blob(["test"], { type: "image/png" });
      const validWebp = new Blob(["test"], { type: "image/webp" });

      expect(() => validateImageFile(validJpeg)).not.toThrow();
      expect(() => validateImageFile(validPng)).not.toThrow();
      expect(() => validateImageFile(validWebp)).not.toThrow();
    });

    it("deve rejeitar formatos não permitidos (ex: PDF, GIF, executáveis)", () => {
      const invalidPdf = new Blob(["test"], { type: "application/pdf" });
      const invalidGif = new Blob(["test"], { type: "image/gif" });

      expect(() => validateImageFile(invalidPdf)).toThrow(ImageProcessingError);
      expect(() => validateImageFile(invalidPdf)).toThrow(/Formatos permitidos/);
      expect(() => validateImageFile(invalidGif)).toThrow(ImageProcessingError);
    });

    it("deve rejeitar arquivos que excedam 10MB", () => {
      const oversizedBlob = {
        type: "image/jpeg",
        size: 11 * 1024 * 1024, // 11MB
      } as Blob;

      expect(() => validateImageFile(oversizedBlob)).toThrow(/limite máximo permitido de 10MB/);
    });
  });

  describe("Cálculo de Redimensionamento Proporcional", () => {
    it("deve manter dimensões originais se forem menores que o limite de 1200px", () => {
      const { width, height } = calculateTargetDimensions(800, 600, MAX_DIMENSION);
      expect(width).toBe(800);
      expect(height).toBe(600);
    });

    it("deve redimensionar proporcionalmente imagem horizontal maior que 1200px", () => {
      // 2400 x 1200 -> limite largura 1200 -> altura proporcional 600
      const { width, height } = calculateTargetDimensions(2400, 1200, MAX_DIMENSION);
      expect(width).toBe(1200);
      expect(height).toBe(600);
    });

    it("deve redimensionar proporcionalmente imagem vertical maior que 1200px", () => {
      // 1000 x 2000 -> limite altura 1200 -> largura proporcional 600
      const { width, height } = calculateTargetDimensions(1000, 2000, MAX_DIMENSION);
      expect(width).toBe(600);
      expect(height).toBe(1200);
    });

    it("deve manter proporção 1:1 para imagens quadradas grandes", () => {
      const { width, height } = calculateTargetDimensions(3000, 3000, MAX_DIMENSION);
      expect(width).toBe(1200);
      expect(height).toBe(1200);
    });

    it("deve lançar erro se dimensões forem <= 0", () => {
      expect(() => calculateTargetDimensions(0, 500)).toThrow(ImageProcessingError);
      expect(() => calculateTargetDimensions(-100, 500)).toThrow(ImageProcessingError);
    });
  });
});
