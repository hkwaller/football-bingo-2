'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={itemVariants} className="panel p-6">
      <p className="eyebrow mb-3">{title}</p>
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
      className={`w-full rounded-[14px] px-4 py-3 text-left transition-all duration-200 ${
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
}: {
  options: number[]
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex gap-3">
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={active ? { transform: 'rotate(-1deg)' } : undefined}
            className={`flex-1 rounded-[14px] py-3.5 font-display text-2xl font-black uppercase leading-none transition-all duration-200 ${
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

const DIFFICULTY_OPTIONS: Array<{ value: TenableDifficultyFilter; label: string; description: string }> = [
  { value: 'mixed', label: 'Mixed', description: 'A blend of everything' },
  { value: 'easy', label: 'Easy', description: 'The best-known lists' },
  { value: 'medium', label: 'Medium', description: 'A bit more obscure' },
  { value: 'hard', label: 'Hard', description: 'For the true anoraks' },
]

const FOCUS_OPTIONS: Array<{ value: 'all' | TenableGroup; label: string }> = [
  { value: 'all', label: 'All topics' },
  { value: 'league', label: 'Leagues' },
  { value: 'club', label: 'Clubs' },
  { value: 'international', label: 'International' },
  { value: 'competition', label: 'Competitions' },
  { value: 'transfers', label: 'Transfers' },
]

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

  const focusValue = config.groups === 'all' ? 'all' : (config.groups[0] ?? 'all')
  const modeLabel = isSolo ? 'Solo' : isMultiplayer ? 'Multiplayer' : null

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-8 md:px-9">
      <motion.div
        className="flex flex-col gap-[18px]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <span className="eyebrow">Tenable{modeLabel ? ` - ${modeLabel}` : ''}</span>
          <h1 className="mt-2.5 font-display text-[48px] font-black uppercase leading-[0.9] text-white md:text-[56px]">
            Setup
          </h1>
          <p className="mt-2 max-w-[460px] text-[15px] font-semibold text-on-green-soft">
            Name the ten. Each category has exactly ten answers — how many can you get before your
            lives run out?
          </p>
        </motion.div>

        <Section title="Lives (wrong guesses)">
          <NumberSelect options={[2, 3, 5]} value={config.lives} onChange={(v) => update('lives', v)} />
        </Section>

        <Section title="Categories">
          <NumberSelect
            options={[1, 3, 5]}
            value={config.questionCount}
            onChange={(v) => update('questionCount', v)}
          />
        </Section>

        <Section title="Topic focus">
          <div className="flex flex-col gap-2">
            {FOCUS_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.value}
                active={focusValue === opt.value}
                onClick={() => update('groups', opt.value === 'all' ? 'all' : [opt.value])}
              >
                {opt.label}
              </OptionButton>
            ))}
          </div>
        </Section>

        <Section title="Difficulty">
          <div className="flex flex-col gap-2">
            {DIFFICULTY_OPTIONS.map((d) => (
              <OptionButton
                key={d.value}
                active={config.difficulty === d.value}
                onClick={() => update('difficulty', d.value)}
                description={d.description}
              >
                {d.label}
              </OptionButton>
            ))}
          </div>
        </Section>

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
              {isMultiplayer ? 'Create room' : 'Multiplayer'}
            </button>
          )}
        </motion.div>
      </motion.div>

      <AdsterraBanner />
    </div>
  )
}
