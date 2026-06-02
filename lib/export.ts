import type {
  Account,
  AppState,
  Category,
  Transaction,
} from './types'
import { formatDate, parseISODate } from './format'

// ---------- Generic file download ----------

export function download(filename: string, blob: Blob) {
  if (typeof window === 'undefined') return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------- CSV ----------

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (/[",\n;]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function transactionsToCSV(
  txs: Transaction[],
  categories: Map<string, Category>,
  accounts: Map<string, Account>,
): string {
  const header = [
    'Data',
    'Tipo',
    'Descrição',
    'Categoria',
    'Conta',
    'Valor',
    'Tags',
    'Notas',
    'Recorrência',
  ]
  const rows = [header.join(',')]
  for (const t of txs) {
    const cat = categories.get(t.categoryId)?.name ?? '—'
    const acc = accounts.get(t.accountId)?.name ?? '—'
    rows.push(
      [
        t.date,
        t.kind === 'income' ? 'Receita' : 'Despesa',
        csvEscape(t.description),
        csvEscape(cat),
        csvEscape(acc),
        t.amount.toFixed(2),
        csvEscape(t.tags.join('; ')),
        csvEscape(t.notes ?? ''),
        t.recurrence,
      ].join(','),
    )
  }
  return rows.join('\n')
}

export function exportCSV(
  txs: Transaction[],
  categories: Map<string, Category>,
  accounts: Map<string, Account>,
  filename = 'transacoes.csv',
) {
  // Prepend a UTF-8 BOM so Excel detects encoding correctly.
  const content = '﻿' + transactionsToCSV(txs, categories, accounts)
  download(filename, new Blob([content], { type: 'text/csv;charset=utf-8' }))
}

// ---------- JSON (full backup) ----------

export function exportJSON(state: AppState, filename = 'a2ie-backup.json') {
  const content = JSON.stringify(state, null, 2)
  download(
    filename,
    new Blob([content], { type: 'application/json;charset=utf-8' }),
  )
}

export async function readJSONFile(file: File): Promise<unknown> {
  const text = await file.text()
  return JSON.parse(text)
}

// ---------- XLSX (SpreadsheetML 2003 — Excel-compatible, no deps) ----------

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function xmlCell(value: unknown): string {
  if (value == null || value === '') {
    return '<Cell><Data ss:Type="String"></Data></Cell>'
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(String(value))}</Data></Cell>`
}

function xmlRow(cells: unknown[]): string {
  return `<Row>${cells.map(xmlCell).join('')}</Row>`
}

export function exportXLSX(
  txs: Transaction[],
  categories: Map<string, Category>,
  accounts: Map<string, Account>,
  filename = 'transacoes.xls',
) {
  const headerRow = xmlRow([
    'Data',
    'Tipo',
    'Descrição',
    'Categoria',
    'Conta',
    'Valor',
    'Tags',
    'Notas',
    'Recorrência',
  ])
  const dataRows = txs
    .map((t) =>
      xmlRow([
        t.date,
        t.kind === 'income' ? 'Receita' : 'Despesa',
        t.description,
        categories.get(t.categoryId)?.name ?? '—',
        accounts.get(t.accountId)?.name ?? '—',
        t.amount,
        t.tags.join('; '),
        t.notes ?? '',
        t.recurrence,
      ]),
    )
    .join('')

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<?mso-application progid="Excel.Sheet"?>\n` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
    `xmlns:o="urn:schemas-microsoft-com:office:office" ` +
    `xmlns:x="urn:schemas-microsoft-com:office:excel" ` +
    `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ` +
    `xmlns:html="http://www.w3.org/TR/REC-html40">` +
    `<Styles>` +
    `<Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#EFEFEF" ss:Pattern="Solid"/></Style>` +
    `</Styles>` +
    `<Worksheet ss:Name="Transações"><Table>` +
    headerRow +
    dataRows +
    `</Table></Worksheet>` +
    `</Workbook>`

  download(
    filename,
    new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' }),
  )
}

// ---------- PDF via window.print ----------

export interface PrintReport {
  title: string
  subtitle?: string
  currency: string
  locale: string
  txs: Transaction[]
  categories: Map<string, Category>
  accounts: Map<string, Account>
  summary: {
    income: number
    expense: number
    net: number
  }
}

function fmtMoney(value: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

export function openPrintReport(report: PrintReport) {
  if (typeof window === 'undefined') return
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100')
  if (!w) return

  const escapeHTML = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const sortedTxs = [...report.txs].sort((a, b) =>
    parseISODate(a.date).getTime() - parseISODate(b.date).getTime(),
  )

  const rows = sortedTxs
    .map(
      (t) => `<tr class="${t.kind}">
        <td>${formatDate(t.date, report.locale)}</td>
        <td>${escapeHTML(report.categories.get(t.categoryId)?.name ?? '—')}</td>
        <td>${escapeHTML(t.description)}</td>
        <td>${escapeHTML(report.accounts.get(t.accountId)?.name ?? '—')}</td>
        <td class="amt">${t.kind === 'income' ? '+' : '−'} ${fmtMoney(t.amount, report.currency, report.locale)}</td>
      </tr>`,
    )
    .join('')

  const html = `<!doctype html>
<html lang="${report.locale}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHTML(report.title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #111; padding: 32px; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .sub { color: #555; margin-bottom: 24px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px 16px; }
    .card .label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: .05em; }
    .card .value { font-size: 18px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 8px 6px; border-bottom: 1px solid #eee; text-align: left; vertical-align: top; }
    th { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: .05em; }
    .amt { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    tr.income .amt { color: #047857; }
    tr.expense .amt { color: #b91c1c; }
    footer { margin-top: 24px; color: #888; font-size: 11px; text-align: center; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHTML(report.title)}</h1>
  ${report.subtitle ? `<div class="sub">${escapeHTML(report.subtitle)}</div>` : ''}
  <div class="summary">
    <div class="card"><div class="label">Receitas</div><div class="value">${fmtMoney(report.summary.income, report.currency, report.locale)}</div></div>
    <div class="card"><div class="label">Despesas</div><div class="value">${fmtMoney(report.summary.expense, report.currency, report.locale)}</div></div>
    <div class="card"><div class="label">Saldo</div><div class="value">${fmtMoney(report.summary.net, report.currency, report.locale)}</div></div>
  </div>
  <table>
    <thead>
      <tr><th>Data</th><th>Categoria</th><th>Descrição</th><th>Conta</th><th class="amt">Valor</th></tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#999;padding:32px">Sem transações no período</td></tr>'}</tbody>
  </table>
  <footer>Gerado por A2IE — Expense Analyzer</footer>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 200));</script>
</body>
</html>`

  w.document.open()
  w.document.write(html)
  w.document.close()
}
