# BUG_REPORT.md

> Lista detalhada de bugs identificados no estado original do projeto e o
> respetivo estado de correção após esta sessão.
>
> Severidade: **🔴 Crítico** · **🟠 Alto** · **🟡 Médio** · **🟢 Baixo**

---

## B-01 🔴 Data "TODAY" hardcoded como string

* **Ficheiro:** `app/page.tsx:49`
* **Código:** `const TODAY = '2026-05-26'`
* **Impacto:** Toda nova despesa criada cai em 26-05-2026, independentemente do
  dia real do utilizador. O sistema fica essencialmente congelado no tempo.
* **Causa raiz:** O *prompt* gerador da versão v0 fixou a "data de hoje" como
  literal em vez de obter `new Date()`.
* **Correção:** Substituído por `format(new Date(), 'yyyy-MM-dd')` (em
  `lib/format.ts`), recalculado a cada abertura do formulário.
* **Estado:** ✅ Corrigido.

---

## B-02 🔴 Mês selecionado hardcoded ao arrancar

* **Ficheiro:** `app/page.tsx:56`
* **Código:** `const [selectedMonth, setSelectedMonth] = useState(4)` (= maio)
* **Impacto:** Independentemente do mês corrente, abre sempre em maio. A
  partir de 2026-06-01, todas as despesas reais ficavam "escondidas" porque o
  dashboard mostrava maio por defeito.
* **Correção:** `useState(() => new Date().getMonth())` + adição de seletor de
  ano (não só mês). O estado é guardado em `selectedPeriod = {year, month}` em
  `lib/store.tsx`.
* **Estado:** ✅ Corrigido.

---

## B-03 🟠 Parsing de datas com bug de *timezone*

* **Ficheiro:** `app/page.tsx:125`
* **Código:** `new Date(e.date).getMonth()` onde `e.date` é `'YYYY-MM-DD'`.
* **Impacto:** Strings `'YYYY-MM-DD'` são interpretadas como UTC. Em timezones
  ocidentais negativos (e.g. UTC-3 no Brasil), `new Date('2026-05-01')` resolve
  para 30-04-2026 21:00 local — o `.getMonth()` devolve `3` (abril) em vez de
  `4` (maio), atribuindo a despesa ao mês errado.
* **Correção:** Funções `parseISODate(str)` e `monthOf(date)` em
  `lib/format.ts` que dividem a string em `[y, m, d]` e constroem
  `new Date(y, m-1, d)` (interpretação local).
* **Estado:** ✅ Corrigido.

---

## B-04 🟠 Persistência sem validação de *schema*

* **Ficheiro:** `app/page.tsx:62-72`
* **Código:** Apenas `Array.isArray(saved.expenses)` antes de aceitar.
* **Impacto:** Se o `localStorage` for adulterado (ou se o *schema* mudar
  entre versões), o app aceita dados inválidos — campos em falta provocam
  erros em runtime (`Cannot read properties of undefined ...`).
* **Correção:** `lib/storage.ts` usa Zod para validar cada record contra
  `TransactionSchema`, `AccountSchema`, etc. Records inválidos são descartados
  com aviso na consola. Adicionado sistema de migração por `version`.
* **Estado:** ✅ Corrigido.

---

## B-05 🟠 `JSON.parse` engole erros silenciosamente

* **Ficheiro:** `app/page.tsx:70` (e `:79`)
* **Código:** `try { ... } catch {}`
* **Impacto:** Se o `localStorage` contiver lixo, o utilizador nunca é
  informado e o app arranca em estado vazio sem explicação.
* **Correção:** Novo helper `safeRead()` em `lib/storage.ts` que (1) loga
  o erro em `console.warn` com contexto e (2) mostra um *toast* informativo
  via `sonner` quando aplicável.
* **Estado:** ✅ Corrigido.

---

## B-06 🟠 ID baseado em `Date.now()` pode colidir

* **Ficheiro:** `app/page.tsx:151`
* **Código:** `const id = Date.now()`
* **Impacto:** Dois registos criados no mesmo milissegundo (e.g. importação
  em lote) recebem o mesmo `id`. A key do React passa a ser não-única.
* **Correção:** Helper `newId()` em `lib/format.ts` que usa
  `crypto.randomUUID()` quando disponível, com *fallback* para
  `${Date.now()}-${Math.random().toString(36).slice(2)}`.
* **Estado:** ✅ Corrigido.

---

## B-07 🟡 `parseFloat` aceita strings com lixo

* **Ficheiro:** `app/page.tsx:147,152`
* **Código:** `parseFloat(form.amount) > 0`
* **Impacto:** `parseFloat('12abc')` devolve `12` sem erro. O utilizador pode
  introduzir `12abc` no campo `<input type="number">` (em alguns browsers) e
  obter um valor "limpo" silenciosamente.
* **Correção:** Validação com Zod (`z.coerce.number().positive().finite()`)
  + mensagem de erro abaixo do campo via `react-hook-form`.
* **Estado:** ✅ Corrigido.

---

## B-08 🟡 *Daily average* mente quando há vários gastos no mesmo dia

* **Ficheiro:** `app/page.tsx:141-145`
* **Lógica original:** `total / unique_spending_days`.
* **Impacto:** "Daily avg" inflaciona se o utilizador agregar várias compras
  do mesmo dia (típico em mercearia + café + transporte) — divide pelo
  número de **dias com despesas** e não pelos **dias do período**.
* **Correção:** Acrescentadas duas métricas distintas:
  * **Average per spending day** (comportamento antigo, mantido)
  * **Daily run-rate** = `total / dias do período até hoje`
  Ambas exibidas com tooltips explicativos.
* **Estado:** ✅ Corrigido + clarificado.

---

## B-09 🟡 Orçamento (`BUDGET`) hardcoded em $3000

* **Ficheiro:** `app/page.tsx:42`
* **Impacto:** Inútil para qualquer utilizador real.
* **Correção:** Orçamento mensal por categoria editável no separador
  *Budgets*; orçamento global opcional em *Settings*. Persistidos em
  `localStorage` com Zod.
* **Estado:** ✅ Corrigido.

---

## B-10 🟡 Moeda "$" hardcoded em 11 sítios

* **Ficheiro:** `app/page.tsx` (vários)
* **Impacto:** Utilizadores em EUR/BRL/GBP veem sempre `$`.
* **Correção:** Helper `formatMoney(amount, currency, locale)` em
  `lib/format.ts` baseado em `Intl.NumberFormat`. Moeda e *locale*
  selecionáveis em *Settings* (EUR, USD, GBP, BRL, JPY, CHF, +outras).
* **Estado:** ✅ Corrigido.

---

## B-11 🟡 Sem possibilidade de editar transações

* **Ficheiro:** `app/page.tsx` (toda a UI)
* **Impacto:** Para corrigir um valor é preciso apagar e recriar.
* **Correção:** `TransactionForm` agora suporta `mode: 'create' | 'edit'`.
  Cada linha tem ícone de lápis. A edição preserva o `id` e a `createdAt`.
* **Estado:** ✅ Corrigido.

---

## B-12 🟡 `next.config.mjs` ignora erros de TypeScript

* **Ficheiro:** `next.config.mjs:3`
* **Código:** `typescript: { ignoreBuildErrors: true }`
* **Impacto:** `next build` não falha em erros de tipos — bugs entram em
  produção sem aviso.
* **Correção:** Removida a flag. O *build* atual passa com
  *strict mode* ativo.
* **Estado:** ✅ Corrigido.

---

## B-13 🟢 `<Analytics />` injetado sem opt-in

* **Ficheiro:** `app/layout.tsx:41`
* **Impacto:** Em deploys que não sejam Vercel, o componente carrega
  `va.vercel-scripts.com` em produção sem o utilizador final saber.
* **Correção:** Removido. Pode ser reintroduzido se o utilizador quiser e
  adicionar um banner de consentimento.
* **Estado:** ✅ Corrigido (removido por defeito).

---

## B-14 🟢 Metadata genérica ("v0 App")

* **Ficheiro:** `app/layout.tsx:9-11`
* **Impacto:** Título da janela e Open Graph dizem "v0 App".
* **Correção:** Substituído por `A2IE — Expense Analyzer` com descrição
  útil e *theme-color* coerente. Removido `generator: 'v0.app'`.
* **Estado:** ✅ Corrigido.

---

## B-15 🟢 `<html lang="en">` num app em PT-PT

* **Ficheiro:** `app/layout.tsx:38`
* **Impacto:** Leitores de ecrã anunciam o conteúdo em inglês.
* **Correção:** `lang="pt-PT"` (corresponde à UI traduzida).
* **Estado:** ✅ Corrigido.

---

## B-16 🟢 Dois ficheiros `globals.css` (duplicados)

* **Ficheiros:** `app/globals.css` e `styles/globals.css` (idênticos).
* **Impacto:** Quem editar `styles/globals.css` não vê efeito; ruído.
* **Correção:** `styles/globals.css` removido.
* **Estado:** ✅ Corrigido.

---

## B-17 🟢 `index.html` órfão (1215 linhas)

* **Ficheiro:** `index.html`
* **Impacto:** Implementação paralela em HTML+Chart.js que não corre dentro
  do app Next.js. Confunde quem chega novo ao projeto.
* **Correção:** Removido. As funcionalidades úteis (Chart.js → recharts,
  sidebar, filtros) foram absorvidas pela nova arquitetura.
* **Estado:** ✅ Corrigido.

---

## B-18 🟢 Dois lockfiles (`package-lock.json` + `pnpm-lock.yaml`)

* **Impacto:** Risco de versões divergentes consoante o gestor usado.
* **Correção:** Removido `package-lock.json` para fixar pnpm como gestor
  (correspondente ao lockfile mais recente e completo).
* **Estado:** ✅ Corrigido.

---

## B-19 🟡 Modal sem *focus trap*

* **Ficheiro:** `app/page.tsx:332-409`
* **Impacto:** O `Tab` permite sair do modal e focar elementos da página por
  trás (problema de acessibilidade).
* **Correção:** Novo `Modal` em `components/feature/Modal.tsx` que faz
  *focus trap* (ciclo entre primeiro/último elemento focável) + restaura o
  foco anterior ao fechar.
* **Estado:** ✅ Corrigido.

---

## B-20 🟢 *Confirm modal* identifica registo por `id` mas nunca o nome

* **Ficheiro:** `app/page.tsx:398`
* **Impacto:** Diz apenas "Remove this expense?" — utilizador não confirma
  *qual*.
* **Correção:** Mensagem agora cita a descrição: "Remover «Café Starbucks» ?".
* **Estado:** ✅ Corrigido.

---

## Estado final

| Severidade | Encontrados | Corrigidos | Pendentes |
|---|---|---|---|
| 🔴 Crítico | 2 | 2 | 0 |
| 🟠 Alto | 4 | 4 | 0 |
| 🟡 Médio | 7 | 7 | 0 |
| 🟢 Baixo | 7 | 7 | 0 |
| **Total** | **20** | **20** | **0** |
