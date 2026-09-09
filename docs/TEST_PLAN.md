# Plano de Testes — Plataforma de Pizzaria Full-Stack

## 1. Estratégia de Qualidade e Pirâmide de Testes

A qualidade é construída incrementalmente junto com cada fase.
Utilizamos **Vitest** como framework de testes nativo para TypeScript e React Testing Library + happy-dom para componentes DOM.

```text
       ▲
      / \
     / E2E \          (Browser Subagent em Navegador Real: Desktop e Mobile)
    /-------\
   / Integração\      (CatalogSection, PizzaBuilderModal, CartDrawer, StoreStatusBar)
  /-------------\
 /    Unitários  \    (Motor de Preços, Horários da Loja, Formatação de Moeda, CartStore)
+-----------------+
```

---

## 2. Testes Unitários de Domínio (`/src/domain/` e `/src/store/`)

### A. Motor de Precificação (`pricing.test.ts` - 14 testes):
- Cálculo de pizza de sabor único com preço base por tamanho.
- Cálculo de meio a meio com regra `maior_valor`:
  - Sabores com mesmo valor.
  - Sabor A mais caro que Sabor B.
  - Sabor B mais caro que Sabor A.
- Cálculo de meio a meio com regra `media_ponderada`:
  - Média aritmética com valor par.
  - Média com valor ímpar e arredondamento determinístico (`Math.round`).
- Adição de borda recheada ao valor base.
- Adição de múltiplos adicionais extras.
- Multiplicação exata pela quantidade selecionada.
- Cálculo de itens regulares que não são pizza (bebidas, refrigerantes).
- Rejeição de quantidades inválidas ($\le 0$ ou números fracionários).
- Rejeição de 2 sabores em tamanhos de 1 sabor (ex: Brotinho com `max_flavors = 1`).
- Rejeição de pedidos de pizza sem sabor ou sem tamanho.

### B. Regra de Horário da Loja (`storeHours.test.ts` - 13 testes):
- Loja em override manual `aberto` e `fechado`.
- Loja em modo `auto`:
  - Horários comerciais padrão no mesmo dia.
  - Horários antes da abertura e após o fechamento.
  - Turnos noturnos com virada de meia-noite (madrugada do dia seguinte).
  - Dias com fechamento integral da loja.

### C. Utilitários Monetários (`currency.test.ts` - 5 testes):
- Formatação de centavos inteiros para moeda pt-BR (`R$ 00,00`).
- Formatação de zero centavos e valores de milhar.
- Rejeição de valores monetários de ponto flutuante.
- Parse de strings digitadas para inteiros de centavos.

### D. Estado do Carrinho (`cartStore.test.ts` - 9 testes):
- Inicialização com carrinho vazio.
- Adição de itens e atualização de subtotal e contagem total.
- Agrupamento de itens com configurações idênticas (incremento de quantidade).
- Separação de itens com customizações distintas.
- Atualização e remoção ao atingir quantidade 0.
- Limpeza integral do carrinho (`clearCart`).
- Abertura e fechamento do drawer.

---

## 3. Testes de Integração de Componentes (`/src/components/`)

### A. Componentes Base de UI (`components.test.tsx` - 10 testes):
- `Button`: clique, loading state com spinner e desabilitação acessível.
- `Badge`: renderização semântica e indicador de pulso luminoso.
- `Input`: associação acessível de rótulos (`htmlFor`), estados de erro (`aria-invalid`).
- `Tabs`: navegação por abas com atributos ARIA (`role="tablist"`).
- `Dialog` e `Drawer`: abertura controlada, acessibilidade e fechamento por botão.

### B. Catálogo de Produtos (`catalog.test.tsx` - 4 testes):
- Renderização dos cards de produtos com nomes e preços formatados.
- Filtragem textual instantânea via campo de busca.
- Exibição de estado vazio quando nenhum produto for encontrado.
- Disparo de evento `onCustomizePizza` para pizzas.

### C. Construtor de Pizza (`builder.test.tsx` - 2 testes):
- Renderização do modal com tamanhos, fatias e preços base.
- Adição com sucesso ao estado persistente do carrinho.

---

## 4. Matriz de Execução de Testes nos Quality Gates

| Fase | Testes Obrigatórios | Total de Testes | Critério de Sucesso |
| :--- | :--- | :--- | :--- |
| **Fase 0** | Smoke test de setup, tipos e contratos | 5 | 100% PASS |
| **Fase 1** | Componentes base e motor de horários | 28 | 100% PASS |
| **Fase 2** | Motor de preços, carrinho, catálogo e construtor | 57 | 100% PASS |
| **Fase 3** | Recálculo de checkout, ViaCEP fallback e anti-tampering | A definir | 100% PASS |
| **Fase 4** | Permissões RLS, Auth RBAC e Storage policies | A definir | 100% PASS |
| **Fase 5** | Sincronização Realtime e transições do Kanban | A definir | 100% PASS |
| **Fase 6** | Regressão Global completa + Acessibilidade + Build | A definir | 100% PASS |
