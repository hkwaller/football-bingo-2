'use client'

import { useMemo, useState } from 'react'
import { browseLineups, pluralLineups } from '@/lib/famous11s/setupMeta'
import type {
  Famous11sBrowseSort,
  Famous11sDifficultyFilter,
  Famous11sEraFilter,
  Famous11sKindFilter,
} from '@/lib/famous11s/types'
import { Famous11sLineupCard } from './Famous11sLineupCard'

type Chip<T extends string> = { value: T; label: string }

const ERA_CHIPS: Chip<Famous11sEraFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'classic', label: 'Classic' },
  { value: 'big-nights', label: 'Big Nights' },
]

const KIND_CHIPS: Chip<Famous11sKindFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'national', label: 'National' },
  { value: 'club', label: 'Club' },
]

const DIFF_CHIPS: Chip<Famous11sDifficultyFilter>[] = [
  { value: 'mixed', label: 'All' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const SORTS: Chip<Famous11sBrowseSort>[] = [
  { value: 'year-desc', label: 'Newest' },
  { value: 'year-asc', label: 'Oldest' },
  { value: 'side', label: 'A–Z' },
  { value: 'difficulty', label: 'Difficulty' },
]

function ChipRow<T extends string>({
  label,
  chips,
  value,
  onChange,
}: {
  label: string
  chips: Chip<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-on-green-dim">
        {label}
      </span>
      {chips.map((c) => {
        const active = c.value === value
        return (
          <button
            key={c.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c.value)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-pitch ${
              active
                ? 'bg-yellow text-ink shadow-[0_3px_0_#0a2417]'
                : 'border border-surface/15 bg-surface/10 text-on-green hover:bg-surface/[0.22]'
            }`}
          >
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

export function Famous11sBrowse({ onPick }: { onPick: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [era, setEra] = useState<Famous11sEraFilter>('all')
  const [kind, setKind] = useState<Famous11sKindFilter>('all')
  const [difficulty, setDifficulty] = useState<Famous11sDifficultyFilter>('mixed')
  const [sort, setSort] = useState<Famous11sBrowseSort>('year-desc')

  const lineups = useMemo(
    () => browseLineups({ query, era, kind, difficulty, sort }),
    [query, era, kind, difficulty, sort],
  )

  const hasFilters = Boolean(query) || era !== 'all' || kind !== 'all' || difficulty !== 'mixed'

  function clearFilters() {
    setQuery('')
    setEra('all')
    setKind('all')
    setDifficulty('mixed')
  }

  return (
    <div className="mt-6">
      <label className="block">
        <span className="sr-only">Search lineups</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Brazil, 1998, El Clásico…"
          className="w-full rounded-[12px] border-[2.5px] border-surface/30 bg-surface px-4 py-3 text-[15px] font-semibold text-card-ink placeholder:text-card-muted-2 focus:border-sky focus:outline-none"
        />
      </label>

      <div className="mt-4 flex flex-col gap-3">
        <ChipRow label="Era" chips={ERA_CHIPS} value={era} onChange={setEra} />
        <ChipRow label="Type" chips={KIND_CHIPS} value={kind} onChange={setKind} />
        <ChipRow label="Diff" chips={DIFF_CHIPS} value={difficulty} onChange={setDifficulty} />
        <ChipRow label="Sort" chips={SORTS} value={sort} onChange={setSort} />
      </div>

      <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-green-dim">
        {pluralLineups(lineups.length)}
      </p>

      {lineups.length === 0 ? (
        <div className="mt-6 rounded-[14px] bg-surface px-6 py-10 text-center shadow-[0_6px_0_#0a2417]">
          <p className="font-display text-[22px] font-black uppercase leading-none text-card-ink">
            No XIs match
          </p>
          <p className="mt-2 text-[13px] font-semibold text-card-muted">
            Try another search, or clear the filters.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-full bg-yellow px-4 py-2 font-sans text-[12px] font-extrabold uppercase tracking-[0.08em] text-ink shadow-[0_3px_0_#0a2417]"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lineups.map((l) => (
            <Famous11sLineupCard key={l.id} lineup={l} onPick={() => onPick(l.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
