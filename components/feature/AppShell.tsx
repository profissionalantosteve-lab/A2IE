'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3,
  CreditCard,
  FileText,
  ListChecks,
  Settings,
  Tags,
  Target,
  Wallet,
} from 'lucide-react'
import { useApp } from '@/lib/store'
import { currentPeriod } from '@/lib/format'
import type { Period } from '@/lib/types'
import { Header } from './Header'
import { Dashboard } from './Dashboard'
import { TransactionsView } from './TransactionsView'
import { BudgetsView } from './BudgetsView'
import { CategoriesView } from './CategoriesView'
import { AccountsView } from './AccountsView'
import { ReportsView } from './ReportsView'
import { SettingsView } from './SettingsView'
import { TransactionForm } from './TransactionForm'

type Tab =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'categories'
  | 'accounts'
  | 'reports'
  | 'settings'

const TABS: { id: Tab; label: string; icon: React.ReactNode; short: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} />, short: 'Início' },
  { id: 'transactions', label: 'Transações', icon: <ListChecks size={16} />, short: 'Transações' },
  { id: 'budgets', label: 'Orçamentos', icon: <Target size={16} />, short: 'Metas' },
  { id: 'accounts', label: 'Contas', icon: <Wallet size={16} />, short: 'Contas' },
  { id: 'categories', label: 'Categorias', icon: <Tags size={16} />, short: 'Categ.' },
  { id: 'reports', label: 'Relatórios', icon: <FileText size={16} />, short: 'Export' },
  { id: 'settings', label: 'Definições', icon: <Settings size={16} />, short: 'Ajustes' },
]

export function AppShell() {
  const { hydrated } = useApp()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [period, setPeriod] = useState<Period>(currentPeriod())
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  // Keyboard shortcuts: n for new tx, / for search (when on transactions).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const inField =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if (inField) return
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setQuickAddOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Desktop tab bar */}
      <nav
        aria-label="Navegação principal"
        className="hidden md:block sticky top-[57px] z-20 bg-background/85 backdrop-blur-md border-b border-border"
      >
        <div className="mx-auto max-w-6xl px-6">
          <ul className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={tab === t.id ? 'page' : undefined}
                  className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    tab === t.id
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-5 sm:py-7 pb-24 md:pb-7">
        {!hydrated ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            A carregar…
          </div>
        ) : tab === 'dashboard' ? (
          <Dashboard period={period} setPeriod={setPeriod} />
        ) : tab === 'transactions' ? (
          <TransactionsView />
        ) : tab === 'budgets' ? (
          <BudgetsView />
        ) : tab === 'accounts' ? (
          <AccountsView />
        ) : tab === 'categories' ? (
          <CategoriesView />
        ) : tab === 'reports' ? (
          <ReportsView />
        ) : (
          <SettingsView />
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Navegação inferior"
        className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-background/95 backdrop-blur-md border-t border-border"
      >
        <ul className="grid grid-cols-5 max-w-md mx-auto">
          {TABS.slice(0, 4).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  tab === t.id ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {t.icon}
                {t.short}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() =>
                setTab((cur) =>
                  cur === 'reports'
                    ? 'settings'
                    : cur === 'settings'
                      ? 'categories'
                      : cur === 'categories'
                        ? 'reports'
                        : 'reports',
                )
              }
              aria-current={
                tab === 'reports' || tab === 'settings' || tab === 'categories'
                  ? 'page'
                  : undefined
              }
              className={`flex w-full flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                tab === 'reports' || tab === 'settings' || tab === 'categories'
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              <CreditCard size={16} />
              Mais
            </button>
          </li>
        </ul>
      </nav>

      {/* Floating quick-add (mobile) */}
      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Adicionar transação"
        className="md:hidden fixed bottom-16 right-4 z-30 flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:opacity-90 transition-opacity"
      >
        +
      </button>

      <TransactionForm
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </div>
  )
}
