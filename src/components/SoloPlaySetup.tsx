'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { BoardConfig } from '@/lib/boardConfig'
import {
  categoryPoolForConfig,
  categoriesRequired,
  DEFAULT_BOARD_CONFIG,
  isBoardConfigViable,
} from '@/lib/boardConfig'
import {
  DRAFT_POLICY_HELP,
  DRAFT_POLICY_LABEL,
  type DraftPolicy,
} from '@/lib/draftPolicy'
import { loadSolo, saveSolo } from '@/lib/soloStorage'
import type { PlayMode } from '@/lib/playMode'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

function GridDots({ size }: { size: 3 | 4 | 5 }) {
  return (
    <div
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {Array.from({ length: size * size }).map((_, i) => (
        <div key={i} className="size-[5px] rounded-full bg-current opacity-70" />
      ))}
    </div>
  )
}

export function SoloPlaySetup() {
  const router = useRouter()
  const [boardConfig, setBoardConfig] = useState<BoardConfig>(DEFAULT_BOARD_CONFIG)
  const [lineHighlight, setLineHighlight] = useState(true)
  const [draftPolicy, setDraftPolicy] = useState<DraftPolicy>('open')
  const [hydrated, setHydrated] = useState(false)
  const [launching, setLaunching] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    const s = loadSolo()
    if (s) {
      setBoardConfig(s.boardConfig ?? DEFAULT_BOARD_CONFIG)
      setLineHighlight(s.lineHighlight !== false)
      setDraftPolicy(s.draftPolicy === 'placeable' ? 'placeable' : 'open')
    }
    setHydrated(true)
  }, [])

  const poolCount = categoryPoolForConfig(boardConfig).length
  const needCount = categoriesRequired(boardConfig)
  const configOk = isBoardConfigViable(boardConfig)

  const persistAndPlay = () => {
    const prev = loadSolo()
    const playMode: PlayMode = prev?.playMode === 'free' ? 'free' : 'draft'

    saveSolo({
      seed: crypto.randomUUID(),
      solved: {},
      playMode,
      round: 0,
      boardConfig,
      lineHighlight,
      draftPolicy,
    })
    setLaunching(true)
    router.push('/play')
  }

  const toggleKind = (key: keyof BoardConfig['categoryKinds']) => {
    const next = {
      ...boardConfig,
      categoryKinds: {
        ...boardConfig.categoryKinds,
        [key]: !boardConfig.categoryKinds[key],
      },
    }
    if (!isBoardConfigViable(next)) return
    setBoardConfig(next)
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          className="flex items-center gap-3 font-mono text-sm text-chalk/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="inline-block size-2 rounded-full bg-[var(--fb-accent-lime)] animate-pulse" />
          LOADING CONFIG…
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <motion.div
        className="mb-10 flex flex-wrap items-start justify-between gap-4"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--fb-accent-lime)]/30 bg-[var(--fb-accent-lime)]/10 px-3 py-1">
            <span className="size-1.5 rounded-full bg-[var(--fb-accent-lime)] animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--fb-accent-lime)]">
              New game
            </span>
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-chalk md:text-6xl">
            Solo Setup
          </h1>
          <p className="mt-2 max-w-xl font-mono text-sm text-chalk/50">
            Configure your board. Every "Save &amp; play" starts a fresh game with a new seed.
          </p>
        </div>
        <Link
          href="/play"
          className="mt-1 rounded-xl border border-white/20 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-chalk/60 transition-colors hover:border-white/40 hover:text-chalk/90"
        >
          ← Back to game
        </Link>
      </motion.div>

      {/* Sections */}
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Grid size */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-chalk/40">
            Grid size
          </p>
          <div className="flex flex-wrap gap-3">
            {([3, 4, 5] as const).map((n) => {
              const active = boardConfig.size === n
              return (
                <motion.button
                  key={n}
                  type="button"
                  onClick={() => setBoardConfig((c) => ({ ...c, size: n }))}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex flex-col items-center gap-3 rounded-xl border-2 px-6 py-4 font-mono text-sm font-bold transition-all ${
                    active
                      ? 'border-[var(--fb-accent-lime)] bg-[var(--fb-accent-lime)]/10 text-[var(--fb-accent-lime)] shadow-[0_0_16px_rgba(226,255,0,0.15)]'
                      : 'border-white/15 bg-black/20 text-chalk/60 hover:border-white/30 hover:text-chalk'
                  }`}
                >
                  <GridDots size={n} />
                  <span>{n}×{n}</span>
                  {active && (
                    <motion.span
                      layoutId="grid-active-ring"
                      className="absolute inset-0 rounded-xl border-2 border-[var(--fb-accent-lime)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-chalk/40">
              Categories
            </p>
            <motion.span
              key={poolCount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-full px-3 py-0.5 font-mono text-xs font-bold ${
                configOk
                  ? 'bg-[var(--fb-accent-lime)]/15 text-[var(--fb-accent-lime)]'
                  : 'bg-red-500/15 text-red-400'
              }`}
            >
              {poolCount} clues / need {needCount}
            </motion.span>
          </div>

          <div className="space-y-2">
            {(
              [
                ['nationalities', 'Nationalities', '🌍'],
                ['clubs', 'Clubs', '⚽'],
                ['achievements', 'Achievements', '🏆'],
              ] as const
            ).map(([k, label, icon]) => (
              <label
                key={k}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{icon}</span>
                  <span className="font-mono text-sm font-semibold text-chalk">
                    {label}
                  </span>
                </div>
                <Switch
                  checked={boardConfig.categoryKinds[k]}
                  onCheckedChange={() => toggleKind(k)}
                />
              </label>
            ))}
          </div>

          <AnimatePresence>
            {!configOk && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 font-mono text-xs text-red-400"
              >
                ⚠ Turn on more categories — need at least {needCount} clues for a {boardConfig.size}×{boardConfig.size} grid.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Draft draws */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-chalk/40">
            Draft draws
          </p>
          <RadioGroup
            value={draftPolicy}
            onValueChange={(v) => setDraftPolicy(v as DraftPolicy)}
            className="gap-3"
          >
            {(['open', 'placeable'] as const).map((p) => {
              const active = draftPolicy === p
              return (
                <label
                  key={p}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-all ${
                    active
                      ? 'border-[var(--fb-accent-magenta)] bg-[var(--fb-accent-magenta)]/8'
                      : 'border-white/10 bg-black/20 hover:border-white/25'
                  }`}
                >
                  <RadioGroupItem value={p} className="mt-0.5 shrink-0" />
                  <div>
                    <p className={`font-mono text-sm font-bold ${active ? 'text-[var(--fb-accent-magenta)]' : 'text-chalk'}`}>
                      {DRAFT_POLICY_LABEL[p]}
                    </p>
                    <p className="mt-1 font-mono text-xs text-chalk/50">
                      {DRAFT_POLICY_HELP[p]}
                    </p>
                  </div>
                </label>
              )
            })}
          </RadioGroup>
        </motion.div>

        {/* Options row */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-chalk/40">
            Display options
          </p>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition-colors hover:bg-white/[0.04]">
            <div className="flex items-center gap-3">
              <span className="text-base">✨</span>
              <div>
                <p className="font-mono text-sm font-semibold text-chalk">
                  Highlight winning lines
                </p>
                <p className="font-mono text-xs text-chalk/45">
                  Glow effect when you complete a row, column, or diagonal
                </p>
              </div>
            </div>
            <Switch
              checked={lineHighlight}
              onCheckedChange={() => setLineHighlight((v) => !v)}
            />
          </label>
        </motion.div>

        {/* Footer actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap gap-3 pt-2"
        >
          <motion.button
            type="button"
            disabled={!configOk || launching}
            onClick={persistAndPlay}
            whileHover={configOk ? { scale: 1.02 } : {}}
            whileTap={configOk ? { scale: 0.97 } : {}}
            className="fb-brutal-btn min-w-[180px] px-7 py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {launching ? 'Launching…' : 'Save & play'}
          </motion.button>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-white/20 px-6 py-4 font-mono text-sm font-bold uppercase tracking-widest text-chalk/60 transition-colors hover:border-white/40 hover:text-chalk"
          >
            Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
