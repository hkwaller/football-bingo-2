'use client'

import type { Famous11sLineup } from '@/data/famous11s'
import type { Famous11sFixture } from '@/lib/famous11s/setupMeta'
import { lineupCrest } from '@/lib/famous11s/crest'

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
}

function Crest({ name, size }: { name: string; size: 'lg' | 'sm' }) {
  const src = lineupCrest(name)
  const px = size === 'lg' ? 'h-12 w-12 md:h-14 md:w-14' : 'h-7 w-7'
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

function TeamPick({
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
      className="flex min-w-0 flex-1 flex-col items-center rounded-[12px] bg-card-tint/80 px-2 py-3.5 text-center transition-all duration-150 hover:-translate-y-0.5 hover:bg-yellow/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:translate-y-[2px]"
    >
      <Crest name={lineup.side} size="lg" />
      <p className="mt-2.5 min-w-0 font-display text-[18px] font-black uppercase leading-[0.9] text-card-ink md:text-[20px]">
        {lineup.side}
      </p>
      <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-card-muted-2">
        {lineup.formation}
      </p>
      <span
        className={`mt-2 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${DIFF_CLASS[lineup.difficulty]}`}
      >
        {lineup.difficulty}
      </span>
    </button>
  )
}

function GhostTeam({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-[12px] bg-card-tint/40 px-2 py-3.5 text-center opacity-50">
      <Crest name={name} size="lg" />
      <p className="mt-2.5 font-display text-[18px] font-black uppercase leading-[0.9] text-card-ink md:text-[20px]">
        {name}
      </p>
      <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-card-muted-2">
        XI not in the bank
      </p>
    </div>
  )
}

export function Famous11sFixtureCard({
  fixture,
  onPick,
}: {
  fixture: Famous11sFixture
  onPick: (id: string) => void
}) {
  const isMatch = fixture.sides.length > 1 || Boolean(fixture.missingOpponent)
  const seasonTag = !isMatch
    ? (fixture.sides[0]?.title.split('·')[1]?.trim() ?? null)
    : null

  return (
    <article className="flex h-full w-full flex-col rounded-[14px] bg-surface p-4 shadow-[0_6px_0_#0a2417]">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
            fixture.era === 'classic' ? 'bg-yellow/40 text-card-ink' : 'bg-pink/20 text-pink'
          }`}
        >
          {fixture.era === 'classic' ? 'Classic' : 'Big Night'}
        </span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-card-muted-2">
          {fixture.year}
        </span>
      </div>

      <p className="mt-3 font-display text-[16px] font-black uppercase leading-tight text-card-ink md:text-[18px]">
        {fixture.competition}
      </p>
      {seasonTag ? (
        <p className="mt-1 text-[13px] font-extrabold uppercase leading-none text-card-muted">
          {seasonTag}
        </p>
      ) : null}
      <p className="mt-1 text-[12px] font-semibold leading-snug text-card-muted">{fixture.detail}</p>

      {isMatch ? (
        <div className="relative mt-4 flex gap-2">
          {fixture.sides[0] ? (
            <TeamPick lineup={fixture.sides[0]} onPick={() => onPick(fixture.sides[0]!.id)} />
          ) : null}
          {fixture.sides[1] ? (
            <TeamPick lineup={fixture.sides[1]} onPick={() => onPick(fixture.sides[1]!.id)} />
          ) : fixture.missingOpponent ? (
            <GhostTeam name={fixture.missingOpponent} />
          ) : null}
          <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-card-muted-2 shadow-[0_2px_0_#0a2417]">
            vs
          </span>
        </div>
      ) : (
        <div className="mt-4">
          <TeamPick lineup={fixture.sides[0]!} onPick={() => onPick(fixture.sides[0]!.id)} />
        </div>
      )}
    </article>
  )
}
