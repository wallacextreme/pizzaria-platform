import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as fs from "fs/promises";
import * as path from "path";

export const dynamic = "force-dynamic";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB após processamento WebP

/**
 * Validação de Magic Bytes de arquivo WebP:
 * Bytes 0-3: 'RIFF' (0x52 0x49 0x46 0x46)
 * Bytes 8-11: 'WEBP' (0x57 0x45 0x42 0x50)
 */
function isValidWebPMagicBytes(buffer: Uint8Array): boolean {
  if (buffer.length < 12) return false;

  const isRiff =
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46; // F

  const isWebp =
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50; // P

  return isRiff && isWebp;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo enviado ou formato inválido." },
        { status: 400 }
      );
    }

    // 1. Verificação de Tipo MIME declarado
    if (file.type !== "image/webp") {
      return NextResponse.json(
        {
          success: false,
          error: `Formato inválido (${file.type}). Apenas imagens processadas em WebP são aceitas.`,
        },
        { status: 415 }
      );
    }

    // 2. Verificação de Tamanho Máximo
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Tamanho excede o limite máximo permitido de 5MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
        },
        { status: 413 }
      );
    }

    // 3. Verificação de Magic Bytes em Memória (Deep Inspection)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidWebPMagicBytes(new Uint8Array(arrayBuffer))) {
      return NextResponse.json(
        {
          success: false,
          error: "Assinatura de arquivo inválida. O arquivo enviado não é um WebP legítimo.",
        },
        { status: 400 }
      );
    }

    // 4. Geração de Nome Seguro
    const timestamp = Date.now();
    const randomId = crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substring(2, 10);
    const fileName = `prod-${timestamp}-${randomId}.webp`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isRealSupabaseConfigured =
      Boolean(supabaseUrl) &&
      !supabaseUrl?.includes("placeholder") &&
      Boolean(supabaseServiceKey) &&
      !supabaseServiceKey?.includes("placeholder");

    if (isRealSupabaseConfigured) {
      // Produção: Upload direto para o Supabase Storage Bucket 'products'
      const supabaseAdmin = createAdminClient();

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("products")
        .upload(fileName, buffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao enviar para o Supabase Storage: ${uploadError.message}`,
          },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("products")
        .getPublicUrl(uploadData.path);

      return NextResponse.json({
        success: true,
        url: publicUrlData.publicUrl,
        fileName,
        sizeBytes: buffer.length,
        storage: "supabase",
      });
    } else {
      // Modo Local / Fallback para Desenvolvimento Offline e Testes
      const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/products/${fileName}`,
        fileName,
        sizeBytes: buffer.length,
        storage: "local",
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao processar upload.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
