'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useApp } from '@/lib/store'
import { ConfirmDialog } from './Modal'

const CURRENCIES = [
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'BRL', label: 'Real (R$)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'JPY', label: 'Yen (¥)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'AOA', label: 'Kwanza (Kz)' },
  { code: 'MZN', label: 'Metical (MT)' },
]

const LOCALES = [
  { code: 'pt-PT', label: 'Português (Portugal)' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español (España)' },
  { code: 'fr-FR', label: 'Français (France)' },
  { code: 'de-DE', label: 'Deutsch (Deutschland)' },
]

export function SettingsView() {
  const { state, actions } = useApp()
  const { settings } = state
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="space-y-6 max-w-2xl">
      <section>
        <h2 className="text-base font-semibold mb-1">Definições gerais</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Personalize moeda, idioma e orçamento global.
        </p>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <SettingRow label="Moeda" hint="Aplicada em toda a aplicação.">
            <select
              value={settings.currency}
              onChange={(e) => actions.setSettings({ currency: e.target.value })}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </SettingRow>

          <SettingRow label="Idioma / formato" hint="Como datas e números são exibidos.">
            <select
              value={settings.locale}
              onChange={(e) => actions.setSettings({ locale: e.target.value })}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </SettingRow>

          <SettingRow
            label="Orçamento mensal global"
            hint="Opcional. Mostra uma barra de progresso no Dashboard."
          >
            <input
              type="number"
              step="1"
              min="0"
              value={settings.monthlyBudget || ''}
              placeholder="0"
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                actions.setSettings({
                  monthlyBudget: isFinite(v) && v >= 0 ? v : 0,
                })
              }}
              className="w-32 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground tabular-nums text-right"
            />
          </SettingRow>

          <SettingRow
            label="Início da semana"
            hint="Apenas afeta agregações por semana (a vir em versão futura)."
          >
            <select
              value={settings.weekStartsOn}
              onChange={(e) =>
                actions.setSettings({
                  weekStartsOn: Number(e.target.value) as 0 | 1,
                })
              }
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground"
            >
              <option value={1}>Segunda-feira</option>
              <option value={0}>Domingo</option>
            </select>
          </SettingRow>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">Privacidade</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Os seus dados ficam apenas neste navegador. Nada é enviado para fora.
        </p>
        <div className="rounded-xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground space-y-2">
          <p>
            A aplicação usa <code className="rounded bg-muted px-1.5 py-0.5">localStorage</code>{' '}
            para guardar transações, categorias, contas, orçamentos, metas e definições.
          </p>
          <p>
            Limpar a cache do navegador ou trocar de dispositivo <strong>apaga</strong>{' '}
            os dados. Faça <em>backup</em> regular em <strong>Relatórios → Backup JSON</strong>.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
          Zona perigosa
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Ações irreversíveis. Use com cuidado.
        </p>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Apagar todos os dados</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Remove transações, categorias, contas, orçamentos e metas. Não pode
              ser revertido.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="rounded-lg border border-red-600 text-red-600 dark:text-red-400 dark:border-red-400 px-3 py-1.5 text-xs font-medium hover:bg-red-600 hover:text-white dark:hover:bg-red-400 dark:hover:text-red-950 transition-colors"
          >
            Apagar
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Confirmar reset"
        message="Vai perder TODAS as transações, contas, categorias, orçamentos e metas. Esta ação não pode ser revertida. Quer continuar?"
        confirmLabel="Apagar tudo"
        destructive
        onConfirm={() => actions.resetAll()}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  )
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 first:pt-0 last:pb-0 border-b border-border last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
