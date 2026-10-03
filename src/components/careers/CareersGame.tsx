'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { haptic } from '@/lib/native'
import { LivesRow } from '@/components/LivesRow'
import { NameAutocomplete } from '@/components/tenable/NameAutocomplete'
import {
  advance,
  buildSession,
  giveUp,
  pointsAfter,
  revealedClues,
  submitGuess,
} from '@/lib/careers/sessionEngine'
import {
  clearCareersSession,
  loadCareersConfig,
  loadCareersSession,
  loadRecentCareers,
  rememberCareers,
  saveCareersSession,
} from '@/lib/careers/storage'
import type {
  CareerPlayer,
  CareersConfig,
  CareersGuessOutcome,
  CareersSessionState,
} from '@/lib/careers/types'
import { CareerCard } from './CareerCard'
import { CareersEndScreen } from './CareersEndScreen'

type Feedback = { outcome: CareersGuessOutcome; guess: string; id: number }

async function dealSession(config: CareersConfig): Promise<CareersSessionState> {
  const res = await fetch('/api/careers/deal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      difficulty: config.difficulty,
      count: config.playerCount,
      recent: loadRecentCareers(),
    }),
  })
  if (!res.ok) throw new Error(`deal failed: ${res.status}`)
  const { players } = (await res.json()) as { players: CareerPlayer[] }
  rememberCareers(players.map((p) => p.id))
  return buildSession(config, players)
}

export function CareersGame() {
  const [session, setSession] = useState<CareersSessionState | null>(null)
  const [error, setError] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [focusKey, setFocusKey] = useState(0)

  const start = useCallback(() => {
    setError(false)
    setSession(null)
    setFeedback(null)
    clearCareersSession()
    dealSession(loadCareersConfig())
      .then(setSession)
      .catch(() => setError(true))
  }, [])

  useEffect(() => {
    const saved = loadCareersSession()
    if (saved) setSession(saved)
    else start()
  }, [start])

  useEffect(() => {
    if (!session) return
    if (session.phase === 'playing') saveCareersSession(session)
    else clearCareersSession()
  }, [session])

  const handleGuess = useCallback(
    (name: string) => {
      if (!session || session.roundOver) return
      const { state, outcome } = submitGuess(session, name)
      if (outcome.kind === 'repeat') return
      setSession(state)
      setFeedback((f) => ({ outcome, guess: name, id: (f?.id ?? 0) + 1 }))
      haptic(outcome.kind === 'correct' ? 'right' : 'wrong')
      setFocusKey((k) => k + 1)
    },
    [session],
  )

  const handleGiveUp = useCallback(() => {
    if (!session) return
    setSession(giveUp(session))
    setFeedback(null)
  }, [session])

  const handleNext = useCallback(() => {
    if (!session) return
    setFeedback(null)
    setSession(advance(session))
    setFocusKey((k) => k + 1)
  }, [session])

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm font-semibold text-on-green-soft">Couldn&apos;t deal the careers.</p>
        <button onClick={start} className="btn btn-primary">
          Try again
        </button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-on-green-dim animate-pulse-soft">
        Loading…
      </div>
    )
  }

  const player = session.players[session.currentIndex]
  if (session.phase === 'finished' || !player) {
    return <CareersEndScreen session={session} onPlayAgain={start} />
  }

  const misses = session.wrongGuesses.length
  const clues = revealedClues(player, misses, session.roundOver)
  const isLast = session.currentIndex + 1 >= session.players.length

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col px-6 py-8 md:px-9">
      {/* HUD */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow eyebrow-sky">
              Player {session.currentIndex + 1} of {session.players.length}
            </span>
            <h1 className="mt-2 font-display text-[32px] font-black uppercase leading-[0.92] text-on-green md:text-[40px]">
              Whose career?
            </h1>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-lg bg-black/25 px-4 py-2 font-mono text-sm font-bold tabular-nums text-yellow">
            {session.score.toLocaleString()} pts
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <LivesRow livesLeft={session.config.guesses - misses} maxLives={session.config.guesses} />
          {!session.roundOver && (
            <span className="font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-on-green-dim">
              Worth {pointsAfter(misses)}
            </span>
          )}
        </div>
      </div>

      {/* Input / round result */}
      <div className="mb-4 min-h-[92px]">
        {session.roundOver ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 rounded-[12px] bg-black/20 px-4 py-4 text-center"
          >
            <div className="flex items-center gap-3">
              {player.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.imageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full border-2 border-surface object-cover"
                  style={{ objectPosition: '50% 20%' }}
                />
              )}
              <div className="text-left">
                <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-on-green-soft">
                  {session.solved ? `✓ +${session.results.at(-1)?.points ?? 0}` : 'It was'}
                </p>
                <p className="font-display text-[28px] font-black uppercase leading-none text-on-green">
                  {player.name}
                </p>
              </div>
            </div>
            <button onClick={handleNext} className="btn btn-primary btn-lg">
              {isLast ? 'See results' : 'Next player'}
            </button>
          </motion.div>
        ) : (
          <>
            <NameAutocomplete
              onGuess={handleGuess}
              focusKey={focusKey}
              resetKey={session.currentIndex}
              placeholder="Who is it?"
            />
            <div className="mt-2 flex h-6 items-center justify-between gap-3">
              <AnimatePresence mode="wait">
                {feedback?.outcome.kind === 'wrong' && (
                  <motion.p
                    key={feedback.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="truncate text-sm font-bold text-pink"
                  >
                    ✗ Not {feedback.guess} - new clue below
                  </motion.p>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={handleGiveUp}
                className="ml-auto shrink-0 text-[13px] font-bold text-on-green-dim underline hover:text-on-green"
              >
                Give up
              </button>
            </div>
          </>
        )}
      </div>

      {/* Clues */}
      {clues.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {clues.map((c) => (
            <motion.span
              key={c.kind}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-baseline gap-1.5 rounded-full bg-black/25 px-3 py-1.5"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-on-green-dim">
                {c.label}
              </span>
              <span className="text-[13px] font-bold text-on-green">{c.value}</span>
            </motion.span>
          ))}
        </div>
      )}

      <CareerCard key={player.id} career={player.career} />
    </div>
  )
}
