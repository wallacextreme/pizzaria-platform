/**
 * Client-Side Image Processing Pipeline (Canvas API -> WebP)
 * 
 * PADRÃO DE PRODUÇÃO:
 * - Valida MIME type (PNG, JPEG, WebP) e tamanho máximo bruto (10MB).
 * - Sanitiza metadados EXIF ao renderizar novamente os pixels no Canvas.
 * - Redimensiona proporcionalmente limitando a maior dimensão a 1200px.
 * - Converte e comprime para WebP com qualidade 0.82.
 * - Economiza banda e storage em até 85%.
 */

export interface ProcessedImageResult {
  webpBlob: Blob;
  originalName: string;
  width: number;
  height: number;
  sizeBytes: number;
  previewUrl: string;
}

export const MAX_DIMENSION = 1200;
export const WEBP_QUALITY = 0.82;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

/**
 * Valida o arquivo bruto antes do processamento.
 */
export function validateImageFile(file: File | Blob): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ImageProcessingError(
      `Formato de imagem inválido: "${file.type}". Formatos permitidos: JPG, PNG e WebP.`
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageProcessingError(
      `O arquivo excede o limite máximo permitido de 10MB (tamanho recebido: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`
    );
  }
}

/**
 * Calcula dimensões proporcionais preservando o aspect ratio.
 */
export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number = MAX_DIMENSION
): { width: number; height: number } {
  if (originalWidth <= 0 || originalHeight <= 0) {
    throw new ImageProcessingError("Dimensões de imagem inválidas.");
  }

  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }

  if (originalWidth > originalHeight) {
    const width = maxDimension;
    const height = Math.round((originalHeight * maxDimension) / originalWidth);
    return { width, height };
  } else {
    const height = maxDimension;
    const width = Math.round((originalWidth * maxDimension) / originalHeight);
    return { width, height };
  }
}

/**
 * Processa um arquivo de imagem no navegador usando Canvas e exporta para WebP.
 */
export async function processImageToWebP(file: File): Promise<ProcessedImageResult> {
  validateImageFile(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const { width, height } = calculateTargetDimensions(img.width, img.height, MAX_DIMENSION);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new ImageProcessingError("Não foi possível inicializar o contexto 2D do Canvas."));
          return;
        }

        // Desenha imagem redimensionada no canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta como WebP
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              reject(new ImageProcessingError("Falha na conversão para formato WebP."));
              return;
            }

            const previewUrl = URL.createObjectURL(blob);

            resolve({
              webpBlob: blob,
              originalName: file.name.replace(/\.[^/.]+$/, "") + ".webp",
              width,
              height,
              sizeBytes: blob.size,
              previewUrl,
            });
          },
          "image/webp",
          WEBP_QUALITY
        );
      } catch (err: unknown) {
        URL.revokeObjectURL(objectUrl);
        reject(err instanceof Error ? err : new ImageProcessingError("Erro ao processar imagem."));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new ImageProcessingError("Falha ao decodificar a imagem fornecida."));
    };

    img.src = objectUrl;
  });
}
