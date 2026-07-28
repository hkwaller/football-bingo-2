'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ListChecks, Heart, Timer, Target, type LucideIcon } from 'lucide-react'
import type {
  TriviaConfig,
  TriviaDifficulty,
  TriviaSessionType,
  TriviaCategory,
  TriviaMultiplayerMechanic,
} from '@/lib/trivia/types'
import { DEFAULT_TRIVIA_CONFIG } from '@/lib/trivia/types'
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS } from '@/lib/trivia/difficulty'
import { loadTriviaConfig, saveTriviaConfig, clearTriviaSession } from '@/lib/trivia/triviaStorage'
import { AdsterraBanner } from '@/components/AdsterraBanner'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

/** Entrance for the conditional (session-dependent) panels so they ease in when
 *  a session type reveals them. Entrance-only and unmount-on-hide: no exit
 *  animation, so a fast session switch can never leave a stale panel behind. */
const revealVariants = {
  hidden: { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
}

/** Per-mode accent so each game reads as its own thing, selected or not. */
const SESSION_ACCENT: Record<
  TriviaSessionType,
  { fill: string; fillText: string; roundel: string }
> = {
  fixed: { fill: 'bg-sky', fillText: 'text-pitch-deep', roundel: 'bg-sky text-pitch-deep' },
  survival: { fill: 'bg-pink', fillText: 'text-white', roundel: 'bg-pink text-white' },
  timed: { fill: 'bg-yellow', fillText: 'text-pitch-deep', roundel: 'bg-yellow text-pitch-deep' },
  category: { fill: 'bg-green-go', fillText: 'text-white', roundel: 'bg-green-go text-white' },
}

/** deterministic tilt per tile index — rotation everywhere, per DESIGN.md */
const TILE_TILT = [-1.4, 1.1, 1, -1.3]

// ── Secondary controls (quiet, below the hero) ─────────────────────────────────

function SecondaryPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={itemVariants} className="panel p-5">
      <p className="eyebrow mb-3">{title}</p>
      {children}
    </motion.div>
  )
}

function OptionRow({
  active,
  onClick,
  children,
  description,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  description?: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`w-full rounded-[14px] px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        active
          ? 'bg-card-tint ring-[3px] ring-inset ring-card-ink'
          : 'bg-card-tint/50 hover:-translate-y-0.5 hover:bg-card-tint'
      }`}
    >
      <p
        className={`font-display text-lg font-black uppercase leading-none ${active ? 'text-card-ink' : 'text-card-muted'}`}
      >
        {children}
      </p>
      {description && (
        <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-card-muted">
          {description}
        </p>
      )}
    </button>
  )
}

function NumberSelect({
  options,
  value,
  onChange,
  suffix,
}: {
  options: number[]
  value: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-label="Amount">
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
            {suffix && <span className="ml-0.5 font-mono text-sm lowercase">{suffix}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Hero: choose your game ─────────────────────────────────────────────────────

function SessionTile({
  active,
  icon: Icon,
  label,
  blurb,
  badge,
  accent,
  tilt,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  blurb: string
  badge: string
  accent: (typeof SESSION_ACCENT)[TriviaSessionType]
  tilt: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      style={{ transform: `rotate(${active ? tilt : tilt * 0.4}deg)` }}
      className={`group relative flex h-full flex-col rounded-[18px] border-[3px] p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pitch ${
        active
          ? `${accent.fill} ${accent.fillText} border-black/10 shadow-[0_7px_0_rgba(0,0,0,0.28)] -translate-y-0.5`
          : 'border-card-ink/10 bg-white text-card-ink shadow-[0_5px_0_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-[0_7px_0_rgba(0,0,0,0.22)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            active ? 'bg-black/15' : accent.roundel
          }`}
        >
          <Icon size={20} strokeWidth={2.6} />
        </span>
        <span
          className={`rounded-md px-2 py-1 font-mono text-[11px] font-bold leading-none ${
            active ? 'bg-black/15' : 'bg-card-tint text-card-muted'
          }`}
        >
          {badge}
        </span>
      </div>
      <p className="mt-3 font-display text-[22px] font-black uppercase leading-none">{label}</p>
      <p
        className={`mt-1.5 text-[13px] font-semibold leading-snug ${
          active ? 'opacity-90' : 'text-card-muted'
        }`}
      >
        {blurb}
      </p>
    </button>
  )
}

export function TriviaSetup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('mode') as 'solo' | 'multiplayer' | null
  // null = accessed directly (e.g. via header nav) → show both options
  const isSolo = modeParam === 'solo'
  const isMultiplayer = modeParam === 'multiplayer'

  const [config, setConfig] = useState<TriviaConfig>(DEFAULT_TRIVIA_CONFIG)
  const [hydrated, setHydrated] = useState(false)

  // Config lives in localStorage, and this whole subtree is a client-only
  // Suspense boundary (useSearchParams). Rendering it on the server would strand
  // an orphaned copy in the stream, so gate on the client mount like the other
  // setup screens do, then reconcile stored prefs.
  useEffect(() => {
    setConfig(loadTriviaConfig())
    setHydrated(true)
  }, [])

  function update<K extends keyof TriviaConfig>(key: K, value: TriviaConfig[K]) {
    setConfig((prev) => {
      const next = { ...prev, [key]: value }
      saveTriviaConfig(next)
      return next
    })
  }

  function launchSolo() {
    clearTriviaSession()
    saveTriviaConfig(config)
    router.push('/trivia/play')
  }

  function launchMultiplayer() {
    saveTriviaConfig(config)
    router.push('/trivia/room/new')
  }

  const SESSION_TYPE_OPTIONS: Array<{
    value: TriviaSessionType
    label: string
    icon: LucideIcon
    blurb: string
    badge: string
  }> = [
    {
      value: 'fixed',
      label: 'Fixed rounds',
      icon: ListChecks,
      blurb: 'Answer a set number of questions and tally your score.',
      badge: `${config.questionCount} Qs`,
    },
    {
      value: 'survival',
      label: 'Survival',
      icon: Heart,
      blurb: 'Sudden death — one wrong answer and you’re out.',
      badge: '1 life',
    },
    {
      value: 'timed',
      label: 'Timed',
      icon: Timer,
      blurb: 'Beat the clock. Rack up as many as you can before time’s up.',
      badge: `${config.timeLimitSeconds}s`,
    },
    {
      value: 'category',
      label: 'Single topic',
      icon: Target,
      blurb: 'Go deep on one corner of the game — clubs, stats, nations.',
      badge: '1 topic',
    },
  ]

  const DIFFICULTY_OPTIONS: TriviaDifficulty[] = ['easy', 'medium', 'hard']
  const CATEGORY_OPTIONS: Array<{ value: TriviaCategory; label: string }> = [
    { value: 'all', label: 'All topics' },
    { value: 'clubs', label: 'Clubs' },
    { value: 'stats', label: 'Stats' },
    { value: 'achievements', label: 'Achievements' },
    { value: 'nationalities', label: 'Nationalities' },
  ]
  const MP_MECHANIC_OPTIONS: Array<{
    value: TriviaMultiplayerMechanic
    label: string
    description: string
  }> = [
    { value: 'simultaneous', label: 'Simultaneous', description: 'Everyone answers, then reveal' },
    { value: 'race', label: 'Race', description: 'First correct answer wins the round' },
    { value: 'turn-based', label: 'Turn-based', description: 'Players answer one at a time' },
  ]

  const modeLabel = isSolo ? 'Solo' : isMultiplayer ? 'Multiplayer' : null
  const showQuestionCount = config.sessionType === 'fixed' || config.sessionType === 'category'
  const showTimeLimit = config.sessionType === 'timed'
  const showCategory = config.sessionType === 'category'

  if (!hydrated) return null

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-8 md:px-9">
      <motion.div className="flex flex-col gap-[18px]">
        {/* Title */}
        <motion.div>
          <span className="eyebrow">Trivia{modeLabel ? ` · ${modeLabel}` : ''}</span>
          <h1 className="mt-2.5 font-display text-[48px] font-black uppercase leading-[0.9] text-white md:text-[56px]">
            Setup
          </h1>
        </motion.div>

        {/* ── HERO: choose your game ─────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <span className="eyebrow eyebrow-yellow">Choose your game</span>
          <p className="mt-2 max-w-[460px] text-[14px] font-semibold leading-snug text-on-green-soft">
            Four ways to play — each one changes the rules. Pick your battle.
          </p>
          <div
            role="radiogroup"
            aria-label="Choose your game"
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {SESSION_TYPE_OPTIONS.map((opt, i) => (
              <SessionTile
                key={opt.value}
                active={config.sessionType === opt.value}
                icon={opt.icon}
                label={opt.label}
                blurb={opt.blurb}
                badge={opt.badge}
                accent={SESSION_ACCENT[opt.value]}
                tilt={TILE_TILT[i]}
                onClick={() => update('sessionType', opt.value)}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Tuning (secondary, session-dependent) ──────────────── */}
        {/* Entrance-only + unmount-on-hide: a fast session switch removes the
            old panel immediately, so the wrong control can never linger. */}
        {showQuestionCount && (
          <motion.div key="questions" variants={revealVariants} initial="hidden" animate="show">
            <div className="panel p-5">
              <p className="eyebrow mb-3">How many questions?</p>
              <NumberSelect
                options={[5, 10, 20]}
                value={config.questionCount}
                onChange={(v) => update('questionCount', v)}
              />
            </div>
          </motion.div>
        )}

        {showTimeLimit && (
          <motion.div key="time" variants={revealVariants} initial="hidden" animate="show">
            <div className="panel p-5">
              <p className="eyebrow mb-3">How long on the clock?</p>
              <NumberSelect
                options={[60, 120, 180]}
                value={config.timeLimitSeconds}
                onChange={(v) => update('timeLimitSeconds', v)}
                suffix="s"
              />
            </div>
          </motion.div>
        )}

        {showCategory && (
          <motion.div key="category" variants={revealVariants} initial="hidden" animate="show">
            <div className="panel p-5">
              <p className="eyebrow mb-3">Pick your topic</p>
              <div role="radiogroup" aria-label="Topic" className="grid grid-cols-2 gap-2">
                {CATEGORY_OPTIONS.map((opt) => {
                  const active = config.category === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => update('category', opt.value)}
                      className={`rounded-[12px] px-4 py-2.5 text-center font-display text-base font-black uppercase leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                        active
                          ? 'bg-green-go text-white shadow-[0_4px_0_rgba(0,0,0,0.22)]'
                          : 'bg-card-tint text-card-muted hover:-translate-y-0.5 hover:text-card-ink'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Difficulty */}
        <SecondaryPanel title="Difficulty">
          <div role="radiogroup" aria-label="Difficulty" className="flex flex-col gap-2">
            {DIFFICULTY_OPTIONS.map((d) => (
              <OptionRow
                key={d}
                active={config.difficulty === d}
                onClick={() => update('difficulty', d)}
                description={DIFFICULTY_DESCRIPTIONS[d]}
              >
                {DIFFICULTY_LABELS[d]}
              </OptionRow>
            ))}
          </div>
        </SecondaryPanel>

        {/* Multiplayer mechanic - only shown when in multiplayer mode or unspecified */}
        {!isSolo && (
          <SecondaryPanel title="Multiplayer mechanic">
            <div
              role="radiogroup"
              aria-label="Multiplayer mechanic"
              className="flex flex-col gap-2"
            >
              {MP_MECHANIC_OPTIONS.map((opt) => (
                <OptionRow
                  key={opt.value}
                  active={config.multiplayerMechanic === opt.value}
                  onClick={() => update('multiplayerMechanic', opt.value)}
                  description={opt.description}
                >
                  {opt.label}
                </OptionRow>
              ))}
            </div>
          </SecondaryPanel>
        )}

        {/* ── CTAs ───────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-3 pt-2">
          {/* Show solo CTA unless explicitly in multiplayer mode */}
          {!isMultiplayer && (
            <button onClick={launchSolo} className="btn btn-primary btn-lg min-w-[160px] flex-1">
              Play solo
            </button>
          )}
          {/* Show multiplayer CTA unless explicitly in solo mode */}
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
