'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shuffle, Star, Flame, Skull, type LucideIcon } from 'lucide-react'
import type { TenableGroup } from '@/data/tenable'
import { AdsterraBanner } from '@/components/AdsterraBanner'
import type { TenableConfig, TenableDifficultyFilter } from '@/lib/tenable/types'
import { DEFAULT_TENABLE_CONFIG } from '@/lib/tenable/types'
import {
  clearTenableSession,
  loadTenableConfig,
  saveTenableConfig,
} from '@/lib/tenable/tenableStorage'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

function SecondaryPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={itemVariants} className="panel p-5">
      <p className="eyebrow mb-3">{title}</p>
      {children}
    </motion.div>
  )
}

function NumberSelect({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: number[]
  value: number
  onChange: (v: number) => void
  ariaLabel: string
}) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            style={active ? { transform: 'rotate(-1deg)' } : undefined}
            className={`flex-1 rounded-[14px] py-3.5 font-display text-2xl font-black uppercase leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
              active
                ? 'bg-green-go text-white shadow-[0_5px_0_rgba(0,0,0,0.22)]'
                : 'bg-card-tint text-card-muted hover:-translate-y-0.5 hover:text-card-ink'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ── Hero: choose your challenge (difficulty) ───────────────────────────────────

const DIFFICULTY_META: Record<
  TenableDifficultyFilter,
  {
    label: string
    blurb: string
    badge: string
    icon: LucideIcon
    fill: string
    fillText: string
    roundel: string
  }
> = {
  mixed: {
    label: 'Mixed',
    blurb: 'A blend of everything, easy to fiendish.',
    badge: 'ALL',
    icon: Shuffle,
    fill: 'bg-sky',
    fillText: 'text-pitch-deep',
    roundel: 'bg-sky text-pitch-deep',
  },
  easy: {
    label: 'Easy',
    blurb: 'The best-known lists — household names.',
    badge: 'KNOWN',
    icon: Star,
    fill: 'bg-green-go',
    fillText: 'text-white',
    roundel: 'bg-green-go text-white',
  },
  medium: {
    label: 'Medium',
    blurb: 'A bit more obscure — you’ll have to dig.',
    badge: 'DEEPER',
    icon: Flame,
    fill: 'bg-yellow',
    fillText: 'text-pitch-deep',
    roundel: 'bg-yellow text-pitch-deep',
  },
  hard: {
    label: 'Hard',
    blurb: 'For the true anoraks. No mercy.',
    badge: 'ANORAK',
    icon: Skull,
    fill: 'bg-pink',
    fillText: 'text-white',
    roundel: 'bg-pink text-white',
  },
}

const DIFFICULTY_ORDER: TenableDifficultyFilter[] = ['mixed', 'easy', 'medium', 'hard']
const TILE_TILT = [-1.4, 1.1, 1, -1.3]

function ChallengeTile({
  active,
  meta,
  tilt,
  onClick,
}: {
  active: boolean
  meta: (typeof DIFFICULTY_META)[TenableDifficultyFilter]
  tilt: number
  onClick: () => void
}) {
  const Icon = meta.icon
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      style={{ transform: `rotate(${active ? tilt : tilt * 0.4}deg)` }}
      className={`group relative flex h-full flex-col rounded-[18px] border-[3px] p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pitch ${
        active
          ? `${meta.fill} ${meta.fillText} border-black/10 shadow-[0_7px_0_rgba(0,0,0,0.28)] -translate-y-0.5`
          : 'border-card-ink/10 bg-white text-card-ink shadow-[0_5px_0_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-[0_7px_0_rgba(0,0,0,0.22)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            active ? 'bg-black/15' : meta.roundel
          }`}
        >
          <Icon size={20} strokeWidth={2.6} />
        </span>
        <span
          className={`rounded-md px-2 py-1 font-mono text-[11px] font-bold leading-none ${
            active ? 'bg-black/15' : 'bg-card-tint text-card-muted'
          }`}
        >
          {meta.badge}
        </span>
      </div>
      <p className="mt-3 font-display text-[22px] font-black uppercase leading-none">{meta.label}</p>
      <p
        className={`mt-1.5 text-[13px] font-semibold leading-snug ${
          active ? 'opacity-90' : 'text-card-muted'
        }`}
      >
        {meta.blurb}
      </p>
    </button>
  )
}

/**
 * Topic buckets shown as checkboxes. Each maps to one or more of the underlying
 * `TenableGroup`s in the question data - e.g. "Records" folds the one-off
 * `misc`/`transfers` questions together so neither is a lonely standalone filter.
 */
const TOPIC_OPTIONS: Array<{
  key: string
  label: string
  description: string
  groups: TenableGroup[]
}> = [
  {
    key: 'club',
    label: 'Clubs',
    description: 'All-time top scorers for the big clubs - Real, Barça, Liverpool, United…',
    groups: ['club'],
  },
  {
    key: 'league',
    label: 'Leagues',
    description: 'Premier League, La Liga, Serie A & Bundesliga scorers and appearances',
    groups: ['league'],
  },
  {
    key: 'international',
    label: 'Countries',
    description: 'World Cup, caps and national-team goalscorers',
    groups: ['international'],
  },
  {
    key: 'competition',
    label: 'Competitions',
    description: 'Champions League, Euros and European Cups won',
    groups: ['competition'],
  },
  {
    key: 'records',
    label: 'Records & oddities',
    description: "Ballon d'Or, all-time goals, biggest transfers and more",
    groups: ['misc', 'transfers'],
  },
]

function CheckOption({
  active,
  onClick,
  label,
  description,
}: {
  active: boolean
  onClick: () => void
  label: string
  description: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-[14px] px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        active
          ? 'bg-card-tint ring-[3px] ring-inset ring-card-ink'
          : 'bg-card-tint/50 hover:-translate-y-0.5 hover:bg-card-tint'
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-2 text-sm font-black leading-none transition-colors ${
          active ? 'border-green-go bg-green-go text-white' : 'border-card-ink/30 text-transparent'
        }`}
      >
        ✓
      </span>
      <span>
        <span
          className={`block font-display text-lg font-black uppercase leading-none ${active ? 'text-card-ink' : 'text-card-muted'}`}
        >
          {label}
        </span>
        <span className="mt-1 block text-[12.5px] font-semibold leading-relaxed text-card-muted">
          {description}
        </span>
      </span>
    </button>
  )
}

export function TenableSetup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('mode') as 'solo' | 'multiplayer' | null
  const isSolo = modeParam === 'solo'
  const isMultiplayer = modeParam === 'multiplayer'

  const [config, setConfig] = useState<TenableConfig>(DEFAULT_TENABLE_CONFIG)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConfig(loadTenableConfig())
    setHydrated(true)
  }, [])

  function update<K extends keyof TenableConfig>(key: K, value: TenableConfig[K]) {
    setConfig((prev) => {
      const next = { ...prev, [key]: value }
      saveTenableConfig(next)
      return next
    })
  }

  function launchSolo() {
    clearTenableSession()
    saveTenableConfig(config)
    router.push('/tenable/play')
  }

  function launchMultiplayer() {
    saveTenableConfig(config)
    router.push('/tenable/room/new')
  }

  if (!hydrated) return null

  const selectedGroups: Set<TenableGroup> =
    config.groups === 'all' ? new Set() : new Set(config.groups)
  const isTopicActive = (groups: TenableGroup[]) => groups.every((g) => selectedGroups.has(g))
  const toggleTopic = (groups: TenableGroup[]) => {
    const next = new Set(selectedGroups)
    if (groups.every((g) => next.has(g))) groups.forEach((g) => next.delete(g))
    else groups.forEach((g) => next.add(g))
    update('groups', next.size === 0 ? 'all' : (Array.from(next) as TenableGroup[]))
  }
  const allTopics = selectedGroups.size === 0
  const modeLabel = isSolo ? 'Solo' : isMultiplayer ? 'Multiplayer' : null

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-8 md:px-9">
      <motion.div
        className="flex flex-col gap-[18px]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Title */}
        <motion.div variants={itemVariants}>
          <span className="eyebrow">Tenable{modeLabel ? ` · ${modeLabel}` : ''}</span>
          <h1 className="mt-2.5 font-display text-[48px] font-black uppercase leading-[0.9] text-white md:text-[56px]">
            Setup
          </h1>
          <p className="mt-2 max-w-[460px] text-[15px] font-semibold text-on-green-soft">
            Name the ten. Each category has exactly ten answers — how many can you get before your
            lives run out?
          </p>
        </motion.div>

        {/* ── HERO: choose your challenge ────────────────────────── */}
        <motion.div variants={itemVariants}>
          <span className="eyebrow eyebrow-yellow">Choose your challenge</span>
          <p className="mt-2 max-w-[460px] text-[14px] font-semibold leading-snug text-on-green-soft">
            How deep do the lists go? Set the difficulty of every category you’ll face.
          </p>
          <div
            role="radiogroup"
            aria-label="Choose your challenge"
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {DIFFICULTY_ORDER.map((value, i) => (
              <ChallengeTile
                key={value}
                active={config.difficulty === value}
                meta={DIFFICULTY_META[value]}
                tilt={TILE_TILT[i]}
                onClick={() => update('difficulty', value)}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Topics ─────────────────────────────────────────────── */}
        <SecondaryPanel title="Topics">
          <p className="-mt-1 mb-3 text-[12.5px] font-semibold leading-relaxed text-card-muted">
            Pick as many as you like. {allTopics ? 'Everything is in play.' : 'Only the checked topics will come up.'}
          </p>
          <div className="flex flex-col gap-2">
            <CheckOption
              active={allTopics}
              onClick={() => update('groups', 'all')}
              label="All topics"
              description="A bit of everything - the full mix"
            />
            {TOPIC_OPTIONS.map((opt) => (
              <CheckOption
                key={opt.key}
                active={isTopicActive(opt.groups)}
                onClick={() => toggleTopic(opt.groups)}
                label={opt.label}
                description={opt.description}
              />
            ))}
          </div>
        </SecondaryPanel>

        {/* ── Run length ─────────────────────────────────────────── */}
        <SecondaryPanel title="Lives (wrong guesses)">
          <NumberSelect
            options={[2, 3, 5]}
            value={config.lives}
            onChange={(v) => update('lives', v)}
            ariaLabel="Lives"
          />
        </SecondaryPanel>

        <SecondaryPanel title="How many categories?">
          <NumberSelect
            options={[1, 3, 5]}
            value={config.questionCount}
            onChange={(v) => update('questionCount', v)}
            ariaLabel="Categories"
          />
        </SecondaryPanel>

        {/* ── CTAs ───────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-3 pt-2">
          {!isMultiplayer && (
            <button onClick={launchSolo} className="btn btn-primary btn-lg min-w-[160px] flex-1">
              Play solo
            </button>
          )}
          {!isSolo && (
            <button
              onClick={launchMultiplayer}
              className={`btn btn-lg min-w-[160px] flex-1 ${isMultiplayer ? 'btn-primary' : 'btn-outline-light'}`}
            >
              {isMultiplayer ? 'Create room' : 'Play with friends'}
            </button>
          )}
        </motion.div>

        {/* Ad (guests only; component self-hides for ad-free) */}
        <motion.div variants={itemVariants}>
          <AdsterraBanner />
        </motion.div>
      </motion.div>
    </div>
  )
}
