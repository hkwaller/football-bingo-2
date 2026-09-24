'use client'

import type { ReactNode } from 'react'

export type Preset = {
  id: string
  /** Leading emoji, matching the app's existing preset usage. */
  emoji: string
  label: string
}

/**
 * The "SHORTCUTS" row that sits next to the page title - one-tap presets that
 * write a whole config at once. Scrolls horizontally on narrow screens and never
 * wraps. Extra trailing content (e.g. Bingo's "Back to game" pill) slots in via
 * `trailing`.
 */
export function PresetPills({
  presets,
  activeId,
  onSelect,
  trailing,
}: {
  presets: Preset[]
  activeId: string | null
  onSelect: (id: string) => void
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center gap-[9px] overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="hidden shrink-0 font-sans text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-on-green-dim sm:inline">
        Shortcuts
      </span>
      {presets.map((p) => {
        const active = activeId === p.id
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(p.id)}
            className={`flex flex-none items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-extrabold uppercase tracking-[0.04em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-pitch ${
              active
                ? 'bg-yellow text-ink shadow-[0_3px_0_#0a2417]'
                : 'border border-surface/15 bg-surface/10 text-on-green hover:bg-surface/[0.22]'
            }`}
          >
            <span aria-hidden>{p.emoji}</span>
            {p.label}
          </button>
        )
      })}
      {trailing}
    </div>
  )
}
