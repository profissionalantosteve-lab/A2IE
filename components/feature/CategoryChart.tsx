'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useCategoryMap } from '@/lib/store'

interface Props {
  byCategory: Map<string, number>
  fmt: (n: number) => string
}

export function CategoryChart({ byCategory, fmt }: Props) {
  const catMap = useCategoryMap()

  const data = useMemo(() => {
    const arr: { id: string; name: string; value: number; color: string; icon: string }[] = []
    for (const [id, value] of byCategory.entries()) {
      const cat = catMap.get(id)
      if (!cat) continue
      arr.push({
        id,
        name: cat.name,
        value,
        color: cat.color,
        icon: cat.icon,
      })
    }
    arr.sort((a, b) => b.value - a.value)
    return arr
  }, [byCategory, catMap])

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Sem despesas neste período
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[1fr_1fr] gap-4 items-center">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={75}
              paddingAngle={1}
              strokeWidth={0}
            >
              {data.map((d) => (
                <Cell key={d.id} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
                padding: '6px 10px',
              }}
              formatter={(value: number, name: string) => [fmt(value), name]}
              labelStyle={{ display: 'none' }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5 text-xs">
        {data.slice(0, 6).map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0
          return (
            <li key={d.id} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-sm shrink-0"
                style={{ background: d.color }}
                aria-hidden
              />
              <span className="truncate flex-1">
                {d.icon} {d.name}
              </span>
              <span className="tabular-nums text-muted-foreground shrink-0">
                {pct.toFixed(0)}%
              </span>
            </li>
          )
        })}
        {data.length > 6 && (
          <li className="text-muted-foreground pl-4">
            +{data.length - 6} mais
          </li>
        )}
      </ul>
    </div>
  )
}
