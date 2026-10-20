'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { MarqueeCard, type MarqueeAccent } from './MarqueeCard'

export type MarqueeItem = {
  id: string
  icon: LucideIcon
  accent: MarqueeAccent
  title: string
  mobileTitle?: string
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
  fixed = false,
}: {
  items: MarqueeItem[]
  selectedId: string
  onSelect: (id: string) => void
  /** Keep all options in equal, stationary slots at every screen size. */
  fixed?: boolean
}) {
  const card = (item: MarqueeItem, i: number, compact: boolean) => {
    const selected = item.id === selectedId
    return (
      <MarqueeCard
        key={item.id}
        selected={selected}
        fixed={fixed}
        wide={selected}
        compact={compact}
        icon={item.icon}
        accent={item.accent}
        index={i + 1}
        title={item.title}
        mobileTitle={item.mobileTitle}
        blurb={item.blurb}
        decoration={item.renderDecoration?.(selected)}
        tilt={fixed ? 0 : selected ? TILT[i] : TILT[i] * 0.5}
        onClick={() => onSelect(item.id)}
      />
    )
  }

  if (fixed) {
    return (
      <div className="mt-5 grid grid-cols-3 items-stretch gap-2 sm:gap-3.5">
        {items.map((item, i) => card(item, i, false))}
      </div>
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
