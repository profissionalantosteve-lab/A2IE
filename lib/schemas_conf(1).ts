import { z } from 'zod'

// Strip ASCII control chars (except \n and \t) from user input.
const sanitizeString = (s: string) =>
  s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()

const safeString = (max: number, min = 0) =>
  z
    .string()
    .transform(sanitizeString)
    .pipe(z.string().min(min).max(max))

export const ISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (esperado YYYY-MM-DD)')

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida (esperado #RRGGBB)')

export const TransactionKindSchema = z.enum(['expense', 'income'])

export const RecurrenceSchema = z.enum([
  'none',
  'weekly',
  'monthly',
  'yearly',
])

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: safeString(40, 1),
  icon: safeString(8, 1), // emoji
  color: HexColorSchema,
  kind: TransactionKindSchema, // categories are expense- or income-typed
})

export const AccountSchema = z.object({
  id: z.string().min(1),
  name: safeString(40, 1),
  initialBalance: z.coerce.number().finite(),
  color: HexColorSchema,
  icon: safeString(8, 1),
})

export const TransactionSchema = z.object({
  id: z.string().min(1),
  kind: TransactionKindSchema,
  description: safeString(200, 1),
  amount: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .positive('O valor tem de ser maior que zero')
    .finite()
    .max(1e12, 'Valor irreal'),
  date: ISODateSchema,
  categoryId: z.string().min(1),
  accountId: z.string().min(1),
  tags: z.array(safeString(40, 1)).max(20).default([]),
  notes: safeString(2000, 0).optional().default(''),
  recurrence: RecurrenceSchema.default('none'),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
})

export const BudgetSchema = z.object({
  categoryId: z.string().min(1),
  monthlyLimit: z.coerce.number().nonnegative().finite(),
})

export const GoalSchema = z.object({
  id: z.string().min(1),
  name: safeString(80, 1),
  target: z.coerce.number().positive().finite(),
  saved: z.coerce.number().nonnegative().finite().default(0),
  deadline: ISODateSchema.optional(),
  icon: safeString(8, 1).default('🎯'),
  color: HexColorSchema.default('#10b981'),
})

export const SettingsSchema = z.object({
  currency: z.string().length(3).default('EUR'),
  locale: z.string().min(2).default('pt-PT'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  monthlyBudget: z.coerce.number().nonnegative().finite().default(0),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]).default(1),
})

export const StateSchema = z.object({
  version: z.literal(1),
  transactions: z.array(TransactionSchema).default([]),
  categories: z.array(CategorySchema).default([]),
  accounts: z.array(AccountSchema).default([]),
  budgets: z.array(BudgetSchema).default([]),
  goals: z.array(GoalSchema).default([]),
  settings: SettingsSchema.default({
    currency: 'EUR',
    locale: 'pt-PT',
    theme: 'system',
    monthlyBudget: 0,
    weekStartsOn: 1,
  }),
})
