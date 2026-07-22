'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Sticker } from '@/components/Sticker'

/**
 * Interactive trivia taster for the landing hero.
 *
 * Questions are sampled fresh on every load from the *real* 641-player dataset
 * via the /api/hero-trivia route (the 3MB player file is generated server-side
 * so it never lands in the marketing bundle). Mixing well-known and deep-cut
 * players keeps it a genuine challenge rather than a giveaway.
 */

type Question = {
  name: string
  imageUrl: string
  prompt: string
  options: string[]
  correctAnswer: string
}

export function HeroTrivia() {
  const [round, setRound] = useState<Question[] | null>(null)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)

  const load = useCallback(async () => {
    setRound(null)
    setIndex(0)
    setSelected(null)
    setScore(0)
    try {
      const res = await fetch('/api/hero-trivia', { cache: 'no-store' })
      const data = (await res.json()) as { questions: Question[] }
      setRound(data.questions)
    } catch {
      setRound([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!round) return <SkeletonCard />
  if (round.length === 0)
    return (
      <div className="rounded-[24px] bg-white p-[26px] text-center shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
        <p className="font-display text-[22px] font-black uppercase text-card-ink">
          Couldn&apos;t deal a round
        </p>
        <button onClick={load} className="btn btn-primary mt-4 w-full">
          Try again
        </button>
      </div>
    )

  const finished = index >= round.length
  const q = finished ? null : round[index]

  function answer(option: string) {
    if (selected || !q) return
    setSelected(option)
    if (option === q.correctAnswer) setScore((s) => s + 1)
  }

  function next() {
    setSelected(null)
    setIndex((i) => i + 1)
  }

  return (
    <div className="relative rounded-[24px] bg-white p-[26px] shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
      {finished ? (
        <FinishedView score={score} total={round.length} onRestart={load} />
      ) : (
        <>
          {/* Header: sticker + prompt */}
          <div className="flex items-center gap-4">
            <motion.div
              key={q!.name}
              className="w-[92px] shrink-0"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.4, ease: 'easeInOut', repeat: Infinity }}
            >
              <Sticker name={q!.name} imageUrl={q!.imageUrl} rotate={-4} nameSize={11} drawn />
            </motion.div>
            <div>
              <p className="text-[12px] font-extrabold uppercase leading-none tracking-[0.14em] text-pink">
                Question {index + 1} of {round.length} · your turn
              </p>
              <p className="mt-1.5 font-display text-[22px] font-black uppercase leading-[1.05] text-card-ink">
                {q!.prompt}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="mt-[18px] flex flex-col gap-2.5">
            {q!.options.map((option, i) => (
              <button
                key={option}
                onClick={() => answer(option)}
                disabled={!!selected}
                className={optionClass(option, selected, q!.correctAnswer)}
              >
                <span className="flex items-center gap-2.5">
                  <span className={letterTileClass(option, selected, q!.correctAnswer)}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </span>
                {!!selected && option === q!.correctAnswer && <span aria-hidden>✓</span>}
              </button>
            ))}
          </div>

          {/* Feedback + next */}
          <div className="mt-4 flex min-h-[42px] items-center justify-between gap-2">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.span
                  key="feedback"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`-rotate-2 rounded-lg px-2.5 py-1.5 text-[12px] font-extrabold ${
                    selected === q!.correctAnswer ? 'bg-yellow text-pitch-deep' : 'bg-pink text-white'
                  }`}
                >
                  {selected === q!.correctAnswer ? 'GOOOAL! Correct' : `It was ${q!.correctAnswer}`}
                </motion.span>
              ) : (
                <span key="hint" className="text-[12.5px] font-bold text-card-muted-2">
                  Tap your answer 👇
                </span>
              )}
            </AnimatePresence>
            {selected && (
              <button
                onClick={next}
                className="rounded-lg bg-green-go px-4 py-2 text-[13px] font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,0.2)] transition-transform active:translate-y-[2px]"
              >
                {index + 1 === round.length ? 'See score →' : 'Next →'}
              </button>
            )}
          </div>
        </>
      )}

      <motion.div
        className="absolute -right-3.5 -top-6 rotate-[8deg] rounded-full bg-pink px-[18px] py-3 font-display text-[20px] font-black uppercase text-white shadow-[0_6px_0_rgba(0,0,0,0.3)]"
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity }}
      >
        Trivia!
      </motion.div>
    </div>
  )
}

function FinishedView({
  score,
  total,
  onRestart,
}: {
  score: number
  total: number
  onRestart: () => void
}) {
  const perfect = score === total
  return (
    <div className="py-2 text-center">
      <p className="text-[12px] font-extrabold uppercase leading-none tracking-[0.14em] text-pink">
        Round complete
      </p>
      <p className="mt-3 font-display text-[52px] font-black leading-none text-card-ink">
        {score}
        <span className="text-[28px] text-card-muted">/{total}</span>
      </p>
      <p className="mt-2 text-[14px] font-bold text-card-muted">
        {perfect
          ? 'Flawless. You properly know ball. 🐐'
          : score >= total - 1
            ? 'So close to a clean sweep!'
            : score === 0
              ? 'Ouch. The full game is kinder, promise.'
              : 'Not bad — think you can do better?'}
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        <button onClick={onRestart} className="btn btn-outline w-full">
          Deal another round
        </button>
        <Link href="/trivia/setup?mode=solo" className="btn btn-primary w-full">
          Full Trivia mode →
        </Link>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-[24px] bg-white p-[26px] shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-4">
        <div className="h-[112px] w-[92px] shrink-0 animate-pulse rounded-xl bg-card-tint" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-card-tint" />
          <div className="h-6 w-full animate-pulse rounded bg-card-tint" />
        </div>
      </div>
      <div className="mt-[18px] flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[46px] animate-pulse rounded-xl bg-card-tint" />
        ))}
      </div>
    </div>
  )
}

// ── Class helpers (mirror the real Trivia MultipleChoice styling) ──────────────

function optionClass(option: string, selected: string | null, correctAnswer: string): string {
  const base =
    'flex items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] font-extrabold transition-all duration-150'
  if (!selected) {
    return `${base} bg-card-tint text-card-ink hover:-translate-y-[2px] hover:bg-card-tint/70 cursor-pointer`
  }
  if (option === correctAnswer)
    return `${base} bg-green-go text-white shadow-[0_4px_0_rgba(0,0,0,0.2)]`
  if (option === selected) return `${base} bg-pink text-white shadow-[0_4px_0_rgba(0,0,0,0.2)]`
  return `${base} bg-card-tint text-card-muted opacity-60`
}

function letterTileClass(option: string, selected: string | null, correctAnswer: string): string {
  const base =
    'flex h-[26px] w-[26px] shrink-0 -rotate-3 items-center justify-center rounded-[8px] font-display text-[15px] font-black uppercase leading-none'
  if (!selected) return `${base} bg-yellow text-pitch-deep`
  if (option === correctAnswer) return `${base} bg-yellow text-pitch-deep`
  if (option === selected) return `${base} bg-white text-pink`
  return `${base} bg-white/60 text-card-muted`
}
