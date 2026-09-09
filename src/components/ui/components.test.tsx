import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Input } from "./Input";
import { Tabs } from "./Tabs";
import { Dialog } from "./Dialog";
import { Drawer } from "./Drawer";

describe("Base UI Components Suite", () => {
  describe("Button Component", () => {
    it("deve renderizar o texto e disparar o evento de clique", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Pedir Pizza</Button>);

      const button = screen.getByRole("button", { name: /pedir pizza/i });
      expect(button).toBeDefined();

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("deve desabilitar e indicar loading quando isLoading for verdadeiro", () => {
      render(<Button isLoading>Processando</Button>);
      const button = screen.getByRole("button");

      expect(button.getAttribute("disabled")).not.toBeNull();
      expect(button.getAttribute("aria-busy")).toBe("true");
    });
  });

  describe("Badge Component", () => {
    it("deve renderizar o conteúdo do badge", () => {
      render(<Badge variant="success">Forno Aberto</Badge>);
      expect(screen.getByText("Forno Aberto")).toBeDefined();
    });

    it("deve renderizar com ponto indicador quando dot for verdadeiro", () => {
      const { container } = render(<Badge dot pulse variant="danger">Esgotado</Badge>);
      const dot = container.querySelector(".animate-pulse");
      expect(dot).toBeDefined();
    });
  });

  describe("Input Component", () => {
    it("deve renderizar com label e id vinculado acessível", () => {
      render(<Input label="Seu Telefone" placeholder="11 99999-9999" />);
      const input = screen.getByLabelText(/seu telefone/i);
      expect(input).toBeDefined();
      expect(input.getAttribute("placeholder")).toBe("11 99999-9999");
    });

    it("deve renderizar mensagem de erro e marcar aria-invalid", () => {
      render(<Input label="CEP" error="CEP inválido" />);
      const input = screen.getByLabelText(/cep/i);

      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(screen.getByText("CEP inválido")).toBeDefined();
    });
  });

  describe("Tabs Component", () => {
    it("deve renderizar abas e acionar callback onChange ao clicar", () => {
      const handleChange = vi.fn();
      const items = [
        { id: "tab-1", label: "Tradicionais", count: 12 },
        { id: "tab-2", label: "Especiais", count: 8 },
      ];

      render(<Tabs items={items} activeTab="tab-1" onChange={handleChange} />);

      const tab1 = screen.getByRole("tab", { name: /tradicionais/i });
      expect(tab1.getAttribute("aria-selected")).toBe("true");

      const tab2 = screen.getByRole("tab", { name: /especiais/i });
      expect(tab2.getAttribute("aria-selected")).toBe("false");

      fireEvent.click(tab2);
      expect(handleChange).toHaveBeenCalledWith("tab-2");
    });
  });

  describe("Dialog Component", () => {
    it("não deve renderizar quando isOpen for falso", () => {
      render(
        <Dialog isOpen={false} onClose={vi.fn()} title="Título Modal">
          <p>Conteúdo</p>
        </Dialog>
      );
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("deve renderizar acessivelmente quando isOpen for verdadeiro", () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Título Modal">
          <p>Conteúdo do Modal</p>
        </Dialog>
      );

      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Título Modal")).toBeDefined();
      expect(screen.getByText("Conteúdo do Modal")).toBeDefined();

      const closeButton = screen.getByRole("button", { name: /fechar janela/i });
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Drawer Component", () => {
    it("deve renderizar o drawer e fechar pelo botão", () => {
      const handleClose = vi.fn();
      render(
        <Drawer isOpen={true} onClose={handleClose} title="Carrinho">
          <p>Itens do pedido</p>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Carrinho")).toBeDefined();
      expect(screen.getByText("Itens do pedido")).toBeDefined();

      const closeButton = screen.getByRole("button", { name: /fechar painel/i });
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
