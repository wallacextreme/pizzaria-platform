# Plano de Testes — Plataforma de Pizzaria Full-Stack

## 1. Estratégia de Qualidade e Pirâmide de Testes

A qualidade não é uma etapa final, mas um processo contínuo construído junto com cada módulo.
Utilizamos **Vitest** como framework de testes ágil, nativo para TypeScript e compatível com o ecossistema Next.js.

```text
       ▲
      / \
     / E2E \          (Fluxo completo Cardápio -> Carrinho -> Checkout -> Pedido)
    /-------\
   / Integração\      (API Route Handlers, Validação de Preços, Mock Repositories)
  /-------------\
 /    Unitários  \    (Cálculo de Preço, Meio a Meio, Horário da Loja, Formatação)
+-----------------+
```

---

## 2. Testes Unitários de Domínio (`/src/domain/`)

### A. Motor de Precificação (`pricing.test.ts`):
- Cálculo de pizza de 1 sabor com preço base do tamanho.
- Cálculo de pizza meio a meio com regra `maior_valor`:
  - Sabores com mesmo valor.
  - Sabor A mais caro que Sabor B.
  - Sabor B mais caro que Sabor A.
- Cálculo de pizza meio a meio com regra `media_ponderada`:
  - Média com valor par.
  - Média com valor ímpar (arredondamento correto de centavos).
- Adição de borda recheada ao valor base.
- Adição de múltiplos extras (bacon, queijo extra, etc.).
- Multiplicação correta pela quantidade.
- Rejeição de quantidades inválidas ($\le 0$ ou não inteiras).

### B. Regra de Horário da Loja (`storeHours.test.ts`):
- Loja em override manual `aberto`: Retorna aberta independente do horário.
- Loja em override manual `fechado`: Retorna fechada independente do horário.
- Loja em modo `auto`:
  - Horário comercial padrão no mesmo dia (ex: 18:00 às 23:30).
  - Horário antes da abertura (ex: 17:59 -> fechada).
  - Horário exatamente na abertura (ex: 18:00 -> aberta).
  - Horário após o fechamento (ex: 23:31 -> fechada).
  - Horário com virada de meia-noite (ex: 18:00 às 02:00 do dia seguinte):
    - Teste às 23:00 -> aberta.
    - Teste às 01:30 -> aberta.
    - Teste às 02:01 -> fechada.
  - Dia com `is_open = false` -> fechada.

---

## 3. Testes de Integração (`/src/app/api/` e `/src/repositories/`)

### A. Repositórios Mock (Uso Exclusivo para Testes):
- O Mock Repository emula fielmente o comportamento de constraints e erros do PostgreSQL:
  - Rejeição de produto inexistente.
  - Rejeição de categoria inativa.
  - Rejeição de duplicação de slug ou ID.

### B. Endpoint de Criação de Pedidos (`/api/orders`):
- **Cenário de Tentativa de Adulteração de Preço (Security Test)**:
  - Cliente envia produto com preço `total = 100` (R$ 1,00) quando o preço real é `5500` (R$ 55,00).
  - O servidor ignora o valor enviado e recalcula o total correto.
- **Cenário de Produto Inativo**:
  - Rejeição com erro `422` informando que o produto não está disponível.
- **Cenário de Borda/Extra Inexistente no Produto**:
  - Rejeição com erro de integridade.
- **Cenário de Troco Menor que o Total**:
  - Rejeição imediata com validação de troco insuficiente.
- **Cenário de Taxa de Entrega de Bairro Inválido**:
  - Rejeição se o bairro não estiver cadastrado nas zonas ativas.

---

## 4. Testes de Interface e Estado Local

- **Zustand Cart Store (`cartStore.test.ts`)**:
  - Adição de item ao carrinho.
  - Atualização de quantidade (incremento/decremento).
  - Remoção de item.
  - Limpeza completa do carrinho pós-checkout.
  - Persistência e reidratação em `localStorage`.

---

## 5. Matriz de Execução de Testes nos Quality Gates

| Fase | Testes Obrigatórios | Critério de Sucesso |
| :--- | :--- | :--- |
| **Fase 0** | Smoke test de setup, tipos e contratos | 100% de aprovação |
| **Fase 1** | Componentes base e renderização de layout | 100% de aprovação |
| **Fase 2** | Regras de preço, meio a meio, extras e carrinho | 100% de aprovação |
| **Fase 3** | Recálculo de checkout, ViaCEP fallback e anti-tampering | 100% de aprovação |
| **Fase 4** | Permissões RLS, Auth RBAC e Storage policies | 100% de aprovação |
| **Fase 5** | Sincronização Realtime e transições do Kanban | 100% de aprovação |
| **Fase 6** | Regressão Global completa + Acessibilidade + Build | 100% de aprovação |
