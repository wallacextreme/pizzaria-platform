import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CatalogSection } from "./CatalogSection";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/mockData";

describe("CatalogSection Component Suite", () => {
  it("deve renderizar os produtos e categorias corretamente", () => {
    const handleCustomize = vi.fn();
    const handleAddRegular = vi.fn();

    render(
      <CatalogSection
        products={MOCK_PRODUCTS}
        categories={MOCK_CATEGORIES}
        onCustomizePizza={handleCustomize}
        onAddRegularItem={handleAddRegular}
      />
    );

    // Confirma que os nomes dos produtos estão na tela
    expect(screen.getByText("Margherita Especial")).toBeDefined();
    expect(screen.getByText("Calabresa Artesanal Defumada")).toBeDefined();
    expect(screen.getByText("Coca-Cola Original 2 Litros")).toBeDefined();
  });

  it("deve filtrar produtos em tempo real através da barra de busca", () => {
    render(
      <CatalogSection
        products={MOCK_PRODUCTS}
        categories={MOCK_CATEGORIES}
        onCustomizePizza={vi.fn()}
        onAddRegularItem={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar por sabor ou ingrediente/i);
    fireEvent.change(searchInput, { target: { value: "Margherita" } });

    expect(screen.getByText("Margherita Especial")).toBeDefined();
    expect(screen.queryByText("Calabresa Artesanal Defumada")).toBeNull();
  });

  it("deve exibir estado vazio elegante quando nenhum produto for encontrado", () => {
    render(
      <CatalogSection
        products={MOCK_PRODUCTS}
        categories={MOCK_CATEGORIES}
        onCustomizePizza={vi.fn()}
        onAddRegularItem={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/buscar por sabor ou ingrediente/i);
    fireEvent.change(searchInput, { target: { value: "TermoInexistente12345" } });

    expect(screen.getByText("Nenhum produto encontrado")).toBeDefined();
  });

  it("deve acionar onCustomizePizza ao clicar no botão Montar Pizza", () => {
    const handleCustomize = vi.fn();

    render(
      <CatalogSection
        products={MOCK_PRODUCTS}
        categories={MOCK_CATEGORIES}
        onCustomizePizza={handleCustomize}
        onAddRegularItem={vi.fn()}
      />
    );

    const customizeButtons = screen.getAllByRole("button", { name: /personalizar/i });
    const firstButton = customizeButtons[0];
    expect(firstButton).toBeDefined();

    if (firstButton) {
      fireEvent.click(firstButton);
      expect(handleCustomize).toHaveBeenCalledTimes(1);
    }
  });
});
