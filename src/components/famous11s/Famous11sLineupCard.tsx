'use client'

import type { Famous11sLineup } from '@/data/famous11s'
import { lineupCrest } from '@/lib/famous11s/crest'

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
}

function Crest({
  name,
  size,
}: {
  name: string
  size: 'lg' | 'sm'
}) {
  const src = lineupCrest(name)
  const px = size === 'lg' ? 'h-14 w-14 md:h-16 md:w-16' : 'h-7 w-7'
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${px} shrink-0 object-contain`} />
    )
  }
  return (
    <span
      aria-hidden
      className={`${px} inline-flex shrink-0 items-center justify-center rounded-md bg-card-tint font-display text-[13px] font-black uppercase leading-none text-card-ink md:text-[15px]`}
    >
      {initials(name)}
    </span>
  )
}

const DIFF_CLASS = {
  easy: 'bg-green-go/20 text-green-go',
  medium: 'bg-yellow/35 text-card-ink',
  hard: 'bg-red/20 text-red',
} as const

export function Famous11sLineupCard({
  lineup,
  onPick,
}: {
  lineup: Famous11sLineup
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex h-full w-full flex-col rounded-[14px] bg-surface p-4 text-left shadow-[0_6px_0_#0a2417] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_0_#0a2417] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-pitch active:translate-y-[3px] active:shadow-[0_2px_0_#0a2417]"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
            lineup.era === 'classic' ? 'bg-yellow/40 text-card-ink' : 'bg-pink/20 text-pink'
          }`}
        >
          {lineup.era === 'classic' ? 'Classic' : 'Big Night'}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${DIFF_CLASS[lineup.difficulty]}`}
        >
          {lineup.difficulty}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Crest name={lineup.side} size="lg" />
        <p className="min-w-0 font-display text-[26px] font-black uppercase leading-[0.88] text-card-ink md:text-[30px]">
          {lineup.side}
        </p>
      </div>

      {lineup.opponent ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-card-muted-2">
            vs
          </span>
          <Crest name={lineup.opponent} size="sm" />
          <span className="truncate text-[13px] font-extrabold uppercase leading-none text-card-muted">
            {lineup.opponent}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-[13px] font-extrabold uppercase leading-none text-card-muted">
          {lineup.title.split('·')[1]?.trim() ?? lineup.competition}
        </p>
      )}

      <p className="mt-4 font-display text-[15px] font-black uppercase leading-tight text-card-ink">
        {lineup.competition} · {lineup.year}
      </p>
      <p className="mt-1 text-[12px] font-semibold leading-snug text-card-muted">{lineup.prompt}</p>
      <p className="mt-auto pt-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-card-muted-2">
        {lineup.formation}
      </p>
    </button>
  )
}
