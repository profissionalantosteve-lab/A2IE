# TECHNICAL_DEBT.md

> Débito técnico identificado e refatorações recomendadas.
> Cada item indica o seu **custo de adoção** e o **custo de adiar**.

---

## TD-01 — Sem testes automatizados

* **Estado:** não existem testes (`*.test.*` ou `*.spec.*`).
* **Risco:** Médio. A lógica de negócio está agora em `lib/` (puro), portanto
  facilmente testável; mas qualquer refator pode introduzir regressões
  silenciosas.
* **Recomendação:**
  * **Vitest** + **@testing-library/react** para componentes.
  * Cobertura prioritária:
    1. `lib/format.ts` — datas e moeda (alto risco de timezone).
    2. `lib/storage.ts` — serialização + migrações.
    3. `lib/store.tsx` — reducer (testar puramente sem React).
    4. `lib/export.ts` — geração de CSV/XLSX.
* **Custo de adoção:** 1 dia para *setup* + testes prioritários.

---

## TD-02 — Componentes `shadcn/ui` por usar

* **Estado:** ~55 componentes em `components/ui/`, dos quais a versão
  atual usa apenas alguns (button, input, dialog, etc.).
* **Risco:** Baixo. Não são importados, logo o tree-shaking remove-os do
  bundle final. Inflacionam o repositório e a árvore de tipos.
* **Recomendação:** Limpar os não usados via script (`unimported` ou
  `knip`). Reintroduzir conforme necessário.
* **Custo de adoção:** 1–2 horas.

---

## TD-03 — Persistência em `localStorage`

* **Estado:** Toda a base de dados num único *key* JSON em `localStorage`.
* **Limites:**
  * ~5–10 MB consoante o navegador.
  * Síncrono — bloqueia main thread em leituras grandes.
  * Sem TTL nem GC.
* **Risco:** Baixo até ~5 000 transações; alto a partir daí.
* **Recomendação:** Migrar para **IndexedDB** via `idb` (~1 KB) com a
  mesma forma de tipos. Pode ser feita transparente ao utilizador
  (migração one-shot ao arrancar).
* **Custo de adoção:** 0.5 dia.

---

## TD-04 — Sem virtualização da lista

* **Estado:** A lista de transações renderiza todos os registos do filtro
  ativo num único `<ul>`.
* **Risco:** Baixo (uso pessoal, < 10 000 registos). Médio se um utilizador
  importar histórico bancário inteiro.
* **Recomendação:** `@tanstack/react-virtual` quando a lista ultrapassar
  500 entradas visíveis.
* **Custo de adoção:** 2–3 horas.

---

## TD-05 — Sem ESLint / Prettier configurados

* **Estado:** `package.json` declara `lint` mas não há `.eslintrc.*` nem
  `eslint.config.*`. `next lint` está depreciado a partir do Next 15.
* **Recomendação:** Migrar para `eslint.config.mjs` + `@next/eslint-config`
  + `eslint-plugin-react-hooks`. Adicionar Prettier + plugin Tailwind para
  ordenar classes.
* **Custo de adoção:** 1 hora.

---

## TD-06 — Sem CI/CD

* **Estado:** Nenhum workflow GitHub Actions / GitLab CI.
* **Recomendação:** Workflow mínimo:
  1. `pnpm install`
  2. `pnpm tsc --noEmit`
  3. `pnpm test`
  4. `pnpm build`
* **Custo de adoção:** 30 minutos.

---

## TD-07 — Tema próprio em vez de `next-themes`

* **Estado:** O `theme-provider.tsx` (wrapper next-themes) **não** está em
  uso na implementação atual; o tema é gerido manualmente via classe `dark`
  em `<html>` + estado no `store`.
* **Risco:** Baixo, mas significa que perdemos algumas afinações do
  `next-themes` (sincronização entre tabs, prevenção de flicker).
* **Recomendação:** Migrar para `next-themes` num próximo incremento e
  remover a lógica manual.
* **Custo de adoção:** 1–2 horas.

---

## TD-08 — Lockfile único

* **Estado:** Após esta sessão restou apenas `pnpm-lock.yaml`. Quem use
  `npm install` regenera `package-lock.json`.
* **Recomendação:** Adicionar bloco `engines` e `packageManager` ao
  `package.json` (`"packageManager": "pnpm@9.x"`) + `.npmrc` com
  `package-manager-strict=true` para falhar em outro gestor.
* **Custo de adoção:** 5 minutos.

---

## TD-09 — Sem CSP nem cabeçalhos de segurança

* **Estado:** `next.config.mjs` não define `headers()`. Em deploy, o app
  herda os cabeçalhos default do Vercel/Nginx.
* **Risco:** Médio em produção pública.
* **Recomendação:** Adicionar `headers()` com:
  * `Content-Security-Policy: default-src 'self'; img-src 'self' data:; ...`
  * `Strict-Transport-Security: max-age=63072000; includeSubDomains`
  * `X-Content-Type-Options: nosniff`
  * `Referrer-Policy: strict-origin-when-cross-origin`
* **Custo de adoção:** 1 hora (+testes contra a CSP).

---

## TD-10 — Lógica de export como string templates

* **Estado:** O ficheiro `lib/export.ts` gera CSV e XLSX por concatenação
  de strings. Funciona, mas é frágil se o utilizador colar `"`/`<`/`>` em
  campos.
* **Risco:** Baixo (sanitização já presente para CSV: aspas duplas e
  *escape* `""`; para XLSX: encode XML de `&`, `<`, `>`, `"`, `'`).
* **Recomendação:** Migrar para `xlsx` (SheetJS) ou `exceljs` se for
  preciso suportar formatação rica (cores, fórmulas, gráficos).
* **Custo de adoção:** 0.5 dia.

---

## TD-11 — Sem schema de migração explícito

* **Estado:** `lib/storage.ts` aceita um `version` field e ignora dados
  inválidos. Não há migrações declaradas — apenas reset silencioso.
* **Risco:** Baixo agora (v1), mas qualquer mudança de *schema* irá apagar
  os dados de utilizadores existentes.
* **Recomendação:** Estrutura `migrations: Record<number, (data) => data>`
  com aplicação sequencial.
* **Custo de adoção:** 2 horas + 1 hora por migração futura.

---

## TD-12 — Acessibilidade não auditada formalmente

* **Estado:** Verificações manuais (foco, contraste, leitor de ecrã)
  mas sem audit com **axe** ou **Lighthouse**.
* **Recomendação:** Correr `@axe-core/react` em desenvolvimento e
  Lighthouse no CI.
* **Custo de adoção:** 2 horas.

---

## TD-13 — `pnpm-lock.yaml` muito antigo (133 KB) — versões podem estar desatualizadas

* **Estado:** Lockfile gerado em maio 2026; algumas bibliotecas têm
  patches críticos posteriores.
* **Recomendação:** `pnpm up -L` periódico, com `dependabot` automatizado.
* **Custo de adoção:** Recorrente.

---

## TD-14 — Sem telemetria de erros (Sentry, etc.)

* **Estado:** Erros em runtime caem apenas na `console.warn` do utilizador.
* **Risco:** Baixo (app pessoal), médio se distribuída.
* **Recomendação:** Para uso pessoal nada a fazer. Para distribuição,
  considerar `@sentry/nextjs` com sampling baixo e *opt-in*.

---

## Sumário priorizado

| Prioridade | Item | Esforço |
|---|---|---|
| Alta | TD-01 Testes | 1 dia |
| Alta | TD-09 CSP / headers | 1 hora |
| Média | TD-05 ESLint+Prettier | 1 hora |
| Média | TD-06 CI/CD | 30 min |
| Média | TD-02 Limpar shadcn | 1–2 horas |
| Baixa | TD-03 IndexedDB | 0.5 dia |
| Baixa | TD-04 Virtualização | 2–3 horas |
| Baixa | TD-07 next-themes | 1–2 horas |
| Baixa | TD-08 Lockfile estrito | 5 min |
| Baixa | TD-10 SheetJS | 0.5 dia |
| Baixa | TD-11 Migrações | 2 horas |
| Baixa | TD-12 axe/Lighthouse | 2 horas |
