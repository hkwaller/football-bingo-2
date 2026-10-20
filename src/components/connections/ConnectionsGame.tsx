'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { haptic } from '@/lib/native'
import { LivesRow } from '@/components/LivesRow'
import { ContinueButton } from '@/components/ContinueButton'
import { NameAutocomplete } from '@/components/tenable/NameAutocomplete'
import {
  advance,
  buildSession,
  giveUp,
  pointsAfter,
  revealedClues,
  submitGuess,
} from '@/lib/connections/sessionEngine'
import {
  clearConnectionsSession,
  loadConnectionsConfig,
  loadConnectionsSession,
  loadRecentConnections,
  rememberConnections,
  saveConnectionsSession,
} from '@/lib/connections/storage'
import type {
  ConnectionsConfig,
  ConnectionsGuessOutcome,
  ConnectionsPuzzle,
  ConnectionsSessionState,
} from '@/lib/connections/types'
import { useKnownNames } from '@/lib/connections/useKnownNames'
import { AnswerList, ClubsBoard, clubsPhrase } from './ClubsBoard'
import { ConnectionsEndScreen } from './ConnectionsEndScreen'
import { GuessFeedback } from './GuessFeedback'

type Feedback = { outcome: ConnectionsGuessOutcome; guess: string; id: number }

export async function dealPuzzles(config: ConnectionsConfig): Promise<ConnectionsPuzzle[]> {
  const res = await fetch('/api/connections/deal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      difficulty: config.difficulty,
      clubCount: config.clubCount,
      count: config.puzzleCount,
      recent: loadRecentConnections(),
    }),
  })
  if (!res.ok) throw new Error(`deal failed: ${res.status}`)
  const { puzzles } = (await res.json()) as { puzzles: ConnectionsPuzzle[] }
  rememberConnections(puzzles.map((p) => p.id))
  return puzzles
}

export function ConnectionsGame() {
  const known = useKnownNames()
  const [session, setSession] = useState<ConnectionsSessionState | null>(null)
  const [error, setError] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [focusKey, setFocusKey] = useState(0)

  const start = useCallback(() => {
    setError(false)
    setSession(null)
    setFeedback(null)
    clearConnectionsSession()
    const config = loadConnectionsConfig()
    dealPuzzles(config)
      .then((puzzles) => setSession(buildSession(config, puzzles)))
      .catch(() => setError(true))
  }, [])

  useEffect(() => {
    const saved = loadConnectionsSession()
    if (saved) setSession(saved)
    else start()
  }, [start])

  useEffect(() => {
    if (!session) return
    if (session.phase === 'playing') saveConnectionsSession(session)
    else clearConnectionsSession()
  }, [session])

  const handleGuess = useCallback(
    (name: string) => {
      if (!session || session.roundOver) return
      const { state, outcome } = submitGuess(session, name, known)
      if (outcome.kind === 'repeat') return
      setSession(state)
      setFeedback((f) => ({ outcome, guess: name, id: (f?.id ?? 0) + 1 }))
      if (outcome.kind !== 'unknown') haptic(outcome.kind === 'correct' ? 'right' : 'wrong')
      setFocusKey((k) => k + 1)
    },
    [session, known],
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
        <p className="text-sm font-semibold text-on-green-soft">Couldn&apos;t deal the clubs.</p>
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

  const puzzle = session.puzzles[session.currentIndex]
  if (session.phase === 'finished' || !puzzle) {
    return <ConnectionsEndScreen session={session} onPlayAgain={start} />
  }

  const misses = session.wrongGuesses.length
  const clues = revealedClues(puzzle, misses, false)
  const isLast = session.currentIndex + 1 >= session.puzzles.length
  const result = session.roundOver ? session.results.at(-1) : undefined

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col px-6 py-8 md:px-9">
      {/* HUD */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow eyebrow-yellow">
              Puzzle {session.currentIndex + 1} of {session.puzzles.length}
            </span>
            <h1 className="mt-2 font-display text-[32px] font-black uppercase leading-[0.92] text-on-green md:text-[40px]">
              Connect them
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

      <div className="mb-5">
        <ClubsBoard key={puzzle.id} clubs={puzzle.clubs} />
        <p className="mt-4 text-center text-[14px] font-semibold text-on-green-soft">
          Name a player who played for {clubsPhrase(puzzle.clubs.length)}. Loans count.
        </p>
      </div>

      {/* Input / round result */}
      <div className="mb-4 min-h-[92px]">
        {session.roundOver ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 rounded-[12px] bg-black/20 px-4 py-4 text-center"
          >
            <p className="font-display text-[26px] font-black uppercase leading-none text-on-green">
              {result?.solved
                ? `✓ ${result.answerName} · +${result.points}`
                : 'Not this time'}
            </p>
            {result?.deepCut && (
              <span className="-rotate-2 rounded bg-yellow px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink">
                Deep cut bonus
              </span>
            )}
            <ContinueButton onClick={handleNext} className="btn btn-primary btn-lg">
              {isLast ? 'See results' : 'Next clubs'}
            </ContinueButton>
          </motion.div>
        ) : (
          <>
            <NameAutocomplete
              onGuess={handleGuess}
              focusKey={focusKey}
              resetKey={session.currentIndex}
              placeholder="Who played for them?"
            />
            <div className="mt-2 flex h-6 items-center justify-between gap-3">
              <AnimatePresence mode="wait">
                {feedback && <GuessFeedback key={feedback.id} {...feedback} />}
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

      {/* Clues - about the best-known answer, though any answer counts */}
      {!session.roundOver && clues.length > 0 && <ClueChips clues={clues} />}

      {session.roundOver && (
        <AnswerList
          puzzle={puzzle}
          highlight={session.solvedWith ? { [session.solvedWith]: 'You' } : {}}
        />
      )}
    </div>
  )
}

export function ClueChips({ clues }: { clues: ReturnType<typeof revealedClues> }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-on-green-dim">
        One of them:
      </span>
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
  )
}
