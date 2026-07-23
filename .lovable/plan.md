
# Sistema Lei do Bem — Experiência do Relator

Protótipo funcional frontend (sem backend) com dados fictícios (mock) demonstrando o fluxo completo do Relator: dashboard, criação de projeto, ficha longa em etapas, evidências, despesas e envio para revisão.

## Escopo desta versão

- Apenas persona **Relator**.
- Sem autenticação real — usuário logado fictício ("Ana Souza — P&D").
- Sem integração com IA real — botões "Melhorar/Analisar com IA" mostram um painel lateral com resposta simulada (placeholder).
- Sem upload real — anexos ficam em estado local (nome, tipo, data, autor).
- Persistência apenas em memória + `localStorage` para simular auto-save e rascunhos.

## Design system

- **Cor primária:** `#BE1520` (vermelho corporativo), com neutros cinza-carvão e branco.
- Visual corporativo, denso e produtivo: tipografia sóbria (Inter), cantos discretos, tabelas limpas, cards com hierarquia clara.
- Tokens semânticos em `src/styles.css` (primary, background, muted, border, status colors para Rascunho/Ajustes/Pronto/Submetido/Aprovado/Indeferido).
- Layout desktop/tablet (min 1024px otimizado, funcional em 768px).

## Estrutura de rotas (TanStack Router)

```
/                              → redireciona para /dashboard
/dashboard                     → Tela 1: dashboard do Relator
/projetos/novo                 → Tela 2: criar novo projeto
/projetos/$id                  → Tela 3: ficha do projeto (layout com sidebar)
  ├─ /informacoes-gerais
  ├─ /elemento-inovador
  ├─ /barreiras-desafios
  ├─ /metodologia
  ├─ /evidencias
  ├─ /despesas
  └─ /revisao-final
```

Layout compartilhado em `__root.tsx`: header fixo (logo "Lei do Bem", nome/área do usuário, menu de perfil).

## Telas

### Tela 1 — Dashboard
- Header com identidade do sistema e usuário.
- 5 cards de resumo (Rascunho, Ajustes, Enviados para Revisão, Prontos, Submetidos) com contagem e link rápido que aplica filtro na tabela.
- Tabela de projetos com colunas: Nome, Área, Responsável, Última atualização, Prazo, Status (badge colorida).
- Toolbar: busca por nome, filtro por status (multi-select), filtro por período (date range), botão primário "Novo Projeto".
- Dados mock: ~12 projetos variados cobrindo todos os status.

### Tela 2 — Novo Projeto
- Formulário curto com validação (Zod + react-hook-form).
- Campos: nome, área (select), responsável (pré-preenchido, disabled), data início, data prevista término, patente (radio + campo condicional para número), natureza (radio Produto/Processo/Serviço), atividade (radio 3 opções).
- Ao salvar → cria projeto em status "Rascunho" e navega para `/projetos/$id/informacoes-gerais`.

### Tela 3 — Ficha do Projeto (layout com sidebar)
- **Sidebar esquerda** com as 7 etapas, cada uma com ícone de status (Completa ✓ / Em andamento ● / Pendente ○) e barra de progresso geral (%).
- **Header interno da ficha:** nome do projeto, badge de status, "Última atualização há X min", indicador "Salvo automaticamente".
- **Barra inferior fixa (sticky):** botões "Salvar Rascunho" (secundário) e "Enviar para Revisão" (primário, desabilitado até 100% obrigatórios).
- **Auto-save:** debounce de 1,5s salvando no `localStorage`, com toast discreto.

Componente reutilizável **`<QuestionField>`**: label + textarea grande + contador de caracteres + 2 botões inline ("Melhorar com IA", "Analisar com IA") + dropzone compacta para anexos da pergunta. Painel lateral direito (Sheet) mostra sugestão/análise da IA (mock).

**Seções:**
1. **Informações Gerais** — leitura/edição dos dados da Tela 2.
2. **Elemento Tecnologicamente Novo ou Inovador** — 11 perguntas (QuestionField cada).
3. **Barreiras e Desafios Tecnológicos** — 9 perguntas.
4. **Metodologia e Métodos** — 7 perguntas + upload de cronograma.
5. **Evidências** — dropzone geral + lista de arquivos categorizada (Fotos, Nota fiscal, Relatório, Apresentação, Outros) com colunas Nome, Tipo, Data, Autor, ações.
6. **Despesas** — Tabs (shadcn):
   - **Funcionários:** busca por crachá (mock lookup), tabela editável (código, nome, função, atividade, horas totais, horas elegíveis). Alerta informativo sobre horas elegíveis.
   - **Serviços de Terceiros:** tabela com empresa, CNPJ, NF, valor total, valor usado neste projeto. Validação: soma alocada em outros projetos + este não pode exceder valor total da NF (mock de alocações em outros projetos para demonstrar o aviso).
   - **Materiais:** fornecedor, CNPJ, NF, valor bruto, valor líquido, descrição do material, descrição de uso no projeto.
7. **Revisão Final** — resumo consolidado por seção com checklist de pendências e botão "Enviar para Revisão" (muda status para "Pronto").

## Detalhes técnicos

- **Stack:** TanStack Start já configurado, Tailwind v4, shadcn/ui.
- **Estado:** Zustand para store de projetos (`useProjectsStore`) com persistência em localStorage; react-hook-form + Zod por formulário.
- **Componentes shadcn usados:** Card, Table, Badge, Button, Input, Textarea, Select, RadioGroup, Tabs, Sheet, Dialog, Progress, Toast (sonner), Tooltip, Popover, Calendar/DateRangePicker, DropdownMenu.
- **Mock data:** `src/data/mock.ts` com áreas, colaboradores (crachás), fornecedores, projetos-exemplo.
- **Tipos:** `src/types/project.ts` com Project, ProjectStatus, Expense (Employee/ThirdParty/Material), Evidence, QuestionAnswer.
- **SEO/head:** título e descrição específicos por rota em `head()`.

## Fora do escopo (deixar claro no protótipo)

- Login/autenticação real.
- Upload de arquivos para storage.
- IA real (respostas simuladas).
- Submissão ao MCTI.
- Outras personas (revisor, admin).

## Entregável

Protótipo navegável cobrindo o fluxo completo: dashboard → novo projeto → preenchimento da ficha em todas as 7 etapas → despesas nas 3 abas → envio para revisão, com dados fictícios já populados para demonstração imediata.
