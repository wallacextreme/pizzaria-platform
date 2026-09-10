# Regras de Negócio — Plataforma de Pizzaria Full-Stack

## 1. Princípios Gerais de Precificação
- **Moeda**: Real Brasileiro (BRL), representado e calculado internamente em **centavos inteiros** (`price_cents`).
- **Validação de Preço no Backend**: O cliente envia intenção (IDs dos produtos, tamanho, sabores, borda, extras). O servidor busca as entidades autoritativas no banco de dados e recalcula o preço total do item.

---

## 2. Regra de Precificação Meio a Meio (Half-and-Half)

A regra é parametrizada no banco (`store_settings.half_and_half_pricing_rule`) com duas opções:

### A. `maior_valor` (Padrão de Mercado)
O preço base da pizza é o maior preço entre os sabores escolhidos para o tamanho selecionado:
$$\text{BasePrice} = \max(\text{flavor}_1.\text{price}, \text{flavor}_2.\text{price})$$

### B. `media_ponderada` (Ou Média Aritmética Simples 50/50)
O preço base da pizza é a média aritmética exata dos sabores escolhidos, com arredondamento determinístico:
$$\text{BasePrice} = \text{Math.round}\left(\frac{\text{flavor}_1.\text{price} + \text{flavor}_2.\text{price}}{2}\right)$$

### Preço Final do Item de Pizza
$$\text{ItemUnitPrice} = \text{BasePrice} + \text{CrustPrice} + \sum \text{ExtraPrice}$$
$$\text{ItemTotalPrice} = \text{ItemUnitPrice} \times \text{Quantity}$$

---

## 3. Regras de Tamanho e Fatias
- **Brotinho (4 fatias)**: Exclusivamente **1 sabor**.
- **Média (6 fatias)**: Até **2 sabores** (1 sabor ou meio a meio).
- **Grande (8 fatias)**: Até **2 sabores** (1 sabor ou meio a meio).
- **Família (12 fatias)**: Até **2 sabores** (1 sabor ou meio a meio).

Se o cliente selecionar um tamanho que não suporte 2 sabores e enviar 2 sabores, o backend rejeita a requisição com erro `422 Unprocessable Entity`.

---

## 4. Regras de Entrega e Retirada

### Modalidade `delivery`:
- Exige endereço completo (rua, número, bairro, cidade, estado, CEP).
- O bairro selecionado deve existir na tabela `delivery_zones` e estar ativo (`active = true`).
- A taxa de entrega (`delivery_fee_cents`) é recuperada exclusivamente da tabela de zonas de entrega pelo backend.
- Se o subtotal do pedido for inferior a `min_order_cents`, o pedido é rejeitado.

### Modalidade `retirada`:
- Endereço é nulo.
- Taxa de entrega é estritamente `0`.
- Não se aplica restrição de taxa de entrega.

---

## 5. Regras de Pagamento
- **PIX**:
  - Geração de payload PIX Copia e Cola / QR Code demonstrativo para o escopo atual, deixando hooks prontos para PSP (Mercado Pago, EFI, etc.).
- **Cartão (Débito/Crédito na Entrega/Balcão)**:
  - Cliente informa a bandeira ou modalidade. Maquininha é levada pelo entregador.
- **Dinheiro**:
  - Se selecionado dinheiro, o cliente pode informar se precisa de troco.
  - Se precisar de troco (`change_for_cents`), o valor DEVE ser estritamente maior que o total do pedido:
    $$\text{change\_for\_cents} \ge \text{total\_cents}$$
  - O cálculo do troco a ser preparado pela equipe é:
    $$\text{troco} = \text{change\_for\_cents} - \text{total\_cents}$$

---

## 6. Regra de Horário e Status Operacional da Loja

O status operacional da loja pode assumir três estados:
- `aberto`: Forçado manualmente pelo administrador via painel.
- `fechado`: Forçado manualmente pelo administrador via painel.
- `auto`: Determinado automaticamente com base no horário atual do fuso `America/Sao_Paulo` contra a tabela `operating_hours`.

### Avaliação do Modo Automático:
Para o dia da semana atual (`0 = Domingo`, ..., `6 = Sábado`):
1. Verifica se `is_open = true`. Se falso, a loja está fechada.
2. Para cada intervalo `[start, end]`:
   - Se `start <= end` (horário normal no mesmo dia, ex: `18:00` a `23:30`):
     $$\text{currentTime} \ge \text{start} \land \text{currentTime} < \text{end}$$
   - Se `start > end` (virada de noite/madrugada, ex: `18:00` a `02:00`):
     $$\text{currentTime} \ge \text{start} \lor \text{currentTime} < \text{end}$$
3. Se nenhum intervalo corresponder, a loja está fechada.

Quando a loja estiver fechada, novos pedidos pela web são bloqueados ou sinalizados como agendamento/fechado conforme configuração.

---

## 7. Máquina de Estados e Transições de Pedidos (Kanban)

O ciclo de vida do pedido é estritamente controlado pelo backend (`orderTransitions.ts`):
- `novo` → `em_preparo`
- `em_preparo` → `no_forno`
- `no_forno` → `saiu_para_entrega`
- `saiu_para_entrega` → `concluido`

### Regras de Cancelamento:
- Cancelamento (`cancelado`) é permitido a partir dos status: `novo`, `em_preparo`, `no_forno` e `saiu_para_entrega`.
- Pedidos com status `concluido` são imutáveis e jamais podem ser cancelados ou regredidos.
- Pedidos com status `cancelado` são imutáveis e jamais podem ser reabertos.
- Qualquer tentativa de pular etapas (ex: `novo` → `concluido`) ou regredir arbitrariamente (ex: `saiu_para_entrega` → `novo`) é rejeitada com código HTTP `400 Bad Request`.

---

## 8. Definição Única de Negócio para Métricas do Dashboard (`metrics.ts`)

Todas as métricas operacionais compartilham uma única fórmula e fonte de verdade:
- **Faturamento do Dia**: Somatório de `total_cents` de todos os pedidos criados na data civil de referência cujo status seja DIFERENTE de `cancelado`.
- **Pedidos do Dia**: Contagem de pedidos válidos do dia de referência (`status != 'cancelado'`).
- **Pedidos em Andamento**: Contagem de pedidos ativos em produção ou rota cujo status pertença a `['novo', 'em_preparo', 'no_forno', 'saiu_para_entrega']`.
- **Ticket Médio**: Divisão inteira `faturamento_do_dia / pedidos_do_dia` (em centavos inteiros arredondados). Se zero pedidos, retorna `0`.

---

## 9. Disponibilidade e Pausa de Produtos

- Quando um produto tem seu status alterado para pausado (`is_active = false`) pelo administrador via `/api/products`:
  1. A alteração persiste imediatamente no banco de dados.
  2. A vitrine pública reflete o item indisponível/desabilitado.
  3. Carrinhos de compras existentes mantêm o item sem quebrar a interface do cliente.
  4. Na tentativa de checkout posterior, o motor de validação (`orderValidator.ts`) rejeita a criação do pedido informando amigavelmente que o produto foi pausado e não está mais disponível.

---

## 10. Transparência Gastronômica, Acessibilidade & Persistência (Fase 6)

- **Destaque Visual para Restrições Alimentares & Remoções**:
  - Quando um cliente solicita a remoção de um ingrediente (ex: cebola, manjericão, lactose), a comanda da cozinha (`OrderCard.tsx`) exibe um badge visual vermelho com ícone de alerta destacado, prevenindo erros operacionais na esteira de montagem da pizza.
- **Persistência Reativa do Carrinho**:
  - A seleção de itens é mantida no `localStorage` do cliente através do store Zustand. O recarregamento acidental de página, perda momentânea de conexão ou navegação entre abas não esvazia o pedido em montagem.
  - O carrinho só é esvaziado quando o pedido é submetido com sucesso no checkout ou por ação explícita no botão "Esvaziar carrinho".
- **Acessibilidade Universal**:
  - O cardápio digital deve ser operável por navegação em teclado, com salto de foco lógico e suporte a leitores de tela para itens, adicionais e preços.
- **Estruturação de Dados de Cardápio para Motores de Busca**:
  - O cardápio é mapeado via dados estruturados Schema.org `Menu` com ofertas de preço em BRL para exibição em snippets do Google.

