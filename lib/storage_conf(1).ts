import {
  AccountSchema,
  BudgetSchema,
  CategorySchema,
  GoalSchema,
  SettingsSchema,
  StateSchema,
  TransactionSchema,
} from './schemas'
import { INITIAL_STATE } from './seed'
import type { AppState } from './types'

const STORAGE_KEY = 'a2ie:state'
export const SETTINGS_PREVIEW_KEY = 'a2ie:settings' // mirrored for theme bootstrap

export interface LoadResult {
  state: AppState
  recovered: boolean
  error?: string
}

export function loadState(): LoadResult {
  if (typeof window === 'undefined') {
    return { state: INITIAL_STATE, recovered: false }
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return { state: INITIAL_STATE, recovered: false }
  try {
    const parsed = JSON.parse(raw)
    const result = StateSchema.safeParse(parsed)
    if (result.success) {
      return { state: result.data, recovered: false }
    }
    console.warn(
      '[storage] estado inválido, tentar recuperação parcial',
      result.error.flatten(),
    )
    const recovered = recoverPartial(parsed)
    return {
      state: recovered,
      recovered: true,
      error: 'Alguns dados foram descartados porque estavam corrompidos.',
    }
  } catch (e) {
    console.warn('[storage] falha a ler localStorage', e)
    return {
      state: INITIAL_STATE,
      recovered: true,
      error: 'Falha a ler dados guardados. A começar com estado limpo.',
    }
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return
  try {
    const serialized = JSON.stringify(state)
    window.localStorage.setItem(STORAGE_KEY, serialized)
    window.localStorage.setItem(
      SETTINGS_PREVIEW_KEY,
      JSON.stringify(state.settings),
    )
  } catch (e) {
    console.warn('[storage] falha a gravar localStorage', e)
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(SETTINGS_PREVIEW_KEY)
  } catch (e) {
    console.warn('[storage] falha a limpar localStorage', e)
  }
}

function recoverPartial(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object') return INITIAL_STATE
  const obj = raw as Record<string, unknown>

  const txs = pick(obj.transactions, TransactionSchema, [])
  const cats = pick(obj.categories, CategorySchema, INITIAL_STATE.categories)
  const accs = pick(obj.accounts, AccountSchema, INITIAL_STATE.accounts)
  const budgets = pick(obj.budgets, BudgetSchema, [])
  const goals = pick(obj.goals, GoalSchema, [])
  const settingsResult = SettingsSchema.safeParse(obj.settings)
  const settings = settingsResult.success
    ? settingsResult.data
    : INITIAL_STATE.settings

  return {
    version: 1,
    transactions: txs,
    categories: cats,
    accounts: accs,
    budgets,
    goals,
    settings,
  }
}

function pick<T>(
  arr: unknown,
  schema: { safeParse: (x: unknown) => { success: boolean; data?: T } },
  fallback: T[],
): T[] {
  if (!Array.isArray(arr)) return fallback
  const kept: T[] = []
  for (const item of arr) {
    const r = schema.safeParse(item)
    if (r.success && r.data !== undefined) kept.push(r.data)
  }
  return kept.length ? kept : fallback
}
