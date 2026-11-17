"use client";

import * as React from "react";
import type { Category, Product } from "@/types/domain";
import { parseBRLInputToCents, formatCentsToBRL } from "@/domain/currency";
import type { ProcessedImageResult } from "@/lib/imageProcessor";
import { publishRealtimeSync } from "@/lib/realtimeBroadcast";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  categories: Category[];
  onSaved: (product: Product, mode: "create" | "edit") => void;
}

export function ProductFormModal({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onSaved,
}: ProductFormModalProps) {
  const isEditing = Boolean(productToEdit);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id || "cat-tradicionais");
  const [isPizza, setIsPizza] = React.useState(true);
  const [basePriceRaw, setBasePriceRaw] = React.useState("72,00");
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [vegetarian, setVegetarian] = React.useState(false);
  const [spicy, setSpicy] = React.useState(false);
  const [badge, setBadge] = React.useState("");
  const [removableText, setRemovableText] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadNotice, setUploadNotice] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setUploadNotice(null);

    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description);
      setCategoryId(productToEdit.category_id);
      setIsPizza(productToEdit.flags.is_pizza);

      // Usa preço da Grande se pizza, ou primeiro tamanho disponível
      const grandeSize = productToEdit.sizes.find((s) => s.id === "size-grande");
      const refCents = grandeSize?.price_cents ?? productToEdit.sizes[0]?.price_cents ?? 5000;
      setBasePriceRaw((refCents / 100).toFixed(2).replace(".", ","));

      setIsFeatured(Boolean(productToEdit.flags.is_featured));
      setVegetarian(Boolean(productToEdit.flags.vegetarian));
      setSpicy(Boolean(productToEdit.flags.spicy));
      setBadge(productToEdit.flags.badge || "");
      setRemovableText(productToEdit.removable_ingredients.join(", "));
      setImageUrl(productToEdit.images[0] || "");
    } else {
      setName("");
      setDescription("");
      setCategoryId(categories[0]?.id || "cat-tradicionais");
      setIsPizza(true);
      setBasePriceRaw("72,00");
      setIsFeatured(false);
      setVegetarian(false);
      setSpicy(false);
      setBadge("");
      setRemovableText("");
      setImageUrl("");
    }
  }, [isOpen, productToEdit, categories]);

  // Envia o Blob WebP gerado no Canvas do cliente para /api/upload
  const handleImageProcessed = async (result: ProcessedImageResult) => {
    setIsUploading(true);
    setError(null);
    setUploadNotice(null);

    try {
      const formData = new FormData();
      formData.append("file", result.webpBlob, result.originalName);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || "Falha ao enviar imagem WebP para o servidor.");
      }

      setImageUrl(data.url);
      setUploadNotice(`WebP salvo (${(result.sizeBytes / 1024).toFixed(1)} KB) em ${data.url}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Informe um nome válido com ao menos 2 caracteres.");
      return;
    }

    if (description.trim().length < 4) {
      setError("Informe uma descrição com ao menos 4 caracteres.");
      return;
    }

    const baseCents = parseBRLInputToCents(basePriceRaw);
    if (!baseCents || baseCents <= 0) {
      setError("Informe um preço válido maior que R$ 0,00.");
      return;
    }

    const removableList = removableText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSaving(true);

    try {
      if (isEditing && productToEdit) {
        // Recalcula proporcionalmente os tamanhos se o preço referência foi alterado
        const updatedSizes = isPizza
          ? [
              {
                id: "size-brotinho",
                name: "Brotinho (4 fatias)",
                price_cents: Math.round((baseCents * 0.55) / 100) * 100,
                slices: 4,
                max_flavors: 1,
              },
              {
                id: "size-media",
                name: "Média (6 fatias)",
                price_cents: Math.round((baseCents * 0.8) / 100) * 100,
                slices: 6,
                max_flavors: 2,
              },
              {
                id: "size-grande",
                name: "Grande (8 fatias)",
                price_cents: baseCents,
                slices: 8,
                max_flavors: 2,
              },
              {
                id: "size-familia",
                name: "Família (12 fatias)",
                price_cents: Math.round((baseCents * 1.24) / 100) * 100,
                slices: 12,
                max_flavors: 2,
              },
            ]
          : [
              {
                id: "size-padrao",
                name: productToEdit.sizes[0]?.name || "Unidade",
                price_cents: baseCents,
                slices: 0,
                max_flavors: 0,
              },
            ];

        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: productToEdit.id,
            name: name.trim(),
            description: description.trim(),
            category_id: categoryId,
            images: imageUrl ? [imageUrl] : productToEdit.images,
            sizes: updatedSizes,
            removable_ingredients: removableList,
            flags: {
              is_pizza: isPizza,
              is_featured: isFeatured,
              vegetarian,
              spicy,
              badge: badge.trim() || undefined,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Erro ao atualizar produto.");
        }

        publishRealtimeSync("products");
        onSaved(data.product, "edit");
        onClose();
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            category_id: categoryId,
            is_pizza: isPizza,
            base_price_cents: baseCents,
            images: imageUrl ? [imageUrl] : [],
            removable_ingredients: removableList,
            flags: {
              is_featured: isFeatured,
              vegetarian,
              spicy,
              badge: badge.trim() || undefined,
            },
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Erro ao criar produto.");
        }

        publishRealtimeSync("products");
        onSaved(data.product, "create");
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar: ${productToEdit?.name}` : "Cadastrar Novo Item no Cardápio"}
      description="As fotos são convertidas para WebP otimizado antes do upload e sincronizadas ao vivo com a loja."
      maxWidth="lg"
      className="max-h-[92vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-left py-2">
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nome do Produto"
            placeholder="Ex: Pepperoni Diavola"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label
              htmlFor="product-category-select"
              className="block text-xs font-semibold text-stone-300 uppercase tracking-wider"
            >
              Categoria
            </label>
            <select
              id="product-category-select"
              value={categoryId}
              onChange={(e) => {
                const nextCat = e.target.value;
                setCategoryId(nextCat);
                if (nextCat === "cat-bebidas") {
                  setIsPizza(false);
                } else {
                  setIsPizza(true);
                }
              }}
              className="w-full h-11 px-3 bg-pizza-charcoal border border-pizza-border rounded-xl text-sm text-pizza-cream focus:outline-none focus:ring-2 focus:ring-pizza-terracotta"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="product-description"
            className="block text-xs font-semibold text-stone-300 uppercase tracking-wider"
          >
            Descrição Gastronômica
          </label>
          <textarea
            id="product-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva os ingredientes e diferenciais..."
            className="w-full p-3 rounded-xl bg-pizza-charcoal border border-pizza-border text-sm text-pizza-cream placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-pizza-terracotta resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={isPizza ? "Preço Pizza Grande (8 fatias)" : "Preço Unitário (R$)"}
            placeholder="Ex: 74,90"
            value={basePriceRaw}
            onChange={(e) => setBasePriceRaw(e.target.value)}
            helperText={
              isPizza
                ? `Brotinho, Média e Família são derivados automaticamente a partir de ${formatCentsToBRL(
                    parseBRLInputToCents(basePriceRaw) || 0
                  )}`
                : "Valor unitário em R$"
            }
          />

          <Input
            label="Selo de Destaque (Opcional)"
            placeholder="Ex: Chef Signature, Novidade"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
          />
        </div>

        {/* Opções e Flags */}
        <div className="flex flex-wrap gap-4 p-3.5 rounded-xl bg-pizza-charcoal border border-pizza-border text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-stone-200">
            <input
              type="checkbox"
              checked={isPizza}
              onChange={(e) => setIsPizza(e.target.checked)}
              className="rounded border-pizza-border text-pizza-terracotta"
            />
            <span>É Pizza (habilita tamanhos e meio a meio)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-stone-200">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-pizza-border text-pizza-terracotta"
            />
            <span>Mais Pedida / Destaque</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-emerald-300">
            <input
              type="checkbox"
              checked={vegetarian}
              onChange={(e) => setVegetarian(e.target.checked)}
              className="rounded border-pizza-border text-emerald-500"
            />
            <span>Vegetariana</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-amber-300">
            <input
              type="checkbox"
              checked={spicy}
              onChange={(e) => setSpicy(e.target.checked)}
              className="rounded border-pizza-border text-amber-500"
            />
            <span>Picante</span>
          </label>
        </div>

        {isPizza && (
          <Input
            label="Ingredientes Removíveis (separados por vírgula)"
            placeholder="Ex: cebola roxa, azeitonas pretas, orégano"
            value={removableText}
            onChange={(e) => setRemovableText(e.target.value)}
          />
        )}

        {/* Pipeline Client-Side Canvas -> WebP -> /api/upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
              Foto do Produto (Conversão Automática WebP)
            </span>
            {isUploading && (
              <span className="text-xs text-pizza-gold flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enviando WebP...
              </span>
            )}
          </div>

          <ImageUpload
            initialImageUrl={imageUrl || undefined}
            onImageProcessed={handleImageProcessed}
            onImageRemoved={() => {
              setImageUrl("");
              setUploadNotice(null);
            }}
          />

          {uploadNotice && (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{uploadNotice}</span>
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-pizza-border flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving || isUploading}
            className="font-bold gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? "Salvar Alterações" : "Publicar no Cardápio"}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
