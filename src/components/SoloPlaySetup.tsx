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
import { DRAFT_POLICY_HELP, DRAFT_POLICY_LABEL, type DraftPolicy } from '@/lib/draftPolicy'
import { randomUUID } from '@/lib/randomUUID'
import { loadSolo, saveSolo } from '@/lib/soloStorage'
import type { PlayMode } from '@/lib/playMode'
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
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
}

function GridDots({ size }: { size: 3 | 4 | 5 }) {
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
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
      seed: randomUUID(),
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
          className="flex items-center gap-3 text-sm text-chalk-dim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="inline-block size-2 rounded-full bg-turf animate-pulse" />
          Loading config…
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
          <div className="chip mb-3 text-turf">
            <span className="size-1.5 rounded-full bg-turf animate-pulse" />
            New game
          </div>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-chalk md:text-6xl">
            Solo Setup
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-chalk-dim">
            Configure your board. Every &ldquo;Save &amp; play&rdquo; starts a fresh game with a new
            seed.
          </p>
        </div>
        <Link href="/play" className="btn btn-secondary mt-1">
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
        <motion.div variants={itemVariants} className="card p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">
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
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex flex-col items-center gap-3 rounded-xl border px-6 py-4 font-display text-lg font-semibold transition-all duration-200 ${
                    active
                      ? 'border-transparent bg-turf/10 text-turf'
                      : 'border-line bg-pitch text-chalk-dim hover:border-line-strong hover:text-chalk'
                  }`}
                >
                  <GridDots size={n} />
                  <span>
                    {n}×{n}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="grid-active-ring"
                      className="absolute inset-0 rounded-xl border border-turf/70 shadow-glow-turf"
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div variants={itemVariants} className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">
              Categories
            </p>
            <motion.span
              key={poolCount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`chip font-mono ${configOk ? 'text-turf' : 'text-flare'}`}
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
            ).map(([k, label, icon]) => {
              const active = boardConfig.categoryKinds[k]
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleKind(k)}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200 text-left ${
                    active
                      ? 'border-turf/60 bg-turf/10 text-chalk'
                      : 'border-line bg-pitch text-chalk-dim hover:border-line-strong hover:text-chalk'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{icon}</span>
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold ${active ? 'text-turf' : 'text-chalk-dim'}`}
                  >
                    {active ? 'On' : 'Off'}
                  </span>
                </button>
              )
            })}
          </div>

          <AnimatePresence>
            {!configOk && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 text-xs text-flare"
              >
                Turn on more categories — need at least {needCount} clues for a {boardConfig.size}×
                {boardConfig.size} grid.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Draft draws */}
        <motion.div variants={itemVariants} className="card p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">
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
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-200 ${
                    active
                      ? 'border-turf/60 bg-turf/5'
                      : 'border-line bg-pitch hover:border-line-strong'
                  }`}
                >
                  <RadioGroupItem value={p} className="mt-0.5 shrink-0" />
                  <div>
                    <p className={`text-sm font-semibold ${active ? 'text-turf' : 'text-chalk'}`}>
                      {DRAFT_POLICY_LABEL[p]}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-chalk-dim">
                      {DRAFT_POLICY_HELP[p]}
                    </p>
                  </div>
                </label>
              )
            })}
          </RadioGroup>
        </motion.div>

        {/* Options row */}
        <motion.div variants={itemVariants} className="card p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">
            Display options
          </p>
          <button
            type="button"
            onClick={() => setLineHighlight((v) => !v)}
            className={`w-full flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-all duration-200 text-left ${
              lineHighlight
                ? 'border-turf/60 bg-turf/10 text-chalk'
                : 'border-line bg-pitch text-chalk-dim hover:border-line-strong hover:text-chalk'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">✨</span>
              <div>
                <p className="text-sm font-semibold">Highlight winning lines</p>
                <p className="text-xs leading-relaxed text-chalk-dim">
                  Glow effect when you complete a row, column, or diagonal
                </p>
              </div>
            </div>
            <span
              className={`shrink-0 text-xs font-semibold ${lineHighlight ? 'text-turf' : 'text-chalk-dim'}`}
            >
              {lineHighlight ? 'On' : 'Off'}
            </span>
          </button>
        </motion.div>

        {/* Footer actions */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-3 pt-2">
          <motion.button
            type="button"
            disabled={!configOk || launching}
            onClick={persistAndPlay}
            whileTap={configOk ? { scale: 0.98 } : {}}
            className="btn btn-primary btn-lg min-w-[180px]"
          >
            {launching ? 'Launching…' : 'Save & play'}
          </motion.button>
          <Link href="/" className="btn btn-secondary btn-lg">
            Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
