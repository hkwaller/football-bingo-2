'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowDownUp, Check, Globe2, Layers, Search, Shield, Sparkles, Trophy, ArrowLeftRight, X } from 'lucide-react'
import type { TenableGroup } from '@/data/tenable'
import { TENABLE_GROUPS, browseTenables, pluralLists } from '@/lib/tenable/setupMeta'
import type {
  TenableBrowseSort,
  TenableDifficultyFilter,
  TenableKindFilter,
} from '@/lib/tenable/types'
import type { Chip } from '@/components/setup/ChipRow'
import { BrowseFilterChoices as FilterChoices } from '@/components/setup/BrowseFilterChoices'
import { TenableListCard } from './TenableListCard'
import styles from '@/components/setup/BrowseGallery.module.css'

const TOPICS = [
  { value: 'all' as const, label: 'All topics', icon: Layers },
  ...TENABLE_GROUPS.map((g) => ({
    value: g.id,
    label: g.label,
    icon: { club: Shield, league: Trophy, international: Globe2, competition: Trophy, transfers: ArrowLeftRight, misc: Sparkles }[g.id],
  })),
]
const KINDS: Chip<TenableKindFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'ranked', label: 'Top 10' },
  { value: 'open', label: 'Name any 10' },
]
const DIFFICULTIES: Chip<TenableDifficultyFilter>[] = [
  { value: 'mixed', label: 'All' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

export function TenableBrowse({ onPick }: { onPick: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<TenableGroup | 'all'>('all')
  const [kind, setKind] = useState<TenableKindFilter>('all')
  const [difficulty, setDifficulty] = useState<TenableDifficultyFilter>('mixed')
  const [sort, setSort] = useState<TenableBrowseSort>('topic')
  const reduceMotion = useReducedMotion()

  const lists = useMemo(
    () => browseTenables({ query, group, kind, difficulty, sort }),
    [query, group, kind, difficulty, sort],
  )
  const topicCounts = useMemo(() => new Map(TOPICS.map((topic) => [topic.value,
    browseTenables({ query, group: topic.value, kind, difficulty, sort: 'topic' }).length,
  ])), [query, kind, difficulty])
  const hasFilters = Boolean(query) || group !== 'all' || kind !== 'all' || difficulty !== 'mixed'

  function clearFilters() {
    setQuery('')
    setGroup('all')
    setKind('all')
    setDifficulty('mixed')
  }

  return (
    <div className={styles.browse}>
      <div className={styles.filterDesk}>
        <label className={styles.search}>
          <Search size={21} aria-hidden="true" />
          <span className="sr-only">Search lists</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Premier League, Swedes, Arsenal…" />
        </label>

        <fieldset className={styles.topics}>
          <legend className="sr-only">Topic</legend>
          <div className={styles.topicGrid}>
            {TOPICS.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" aria-pressed={group === value}
                onClick={() => setGroup(value)} className={styles.topic}>
                <span className={styles.topicTop}>
                  <Icon size={21} strokeWidth={2.2} aria-hidden="true" />
                  <span className={styles.topicCount}>{topicCounts.get(value)}</span>
                </span>
                <span className={styles.topicName}>{label}</span>
                <Check className={styles.topicCheck} size={14} strokeWidth={3} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>

        <div className={styles.refine}>
          <FilterChoices label="Type" choices={KINDS} value={kind} onChange={setKind} />
          <FilterChoices label="Difficulty" choices={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
        </div>
      </div>

      <div className={styles.resultsBar}>
        <p className={styles.tally} role="status" aria-live="polite" aria-atomic="true">
          <span key={lists.length} className={styles.tallyNumber}>{lists.length}</span>
          <span>{lists.length === 1 ? 'list' : 'lists'} in play</span>
        </p>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className={styles.clear}>
            <X size={14} aria-hidden="true" /> Clear filters
          </button>
        )}
        <label className={styles.sort}>
          <ArrowDownUp size={15} aria-hidden="true" />
          <span className="sr-only">Sort lists</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as TenableBrowseSort)}>
            <option value="topic">Topic</option>
            <option value="az">A–Z</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </label>
      </div>

      {lists.length === 0 ? (
        <div className={styles.empty}>
          <Search size={28} aria-hidden="true" />
          <p className="font-display text-[30px] font-black uppercase leading-none">No lists match</p>
          <p className="text-[13px] font-semibold text-card-muted">
            Try another search, or clear the filters.
          </p>
          {hasFilters && <button type="button" onClick={clearFilters} className="btn btn-primary btn-sm">Clear filters</button>}
        </div>
      ) : (
        <div className={styles.results} aria-label={pluralLists(lists.length)}>
          <AnimatePresence initial={false} mode="popLayout">
            {lists.map((q) => (
              <motion.div key={q.id} layout={reduceMotion ? false : 'position'}
                initial={reduceMotion ? { opacity: 0.6 } : { opacity: 0, y: 10, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                transition={{ duration: reduceMotion ? 0.1 : 0.24, ease: [0.16, 1, 0.3, 1], opacity: { duration: 0.12 } }}
                className={styles.result}>
                <TenableListCard question={q} onPick={() => onPick(q.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
