'use client'

import { useMemo, useState } from 'react'
import type { TenableGroup } from '@/data/tenable'
import { TENABLE_GROUPS, browseTenables, pluralLists } from '@/lib/tenable/setupMeta'
import type {
  TenableBrowseSort,
  TenableDifficultyFilter,
  TenableKindFilter,
} from '@/lib/tenable/types'
import { ChipRow, type Chip } from '@/components/setup/ChipRow'
import { TenableListCard } from './TenableListCard'

const TOPIC_CHIPS: Chip<TenableGroup | 'all'>[] = [
  { value: 'all', label: 'All' },
  ...TENABLE_GROUPS.map((g) => ({ value: g.id, label: g.label })),
]

const KIND_CHIPS: Chip<TenableKindFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'ranked', label: 'Top 10' },
  { value: 'open', label: 'Name any 10' },
]

const DIFF_CHIPS: Chip<TenableDifficultyFilter>[] = [
  { value: 'mixed', label: 'All' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const SORTS: Chip<TenableBrowseSort>[] = [
  { value: 'topic', label: 'Topic' },
  { value: 'az', label: 'A–Z' },
  { value: 'difficulty', label: 'Difficulty' },
]

export function TenableBrowse({ onPick }: { onPick: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<TenableGroup | 'all'>('all')
  const [kind, setKind] = useState<TenableKindFilter>('all')
  const [difficulty, setDifficulty] = useState<TenableDifficultyFilter>('mixed')
  const [sort, setSort] = useState<TenableBrowseSort>('topic')

  const lists = useMemo(
    () => browseTenables({ query, group, kind, difficulty, sort }),
    [query, group, kind, difficulty, sort],
  )

  const hasFilters = Boolean(query) || group !== 'all' || kind !== 'all' || difficulty !== 'mixed'

  function clearFilters() {
    setQuery('')
    setGroup('all')
    setKind('all')
    setDifficulty('mixed')
  }

  return (
    <div className="mt-6">
      <label className="block">
        <span className="sr-only">Search lists</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Premier League, Swedes, Arsenal…"
          className="w-full rounded-[12px] border-[2.5px] border-surface/30 bg-surface px-4 py-3 text-[15px] font-semibold text-card-ink placeholder:text-card-muted-2 focus:border-sky focus:outline-none"
        />
      </label>

      <div className="mt-4 flex flex-col gap-3">
        <ChipRow label="Topic" chips={TOPIC_CHIPS} value={group} onChange={setGroup} />
        <ChipRow label="Type" chips={KIND_CHIPS} value={kind} onChange={setKind} />
        <ChipRow label="Diff" chips={DIFF_CHIPS} value={difficulty} onChange={setDifficulty} />
        <ChipRow label="Sort" chips={SORTS} value={sort} onChange={setSort} />
      </div>

      <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-green-dim">
        {pluralLists(lists.length)}
      </p>

      {lists.length === 0 ? (
        <div className="mt-6 rounded-[14px] bg-surface px-6 py-10 text-center shadow-[0_6px_0_#0a2417]">
          <p className="font-display text-[22px] font-black uppercase leading-none text-card-ink">
            No lists match
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
          {lists.map((q) => (
            <TenableListCard key={q.id} question={q} onPick={() => onPick(q.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
