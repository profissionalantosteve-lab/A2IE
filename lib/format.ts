import type { Period } from './types'

// ---------- IDs ----------

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// ---------- Dates ----------
// All dates are stored as ISO 'YYYY-MM-DD' strings (local-naive).
// We parse them by splitting to avoid the UTC interpretation bug.

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today(): string {
  return formatISODate(new Date())
}

export function periodOf(isoDate: string): Period {
  const d = parseISODate(isoDate)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function currentPeriod(): Period {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function periodsEqual(a: Period, b: Period): boolean {
  return a.year === b.year && a.month === b.month
}

export function periodKey(p: Period): string {
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}`
}

export function daysInPeriod(p: Period): number {
  return new Date(p.year, p.month + 1, 0).getDate()
}

export function shiftPeriod(p: Period, delta: number): Period {
  const d = new Date(p.year, p.month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function periodLabel(p: Period, locale = 'pt-PT'): string {
  if (locale === 'pt-PT') return `${MONTH_NAMES_PT[p.month]} ${p.year}`
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(p.year, p.month, 1))
}

export function formatDate(isoDate: string, locale = 'pt-PT'): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parseISODate(isoDate))
  } catch {
    return isoDate
  }
}

export function formatDateShort(isoDate: string, locale = 'pt-PT'): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
    }).format(parseISODate(isoDate))
  } catch {
    return isoDate
  }
}

// ---------- Money ----------

export function formatMoney(
  amount: number,
  currency = 'EUR',
  locale = 'pt-PT',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatMoneyCompact(
  amount: number,
  currency = 'EUR',
  locale = 'pt-PT',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  } catch {
    return `${amount.toFixed(0)} ${currency}`
  }
}

// ---------- Misc ----------

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function sum<T>(items: T[], get: (t: T) => number): number {
  let total = 0
  for (const it of items) total += get(it)
  return total
}

export function groupBy<T, K extends string>(
  items: T[],
  key: (t: T) => K,
): Record<K, T[]> {
  const out = {} as Record<K, T[]>
  for (const it of items) {
    const k = key(it)
    if (!out[k]) out[k] = []
    out[k].push(it)
  }
  return out
}
