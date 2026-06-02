'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { useApp } from '@/lib/store'
import { periodOf, periodsEqual, shiftPeriod } from '@/lib/format'
import type { Period } from '@/lib/types'

interface Props {
  period: Period
  fmt: (n: number) => string
}

const MONTH_SHORT_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export function TrendChart({ period, fmt }: Props) {
  const { state } = useApp()

  const data = useMemo(() => {
    const periods: Period[] = []
    for (let i = 11; i >= 0; i--) {
      periods.push(shiftPeriod(period, -i))
    }

    return periods.map((p) => {
      let income = 0
      let expense = 0
      for (const t of state.transactions) {
        const tp = periodOf(t.date)
        if (!periodsEqual(tp, p)) continue
        if (t.kind === 'income') income += t.amount
        else expense += t.amount
      }
      return {
        label: `${MONTH_SHORT_PT[p.month]}${p.year !== period.year ? `/${String(p.year).slice(2)}` : ''}`,
        Receitas: Number(income.toFixed(2)),
        Despesas: Number(expense.toFixed(2)),
      }
    })
  }, [state.transactions, period])

  const hasData = data.some((d) => d.Receitas > 0 || d.Despesas > 0)
  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Ainda sem histórico para mostrar
      </div>
    )
  }

  return (
    <div className="h-48 -ml-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [fmt(value), name]}
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
          />
          <Legend
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
          />
          <Bar dataKey="Receitas" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={20} />
          <Bar dataKey="Despesas" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
