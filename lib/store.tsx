'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
import { StateSchema } from './schemas'
import { INITIAL_STATE } from './seed'
import { loadState, saveState, clearState } from './storage'
import { newId } from './format'
import type {
  Account,
  AppState,
  Budget,
  Category,
  Goal,
  Settings,
  Transaction,
} from './types'

type Action =
  | { type: 'hydrate'; payload: AppState }
  | { type: 'replaceAll'; payload: AppState }
  | { type: 'reset' }
  | { type: 'addTx'; payload: Transaction }
  | { type: 'updateTx'; payload: Transaction }
  | { type: 'removeTx'; payload: string }
  | { type: 'addCategory'; payload: Category }
  | { type: 'updateCategory'; payload: Category }
  | { type: 'removeCategory'; payload: string }
  | { type: 'addAccount'; payload: Account }
  | { type: 'updateAccount'; payload: Account }
  | { type: 'removeAccount'; payload: string }
  | { type: 'setBudget'; payload: Budget }
  | { type: 'removeBudget'; payload: string }
  | { type: 'addGoal'; payload: Goal }
  | { type: 'updateGoal'; payload: Goal }
  | { type: 'removeGoal'; payload: string }
  | { type: 'setSettings'; payload: Partial<Settings> }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
    case 'replaceAll':
      return action.payload
    case 'reset':
      return INITIAL_STATE
    case 'addTx':
      return { ...state, transactions: [action.payload, ...state.transactions] }
    case 'updateTx':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        ),
      }
    case 'removeTx':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      }
    case 'addCategory':
      return { ...state, categories: [...state.categories, action.payload] }
    case 'updateCategory':
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      }
    case 'removeCategory': {
      // Refuse if there are transactions using it.
      const inUse = state.transactions.some(
        (t) => t.categoryId === action.payload,
      )
      if (inUse) return state
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
        budgets: state.budgets.filter((b) => b.categoryId !== action.payload),
      }
    }
    case 'addAccount':
      return { ...state, accounts: [...state.accounts, action.payload] }
    case 'updateAccount':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? action.payload : a,
        ),
      }
    case 'removeAccount': {
      const inUse = state.transactions.some(
        (t) => t.accountId === action.payload,
      )
      if (inUse) return state
      if (state.accounts.length <= 1) return state
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.payload),
      }
    }
    case 'setBudget': {
      const others = state.budgets.filter(
        (b) => b.categoryId !== action.payload.categoryId,
      )
      if (action.payload.monthlyLimit <= 0) {
        return { ...state, budgets: others }
      }
      return { ...state, budgets: [...others, action.payload] }
    }
    case 'removeBudget':
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.categoryId !== action.payload),
      }
    case 'addGoal':
      return { ...state, goals: [...state.goals, action.payload] }
    case 'updateGoal':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? action.payload : g,
        ),
      }
    case 'removeGoal':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      }
    case 'setSettings':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  hydrated: boolean
  actions: {
    addTransaction: (
      input: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    ) => void
    updateTransaction: (tx: Transaction) => void
    removeTransaction: (id: string) => void
    addCategory: (input: Omit<Category, 'id'>) => void
    updateCategory: (cat: Category) => void
    removeCategory: (id: string) => void
    addAccount: (input: Omit<Account, 'id'>) => void
    updateAccount: (acc: Account) => void
    removeAccount: (id: string) => void
    setBudget: (b: Budget) => void
    removeBudget: (categoryId: string) => void
    addGoal: (input: Omit<Goal, 'id'>) => void
    updateGoal: (g: Goal) => void
    removeGoal: (id: string) => void
    setSettings: (patch: Partial<Settings>) => void
    importState: (raw: unknown) => boolean
    resetAll: () => void
  }
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const [hydrated, setHydrated] = useState(false)
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    const result = loadState()
    dispatch({ type: 'hydrate', payload: result.state })
    setHydrated(true)
    if (result.error) {
      // Defer toast to next tick so Toaster is mounted.
      queueMicrotask(() => toast.warning(result.error!))
    }
  }, [])

  // Persist on change (debounced).
  useEffect(() => {
    if (!hydrated) return
    if (writeTimer.current) clearTimeout(writeTimer.current)
    writeTimer.current = setTimeout(() => saveState(state), 250)
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current)
    }
  }, [state, hydrated])

  // Apply theme to <html>.
  useEffect(() => {
    if (!hydrated) return
    const t = state.settings.theme
    const apply = () => {
      const resolved =
        t === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : t
      document.documentElement.classList.toggle('dark', resolved === 'dark')
    }
    apply()
    if (t === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [state.settings.theme, hydrated])

  const actions = useMemo<AppContextValue['actions']>(
    () => ({
      addTransaction: (input) => {
        const now = Date.now()
        const tx: Transaction = {
          ...input,
          id: newId(),
          createdAt: now,
          updatedAt: now,
        }
        dispatch({ type: 'addTx', payload: tx })
        toast.success('Transação adicionada')
      },
      updateTransaction: (tx) => {
        dispatch({
          type: 'updateTx',
          payload: { ...tx, updatedAt: Date.now() },
        })
        toast.success('Transação atualizada')
      },
      removeTransaction: (id) => {
        dispatch({ type: 'removeTx', payload: id })
      },
      addCategory: (input) => {
        dispatch({ type: 'addCategory', payload: { ...input, id: newId() } })
        toast.success('Categoria criada')
      },
      updateCategory: (cat) => {
        dispatch({ type: 'updateCategory', payload: cat })
      },
      removeCategory: (id) => {
        // Check refusal condition here so we can show a useful toast.
        // (State capture: read from latest store via ref-less callback)
        dispatch({ type: 'removeCategory', payload: id })
      },
      addAccount: (input) => {
        dispatch({ type: 'addAccount', payload: { ...input, id: newId() } })
        toast.success('Conta criada')
      },
      updateAccount: (acc) => {
        dispatch({ type: 'updateAccount', payload: acc })
      },
      removeAccount: (id) => {
        dispatch({ type: 'removeAccount', payload: id })
      },
      setBudget: (b) => {
        dispatch({ type: 'setBudget', payload: b })
      },
      removeBudget: (categoryId) => {
        dispatch({ type: 'removeBudget', payload: categoryId })
      },
      addGoal: (input) => {
        dispatch({ type: 'addGoal', payload: { ...input, id: newId() } })
        toast.success('Meta criada')
      },
      updateGoal: (g) => {
        dispatch({ type: 'updateGoal', payload: g })
      },
      removeGoal: (id) => {
        dispatch({ type: 'removeGoal', payload: id })
      },
      setSettings: (patch) => {
        dispatch({ type: 'setSettings', payload: patch })
      },
      importState: (raw) => {
        const result = StateSchema.safeParse(raw)
        if (!result.success) {
          toast.error('Ficheiro inválido', {
            description: 'Os dados não correspondem ao formato esperado.',
          })
          return false
        }
        dispatch({ type: 'replaceAll', payload: result.data })
        toast.success('Dados importados', {
          description: `${result.data.transactions.length} transações repostas.`,
        })
        return true
      },
      resetAll: () => {
        clearState()
        dispatch({ type: 'reset' })
        toast.success('Dados apagados')
      },
    }),
    [],
  )

  const value = useMemo(
    () => ({ state, hydrated, actions }),
    [state, hydrated, actions],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used inside <AppProvider>')
  }
  return ctx
}

// Convenience selectors.

export function useTransactions() {
  return useApp().state.transactions
}

export function useCategoriesByKind(kind: 'expense' | 'income') {
  const { state } = useApp()
  return useMemo(
    () => state.categories.filter((c) => c.kind === kind),
    [state.categories, kind],
  )
}

export function useCategoryMap() {
  const { state } = useApp()
  return useMemo(() => {
    const map = new Map<string, Category>()
    for (const c of state.categories) map.set(c.id, c)
    return map
  }, [state.categories])
}

export function useAccountMap() {
  const { state } = useApp()
  return useMemo(() => {
    const map = new Map<string, Account>()
    for (const a of state.accounts) map.set(a.id, a)
    return map
  }, [state.accounts])
}

export function useFormatters() {
  const { state } = useApp()
  const { currency, locale } = state.settings
  return useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
        }).format(amount)
      } catch {
        return `${amount.toFixed(2)} ${currency}`
      }
    },
    [currency, locale],
  )
}
