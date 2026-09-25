'use client'

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { BingoBoardView } from '@/components/BingoBoardView'
import { Sticker } from '@/components/Sticker'
import { StatComparison } from '@/components/trivia/questions/StatComparison'
import { TenableHUD } from '@/components/tenable/TenableHUD'
import { TenableBoard } from '@/components/tenable/TenableBoard'
import { Famous11sHUD } from '@/components/famous11s/Famous11sHUD'
import { PitchBoard } from '@/components/famous11s/PitchBoard'
import type { CellPick } from '@/lib/cellPick'
import type { GamesPreviewData } from '@/lib/gamesPreview'
import { POINTS_PER_ANSWER } from '@/lib/tenable/types'
import { POINTS_PER_SLOT } from '@/lib/famous11s/types'

// useLayoutEffect warns during SSR; the measurement only matters in the browser.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Renders a real game screen at its native width, then scales it down to fit
 * the frame (and `maxHeight`). The screen is inert: a picture, not a control.
 */
function ScaledPreview({
  width,
  maxHeight,
  label,
  children,
}: {
  width: number
  maxHeight: number
  label: string
  children: ReactNode
}) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ scale: number; height: number } | null>(null)

  useIsoLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const measure = () => {
      const height = inner.offsetHeight
      if (!height) return
      setBox({ scale: Math.min(1, outer.clientWidth / width, maxHeight / height), height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(outer)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [width, maxHeight])

  return (
    <div
      ref={outerRef}
      role="img"
      aria-label={label}
      className="relative w-full overflow-hidden transition-[height] duration-300"
      style={{ height: box ? box.height * box.scale : maxHeight }}
    >
      <div
        ref={innerRef}
        inert
        className="absolute left-1/2 top-0 origin-top transition-opacity duration-300"
        style={{
          width,
          transform: `translateX(-50%) scale(${box?.scale ?? 1})`,
          opacity: box ? 1 : 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Drives a looping demo: counts 0 → `total` while on screen, holds, restarts.
 * Reduced motion shows the finished state.
 */
function useDemoStep(total: number, { start = 1, interval = 1300, hold = 3200 } = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-80px' })
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(start)

  useEffect(() => {
    if (reduceMotion || !inView) return
    const t = setTimeout(() => setStep((s) => (s >= total ? 0 : s + 1)), step >= total ? hold : interval)
    return () => clearTimeout(t)
  }, [step, total, inView, reduceMotion, interval, hold])

  return { ref, step: reduceMotion ? total : step }
}

// ── Bingo ─────────────────────────────────────────────────────────────────

export function BingoPreview({ data }: { data: NonNullable<GamesPreviewData['bingo']> }) {
  const { ref, step } = useDemoStep(data.picks.length, { start: 2 })
  const solved = new Map<number, CellPick>(data.picks.slice(0, step).map((p) => [p.cell, p.pick]))
  const lineDone = step >= data.picks.length
  const drawn = data.picks[step]?.pick

  return (
    <div ref={ref} className="relative">
      <ScaledPreview width={760} maxHeight={520} label="A Bingo board filling up with player stickers">
        <BingoBoardView
          cells={data.cells}
          size={data.size}
          boardKey={data.seed}
          winningCells={new Set(lineDone ? data.line : [])}
          solved={solved}
          onCellClick={() => {}}
          showLabels
        />
      </ScaledPreview>
      {/* the next sticker off the pile */}
      <div className="pointer-events-none absolute -bottom-6 -right-3 hidden sm:block">
        <AnimatePresence mode="wait">
          {drawn ? (
            <motion.div
              key={drawn.playerId}
              initial={{ opacity: 0, y: 16, rotate: 12 }}
              animate={{ opacity: 1, y: 0, rotate: 6 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Sticker name={drawn.name} imageUrl={drawn.imageUrl} width={96} nameSize={11} drawn />
            </motion.div>
          ) : (
            <motion.span
              key="bingo"
              initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: -4 }}
              exit={{ opacity: 0 }}
              className="block rounded-lg border-[2.5px] border-ink bg-yellow px-4 py-2 font-display text-[32px] font-black uppercase leading-none text-ink shadow-[0_5px_0_#0a2417]"
            >
              Bingo!
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Trivia ────────────────────────────────────────────────────────────────

export function TriviaPreview({ questions }: { questions: GamesPreviewData['trivia'] }) {
  const { ref, step } = useDemoStep(questions.length - 1, { start: 0, interval: 3200, hold: 3200 })
  const question = questions[step]
  if (!question) return null

  return (
    <div ref={ref}>
      <ScaledPreview width={540} maxHeight={520} label="A Trivia stat duel between two players">
        <div className="px-2 py-4">
          <p className="mb-4 flex items-center justify-between font-mono text-sm font-bold uppercase tracking-[0.1em] text-on-green-dim">
            <span>Question {step + 3} of 10</span>
            <span className="rounded-lg bg-black/25 px-3 py-1.5 text-yellow">{(step + 2) * 850} pts</span>
          </p>
          {/* keyed so each duel replays its entrance */}
          <StatComparison key={question.id} question={question} onAnswer={() => {}} disabled={false} />
        </div>
      </ScaledPreview>
    </div>
  )
}

// ── Tenable ───────────────────────────────────────────────────────────────

export function TenablePreview({ data }: { data: NonNullable<GamesPreviewData['tenable']> }) {
  const { question, foundOrder } = data
  const { ref, step } = useDemoStep(foundOrder.length, { start: 2 })
  const found = foundOrder.slice(0, step)
  // one wrong guess partway through, so the lives row isn't just decoration
  const misses = step >= 4 ? 1 : 0
  const last = question.answers.find((a) => a.rank === found.at(-1))

  return (
    <div ref={ref}>
      <ScaledPreview width={720} maxHeight={560} label="A Tenable list with some answers found">
        <div className="px-2 py-4">
          <TenableHUD
            category={question.category}
            prompt={question.prompt}
            questionNumber={2}
            totalQuestions={5}
            foundCount={found.length}
            totalAnswers={10}
            livesLeft={3 - misses}
            maxLives={3}
            score={1200 + found.length * POINTS_PER_ANSWER}
          />
          <div className="input mb-2 flex items-center text-card-muted-2">Name a player…</div>
          <p className="mb-4 h-5 text-center text-sm font-bold text-yellow">{last ? `✓ ${last.name}` : ''}</p>
          <TenableBoard question={question} foundRanks={found} justFound={found.at(-1) ?? null} />
        </div>
      </ScaledPreview>
    </div>
  )
}

// ── Famous 11s ────────────────────────────────────────────────────────────

export function Famous11sPreview({ data }: { data: NonNullable<GamesPreviewData['famous11s']> }) {
  const { lineup, foundOrder } = data
  const { ref, step } = useDemoStep(foundOrder.length, { start: 2 })
  const found = foundOrder.slice(0, step)

  return (
    <div ref={ref}>
      <ScaledPreview width={440} maxHeight={560} label="A Famous 11s pitch with part of the lineup named">
        <div className="px-2 py-4">
          <Famous11sHUD
            lineup={lineup}
            lineupNumber={1}
            totalLineups={3}
            foundCount={found.length}
            totalSlots={11}
            livesLeft={3}
            maxLives={3}
            score={found.length * POINTS_PER_SLOT}
          />
          <PitchBoard
            lineup={lineup}
            foundSlotIds={found}
            justFoundSlotId={found.at(-1) ?? null}
            includeManager={false}
          />
        </div>
      </ScaledPreview>
    </div>
  )
}
