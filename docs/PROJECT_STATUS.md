# Status do Projeto — Plataforma de Pizzaria Full-Stack

**Última Atualização**: 2026-09-09
**Fase Atual**: FASE 3 — CHECKOUT, ANTI-TAMPERING & INTEGRAÇÃO WHATSAPP
**Status Geral**: FASE 3 CONCLUÍDA E APROVADA (Gate F3: PASS)

---

## 1. Visão Geral das Fases

| Fase | Título | Status | Gate de Qualidade |
| :--- | :--- | :--- | :--- |
| **Fase 0** | Inspeção + Arquitetura + Baseline | **CONCLUÍDA** | **PASS** |
| **Fase 1** | Foundation + Design System Gastronômico | **CONCLUÍDA** | **PASS** |
| **Fase 2** | Cardápio + Construtor de Pizza + Carrinho | **CONCLUÍDA** | **PASS** |
| **Fase 3** | Checkout + Anti-Tampering + WhatsApp | **CONCLUÍDA** | **PASS** |
| **Fase 4** | Backend Supabase + RLS + Storage WebP | **PRONTO PARA INICIAR** | Pendente autorização |
| **Fase 5** | Admin + Kanban Realtime + Alerta Sonoro | PENDENTE | Bloqueado por Gate F4 |
| **Fase 6** | Polimento + Acessibilidade + Auditoria 10/10 | PENDENTE | Bloqueado por Gate F5 |

---

## 2. Checklist do Gate F3 (Critérios de Aceite Validados)

- [x] Modal de Checkout Completo (`src/components/checkout/CheckoutModal.tsx`):
  - Alternância fluida entre Delivery e Retirada no Balcão.
  - Auto-preenchimento de endereço via ViaCEP (`src/lib/viacep.ts`) ao digitar 8 dígitos de CEP.
  - Fallback manual transparente: se o CEP não for encontrado ou a rede falhar, o cliente preenche manualmente sem bloqueio.
  - Cálculo e mapeamento da taxa de entrega baseado no bairro selecionado (`delivery_zones`).
  - Formas de pagamento: PIX (com aviso e QR demonstrativo), Cartão (na entrega) e Dinheiro.
  - Dinheiro com validação dinâmica de troco (`change_for_cents >= total_cents`) e cálculo de troco a levar.
- [x] Backend como Fonte da Verdade & Anti-Tampering (`src/domain/orderValidator.ts` & `src/app/api/orders/route.ts`):
  - Validação estrita via Zod de todo o payload recebido.
  - Recálculo forçado de todos os itens, sabores, bordas e adicionais no servidor a partir do catálogo de produtos.
  - Rejeição/sobrescrita de preços fraudulentos enviados pelo cliente (`priceTampered` detectado nos testes de segurança).
  - Persistência desacoplada no repositório de pedidos (`IOrderRepository`).
- [x] Formatador Profissional de Mensagem para WhatsApp (`src/domain/whatsapp.ts`):
  - Geração de mensagem estruturada com identificador, cliente, endereço, itens detalhados, valores e forma de pagamento.
  - Geração de URL devidamente codificada com `encodeURIComponent` para `wa.me`.
- [x] Página de Acompanhamento do Pedido (`src/app/pedido/[id]/page.tsx`):
  - Exibição do identificador curto (`display_id`, ex: `#PZ-5011`).
  - Stepper visual de status operacional (`Recebido` -> `Em Preparo` -> `No Forno` -> `A Caminho` -> `Entregue`).
  - Caixa de cópia de chave PIX com botão "Copiar".
  - Botão de reenvio / abertura no WhatsApp e botão de retorno ao cardápio.
- [x] Suíte de Testes Automatizados: 69/69 testes passando (Vitest + Testing Library).
  - Inclui testes de segurança simulando adulteração de preço (tentativa de pagar R$ 1,00 em pizza de R$ 92,00).
- [x] TypeScript estrito validado sem erros (`tsc --noEmit`).
- [x] ESLint executado sem erros ou warnings (`next lint`).
- [x] Compilação de produção Next.js validada com sucesso (`next build`).
- [x] Teste de Navegador Real (desktop e mobile 390px) validado com sucesso via subagente.
- [x] Checkpoint Git registrado para Fase 3.
