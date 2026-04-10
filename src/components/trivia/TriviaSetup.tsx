'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
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

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-3">
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-chalk/50">{title}</h3>
      {children}
    </motion.div>
  )
}

function OptionButton({
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
      onClick={onClick}
      className={`w-full border-4 px-4 py-3 text-left transition-all duration-100 ${
        active
          ? 'border-[var(--fb-accent-lime)] bg-[var(--fb-accent-lime)]/10 text-white shadow-brutal-lime'
          : 'border-white/20 text-chalk/70 hover:border-white/50 hover:text-white'
      }`}
    >
      <p className="font-mono font-bold uppercase tracking-wide text-sm">{children}</p>
      {description && (
        <p className="font-mono text-xs text-chalk/50 mt-0.5">{description}</p>
      )}
    </button>
  )
}

function NumberSelect({
  options,
  value,
  onChange,
}: {
  options: number[]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 border-4 py-3 font-display text-2xl tracking-wide transition-all duration-100 ${
            value === opt
              ? 'border-[var(--fb-accent-lime)] bg-[var(--fb-accent-lime)]/10 text-[var(--fb-accent-lime)] shadow-brutal-lime'
              : 'border-white/20 text-chalk/50 hover:border-white/50 hover:text-white'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
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

  if (!hydrated) return null

  const SESSION_TYPE_OPTIONS: Array<{ value: TriviaSessionType; label: string; description: string }> = [
    { value: 'fixed', label: 'Fixed rounds', description: `Answer ${config.questionCount} questions` },
    { value: 'survival', label: 'Survival', description: 'One wrong answer ends the game' },
    { value: 'timed', label: 'Timed', description: `Answer as many as possible in ${config.timeLimitSeconds}s` },
    { value: 'category', label: 'Category', description: 'Focus on one topic' },
  ]

  const DIFFICULTY_OPTIONS: TriviaDifficulty[] = ['easy', 'medium', 'hard']
  const CATEGORY_OPTIONS: Array<{ value: TriviaCategory; label: string }> = [
    { value: 'all', label: 'All topics' },
    { value: 'clubs', label: 'Clubs' },
    { value: 'stats', label: 'Stats' },
    { value: 'achievements', label: 'Achievements' },
    { value: 'nationalities', label: 'Nationalities' },
  ]
  const MP_MECHANIC_OPTIONS: Array<{ value: TriviaMultiplayerMechanic; label: string; description: string }> = [
    { value: 'simultaneous', label: 'Simultaneous', description: 'Everyone answers, then reveal' },
    { value: 'race', label: 'Race', description: 'First correct answer wins the round' },
    { value: 'turn-based', label: 'Turn-based', description: 'Players answer one at a time' },
  ]

  const modeLabel = isSolo ? 'Solo' : isMultiplayer ? 'Multiplayer' : null

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-12">
      <motion.div
        className="flex flex-col gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Title */}
        <motion.div variants={itemVariants}>
          <div className="inline-block border-4 border-white bg-black px-6 py-2 shadow-brutal-lime -rotate-1 mb-4">
            <p className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--fb-accent-lime)]">
              Trivia{modeLabel ? ` — ${modeLabel}` : ''}
            </p>
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-white tracking-wider" style={{ textShadow: '4px 4px 0 var(--fb-accent-magenta)' }}>
            SETUP
          </h1>
        </motion.div>

        {/* Session type */}
        <Section title="Session type">
          <div className="flex flex-col gap-2">
            {SESSION_TYPE_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.value}
                active={config.sessionType === opt.value}
                onClick={() => update('sessionType', opt.value)}
                description={opt.description}
              >
                {opt.label}
              </OptionButton>
            ))}
          </div>
        </Section>

        {/* Question count — shown for fixed + category */}
        {(config.sessionType === 'fixed' || config.sessionType === 'category') && (
          <Section title="Questions">
            <NumberSelect
              options={[5, 10, 20]}
              value={config.questionCount}
              onChange={(v) => update('questionCount', v)}
            />
          </Section>
        )}

        {/* Time limit — shown for timed */}
        {config.sessionType === 'timed' && (
          <Section title="Time limit (seconds)">
            <NumberSelect
              options={[60, 120, 180]}
              value={config.timeLimitSeconds}
              onChange={(v) => update('timeLimitSeconds', v)}
            />
          </Section>
        )}

        {/* Category — shown for category mode */}
        {config.sessionType === 'category' && (
          <Section title="Category">
            <div className="flex flex-col gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.value}
                  active={config.category === opt.value}
                  onClick={() => update('category', opt.value)}
                >
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </Section>
        )}

        {/* Difficulty */}
        <Section title="Difficulty">
          <div className="flex flex-col gap-2">
            {DIFFICULTY_OPTIONS.map((d) => (
              <OptionButton
                key={d}
                active={config.difficulty === d}
                onClick={() => update('difficulty', d)}
                description={DIFFICULTY_DESCRIPTIONS[d]}
              >
                {DIFFICULTY_LABELS[d]}
              </OptionButton>
            ))}
          </div>
        </Section>

        {/* Multiplayer mechanic — only shown when in multiplayer mode or unspecified */}
        {!isSolo && (
          <Section title="Multiplayer mechanic">
            <div className="flex flex-col gap-2">
              {MP_MECHANIC_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.value}
                  active={config.multiplayerMechanic === opt.value}
                  onClick={() => update('multiplayerMechanic', opt.value)}
                  description={opt.description}
                >
                  {opt.label}
                </OptionButton>
              ))}
            </div>
          </Section>
        )}

        {/* CTAs */}
        <motion.div variants={itemVariants} className="flex gap-4 flex-wrap pt-2">
          {/* Show solo CTA unless explicitly in multiplayer mode */}
          {!isMultiplayer && (
            <button
              onClick={launchSolo}
              className="fb-brutal-btn flex-1 px-6 py-4 text-xl min-w-[160px]"
            >
              Play solo
            </button>
          )}
          {/* Show multiplayer CTA unless explicitly in solo mode */}
          {!isSolo && (
            <button
              onClick={launchMultiplayer}
              className="fb-brutal-btn flex-1 px-6 py-4 text-xl min-w-[160px] bg-[var(--fb-accent-cyan)] !shadow-brutal-magenta"
            >
              {isMultiplayer ? 'Create room' : 'Multiplayer'}
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
