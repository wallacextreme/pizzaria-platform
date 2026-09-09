"use client";

import * as React from "react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { ProcessedImageResult } from "@/lib/imageProcessor";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, UploadCloud, Info } from "lucide-react";


export default function UploadDemoPage() {
  const [processed, setProcessed] = React.useState<ProcessedImageResult | null>(null);
  const [serverUrl, setServerUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleImageProcessed = async (result: ProcessedImageResult) => {
    setProcessed(result);
    setUploadError(null);
    setServerUrl(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", result.webpBlob, result.originalName);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro no envio para o servidor.");
      }

      setServerUrl(data.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoved = () => {
    setProcessed(null);
    setServerUrl(null);
    setUploadError(null);
  };

  return (
    <div className="min-h-screen bg-pizza-charcoal text-pizza-cream flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        <div className="border-b border-pizza-border pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="terracotta">Fase 4 — Backend & Storage</Badge>
            <Badge variant="outline">Pipeline WebP + Supabase</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-pizza-cream mt-2">
            Upload & Otimização de Imagens
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Pipeline com conversão automática para WebP via Canvas API, remoção de EXIF, limitação a 1200px e persistência segura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-4">
            <Card className="bg-pizza-charcoal-card border-pizza-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-pizza-terracotta" />
                  <span>Selecione ou Arraste uma Imagem</span>
                </CardTitle>
                <CardDescription>
                  Suporta arquivos JPG, PNG ou WebP de até 10MB. Você também pode colar com Ctrl+V.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  id="product-image-upload"
                  onImageProcessed={handleImageProcessed}
                  onImageRemoved={handleRemoved}
                />
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-5 space-y-4">
            <Card className="bg-pizza-charcoal-card border-pizza-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-pizza-gold" />
                  <span>Métricas de Compressão</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {processed ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Nome original:</span>
                        <span className="font-mono text-pizza-cream truncate max-w-[160px]">{processed.originalName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Dimensões finais:</span>
                        <span className="font-bold text-pizza-gold">{processed.width} × {processed.height} px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Tamanho WebP:</span>
                        <span className="font-bold text-emerald-400">{(processed.sizeBytes / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Qualidade WebP:</span>
                        <span>82% (Lossy otimizado)</span>
                      </div>
                    </div>

                    {uploading && (
                      <p className="text-pizza-gold animate-pulse">Enviando para o servidor de armazenamento...</p>
                    )}

                    {serverUrl && (
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Armazenado com sucesso!</span>
                        </div>
                        <p className="text-stone-400 break-all font-mono text-[11px]">{serverUrl}</p>
                      </div>
                    )}

                    {uploadError && (
                      <p className="text-red-400 font-medium">{uploadError}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-stone-500 space-y-2">
                    <p>Nenhuma imagem carregada ainda.</p>
                    <p className="text-[11px]">Faça upload de uma foto para visualizar a taxa de compressão e o processamento Canvas.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-black/20 border border-pizza-border text-xs space-y-2">
              <h3 className="font-bold text-stone-300">Regras de Segurança Ativas</h3>
              <ul className="space-y-1 text-stone-400 list-disc list-inside text-[11px]">
                <li>Remoção total de dados EXIF e geolocalização</li>
                <li>Validação de Magic Bytes RIFF/WEBP no backend</li>
                <li>Limite estrito de 5MB por upload no servidor</li>
                <li>Bucket protegido por Row Level Security</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
