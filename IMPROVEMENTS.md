# IMPROVEMENTS.md

> Melhorias implementadas nesta sessão.
> Cada secção referencia os ficheiros tocados e a *driver* do produto que
> levou à decisão técnica.

---

## 1. Arquitetura

### 1.1 Separação em camadas

Antes: tudo em `app/page.tsx` (412 linhas).
Depois:

```
lib/                      # domínio puro (sem React)
├── types.ts              # entidades + tipos discriminantes
├── schemas.ts            # validação Zod
├── format.ts             # money, dates, ids
├── storage.ts            # localStorage + migrações
├── seed.ts               # estado inicial sensato
├── export.ts             # CSV / JSON / XLSX (SpreadsheetML) / Print PDF
└── store.tsx             # React Context + reducer

components/feature/       # vista + interação
├── AppShell.tsx          # layout, tabs, mobile nav
├── Header.tsx            # branding, theme toggle, settings
├── Dashboard.tsx         # KPIs + alertas
├── CategoryChart.tsx     # doughnut + legenda
├── TrendChart.tsx        # 12-month bar comparativo
├── TransactionsView.tsx  # lista, search, filtro, sort
├── TransactionForm.tsx   # add/edit com Zod + RHF
├── BudgetsView.tsx       # orçamentos por categoria + metas
├── CategoriesView.tsx    # CRUD de categorias
├── AccountsView.tsx      # CRUD de contas/carteiras
├── ReportsView.tsx       # relatórios mensais + export
├── SettingsView.tsx      # moeda, locale, tema, danger zone
└── Modal.tsx             # modal acessível com focus-trap

app/
├── layout.tsx            # metadata correta, providers
└── page.tsx              # apenas <AppShell />
```

### 1.2 Estado global (Context + Reducer)

* `useApp()` hook tipado expõe `state` e `actions`.
* Reducer com ações: `addTx`, `updateTx`, `removeTx`, `setBudget`,
  `addCategory`, `removeCategory`, `addAccount`, `removeAccount`,
  `addGoal`, `updateGoal`, `setSettings`, `replaceAll` (import).
* Persistência automática via `useEffect` que escreve em `localStorage`
  *debounced* (250 ms) para evitar *thrashing*.

### 1.3 Tipos discriminantes

```ts
type Transaction =
  | { kind: 'expense'; ... }
  | { kind: 'income';  ... }
```

Receitas e despesas partilham campos comuns mas o `kind` permite
desambiguação segura em filtros e cálculos.

---

## 2. Funcionalidades novas

| # | Funcionalidade | Implementação |
|---|---|---|
| F-01 | Registo de **receitas** e despesas | Tipo `kind: 'income' \| 'expense'` |
| F-02 | Categorias personalizadas | CRUD com ícone (emoji) e cor |
| F-03 | Múltiplas **contas/carteiras** | CRUD com saldo inicial |
| F-04 | **Tags** | Array `tags: string[]` por transação |
| F-05 | Notas / descrição longa | Campo `notes?: string` opcional |
| F-06 | **Recorrência** (semanal/mensal/anual) | Campo `recurrence` que sugere próxima ocorrência |
| F-07 | Dashboard | Income, expense, saldo, top categoria, % do orçamento |
| F-08 | **Gráfico** categoria (donut) | recharts `PieChart` |
| F-09 | **Gráfico** tendência 12 meses | recharts `BarChart` agrupado |
| F-10 | Pesquisa textual | Match na descrição, nota, tag, categoria |
| F-11 | Filtros | Por tipo, categoria, conta, tag, intervalo de datas |
| F-12 | Sort | Por data, valor, descrição (asc/desc) |
| F-13 | Edição de transações | `TransactionForm` em modo `edit` |
| F-14 | **Metas de poupança** | Goal com `target`, `deadline`, `currentAmount` |
| F-15 | **Orçamentos por categoria** | Limite mensal, barra de progresso |
| F-16 | **Alertas** de orçamento | Inline + toast quando ultrapassa 80% e 100% |
| F-17 | Relatórios mensais | Vista dedicada com tabela + breakdown |
| F-18 | **Export CSV** | `Blob` + download |
| F-19 | **Export JSON** | Backup completo |
| F-20 | **Export XLSX** | SpreadsheetML 2003 XML (sem dependências) |
| F-21 | **Export PDF** | Stylesheet de impressão + `window.print()` |
| F-22 | **Import JSON** | Repõe estado completo após validação Zod |
| F-23 | Moeda + locale configuráveis | `Intl.NumberFormat` |
| F-24 | **Modo escuro** | next-themes + `prefers-color-scheme` + toggle manual |
| F-25 | Responsivo móvel | Tab bar inferior abaixo de 768 px |
| F-26 | *Empty states* informativos | Cada lista tem CTA específico |
| F-27 | **Toasts** | sonner em todas as ações (add, edit, delete, import) |
| F-28 | *Focus trap* nos modais | `Modal.tsx` acessível |
| F-29 | Confirmação de exclusão com nome | "Remover «Café»?" |
| F-30 | Atalhos de teclado | `n` novo, `/` foco na pesquisa, `Esc` fecha |

---

## 3. UX / UI

* **Estética coerente** — tokens CSS via Tailwind v4, modo claro/escuro
  apropriado, *radius* uniformes, espaçamento consistente.
* **Toasts** discretos em vez de modais para mensagens de sucesso.
* **Mensagens de erro inline** abaixo dos campos via react-hook-form +
  Zod.
* **Hierarquia visual** — KPIs grandes no topo, gráficos a meio,
  lista detalhada em baixo.
* **Navegação por tabs** ergonómica em desktop (sidebar) e mobile
  (bottom tab bar).
* **Estados visuais** para orçamentos: verde / âmbar / vermelho consoante
  utilização (com `aria-label` para leitores de ecrã).

---

## 4. Acessibilidade

* `<label>` associada a cada `<input>` no formulário (via shadcn `Form`).
* `role="dialog"` e `aria-modal` no `Modal`.
* `aria-label` em todos os botões só com ícone.
* Suporte a `prefers-reduced-motion` para desativar transições.
* Contraste WCAG AA no tema escuro (verificado a olho com base nos tokens
  shadcn-neutral).
* Foco visível em todos os elementos interativos.

---

## 5. Qualidade de código

* **TypeScript estrito** — `next.config.mjs` já não ignora erros.
* **Sem `any`** — todos os tipos derivados de Zod via `z.infer`.
* **Funções puras** — toda a lógica de cálculo em `lib/` (testável).
* **Reducer determinístico** — sem `useState` espalhados pela UI.
* **Sem efeitos no render** — todas as escritas a localStorage em `useEffect`.
* **Hidratação segura** — leitura do `localStorage` só após `mount`;
  estado inicial via *seed* determinístico para evitar mismatches.

---

## 6. Performance

* `lib/` sem React → tree-shakeable.
* Lista de transações com `useMemo` para filtros, agregações e sort.
* `recharts` importado apenas nos componentes que precisam.
* *Debounce* de 250 ms na escrita para `localStorage`.
* Sem virtualização (não foi adicionada — ver TECHNICAL_DEBT.md).

---

## 7. Documentação

Foram criados 6 documentos:

* `PROJECT_ANALYSIS.md` — auditoria geral.
* `BUG_REPORT.md` — bugs encontrados e estado.
* `IMPROVEMENTS.md` — este ficheiro.
* `FEATURES_ROADMAP.md` — futuras versões.
* `TECHNICAL_DEBT.md` — débitos restantes.
* `SECURITY_REVIEW.md` — análise de segurança.
