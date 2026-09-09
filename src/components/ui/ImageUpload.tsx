"use client";

import * as React from "react";
import {
  processImageToWebP,
  type ProcessedImageResult,
  ImageProcessingError,
} from "@/lib/imageProcessor";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";


export interface ImageUploadProps {
  id?: string;
  onImageProcessed: (result: ProcessedImageResult) => void;
  onImageRemoved?: () => void;
  initialImageUrl?: string;
  className?: string;
}

export type UploadState = "idle" | "processing" | "success" | "error";

export function ImageUpload({
  id,
  onImageProcessed,
  onImageRemoved,
  initialImageUrl,
  className,
}: ImageUploadProps) {

  const [state, setState] = React.useState<UploadState>(initialImageUrl ? "success" : "idle");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialImageUrl || null);
  const [processedResult, setProcessedResult] = React.useState<ProcessedImageResult | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Limpeza de Blob URL em memória ao desmontar
  React.useEffect(() => {
    return () => {
      if (processedResult?.previewUrl) {
        URL.revokeObjectURL(processedResult.previewUrl);
      }
    };
  }, [processedResult]);

  const handleProcessFile = async (file: File) => {
    setState("processing");
    setErrorMessage(null);

    try {
      const result = await processImageToWebP(file);
      setProcessedResult(result);
      setPreviewUrl(result.previewUrl);
      setState("success");
      onImageProcessed(result);
    } catch (err: unknown) {
      setState("error");
      if (err instanceof ImageProcessingError || err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Erro ao processar imagem.");
      }
    }
  };

  // 1. Upload Convencional via Input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // 2. Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // 3. Colar via Clipboard (Ctrl+V / Cmd+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            handleProcessFile(file);
            return;
          }
        }
      }
    }
  };

  const handleReset = () => {
    if (processedResult?.previewUrl) {
      URL.revokeObjectURL(processedResult.previewUrl);
    }
    setProcessedResult(null);
    setPreviewUrl(null);
    setState("idle");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  return (
    <div
      id={id}
      ref={containerRef}
      onPaste={handlePaste}
      tabIndex={0}
      className={`space-y-3 focus:outline-none focus:ring-2 focus:ring-pizza-terracotta rounded-2xl ${className || ""}`}
    >

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Estado: IDLE ou DRAG OVER */}
      {state === "idle" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
            isDragOver
              ? "border-pizza-terracotta bg-pizza-terracotta/10 scale-[1.01]"
              : "border-pizza-border bg-pizza-charcoal hover:border-stone-500 hover:bg-white/5"
          }`}
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-pizza-charcoal-card border border-pizza-border flex items-center justify-center text-pizza-terracotta">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-pizza-cream">
              Arraste uma foto ou clique para selecionar
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              Você também pode colar direto da área de transferência com{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] text-pizza-gold">
                Ctrl+V
              </kbd>
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-stone-500">
            <span>PNG, JPG ou WebP</span>
            <span>•</span>
            <span>Até 10MB</span>
            <span>•</span>
            <span>Otimizado para 1200px</span>
          </div>
        </div>
      )}

      {/* Estado: PROCESSANDO (Canvas / WebP) */}
      {state === "processing" && (
        <div className="p-8 rounded-2xl border border-pizza-border bg-pizza-charcoal text-center space-y-3">
          <Loader2 className="w-8 h-8 mx-auto text-pizza-terracotta animate-spin" />
          <div>
            <p className="text-sm font-bold text-pizza-cream">Processando imagem...</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Redimensionando para 1200px e convertendo para WebP otimizado via Canvas API.
            </p>
          </div>
        </div>
      )}

      {/* Estado: SUCESSO (Preview) */}
      {state === "success" && previewUrl && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Imagem convertida para WebP com sucesso!</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Remover foto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative aspect-video max-h-48 w-full rounded-xl overflow-hidden border border-pizza-border bg-black/40 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Pré-visualização do produto"
              className="object-contain w-full h-full"
            />
          </div>

          {processedResult && (
            <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-emerald-500/20">
              <span>Dimensões: {processedResult.width}x{processedResult.height}px</span>
              <span>Tamanho final: {(processedResult.sizeBytes / 1024).toFixed(1)} KB (WebP)</span>
              <Badge variant="success">Otimizada</Badge>
            </div>
          )}
        </div>
      )}

      {/* Estado: ERRO */}
      {state === "error" && (
        <div className="p-5 rounded-2xl border border-red-500/40 bg-red-950/30 space-y-3 text-left">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Falha no processamento da imagem</span>
          </div>
          <p className="text-xs text-stone-300">{errorMessage}</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleReset}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Novamente</span>
          </Button>
        </div>
      )}
    </div>
  );
}
