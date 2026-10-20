'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowDownUp, Check, History, Layers, Search, Trophy, X } from 'lucide-react'
import { browseFixtures, pluralFixtures, pluralLineups } from '@/lib/famous11s/setupMeta'
import type {
  Famous11sBrowseSort,
  Famous11sDifficultyFilter,
  Famous11sEraFilter,
  Famous11sKindFilter,
} from '@/lib/famous11s/types'
import type { Chip } from '@/components/setup/ChipRow'
import { BrowseFilterChoices } from '@/components/setup/BrowseFilterChoices'
import styles from '@/components/setup/BrowseGallery.module.css'
import { Famous11sFixtureCard } from './Famous11sLineupCard'

const ERAS = [
  { value: 'all', label: 'All eras', icon: Layers },
  { value: 'classic', label: 'Classic', icon: History },
  { value: 'big-nights', label: 'Big Nights', icon: Trophy },
] satisfies Array<{ value: Famous11sEraFilter; label: string; icon: typeof Layers }>

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

export function Famous11sBrowse({ onPick }: { onPick: (id: string) => void }) {
  const reduceMotion = useReducedMotion()
  const [query, setQuery] = useState('')
  const [era, setEra] = useState<Famous11sEraFilter>('all')
  const [kind, setKind] = useState<Famous11sKindFilter>('all')
  const [difficulty, setDifficulty] = useState<Famous11sDifficultyFilter>('mixed')
  const [sort, setSort] = useState<Famous11sBrowseSort>('year-desc')

  const fixtures = useMemo(
    () => browseFixtures({ query, era, kind, difficulty, sort }),
    [query, era, kind, difficulty, sort],
  )
  const eraCounts = useMemo(() => new Map(ERAS.map((item) => [item.value,
    browseFixtures({ query, era: item.value, kind, difficulty, sort: 'year-desc' }).length,
  ])), [query, kind, difficulty])
  const xiCount = fixtures.reduce((n, f) => n + f.sides.length, 0)

  const hasFilters = Boolean(query) || era !== 'all' || kind !== 'all' || difficulty !== 'mixed'

  function clearFilters() {
    setQuery('')
    setEra('all')
    setKind('all')
    setDifficulty('mixed')
  }

  return (
    <div className={`${styles.browse} ${styles.famous}`}>
      <div className={styles.filterDesk}>
        <label className={styles.search}>
          <Search size={21} aria-hidden="true" />
          <span className="sr-only">Search lineups</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Brazil, 1998, El Clásico…" />
        </label>

        <fieldset className={styles.topics}>
          <legend className="sr-only">Era</legend>
          <div className={`${styles.topicGrid} ${styles.eraGrid}`}>
            {ERAS.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" aria-pressed={era === value}
                onClick={() => setEra(value)} className={styles.topic}>
                <span className={styles.topicTop}>
                  <Icon size={21} strokeWidth={2.2} aria-hidden="true" />
                  <span className={styles.topicCount} aria-label={pluralFixtures(eraCounts.get(value) ?? 0)}>
                    {eraCounts.get(value)}
                  </span>
                </span>
                <span className={styles.topicName}>{label}</span>
                <Check className={styles.topicCheck} size={14} strokeWidth={3} aria-hidden="true" />
              </button>
            ))}
          </div>
        </fieldset>

        <div className={styles.refine}>
          <BrowseFilterChoices label="Type" choices={KIND_CHIPS} value={kind} onChange={setKind} />
          <BrowseFilterChoices label="Difficulty" choices={DIFF_CHIPS} value={difficulty} onChange={setDifficulty} />
        </div>
      </div>

      <div className={styles.resultsBar}>
        <p className={styles.tally} role="status" aria-live="polite" aria-atomic="true">
          <span key={fixtures.length} className={styles.tallyNumber}>{fixtures.length}</span>
          <span>{fixtures.length === 1 ? 'fixture' : 'fixtures'} in play
            {xiCount !== fixtures.length && <span className="block">{pluralLineups(xiCount)}</span>}
          </span>
        </p>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className={styles.clear}>
            <X size={14} aria-hidden="true" /> Clear filters
          </button>
        )}
        <label className={styles.sort}>
          <ArrowDownUp size={15} aria-hidden="true" />
          <span className="sr-only">Sort fixtures</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Famous11sBrowseSort)}>
            {SORTS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {fixtures.length === 0 ? (
        <div className={styles.empty}>
          <Search size={28} aria-hidden="true" />
          <p className="font-display text-[30px] font-black uppercase leading-none">No XIs match</p>
          <p className="text-[13px] font-semibold text-card-muted">
            Try another search, or clear the filters.
          </p>
          {hasFilters && <button type="button" onClick={clearFilters} className="btn btn-primary btn-sm">Clear filters</button>}
        </div>
      ) : (
        <div className={`${styles.results} ${styles.lineupResults}`} aria-label={pluralFixtures(fixtures.length)}>
          <AnimatePresence initial={false} mode="popLayout">
            {fixtures.map((fixture) => (
              <motion.div key={fixture.key} layout={reduceMotion ? false : 'position'}
                initial={reduceMotion ? { opacity: 0.6 } : { opacity: 0, y: 10, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                transition={{ duration: reduceMotion ? 0.1 : 0.24, ease: [0.16, 1, 0.3, 1], opacity: { duration: 0.12 } }}
                className={styles.result}>
                <Famous11sFixtureCard fixture={fixture} onPick={onPick} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
