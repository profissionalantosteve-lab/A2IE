// Domain types for A2IE Expense Analyzer.
// These are re-exported from schemas via z.infer to keep them in sync
// with the runtime validators; declaring them here too is purely for
// import ergonomics (so consumers can import from '@/lib/types').

import type { z } from 'zod'
import type {
  AccountSchema,
  BudgetSchema,
  CategorySchema,
  GoalSchema,
  RecurrenceSchema,
  SettingsSchema,
  StateSchema,
  TransactionKindSchema,
  TransactionSchema,
} from './schemas'

export type TransactionKind = z.infer<typeof TransactionKindSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type Category = z.infer<typeof CategorySchema>
export type Account = z.infer<typeof AccountSchema>
export type Budget = z.infer<typeof BudgetSchema>
export type Goal = z.infer<typeof GoalSchema>
export type Recurrence = z.infer<typeof RecurrenceSchema>
export type Settings = z.infer<typeof SettingsSchema>
export type AppState = z.infer<typeof StateSchema>

export interface Period {
  year: number
  month: number // 0-indexed (0 = January)
}
