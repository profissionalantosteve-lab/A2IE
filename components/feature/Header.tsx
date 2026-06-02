'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useApp } from '@/lib/store'

export function Header() {
  const { state, actions } = useApp()
  const theme = state.settings.theme

  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background font-bold text-sm">
            A2
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight tracking-tight">
              A2IE
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Expense Analyzer
            </p>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Tema"
          className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
        >
          <ThemeButton
            current={theme}
            value="light"
            label="Tema claro"
            icon={<Sun size={14} />}
            onClick={() => actions.setSettings({ theme: 'light' })}
          />
          <ThemeButton
            current={theme}
            value="system"
            label="Tema do sistema"
            icon={<Monitor size={14} />}
            onClick={() => actions.setSettings({ theme: 'system' })}
          />
          <ThemeButton
            current={theme}
            value="dark"
            label="Tema escuro"
            icon={<Moon size={14} />}
            onClick={() => actions.setSettings({ theme: 'dark' })}
          />
        </div>
      </div>
    </header>
  )
}

function ThemeButton({
  current,
  value,
  label,
  icon,
  onClick,
}: {
  current: string
  value: string
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  const active = current === value
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      onClick={onClick}
      className={`rounded-full p-1.5 transition-colors ${
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
    </button>
  )
}
