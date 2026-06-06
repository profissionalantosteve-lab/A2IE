import type { AppState, Category, Account } from './types'

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'cat-housing', name: 'Habitação', icon: '🏠', color: '#6366f1', kind: 'expense' },
  { id: 'cat-food', name: 'Alimentação', icon: '🍽️', color: '#f97316', kind: 'expense' },
  { id: 'cat-transport', name: 'Transportes', icon: '🚗', color: '#0ea5e9', kind: 'expense' },
  { id: 'cat-health', name: 'Saúde', icon: '💊', color: '#ef4444', kind: 'expense' },
  { id: 'cat-entertainment', name: 'Lazer', icon: '🎬', color: '#a855f7', kind: 'expense' },
  { id: 'cat-shopping', name: 'Compras', icon: '🛍️', color: '#ec4899', kind: 'expense' },
  { id: 'cat-utilities', name: 'Serviços', icon: '⚡', color: '#eab308', kind: 'expense' },
  { id: 'cat-education', name: 'Educação', icon: '📚', color: '#14b8a6', kind: 'expense' },
  { id: 'cat-other-exp', name: 'Outro', icon: '📦', color: '#737373', kind: 'expense' },
]

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'cat-salary', name: 'Salário', icon: '💼', color: '#10b981', kind: 'income' },
  { id: 'cat-freelance', name: 'Freelance', icon: '💻', color: '#22c55e', kind: 'income' },
  { id: 'cat-investments', name: 'Investimentos', icon: '📈', color: '#84cc16', kind: 'income' },
  { id: 'cat-gift', name: 'Presente', icon: '🎁', color: '#f59e0b', kind: 'income' },
  { id: 'cat-other-inc', name: 'Outro', icon: '✨', color: '#737373', kind: 'income' },
]

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-cash', name: 'Dinheiro', initialBalance: 0, color: '#10b981', icon: '💵' },
  { id: 'acc-bank', name: 'Conta corrente', initialBalance: 0, color: '#3b82f6', icon: '🏦' },
  { id: 'acc-card', name: 'Cartão de crédito', initialBalance: 0, color: '#a855f7', icon: '💳' },
]

export const INITIAL_STATE: AppState = {
  version: 1,
  transactions: [],
  categories: [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES],
  accounts: DEFAULT_ACCOUNTS,
  budgets: [],
  goals: [],
  settings: {
    currency: 'EUR',
    locale: 'pt-PT',
    theme: 'system',
    monthlyBudget: 0,
    weekStartsOn: 1,
  },
}
