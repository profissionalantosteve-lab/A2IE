# FEATURES_ROADMAP.md

> Roadmap das funcionalidades futuras propostas para o **A2IE — Expense Analyzer**.
>
> A intervenção atual entrega um produto **client-only**, totalmente funcional,
> sem dependências de *backend*. As propostas abaixo extendem essa base.

---

## Versão atual (v1.0 — entregue nesta sessão)

✅ Receitas e despesas
✅ Categorias personalizadas
✅ Contas / carteiras
✅ Tags
✅ Dashboard com KPIs
✅ Gráficos por categoria e tendência 12 meses
✅ Pesquisa e filtros completos
✅ Orçamentos por categoria
✅ Metas de poupança
✅ Alertas (toast + visual)
✅ Relatórios mensais
✅ Export CSV, JSON, XLSX, PDF (impressão)
✅ Import JSON (backup)
✅ Moeda e *locale* configuráveis
✅ Modo escuro com `prefers-color-scheme`
✅ Responsividade móvel
✅ Acessibilidade básica
✅ Atalhos de teclado

---

## v1.1 — Próximo incremento (pequenas melhorias)

> Estimativa: 1–2 dias.

* **`R-101` Recorrência automática** — hoje o app marca uma transação como
  recorrente mas não a cria automaticamente. Implementar *cron* leve
  no `useEffect` que, na montagem, gera as ocorrências em falta até hoje.
* **`R-102` Transferências entre contas** — hoje requer criar duas
  transações manuais (-/+) com a mesma descrição. Adicionar tipo
  `kind: 'transfer'` com `fromAccount` / `toAccount` que não conta no total
  de despesas.
* **`R-103` Duplicar transação** — botão "duplicar" na lista para acelerar
  registo de despesas repetitivas.
* **`R-104` Anexar recibo** — upload local de imagem (guardada em
  IndexedDB para evitar inchar `localStorage`); pré-visualização inline.
* **`R-105` Pesquisa com operadores** — `cat:food`, `min:50`, `tag:trip`
  para utilizadores avançados.
* **`R-106` Undo de ações destrutivas** — toast com botão "Anular" durante
  5 s após apagar (estilo Gmail).
* **`R-107` Atalhos completos** — `1..5` para mudar de tab, `t` para
  alternar tipo no formulário, etc. + ajuda `?`.

---

## v1.2 — Internacionalização

> Estimativa: 2–3 dias.

* **`R-201` i18n com `next-intl`** ou `react-i18next` (strings PT/EN/ES/FR).
* **`R-202` Conversão multi-moeda** — usar API gratuita (e.g. `frankfurter.app`)
  para mostrar saldo em moeda secundária. Cache de 24h.
* **`R-203` Formatos de data por *locale*** — usar `Intl.DateTimeFormat`.

---

## v2.0 — Persistência multi-dispositivo

> Estimativa: 1–2 semanas.

Esta é a fronteira em que a aplicação passa de *client-only* para
*client + servidor*. Implica decisões de produto e infraestrutura.

* **`R-301` Login / autenticação** — opções:
  * Magic link (e.g. `@auth/core` + provider de email)
  * OAuth Google / GitHub
* **`R-302` Backend** — opções:
  * Supabase (Postgres + Auth + RLS) — recomendada se quiser SQL.
  * Firebase Firestore — recomendada se quiser real-time barato.
  * Backend próprio Next.js Route Handlers + Vercel KV/Postgres.
* **`R-303` Sincronização local-first** — manter localStorage como cache;
  *sync* assíncrona em background; resolução de conflitos por `updatedAt`.
* **`R-304` Partilha familiar** — convidar segunda pessoa para a mesma
  conta com permissões (read-only / read-write).

---

## v2.1 — Inteligência

> Estimativa: 1–2 semanas (depende de v2.0).

* **`R-401` Categorização automática** — regex simples na descrição
  ("starbucks" → Café/Food). Pode ser feita client-side desde já.
* **`R-402` Deteção de padrões** — "o seu gasto em Transport subiu 30%
  vs mês anterior".
* **`R-403` Previsão de fim do mês** — extrapolação linear baseada no
  ritmo atual.
* **`R-404` Resumos com IA** (opt-in) — chamada à API Claude para gerar
  um briefing semanal em linguagem natural.

---

## v2.2 — Importação inteligente

> Estimativa: 3–5 dias.

* **`R-501` Importar CSV de bancos** — *mapping* de colunas
  (Millennium, ActivoBank, CGD, Revolut, N26, Wise, etc.) com presets
  por banco.
* **`R-502` Importação OFX/QIF** — formatos padrão de banca.
* **`R-503` Importação de extrato PDF** — parsing best-effort com
  *Tesseract.js* ou similar para OCR.

---

## v3.0 — Mobile nativo

> Estimativa: 4+ semanas.

* **`R-601` PWA install + offline-first** — service worker + manifest
  refinado (passo intermédio antes de nativo).
* **`R-602` App Capacitor / Tauri** — empacotar a mesma UI para iOS /
  Android / desktop.
* **`R-603` Atalhos do sistema** — adicionar despesa via Siri Shortcut
  / Google Assistant.

---

## v3.1 — Investimentos & património

> Estimativa: 2–4 semanas.

* **`R-701` Ativos** — registar ações, criptos, fundos.
* **`R-702` Cotações** — *fetch* diário de API pública.
* **`R-703` Património líquido** — gráfico de evolução agregado
  (Contas + Ativos − Dívidas).

---

## Princípios de produto

Para guiar futuras adições:

1. **Privacidade primeiro** — qualquer feature que envie dados para fora do
   navegador deve ser *opt-in* e estar claramente identificada.
2. **Funciona offline** — perda de rede nunca deve impedir registar uma
   transação.
3. **Acessibilidade não é opcional** — toda a feature nova passa por
   navegação por teclado + leitor de ecrã.
4. **Zero subscrição** — a app é uma ferramenta pessoal de quem a usa, não
   um produto SaaS.
