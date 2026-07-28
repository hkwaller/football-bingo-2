'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { MarqueeCard, type MarqueeAccent } from './MarqueeCard'

export type MarqueeItem = {
  id: string
  icon: LucideIcon
  accent: MarqueeAccent
  title: string
  blurb: string
  /** Custom decoration (Bingo dot-grid); falls back to the ghost numeral. */
  renderDecoration?: (selected: boolean) => ReactNode
}

/** Deterministic tilt per position (never more than ~1deg). */
const TILT = [-1, 0.5, -0.5]

/**
 * The marquee row shared by Trivia and Bingo. On wide screens it's a flex row
 * where the selected card grows to the 1.24fr slot in place; on phones the
 * selected card goes full-width with the other two as compact mini-cards beneath.
 */
export function MarqueeRow({
  items,
  selectedId,
  onSelect,
}: {
  items: MarqueeItem[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const card = (item: MarqueeItem, i: number, compact: boolean) => {
    const selected = item.id === selectedId
    return (
      <MarqueeCard
        key={item.id}
        selected={selected}
        wide={selected}
        compact={compact}
        icon={item.icon}
        accent={item.accent}
        index={i + 1}
        title={item.title}
        blurb={item.blurb}
        decoration={item.renderDecoration?.(selected)}
        tilt={selected ? TILT[i] : TILT[i] * 0.5}
        onClick={() => onSelect(item.id)}
      />
    )
  }

  const selectedIndex = items.findIndex((it) => it.id === selectedId)
  const others = items.filter((it) => it.id !== selectedId)

  return (
    <div className="mt-5">
      {/* Mobile: selected full-width, the rest as a 2-up row */}
      <div className="flex flex-col gap-3 sm:hidden">
        {selectedIndex >= 0 && card(items[selectedIndex], selectedIndex, false)}
        {others.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {others.map((it) => card(it, items.indexOf(it), true))}
          </div>
        )}
      </div>

      {/* Tablet/desktop: flex row, selected grows in place */}
      <div className="hidden gap-3.5 sm:flex">
        {items.map((it, i) => (
          <div key={it.id} className={it.id === selectedId ? 'sm:flex-[1.24]' : 'sm:flex-1'}>
            {card(it, i, false)}
          </div>
        ))}
      </div>
    </div>
  )
}
