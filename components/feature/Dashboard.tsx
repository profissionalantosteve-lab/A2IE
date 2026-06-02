'use client'

import { useMemo } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  Target,
  AlertTriangle,
} from 'lucide-react'
import { useApp, useCategoryMap } from '@/lib/store'
import {
  currentPeriod,
  daysInPeriod,
  periodLabel,
  periodOf,
  periodsEqual,
  shiftPeriod,
} from '@/lib/format'
import type { Period } from '@/lib/types'
import { CategoryChart } from './CategoryChart'
import { TrendChart } from './TrendChart'

interface DashboardProps {
  period: Period
  setPeriod: (p: Period) => void
}

export function Dashboard({ period, setPeriod }: DashboardProps) {
  const { state } = useApp()
  const catMap = useCategoryMap()
  const { currency, locale, monthlyBudget } = state.settings

  const txsInPeriod = useMemo(() => {
    return state.transactions.filter((t) => {
      const p = periodOf(t.date)
      return periodsEqual(p, period)
    })
  }, [state.transactions, period])

  const summary = useMemo(() => {
    let income = 0
    let expense = 0
    const byCategory = new Map<string, number>()
    for (const t of txsInPeriod) {
      if (t.kind === 'income') income += t.amount
      else {
        expense += t.amount
        byCategory.set(
          t.categoryId,
          (byCategory.get(t.categoryId) ?? 0) + t.amount,
        )
      }
    }
    return { income, expense, net: income - expense, byCategory }
  }, [txsInPeriod])

  const isCurrentMonth = periodsEqual(period, currentPeriod())
  const dayOfPeriod = isCurrentMonth ? new Date().getDate() : daysInPeriod(period)
  const dailyRunRate = summary.expense / Math.max(dayOfPeriod, 1)

  const uniqueDays = new Set(
    txsInPeriod.filter((t) => t.kind === 'expense').map((t) => t.date),
  ).size
  const avgPerSpendingDay = uniqueDays > 0 ? summary.expense / uniqueDays : 0

  // Budget alerts.
  const budgetAlerts = useMemo(() => {
    const alerts: { categoryId: string; name: string; used: number; limit: number; pct: number }[] = []
    for (const b of state.budgets) {
      const cat = catMap.get(b.categoryId)
      if (!cat || b.monthlyLimit <= 0) continue
      const used = summary.byCategory.get(b.categoryId) ?? 0
      const pct = (used / b.monthlyLimit) * 100
      if (pct >= 80) {
        alerts.push({
          categoryId: b.categoryId,
          name: cat.name,
          used,
          limit: b.monthlyLimit,
          pct,
        })
      }
    }
    return alerts.sort((a, b) => b.pct - a.pct)
  }, [state.budgets, summary.byCategory, catMap])

  const fmt = (v: number) => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(v)
    } catch {
      return `${v.toFixed(2)} ${currency}`
    }
  }

  const globalPct =
    monthlyBudget > 0 ? Math.min((summary.expense / monthlyBudget) * 100, 999) : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Period nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPeriod(shiftPeriod(period, -1))}
            aria-label="Mês anterior"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight px-2">
            {periodLabel(period, locale)}
          </h2>
          <button
            type="button"
            onClick={() => setPeriod(shiftPeriod(period, 1))}
            aria-label="Mês seguinte"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        {!isCurrentMonth && (
          <button
            type="button"
            onClick={() => setPeriod(currentPeriod())}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Hoje
          </button>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Receitas"
          value={fmt(summary.income)}
          icon={<ArrowUpRight size={16} />}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="Despesas"
          value={fmt(summary.expense)}
          icon={<ArrowDownRight size={16} />}
          accent="text-red-600 dark:text-red-400"
        />
        <KpiCard
          label="Saldo"
          value={fmt(summary.net)}
          icon={<Wallet size={16} />}
          accent={summary.net < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}
        />
        <KpiCard
          label="Ritmo diário"
          value={fmt(dailyRunRate)}
          subtitle={`Média/dia ${fmt(avgPerSpendingDay)}`}
          icon={<TrendingUp size={16} />}
        />
      </div>

      {/* Monthly budget bar */}
      {monthlyBudget > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Target size={14} className="text-muted-foreground" />
              Orçamento mensal
            </span>
            <span
              className={`text-sm font-semibold tabular-nums ${
                globalPct >= 100
                  ? 'text-red-600 dark:text-red-400'
                  : globalPct >= 80
                    ? 'text-amber-600 dark:text-amber-400'
                    : ''
              }`}
            >
              {globalPct.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                globalPct >= 100
                  ? 'bg-red-500'
                  : globalPct >= 80
                    ? 'bg-amber-500'
                    : 'bg-foreground'
              }`}
              style={{ width: `${Math.min(globalPct, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{fmt(summary.expense)}</span>
            <span>{fmt(monthlyBudget)}</span>
          </div>
        </div>
      )}

      {/* Alerts */}
      {budgetAlerts.length > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              size={18}
              className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
            />
            <div className="space-y-2 flex-1 min-w-0">
              <p className="text-sm font-medium">
                {budgetAlerts.length === 1
                  ? '1 categoria perto ou acima do limite'
                  : `${budgetAlerts.length} categorias perto ou acima do limite`}
              </p>
              <ul className="space-y-1">
                {budgetAlerts.map((a) => (
                  <li
                    key={a.categoryId}
                    className="text-xs text-muted-foreground flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{a.name}</span>
                    <span className="tabular-nums shrink-0">
                      {fmt(a.used)} / {fmt(a.limit)} ({a.pct.toFixed(0)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-3">Despesas por categoria</h3>
          <CategoryChart byCategory={summary.byCategory} fmt={fmt} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-3">Últimos 12 meses</h3>
          <TrendChart period={period} fmt={fmt} />
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  subtitle,
  icon,
  accent,
}: {
  label: string
  value: string
  subtitle?: string
  icon?: React.ReactNode
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {icon && <span className={accent ?? 'text-muted-foreground'}>{icon}</span>}
      </div>
      <div
        className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums ${accent ?? ''}`}
      >
        {value}
      </div>
      {subtitle && (
        <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}
