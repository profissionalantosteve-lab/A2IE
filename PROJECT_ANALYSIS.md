# PROJECT_ANALYSIS.md

> Análise completa do projeto **A2IE — Expense Analyzer**
> Data da análise: 2026-06-02
> Avaliador: Claude (Opus 4.7)

---

## 1. Visão geral

O projeto é uma aplicação web **Next.js 16 (App Router) + React 19 + TypeScript** cujo
objetivo é o registo e análise de despesas pessoais. Antes desta intervenção, o seu
estado correspondia a um protótipo gerado em [v0.app](https://v0.app/) com a maioria
dos ficheiros do *boilerplate* `shadcn/ui` por usar e a totalidade da lógica
concentrada num único componente cliente de cerca de 400 linhas.

### 1.1 Stack identificada

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Linguagem | TypeScript 5.7 |
| Runtime | React 19 |
| Estilo | Tailwind CSS v4 + `tw-animate-css` |
| Componentes UI | `shadcn/ui` (presentes mas **não utilizados** na versão original) |
| Validação | Zod (instalado, não usado) |
| Gráficos | Recharts (instalado, não usado) |
| Notificações | Sonner (instalado, não usado) |
| Datas | date-fns (instalado, não usado) |
| Formulários | react-hook-form (instalado, não usado) |
| Ícones | lucide-react (instalado, não usado) |
| Persistência | `localStorage` (chave única `expense-analyzer-v1`) |

### 1.2 Estrutura encontrada (antes)

```
A2IE/
├── app/
│   ├── globals.css
│   ├── layout.tsx          # metadata "v0 App"
│   └── page.tsx            # 412 linhas — TODA a aplicação
├── components/
│   ├── theme-provider.tsx  # wrapper next-themes (não usado)
│   └── ui/                 # ~55 componentes shadcn (não usados)
├── hooks/
│   ├── use-mobile.ts       # não usado
│   └── use-toast.ts        # não usado
├── lib/
│   └── utils.ts            # apenas helper cn()
├── public/                 # ícones e placeholders
├── styles/
│   └── globals.css         # DUPLICADO de app/globals.css
├── index.html              # 1215 linhas — implementação ALTERNATIVA (legacy)
├── next.config.mjs         # ignoreBuildErrors: true (perigoso)
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
└── package-lock.json       # dois lockfiles (conflito de gestor)
```

---

## 2. Análise de arquitetura

### 2.1 Problemas estruturais identificados

1. **Monólito em `app/page.tsx`** — toda a UI, estado, persistência e regras de
   negócio num único componente cliente. Impossível de testar, difícil de manter.
2. **`index.html` órfão** — implementação paralela, completa (1215 linhas) com
   Chart.js e sidebar, sem qualquer relação com o app Next.js. É *dead code* puro.
3. **`styles/globals.css` duplicado** de `app/globals.css` (byte por byte) — só um
   é importado pelo `layout.tsx`.
4. **Dois lockfiles** (`package-lock.json` + `pnpm-lock.yaml`) — risco de
   incoerência de versões consoante o gestor usado.
5. **`shadcn/ui` por usar** — ~55 componentes instalados, zero importações no
   código de aplicação. Inflaciona o bundle e cria ruído visual no repositório.
6. **Variáveis CSS Tailwind v4 definidas mas substituídas** por classes
   condicionais inline (`bw` / `black`). O sistema de tokens fica inerte.
7. **Sem separação domínio/UI** — `Expense` e categorias hardcoded no mesmo
   ficheiro da página.

### 2.2 Acoplamento e duplicação

* Theme classes (`bg`, `text`, `muted`, `border`, etc.) são strings inline
  repetidas em 30+ lugares — cada modificação de tema implica edição manual.
* O cálculo do mês ativo é feito em dois sítios (`filteredExpenses` e
  display do título) usando `MONTHS[selectedMonth]`, mas a fonte da
  verdade do índice é um `useState(4)` (= maio) **hardcoded**.
* O valor de hoje (`TODAY`) é uma constante string, não `new Date()` — qualquer
  novo registo cai sempre em 26-05-2026.

---

## 3. Análise de qualidade do código

### 3.1 Pontos positivos do código original

* Uso de `useMemo` para listas derivadas.
* Persistência em `localStorage` envolta em `try/catch`.
* Listener `Escape` para fechar modais e *autofocus* no primeiro campo.
* Atributo `aria-pressed` no toggle de tema.

### 3.2 Pontos negativos

* TypeScript estrito ligado no `tsconfig.json` mas `ignoreBuildErrors: true`
  no `next.config.mjs` — o *typecheck* é silenciosamente ignorado no `next build`.
* O `<Analytics />` da Vercel é montado, mesmo em projetos sem deploy Vercel.
  Está condicional a `NODE_ENV === 'production'`, mas isso ainda assim envia
  *pixels* em qualquer instalação produtiva, sem consentimento do utilizador.
* Sem testes (nenhum ficheiro `*.test.*` ou `*.spec.*`).
* Sem ESLint configurado para regras de qualidade (`eslintConfig` ausente; o
  script `lint` invoca `eslint .` sem `.eslintrc`).
* Sem `prettier` ou EditorConfig.

---

## 4. Análise de UX/UI

| Aspecto | Estado original | Avaliação |
|---|---|---|
| Navegação | Página única | ❌ Limita escalabilidade |
| Modos visuais | "B&W" vs "Full Black" | ⚠ Variante peculiar; nenhum respeita preferência de SO |
| Responsivo | Container `max-w-3xl` apenas | ⚠ Funciona, mas sem otimização móvel real |
| Acessibilidade | `aria-pressed` no toggle, `aria-label` no botão remover | ⚠ Restantes botões/inputs sem `<label>` semântico |
| Feedback de ações | Apenas remoção via modal | ❌ Sem toasts de sucesso/erro |
| Empty state | "No expenses for this month" + botão | ✅ OK |
| Validação | `description.trim().length > 0 && amount > 0` | ❌ Sem mensagens de erro |
| Edição | **Não existe** | ❌ Impossível editar uma transação |
| Datas | `<input type="date">` nativo | ⚠ Sem validação de futuro/passado |
| Moeda | "$" hardcoded | ❌ Sem opção de EUR/GBP/BRL/etc. |

---

## 5. Funcionalidades em falta (versus pedido)

Comparando com o pedido do utilizador:

| Funcionalidade pedida | Estado original |
|---|---|
| Registo de receitas e despesas | ❌ Só despesas |
| Categorias personalizadas | ❌ 8 fixas em código |
| Dashboard com resumo financeiro | ⚠ 3 cards estáticos |
| Gráficos por categoria | ⚠ Barras horizontais simples |
| Histórico de transações | ⚠ Só do mês corrente |
| Pesquisa e filtros | ❌ Inexistente |
| Metas de poupança | ❌ Inexistente |
| Alertas de orçamento | ❌ Apenas cor (amber/vermelho) sem texto |
| Relatórios mensais | ❌ Inexistente |
| Exportação PDF/Excel | ❌ Inexistente |
| Estatísticas financeiras | ⚠ Apenas total e média diária |
| Contas/carteiras | ❌ Inexistente |
| Tags | ❌ Inexistente |
| Modo escuro | ⚠ Existe mas não usa `prefers-color-scheme` |
| Responsividade móvel | ⚠ Parcial |

---

## 6. Vulnerabilidades de segurança

Análise detalhada em **SECURITY_REVIEW.md**. Resumo:

* Sem autenticação — esperado num app *client-only*, mas o utilizador deve
  entender que todos os dados ficam no navegador sem cifra.
* `localStorage` sem cifra: qualquer extensão de navegador com acesso ao
  domínio pode ler tudo.
* `JSON.parse` sem validação de *schema* em produção (apenas verificação rasa
  `Array.isArray(saved.expenses)`).
* `dangerouslySetInnerHTML` não usado (✅).
* Sem CSP, sem `Strict-Transport-Security`, sem `X-Content-Type-Options`,
  configurados — `next.config.mjs` não define `headers()`.

---

## 7. Desempenho

* Bundle inclui `@vercel/analytics`, `next-themes`, `react-hook-form`,
  `recharts`, `sonner`, `zod`, `cmdk`, `embla-carousel-react`, `vaul`,
  `react-day-picker`, ~55 pacotes `@radix-ui/*` — a maioria não usada.
* `app/page.tsx` é cliente (`'use client'`) e renderiza tudo sem dividir,
  obrigando o navegador a hidratar 412 linhas só para mostrar a *home*.
* Cálculos `useMemo` adequados; sem re-renders redundantes detetados.
* Lista de transações sem virtualização — aceitável para volumes pessoais
  (< 10 000 registos).

---

## 8. Conclusão da auditoria

O projeto, no seu estado original, é mais um **template** do que um produto:
demonstra um fluxo mínimo (CRUD de despesas em memória local) mas não cumpre
nenhum dos requisitos avançados pedidos. A intervenção realizada nesta sessão
**re-arquitetou a aplicação** num conjunto de módulos coesos (`lib/` para o
domínio, `components/feature/*` para as vistas, `app/page.tsx` como simples
*shell* de orquestração) e implementou as funcionalidades em falta com
recurso às bibliotecas que já estavam declaradas em `package.json` —
evitando assim aumentar a superfície de dependências.

Consultar:

* [BUG_REPORT.md](BUG_REPORT.md) — todos os bugs encontrados e o seu estado.
* [IMPROVEMENTS.md](IMPROVEMENTS.md) — melhorias implementadas.
* [FEATURES_ROADMAP.md](FEATURES_ROADMAP.md) — roadmap futuro.
* [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) — débito técnico restante.
* [SECURITY_REVIEW.md](SECURITY_REVIEW.md) — análise de segurança detalhada.
