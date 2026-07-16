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
          className="flex items-center gap-3 text-sm font-medium text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="inline-block size-2 animate-pulse rounded-full bg-red" />
          Loading config…
        </motion.div>
      </div>
    )
  }

  const CATEGORIES = [
    ['nationalities', 'Nations', 'bg-nation text-cream'],
    ['clubs', 'Clubs', 'bg-green text-cream'],
    ['achievements', 'Honours', 'bg-foil text-white'],
    ['traits', 'Traits', 'bg-ink text-cream'],
    ['managers', 'Managers', 'bg-red text-cream'],
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
          <h1 className="font-display text-[40px] uppercase leading-none text-green md:text-[44px]">
            Board setup
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted">
            Every save starts a fresh game with a new board.
          </p>
        </div>
        <Link href="/play" className="btn btn-outline">
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
                  style={active ? { transform: 'rotate(-1deg)' } : undefined}
                  className={`flex flex-col items-center gap-2.5 rounded-[10px] px-6 py-3.5 font-display text-xl uppercase transition-all duration-200 ${
                    active
                      ? 'border-2 border-ink bg-panel-white text-green shadow-sticker'
                      : 'border-2 border-dashed border-line-strong text-muted hover:text-ink'
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
              className={`font-mono text-xs font-bold ${configOk ? 'text-muted' : 'text-red'}`}
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
                  className={`inline-flex items-center gap-2 rounded-full px-[18px] py-2 text-[13px] font-bold uppercase tracking-[0.06em] transition-all duration-200 ${
                    active
                      ? onClass
                      : 'border-2 border-dashed border-line-strong text-muted hover:text-ink'
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
                className="mt-3 text-xs font-semibold text-red"
              >
                Turn on more categories — need at least {needCount} clues for a {boardConfig.size}×
                {boardConfig.size} grid.
              </motion.p>
            )}
          </AnimatePresence>
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
                  className={`flex cursor-pointer items-start gap-3 rounded-[10px] p-4 transition-all duration-200 ${
                    active
                      ? 'border-2 border-ink bg-panel-white'
                      : 'border-2 border-dashed border-line-strong'
                  }`}
                >
                  <RadioGroupItem value={p} className="mt-1 shrink-0" />
                  <div>
                    <p
                      className={`font-display text-base uppercase ${active ? 'text-green' : 'text-muted'}`}
                    >
                      {DRAFT_POLICY_LABEL[p]}
                    </p>
                    <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-muted">
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
            className="inline-flex items-center gap-2.5 text-[13.5px] font-semibold text-ink-soft"
          >
            <span
              className={`relative inline-block h-[22px] w-10 rounded-full transition-colors ${
                lineHighlight ? 'bg-green' : 'bg-line-strong'
              }`}
            >
              <span
                className={`absolute top-[3px] h-4 w-4 rounded-full bg-cream transition-all ${
                  lineHighlight ? 'right-[3px]' : 'left-[3px]'
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
            {launching ? 'Launching…' : 'Save & play'}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
