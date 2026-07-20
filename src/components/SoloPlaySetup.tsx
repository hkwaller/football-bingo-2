'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { BoardConfig } from '@/lib/boardConfig'
import {
  categoryPoolForConfig,
  categoriesRequired,
  DEFAULT_BOARD_CONFIG,
  isBoardConfigViable,
  MAX_FAME_SCORE,
} from '@/lib/boardConfig'
import { enrichedFootballPlayers } from '@/data/players'
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

  // Pills sampling players crossing the eligibility threshold as you drag.
  // Each floats up and fades on its own lifetime, so several stay readable.
  const [famePills, setFamePills] = useState<
    { key: number; name: string; direction: 'added' | 'removed'; percent: number }[]
  >([])
  const flashKey = useRef(0)
  // Only sample once the threshold has moved this many steps since the last pill.
  const EMIT_STEP = 4
  const lastEmit = useRef(boardConfig.minFameScore ?? 0)

  const sampleThresholdPlayer = (next: number) => {
    const from = lastEmit.current
    if (Math.abs(next - from) < EMIT_STEP) return
    const direction: 'added' | 'removed' = next > from ? 'removed' : 'added'
    // Band of players whose eligibility flips between the last pill and now.
    const lo = Math.min(from, next)
    const hi = Math.max(from, next)
    const band = enrichedFootballPlayers.filter((p) => {
      const s = p.fameScore ?? 0
      return s >= lo && s < hi
    })
    lastEmit.current = next
    if (band.length === 0) return
    const pick = band[Math.floor(Math.random() * band.length)]
    flashKey.current += 1
    const key = flashKey.current
    setFamePills((prev) =>
      [...prev, { key, name: pick.name, direction, percent: (next / MAX_FAME_SCORE) * 100 }].slice(
        -5,
      ),
    )
  }

  const poolCount = categoryPoolForConfig(boardConfig).length
  const needCount = categoriesRequired(boardConfig)
  const configOk = isBoardConfigViable(boardConfig)

  const minFameScore = boardConfig.minFameScore ?? 0
  const eligiblePlayerCount = useMemo(
    () =>
      minFameScore <= 0
        ? enrichedFootballPlayers.length
        : enrichedFootballPlayers.filter((p) => (p.fameScore ?? 0) >= minFameScore).length,
    [minFameScore],
  )

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
          className="flex items-center gap-3 text-sm font-semibold text-on-green-dim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="inline-block size-2 animate-pulse rounded-full bg-yellow" />
          Loading config…
        </motion.div>
      </div>
    )
  }

  const CATEGORIES = [
    ['nationalities', 'Nations', 'bg-sky text-pitch-deep'],
    ['clubs', 'Clubs', 'bg-green-go text-white'],
    ['achievements', 'Honours', 'bg-yellow text-pitch-deep'],
    ['traits', 'Traits', 'bg-card-ink text-white'],
    ['managers', 'Managers', 'bg-pink text-white'],
  ] as const

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-[18px] px-6 py-8 md:px-9">
      {/* Header */}
      <motion.div
        className="flex flex-wrap items-end justify-between gap-4"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="font-display text-[48px] font-black uppercase leading-[0.9] text-white md:text-[56px]">
            Team talk
          </h1>
          <p className="mt-2 text-[14.5px] font-semibold text-on-green-soft">
            Set your tactics. Every save kicks off a fresh game with a new board.
          </p>
        </div>
        <Link href="/play" className="btn btn-outline-light">
          ← Back to game
        </Link>
      </motion.div>

      {/* Sections */}
      <motion.div
        className="flex flex-col gap-[18px]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Grid size */}
        <motion.div variants={itemVariants} className="panel p-6">
          <p className="eyebrow mb-3">Grid size</p>
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
                  style={active ? { transform: 'rotate(-1.5deg)' } : undefined}
                  className={`flex flex-col items-center gap-2.5 rounded-[14px] px-7 py-4 font-display text-xl font-black uppercase transition-all duration-200 ${
                    active
                      ? 'bg-green-go text-white shadow-[0_5px_0_rgba(0,0,0,0.22)]'
                      : 'bg-card-tint text-card-muted hover:text-card-ink'
                  }`}
                >
                  <GridDots size={n} />
                  <span>
                    {n}×{n}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div variants={itemVariants} className="panel p-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="eyebrow">Categories</p>
            <motion.span
              key={poolCount}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`font-mono text-xs font-bold ${configOk ? 'text-card-muted' : 'text-pink'}`}
            >
              {poolCount} in pool · {needCount} needed {configOk ? '✓' : '✗'}
            </motion.span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {CATEGORIES.map(([k, label, onClass]) => {
              const active = boardConfig.categoryKinds[k]
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleKind(k)}
                  className={`inline-flex items-center gap-2 rounded-full px-[18px] py-2 text-[13px] font-extrabold uppercase tracking-[0.06em] transition-all duration-200 ${
                    active
                      ? `${onClass} shadow-[0_3px_0_rgba(0,0,0,0.2)]`
                      : 'bg-card-tint text-card-muted hover:text-card-ink'
                  }`}
                >
                  {active ? '✓ ' : ''}
                  {label}
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
                className="mt-3 text-xs font-bold text-pink"
              >
                Turn on more categories — need at least {needCount} clues for a {boardConfig.size}×
                {boardConfig.size} grid.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Star quality */}
        <motion.div variants={itemVariants} className="panel p-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="eyebrow">Star quality</p>
            <motion.span
              key={eligiblePlayerCount}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`font-mono text-xs font-bold ${
                eligiblePlayerCount === 0 ? 'text-pink' : 'text-card-muted'
              }`}
            >
              {eligiblePlayerCount} players in play
            </motion.span>
          </div>
          <p className="mb-4 text-[13.5px] font-semibold text-card-muted">
            Drag right to keep the journeymen out. Only players at or above this fame score get
            drawn.
          </p>
          <div className="relative">
            {/* Sampled-player pills floating up from the slider line */}
            <div className="pointer-events-none absolute inset-x-0 bottom-full h-0">
              <AnimatePresence>
                {famePills.map((pill) => (
                  <motion.div
                    key={pill.key}
                    initial={{ opacity: 0, y: 8, scale: 0.8 }}
                    animate={{
                      opacity: [0, 1, 0],
                      y: [8, -8, -60],
                      scale: [0.8, 1, 0.95],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1,
                      ease: 'easeOut',
                    }}
                    onAnimationComplete={() =>
                      setFamePills((prev) => prev.filter((p) => p.key !== pill.key))
                    }
                    style={{
                      left: `clamp(14%, ${pill.percent}%, 86%)`,
                      transform: 'translateX(-50%)',
                    }}
                    className={`absolute bottom-0 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-extrabold shadow-[0_3px_0_rgba(0,0,0,0.2)] ${
                      pill.direction === 'added' ? 'bg-green-go text-white' : 'bg-pink text-white'
                    }`}
                  >
                    <span className="text-[13px] leading-none">
                      {pill.direction === 'added' ? '+' : '−'}
                    </span>
                    {pill.name}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_FAME_SCORE}
              step={1}
              value={minFameScore}
              onChange={(e) => {
                const next = Number(e.target.value)
                sampleThresholdPlayer(next)
                setBoardConfig((c) => ({ ...c, minFameScore: next }))
              }}
              aria-label="Minimum fame score"
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-card-tint accent-green-go"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[12px] font-extrabold uppercase tracking-[0.06em] text-card-muted-2">
            <span>Anyone</span>
            <span className="font-mono text-sm font-bold text-card-ink">
              {minFameScore === 0 ? 'Off' : `≥ ${minFameScore}`}
            </span>
            <span>Legends only</span>
          </div>
        </motion.div>

        {/* Draft rule */}
        <motion.div variants={itemVariants} className="panel p-6">
          <p className="eyebrow mb-3">Draft rule</p>
          <RadioGroup
            value={draftPolicy}
            onValueChange={(v) => setDraftPolicy(v as DraftPolicy)}
            className="grid gap-3 sm:grid-cols-2"
          >
            {(['open', 'placeable'] as const).map((p) => {
              const active = draftPolicy === p
              return (
                <label
                  key={p}
                  className={`flex cursor-pointer items-start gap-3 rounded-[14px] p-4 transition-all duration-200 ${
                    active
                      ? 'border-[3px] border-card-ink bg-card-tint'
                      : 'border-[3px] border-transparent bg-card-tint/50 hover:bg-card-tint'
                  }`}
                >
                  <RadioGroupItem value={p} className="mt-1 shrink-0" />
                  <div>
                    <p
                      className={`font-display text-lg font-black uppercase ${active ? 'text-card-ink' : 'text-card-muted'}`}
                    >
                      {DRAFT_POLICY_LABEL[p]}
                    </p>
                    <p className="mt-1 text-[12.5px] font-semibold leading-relaxed text-card-muted">
                      {DRAFT_POLICY_HELP[p]}
                    </p>
                  </div>
                </label>
              )
            })}
          </RadioGroup>
        </motion.div>

        {/* Footer actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <button
            type="button"
            onClick={() => setLineHighlight((v) => !v)}
            className="inline-flex items-center gap-2.5 text-[13.5px] font-bold text-white"
          >
            <span
              className={`relative inline-block h-[24px] w-11 rounded-full transition-colors ${
                lineHighlight ? 'bg-yellow' : 'bg-black/25'
              }`}
            >
              <span
                className={`absolute top-[3px] h-[18px] w-[18px] rounded-full transition-all ${
                  lineHighlight ? 'right-[3px] bg-pitch-deep' : 'left-[3px] bg-white'
                }`}
              />
            </span>
            Highlight my best line
          </button>
          <motion.button
            type="button"
            disabled={!configOk || launching}
            onClick={persistAndPlay}
            whileTap={configOk ? { scale: 0.98 } : {}}
            className="btn btn-primary btn-lg"
          >
            {launching ? 'Launching…' : 'Save & kick off ⚽'}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
