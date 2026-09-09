# Checklist de Prontidão para Produção (Production Readiness Gate)

Este checklist deve ser integralmente validado antes de autorizar o lançamento da aplicação em ambiente de produção.

---

## 1. Compilação e Código
- [ ] Build de produção (`next build` / `bun run build`) finalizado com 0 erros.
- [ ] Verificação de tipos TypeScript (`tsc --noEmit`) com 0 erros e modo estrito ativo.
- [ ] Lint executado com 0 avisos críticos ou erros.
- [ ] Nenhum `console.log` residual com dados sensíveis no código de produção.
- [ ] Nenhum bloco `catch {}` vazio ou sem tratamento de erro resiliente.
- [ ] Nenhum componente com placeholders ou dados fictícios que deveriam vir do banco.

---

## 2. Testes e Qualidade
- [ ] 100% dos testes unitários de regras de negócio passando (precificação, meio a meio, horários).
- [ ] 100% dos testes de integração de API e repositórios passando.
- [ ] Testes de regressão global executados sem nenhuma quebra de fluxo existente.
- [ ] Testes de validação de troco em dinheiro e seleção de delivery/retirada validados.

---

## 3. Segurança e Banco de Dados
- [ ] Row Level Security (RLS) habilitado e verificado em todas as tabelas do Supabase.
- [ ] Funções `is_admin()` e `is_staff_or_admin()` utilizando `SECURITY DEFINER` e validadas contra elevação de privilégios.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` mantida estritamente nas variáveis de ambiente do servidor, sem prefixo público.
- [ ] Endpoint `/api/orders` recalculando preços integralmente no backend a partir dos dados do PostgreSQL.
- [ ] Upload de imagens client-side sanitizando arquivos via Canvas API e limitando a WebP (1200px max).
- [ ] Políticas do Storage bucket `products` restringindo escrita exclusivamente para administradores.

---

## 4. Experiência de Usuário (UX) e Interface
- [ ] Loading states (Skeletons/Spinners) presentes em todas as operações assíncronas.
- [ ] Feedback claro de erro amigável ao usuário, com orientação sobre o que fazer.
- [ ] Estados vazios (Empty States) elegantes para cardápio vazio, carrinho vazio ou ausência de pedidos.
- [ ] Responsividade testada e aprovada em 360px, 390px, 414px, 768px, 1024px e 1440px+.
- [ ] Acessibilidade WCAG 2.1 AA auditada: navegação por teclado, contraste e foco visível.

---

## 5. Performance e SEO
- [ ] Imagens servidas no formato WebP de alta eficiência com dimensões controladas.
- [ ] Fontes web carregadas com `next/font` para prevenir Layout Shift (CLS).
- [ ] Metadados de SEO completos: Title, Description, Open Graph, Twitter Card.
- [ ] Dados estruturados Schema.org (`Restaurant`, `Menu`) válidos no Google Rich Results.

---

## 6. Documentação e Operação
- [ ] `README.md` completo com instruções de instalação, variáveis de ambiente, execução e migrações.
- [ ] Todos os 9 documentos em `docs/` sincronizados com a versão final do software.
- [ ] Histórico de commits Git limpo com mensagens convencionais descritivas.
