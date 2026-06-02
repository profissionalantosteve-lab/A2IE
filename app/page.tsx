'use client'

import { useState, useMemo, useEffect, useRef } from 'react'

type Theme = 'bw' | 'black'
type Category = 'Housing' | 'Food' | 'Transport' | 'Health' | 'Entertainment' | 'Shopping' | 'Utilities' | 'Other'

interface Expense {
  id: number
  description: string
  amount: number
  category: Category
  date: string
}

const CATEGORY_ICONS: Record<Category, string> = {
  Housing: '🏠',
  Food: '🍽️',
  Transport: '🚗',
  Health: '💊',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Utilities: '⚡',
  Other: '📦',
}

const INITIAL_EXPENSES: Expense[] = [
  { id: 1, description: 'Rent', amount: 1200, category: 'Housing', date: '2026-05-01' },
  { id: 2, description: 'Electricity bill', amount: 85, category: 'Utilities', date: '2026-05-03' },
  { id: 3, description: 'Groceries', amount: 210, category: 'Food', date: '2026-05-05' },
  { id: 4, description: 'Gym membership', amount: 45, category: 'Health', date: '2026-05-06' },
  { id: 5, description: 'Netflix', amount: 18, category: 'Entertainment', date: '2026-05-08' },
  { id: 6, description: 'Gas', amount: 60, category: 'Transport', date: '2026-05-10' },
  { id: 7, description: 'Dinner out', amount: 75, category: 'Food', date: '2026-05-14' },
  { id: 8, description: 'New shoes', amount: 130, category: 'Shopping', date: '2026-05-17' },
  { id: 9, description: 'Doctor visit', amount: 90, category: 'Health', date: '2026-05-20' },
  { id: 10, description: 'Internet', amount: 55, category: 'Utilities', date: '2026-05-22' },
  { id: 11, description: 'Concert tickets', amount: 120, category: 'Entertainment', date: '2026-05-24' },
  { id: 12, description: 'Coffee & snacks', amount: 48, category: 'Food', date: '2026-05-25' },
]

const BUDGET = 3000

const CATEGORIES: Category[] = ['Housing', 'Food', 'Transport', 'Health', 'Entertainment', 'Shopping', 'Utilities', 'Other']

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const STORAGE_KEY = 'expense-analyzer-v1'
const TODAY = '2026-05-26'

export default function Page() {
  const [theme, setTheme] = useState<Theme>('black')
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(4)
  const [form, setForm] = useState({ description: '', amount: '', category: 'Food' as Category, date: TODAY })
  const [hydrated, setHydrated] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.theme === 'bw' || saved.theme === 'black') setTheme(saved.theme)
        if (Array.isArray(saved.expenses)) setExpenses(saved.expenses)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Persist
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, expenses }))
    } catch {}
  }, [theme, expenses, hydrated])

  // ESC closes modals
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (deleteId !== null) setDeleteId(null)
      else if (showForm) setShowForm(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showForm, deleteId])

  // Autofocus first field when opening add modal
  useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => firstInputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [showForm])

  const bw = theme === 'bw'

  // Theme classes
  const bg = bw ? 'bg-white' : 'bg-black'
  const text = bw ? 'text-black' : 'text-white'
  const muted = bw ? 'text-neutral-500' : 'text-neutral-400'
  const border = bw ? 'border-neutral-200' : 'border-neutral-800'
  const divide = bw ? 'divide-neutral-200' : 'divide-neutral-800'
  const cardBg = bw ? 'bg-neutral-50 border border-neutral-200' : 'bg-neutral-950 border border-neutral-800'
  const inputBg = bw ? 'bg-white border border-neutral-300 text-black placeholder-neutral-400 focus:border-black' : 'bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:border-white'
  const btnPrimary = bw ? 'bg-black text-white hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-200'
  const btnPrimaryDisabled = bw ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
  const btnGhost = bw ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100' : 'border border-neutral-700 text-neutral-300 hover:bg-neutral-900'
  const modalBg = bw ? 'bg-white border border-neutral-200 shadow-2xl shadow-black/20' : 'bg-neutral-950 border border-neutral-800 shadow-2xl shadow-black/80'
  const overlay = bw ? 'bg-black/30' : 'bg-black/70'
  const selectBg = bw ? 'bg-white border border-neutral-300 text-black' : 'bg-neutral-900 border border-neutral-700 text-white'
  const rowHover = bw ? 'hover:bg-neutral-50' : 'hover:bg-neutral-900'
  const tabActive = bw ? 'bg-black text-white' : 'bg-white text-black'
  const tabInactive = bw ? 'text-neutral-500 hover:text-black' : 'text-neutral-500 hover:text-white'
  const trackBg = bw ? 'bg-neutral-200' : 'bg-neutral-800'
  const fillColor = bw ? 'bg-black' : 'bg-white'

  const filteredExpenses = useMemo(
    () => expenses
      .filter(e => new Date(e.date).getMonth() === selectedMonth)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, selectedMonth]
  )

  const total = filteredExpenses.reduce((s, e) => s + e.amount, 0)
  const remaining = BUDGET - total
  const pct = Math.min((total / BUDGET) * 100, 100)

  const byCategory = useMemo(() => {
    const map: Partial<Record<Category, number>> = {}
    for (const e of filteredExpenses) map[e.category] = (map[e.category] ?? 0) + e.amount
    return Object.entries(map).sort(([, a], [, b]) => b - a) as [Category, number][]
  }, [filteredExpenses])

  // Daily average across days that have spending
  const dailyAvg = useMemo(() => {
    if (filteredExpenses.length === 0) return 0
    const uniqueDays = new Set(filteredExpenses.map(e => e.date)).size
    return total / Math.max(uniqueDays, 1)
  }, [filteredExpenses, total])

  const formValid = form.description.trim().length > 0 && parseFloat(form.amount) > 0

  function addExpense() {
    if (!formValid) return
    const id = Date.now()
    setExpenses(prev => [{ id, description: form.description.trim(), amount: parseFloat(form.amount), category: form.category, date: form.date }, ...prev])
    setForm({ description: '', amount: '', category: 'Food', date: TODAY })
    setShowForm(false)
  }

  function removeExpense(id: number) {
    setExpenses(prev => prev.filter(e => e.id !== id))
    setDeleteId(null)
  }

  return (
    <div className={`min-h-screen ${bg} ${text} font-sans transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 ${bw ? 'bg-white/90' : 'bg-black/90'} backdrop-blur-md border-b ${border} transition-colors duration-300`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex size-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors duration-300 ${bw ? 'bg-black text-white' : 'bg-white text-black'}`}>
              $
            </div>
            <span className="text-sm font-semibold tracking-tight">Expense Analyzer</span>
          </div>

          {/* Theme toggle */}
          <div className={`flex items-center rounded-full p-1 text-xs font-medium transition-colors duration-300 ${bw ? 'bg-neutral-100' : 'bg-neutral-900'}`}>
            <button
              onClick={() => setTheme('bw')}
              aria-pressed={theme === 'bw'}
              className={`rounded-full px-3 py-1 transition-all duration-200 ${theme === 'bw' ? tabActive : tabInactive}`}
            >
              B&amp;W
            </button>
            <button
              onClick={() => setTheme('black')}
              aria-pressed={theme === 'black'}
              className={`rounded-full px-3 py-1 transition-all duration-200 ${theme === 'black' ? tabActive : tabInactive}`}
            >
              Full Black
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        {/* Month selector */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            {MONTHS[selectedMonth]} 2026
          </h1>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${selectBg} outline-none`}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-xl p-4 transition-colors duration-300 ${cardBg}`}>
            <p className={`mb-1 text-xs font-medium uppercase tracking-widest ${muted}`}>Spent</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">${total.toFixed(0)}</p>
            <p className={`mt-1 text-xs ${muted}`}>of ${BUDGET}</p>
          </div>
          <div className={`rounded-xl p-4 transition-colors duration-300 ${cardBg}`}>
            <p className={`mb-1 text-xs font-medium uppercase tracking-widest ${muted}`}>Remaining</p>
            <p className={`text-2xl font-bold tracking-tight tabular-nums ${remaining < 0 ? 'text-red-500' : remaining < BUDGET * 0.2 ? 'text-amber-500' : ''}`}>
              ${Math.abs(remaining).toFixed(0)}
            </p>
            <p className={`mt-1 text-xs ${muted}`}>{remaining < 0 ? 'over budget' : 'available'}</p>
          </div>
          <div className={`rounded-xl p-4 transition-colors duration-300 ${cardBg}`}>
            <p className={`mb-1 text-xs font-medium uppercase tracking-widest ${muted}`}>Daily avg</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">${dailyAvg.toFixed(0)}</p>
            <p className={`mt-1 text-xs ${muted}`}>per spending day</p>
          </div>
        </div>

        {/* Budget bar */}
        <div className={`rounded-xl p-5 transition-colors duration-300 ${cardBg}`}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">Budget usage</span>
            <span className={`text-sm font-semibold tabular-nums ${pct >= 100 ? 'text-red-500' : pct >= 80 ? 'text-amber-500' : ''}`}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <div className={`h-2 w-full overflow-hidden rounded-full ${trackBg}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : fillColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={`mt-2 flex justify-between text-xs tabular-nums ${muted}`}>
            <span>$0</span>
            <span>${BUDGET}</span>
          </div>
        </div>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div className={`rounded-xl p-5 transition-colors duration-300 ${cardBg}`}>
            <h2 className="mb-4 text-sm font-semibold">By Category</h2>
            <div className="space-y-3">
              {byCategory.map(([cat, amt]) => {
                const catPct = (amt / total) * 100
                return (
                  <div key={cat}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{CATEGORY_ICONS[cat]}</span>
                        <span>{cat}</span>
                      </span>
                      <span className="font-medium tabular-nums">${amt.toFixed(0)}</span>
                    </div>
                    <div className={`h-1.5 w-full overflow-hidden rounded-full ${trackBg}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className={`rounded-xl transition-colors duration-300 ${cardBg}`}>
          <div className={`flex items-center justify-between border-b p-5 ${border}`}>
            <h2 className="text-sm font-semibold">Transactions ({filteredExpenses.length})</h2>
            <button
              onClick={() => setShowForm(true)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${btnPrimary}`}
            >
              + Add
            </button>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className={`flex flex-col items-center gap-3 p-10 text-center text-sm ${muted}`}>
              <span>No expenses for this month.</span>
              <button
                onClick={() => setShowForm(true)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${btnGhost}`}
              >
                + Add your first
              </button>
            </div>
          ) : (
            <ul className={`divide-y ${divide}`}>
              {filteredExpenses.map(exp => (
                <li key={exp.id} className={`flex items-center justify-between gap-3 px-5 py-3.5 transition-colors ${rowHover}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-lg shrink-0">{CATEGORY_ICONS[exp.category]}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{exp.description}</p>
                      <p className={`text-xs ${muted}`}>{exp.category} · {exp.date.slice(5).replace('-', '/')}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="text-sm font-semibold tabular-nums">-${exp.amount.toFixed(2)}</span>
                    <button
                      onClick={() => setDeleteId(exp.id)}
                      aria-label={`Remove ${exp.description}`}
                      className={`text-xs transition-colors ${muted} hover:text-red-500`}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Add Expense Modal */}
      {showForm && (
        <div className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 ${overlay}`} onClick={() => setShowForm(false)}>
          <form
            onSubmit={e => { e.preventDefault(); addExpense() }}
            className={`w-full max-w-md rounded-2xl p-6 space-y-4 ${modalBg}`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold">Add Expense</h3>

            <div className="space-y-3">
              <input
                ref={firstInputRef}
                placeholder="Description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors ${inputBg}`}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="Amount ($)"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors ${inputBg}`}
                />
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors ${inputBg}`}
                />
              </div>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors ${selectBg}`}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${btnGhost}`}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formValid}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${formValid ? btnPrimary : btnPrimaryDisabled}`}
              >
                Add Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId !== null && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlay}`} onClick={() => setDeleteId(null)}>
          <div className={`w-full max-w-xs rounded-2xl p-6 space-y-4 text-center ${modalBg}`} onClick={e => e.stopPropagation()}>
            <p className="text-sm font-medium">Remove this expense?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${btnGhost}`}>
                Cancel
              </button>
              <button onClick={() => removeExpense(deleteId)} className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
