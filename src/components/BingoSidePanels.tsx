'use client'

import { Check, SkipForward } from 'lucide-react'
import type { BoardConfig } from '@/lib/boardConfig'
import { bingoLinesForConfig, freeIndexForConfig } from '@/lib/board'

/** One finished draw in the recent-draws list. */
export type DrawOutcome = {
  key: string
  name: string
  result: 'placed' | 'skipped'
  /** e.g. the square's clue for a placement, or "after 1 miss" for a skip */
  detail?: string
}

type LineProgress = { label: string; filled: number; total: number }

/** Every bingo line with how many of its squares are filled, fullest first. */
export function closestLines(
  config: BoardConfig,
  filled: ReadonlySet<number>,
  limit = 4,
): LineProgress[] {
  const n = config.size
  const free = freeIndexForConfig(config)
  const lines = bingoLinesForConfig(config)
  const label = (i: number) =>
    i < n ? `Row ${i + 1}` : i < 2 * n ? `Col ${i - n + 1}` : i === 2 * n ? 'Diag ↘' : 'Diag ↙'
  return lines
    .map((line, i) => ({
      label: label(i),
      filled: line.filter((c) => c === free || filled.has(c)).length,
      total: line.length,
    }))
    .filter((l) => l.filled < l.total)
    .sort((a, b) => b.filled - a.filled)
    .slice(0, limit)
}

/** Ink scoreboard: three mono counters in wells under a row of yellow bulbs. */
export function Scoreboard({
  items,
  className = '',
}: {
  items: { label: string; value: number; tone?: 'yellow' | 'coral' | 'plain' }[]
  className?: string
}) {
  const tone = { yellow: 'text-yellow', coral: 'text-coral', plain: 'text-on-green' }
  return (
    <div className={`scoreboard px-5 pb-5 pt-3 ${className}`}>
      <div className="scoreboard-bulbs mx-1 mb-3" aria-hidden />
      <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-[#9fc2ac]">Scoreboard</p>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {items.map((it) => (
          <div key={it.label} className="scoreboard-well flex flex-col-reverse px-1.5 py-2.5 text-center">
            <dt className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[#9fc2ac]">{it.label}</dt>
            <dd className={`text-[34px] leading-none ${tone[it.tone ?? 'plain']}`}>{it.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Paper card listing the fullest unfinished lines as 5-segment meters. */
export function ClosestLines({ lines, className = '' }: { lines: LineProgress[]; className?: string }) {
  if (!lines.length) return null
  return (
    <div className={`card flex flex-col gap-3 px-5 py-4 ${className}`}>
      <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-card-muted">Closest lines</p>
      <ul className="flex flex-col gap-2.5">
        {lines.map((l) => (
          <li key={l.label} className="flex items-center gap-3">
            <span className="w-16 shrink-0 font-mono text-[12px] font-semibold uppercase tracking-[0.06em] text-card-muted">
              {l.label}
            </span>
            <span className="flex flex-1 gap-1" aria-hidden>
              {Array.from({ length: l.total }, (_, i) => (
                <span
                  key={i}
                  className={`h-3 flex-1 rounded-[3px] border-[1.5px] border-ink ${i < l.filled ? 'bg-yellow' : 'bg-surface-2'}`}
                />
              ))}
            </span>
            <span className="w-8 shrink-0 text-right font-mono text-[13px] font-semibold text-ink">
              {l.filled}/{l.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Paper card with the last few finished draws (placed ✓ / skipped ⏭). */
export function RecentDraws({ draws, className = '' }: { draws: DrawOutcome[]; className?: string }) {
  if (!draws.length) return null
  return (
    <div className={`card px-5 pb-2 pt-4 ${className}`}>
      <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-card-muted">
        Last {draws.length === 1 ? 'draw' : `${draws.length} draws`}
      </p>
      <ul className="mt-1.5">
        {draws.map((d) => (
          <li key={d.key} className="flex items-center gap-3 border-b-[1.5px] border-dashed border-ink/20 py-2.5 last:border-b-0">
            <span
              className={`flex size-[26px] shrink-0 items-center justify-center rounded-full border-2 border-ink text-ink ${
                d.result === 'placed' ? 'bg-green-go' : 'bg-surface-2'
              }`}
            >
              {d.result === 'placed' ? (
                <Check className="size-3.5" strokeWidth={3} aria-label="Placed" />
              ) : (
                <SkipForward className="size-3.5" strokeWidth={2.5} aria-label="Skipped" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[20px] font-extrabold uppercase leading-none text-ink">
                {d.name}
              </span>
              {d.detail ? (
                <span className="mt-0.5 block truncate text-[13px] text-card-muted">{d.detail}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Small legend of the category colours. */
export function CategoryLegend({ className = '' }: { className?: string }) {
  const items = [
    ['Club', 'bg-green-go'],
    ['Nation', 'bg-sky'],
    ['Honour', 'bg-yellow'],
    ['Trait', 'bg-surface-2'],
  ] as const
  return (
    <div className={`rounded-[14px] border-[2.5px] border-dashed border-surface/40 px-4 py-3.5 text-[14px] leading-relaxed text-[#cfe3d5] ${className}`}>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {items.map(([label, bg]) => (
          <span key={label} className={`rounded px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink ${bg}`}>
            {label}
          </span>
        ))}
      </div>
      Every square is a fact. Only real careers count.
    </div>
  )
}

