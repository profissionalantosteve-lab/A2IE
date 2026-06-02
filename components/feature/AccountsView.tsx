'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '@/lib/store'
import { AccountSchema } from '@/lib/schemas'
import { Modal, ConfirmDialog } from './Modal'
import type { Account } from '@/lib/types'

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#a855f7', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#737373',
]

export function AccountsView() {
  const { state, actions } = useApp()
  const { currency, locale } = state.settings
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<Account | null>(null)

  const balances = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of state.accounts) m.set(a.id, a.initialBalance)
    for (const t of state.transactions) {
      const cur = m.get(t.accountId) ?? 0
      m.set(t.accountId, t.kind === 'income' ? cur + t.amount : cur - t.amount)
    }
    return m
  }, [state.accounts, state.transactions])

  const inUseIds = new Set(state.transactions.map((t) => t.accountId))

  const fmt = (v: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v)
    } catch {
      return `${v.toFixed(2)} ${currency}`
    }
  }

  const totalBalance = state.accounts.reduce(
    (s, a) => s + (balances.get(a.id) ?? 0),
    0,
  )

  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold">Contas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Saldo total:{' '}
            <span className="font-semibold text-foreground tabular-nums">
              {fmt(totalBalance)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 transition-opacity"
        >
          <Plus size={12} /> Nova
        </button>
      </header>

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {state.accounts.map((a) => {
          const bal = balances.get(a.id) ?? 0
          const used = inUseIds.has(a.id)
          const isLast = state.accounts.length <= 1
          return (
            <li
              key={a.id}
              className="group rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex size-10 items-center justify-center rounded-full text-base shrink-0"
                    style={{ background: a.color + '22' }}
                  >
                    {a.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Saldo inicial {fmt(a.initialBalance)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(a)
                      setShowForm(true)
                    }}
                    aria-label="Editar"
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={used || isLast}
                    onClick={() => setConfirmRemove(a)}
                    aria-label={
                      isLast
                        ? 'Tem de existir pelo menos uma conta'
                        : used
                          ? 'Conta em uso'
                          : 'Remover'
                    }
                    title={
                      isLast
                        ? 'Tem de existir pelo menos uma conta.'
                        : used
                          ? 'Esta conta tem transações associadas e não pode ser removida.'
                          : 'Remover'
                    }
                    className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div
                className={`text-xl font-bold tabular-nums ${
                  bal < 0 ? 'text-red-600 dark:text-red-400' : ''
                }`}
              >
                {fmt(bal)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Saldo atual</p>
            </li>
          )
        })}
      </ul>

      <AccountForm
        open={showForm}
        onClose={() => setShowForm(false)}
        editing={editing}
      />

      <ConfirmDialog
        open={!!confirmRemove}
        title="Remover conta"
        message={confirmRemove ? `Remover «${confirmRemove.name}»?` : ''}
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          if (confirmRemove) actions.removeAccount(confirmRemove.id)
        }}
        onClose={() => setConfirmRemove(null)}
      />
    </div>
  )
}

function AccountForm({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Account | null
}) {
  const { actions } = useApp()
  const [form, setForm] = useState({
    name: '',
    initialBalance: '0',
    icon: '💵',
    color: PRESET_COLORS[0],
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name,
        initialBalance: String(editing.initialBalance),
        icon: editing.icon,
        color: editing.color,
      })
    } else {
      setForm({ name: '', initialBalance: '0', icon: '💵', color: PRESET_COLORS[0] })
    }
  }, [open, editing])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      id: editing?.id ?? 'placeholder',
      name: form.name,
      initialBalance: form.initialBalance,
      icon: form.icon || '💵',
      color: form.color,
    }
    const result = AccountSchema.safeParse(payload)
    if (!result.success) {
      toast.error('Verifique os campos')
      return
    }
    if (editing) {
      actions.updateAccount(result.data)
      toast.success('Conta atualizada')
    } else {
      const { id: _id, ...rest } = result.data
      actions.addAccount(rest)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar conta' : 'Nova conta'}
    >
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium block mb-1.5">Nome</span>
          <input
            type="text"
            required
            maxLength={40}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex.: Cartão Revolut, Mealheiro, ..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium block mb-1.5">Saldo inicial</span>
            <input
              type="number"
              step="0.01"
              value={form.initialBalance}
              onChange={(e) =>
                setForm((f) => ({ ...f, initialBalance: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium block mb-1.5">Ícone</span>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              maxLength={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </div>
        <fieldset>
          <legend className="text-xs font-medium block mb-1.5">Cor</legend>
          <div className="grid grid-cols-8 gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                aria-label={`Cor ${c}`}
                aria-pressed={form.color === c}
                className={`h-8 rounded-md transition-all ${
                  form.color === c
                    ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                    : 'hover:scale-105'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </fieldset>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-foreground py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            {editing ? 'Guardar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
