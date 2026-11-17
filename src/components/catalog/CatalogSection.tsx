"use client";

import * as React from "react";
import type { Product, Category } from "@/types/domain";
import { ProductCard } from "./ProductCard";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, SearchX, X, Sparkles, Leaf, Flame } from "lucide-react";

interface CatalogSectionProps {
  products: Product[];
  categories: Category[];
  onCustomizePizza: (product: Product) => void;
  onAddRegularItem: (product: Product) => void;
}

export function CatalogSection({
  products,
  categories,
  onCustomizePizza,
  onAddRegularItem,
}: CatalogSectionProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("todas");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterFeaturedOnly, setFilterFeaturedOnly] = React.useState(false);
  const [filterVegetarianOnly, setFilterVegetarianOnly] = React.useState(false);
  const [filterSpicyOnly, setFilterSpicyOnly] = React.useState(false);

  // Filtra categorias ativas ordenadas por order_index
  const activeCategories = React.useMemo(() => {
    return [...categories]
      .filter((c) => c.is_active)
      .sort((a, b) => a.order_index - b.order_index);
  }, [categories]);

  // Contagem de produtos ativos por categoria
  const tabItems = React.useMemo(() => {
    const allTab = {
      id: "todas",
      label: "Todas as Opções",
      count: products.filter((p) => p.is_active).length,
    };

    const categoryTabs = activeCategories.map((cat) => ({
      id: cat.id,
      label: cat.name,
      count: products.filter((p) => p.category_id === cat.id && p.is_active).length,
    }));

    return [allTab, ...categoryTabs];
  }, [products, activeCategories]);

  // Filtragem dinâmica de produtos
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== "todas" && p.category_id !== selectedCategory) {
        return false;
      }

      if (filterFeaturedOnly && !p.flags.is_featured) {
        return false;
      }

      if (filterVegetarianOnly && !p.flags.vegetarian) {
        return false;
      }

      if (filterSpicyOnly && !p.flags.spicy) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        return matchesName || matchesDesc;
      }

      return true;
    });
  }, [
    products,
    selectedCategory,
    filterFeaturedOnly,
    filterVegetarianOnly,
    filterSpicyOnly,
    searchQuery,
  ]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== "todas" ||
    filterFeaturedOnly ||
    filterVegetarianOnly ||
    filterSpicyOnly;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("todas");
    setFilterFeaturedOnly(false);
    setFilterVegetarianOnly(false);
    setFilterSpicyOnly(false);
  };

  return (
    <section id="cardapio" className="space-y-8 text-left scroll-mt-24">
      {/* Cabeçalho do Cardápio: Título semântico e Barra de Busca */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-pizza-cream font-display tracking-tight">
            Cardápio Artesanal
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xl">
            Pizzas assadas em alta temperatura na pedra vulcânica e bebidas selecionadas para harmonizar.
          </p>
        </div>

        {/* Barra de Pesquisa */}
        <div className="w-full md:w-80">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por sabor ou ingrediente..."
            leftIcon={<Search className="w-4 h-4" />}
            rightIcon={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpar busca"
                  className="p-1 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* Navegação por Abas de Categoria e Filtros Rápidos */}
      <div className="space-y-3">
        <Tabs
          items={tabItems}
          activeTab={selectedCategory}
          onChange={(catId) => setSelectedCategory(catId)}
        />

        {/* Filtros Rápidos Dietéticos e de Destaque */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setFilterFeaturedOnly((prev) => !prev)}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              filterFeaturedOnly
                ? "bg-pizza-terracotta text-white border-pizza-terracotta shadow-sm"
                : "bg-pizza-charcoal text-stone-300 border-pizza-border hover:border-stone-500 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mais Pedidas / Destaques</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterVegetarianOnly((prev) => !prev)}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              filterVegetarianOnly
                ? "bg-emerald-700 text-white border-emerald-500 shadow-sm"
                : "bg-pizza-charcoal text-stone-300 border-pizza-border hover:border-stone-500 hover:text-white"
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vegetarianas</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterSpicyOnly((prev) => !prev)}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              filterSpicyOnly
                ? "bg-red-700 text-white border-red-500 shadow-sm"
                : "bg-pizza-charcoal text-stone-300 border-pizza-border hover:border-stone-500 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Picantes</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[36px] px-3 py-1.5 rounded-full text-xs font-medium text-stone-400 hover:text-pizza-cream transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid de Produtos ou Estado Vazio */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center space-y-4 rounded-3xl bg-pizza-charcoal-card border border-pizza-border p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-pizza-charcoal flex items-center justify-center text-pizza-terracotta border border-pizza-border">
            <SearchX className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-pizza-cream font-display">
              Nenhum produto encontrado
            </h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {searchQuery
                ? `Não encontramos resultados para "${searchQuery}". Tente buscar por outros termos como "Margherita", "Calabresa" ou "Bebidas".`
                : "Nenhum item corresponde aos filtros selecionados no momento."}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            Limpar Filtros e Ver Tudo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onCustomizePizza={onCustomizePizza}
              onAddRegularItem={onAddRegularItem}
            />
          ))}
        </div>
      )}
    </section>
  );
}
