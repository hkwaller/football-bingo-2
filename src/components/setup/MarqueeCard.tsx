'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Bright accent tiles for the two unselected marquee cards. */
export type MarqueeAccent = 'pink' | 'sky'

const ACCENT_TILE: Record<MarqueeAccent, string> = {
  pink: 'bg-pink text-ink',
  sky: 'bg-sky text-ink',
}

/**
 * The large "marquee" card - the one choice that redefines the game (Trivia
 * format, Bingo grid size). Selected → hot yellow, lifted and rotated with a
 * SELECTED chip; unselected → white with a bright icon tile and a ghost
 * decoration (a giant numeral, or a custom node such as Bingo's dot-grid).
 *
 * Press behaviour follows the app's chunky-button feel: the card drops and its
 * shadow flattens on :active.
 */
export function MarqueeCard({
  selected,
  wide = false,
  compact = false,
  icon: Icon,
  accent,
  index,
  title,
  blurb,
  decoration,
  tilt,
  onClick,
}: {
  selected: boolean
  /** The selected card is the wide one in the 1.24fr column. */
  wide?: boolean
  /** Icon + title only, shorter - the mobile "other formats" mini-cards. */
  compact?: boolean
  icon: LucideIcon
  /** Accent for the icon tile when unselected. */
  accent: MarqueeAccent
  /** 1-based position, used for the ghost numeral (01 / 02 / 03). */
  index: number
  title: string
  blurb: string
  /** Overrides the ghost numeral (Bingo passes a dot-grid). */
  decoration?: ReactNode
  tilt: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      style={{ transform: `rotate(${tilt}deg)${selected ? ' translateY(-3px)' : ''}` }}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-[14px] p-[22px] text-left transition-[box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-pitch active:translate-y-[2px] motion-reduce:transform-none ${
        compact ? 'min-h-[132px]' : 'min-h-[196px]'
      } ${
        selected
          ? 'bg-yellow text-ink shadow-[0_9px_0_#0a2417] active:shadow-[0_3px_0_#0a2417]'
          : 'bg-surface text-card-ink shadow-[0_6px_0_#0a2417] hover:-translate-y-0.5 hover:shadow-[0_8px_0_#0a2417] active:shadow-[0_3px_0_#0a2417]'
      }`}
    >
      {/* Ghost decoration */}
      {decoration ?? (
        <span
          aria-hidden
          className={`pointer-events-none absolute -bottom-[34px] -right-[10px] font-display text-[150px] font-black leading-none ${
            selected ? 'text-ink/[0.13]' : 'text-card-ink/[0.07]'
          }`}
        >
          {String(index).padStart(2, '0')}
        </span>
      )}

      {/* Icon + SELECTED chip */}
      <div className="relative flex items-start justify-between gap-2">
        <span
          className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] ${
            selected ? 'bg-pitch-deep/[0.16] text-ink' : ACCENT_TILE[accent]
          }`}
        >
          <Icon size={24} strokeWidth={2.6} />
        </span>
        {selected && (
          <span className="rounded-lg bg-pitch-deep px-3 py-1.5 font-mono text-[11.5px] font-bold uppercase leading-none text-yellow">
            Selected
          </span>
        )}
      </div>

      {/* Title + blurb */}
      <p
        className={`relative font-display font-black uppercase leading-[0.92] ${
          compact ? 'mt-auto text-[27px]' : wide ? 'mt-3 text-[36px]' : 'mt-3 text-[34px]'
        }`}
      >
        {title}
      </p>
      {!compact && (
        <p
          className={`relative mt-2 max-w-[260px] text-[13px] font-semibold leading-[1.35] ${
            selected ? 'text-ink/85' : 'text-card-muted'
          }`}
        >
          {blurb}
        </p>
      )}
    </button>
  )
}

/** A CSS dot-grid used as the Bingo marquee decoration, sized to the grid. */
export function DotGridDecoration({ size, selected }: { size: 3 | 4 | 5; selected: boolean }) {
  const cell = size === 3 ? 19 : size === 4 ? 16 : 13
  const gap = size === 3 ? 6 : size === 4 ? 5 : 4
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -bottom-2 -right-2 grid"
      style={{
        gridTemplateColumns: `repeat(${size}, ${cell}px)`,
        gap: `${gap}px`,
        opacity: selected ? 0.16 : 0.08,
      }}
    >
      {Array.from({ length: size * size }).map((_, i) => (
        <span
          key={i}
          className={selected ? 'bg-pitch-deep' : 'bg-card-ink'}
          style={{ width: cell, height: cell, borderRadius: size === 5 ? 4 : 5 }}
        />
      ))}
    </span>
  )
}
