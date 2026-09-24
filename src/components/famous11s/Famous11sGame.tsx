'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  advanceLineup,
  buildSession,
  isLineupOver,
  submitGuess,
} from '@/lib/famous11s/sessionEngine'
import { lineupTarget } from '@/data/famous11s'
import {
  clearFamous11sSession,
  loadFamous11sConfig,
  loadFamous11sSession,
  saveFamous11sSession,
} from '@/lib/famous11s/storage'
import type { Famous11sSessionState, GuessOutcome } from '@/lib/famous11s/types'
import { Famous11sHUD, useSoloTimer } from './Famous11sHUD'
import { PitchBoard } from './PitchBoard'
import { Famous11sAutocomplete } from './Famous11sAutocomplete'
import { Famous11sEndScreen } from './Famous11sEndScreen'

type Feedback = { outcome: GuessOutcome; id: number }

export function Famous11sGame() {
  const [session, setSession] = useState<Famous11sSessionState | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [justFoundSlotId, setJustFoundSlotId] = useState<string | null>(null)
  const [focusKey, setFocusKey] = useState(0)
  const [timerResetKey, setTimerResetKey] = useState(0)
  const finishedRef = useRef(false)
  const feedbackSeq = useRef(0)

  useEffect(() => {
    const saved = loadFamous11sSession()
    setSession(saved && saved.phase === 'playing' ? saved : buildSession(loadFamous11sConfig()))
  }, [])

  useEffect(() => {
    if (!session) return
    if (session.phase === 'playing') saveFamous11sSession(session)
    else clearFamous11sSession()
  }, [session])

  const currentLineup = session?.lineups[session.currentIndex]
  const lineupOver = session ? isLineupOver(session) : false
  const totalSlots = currentLineup
    ? lineupTarget(currentLineup, session?.config.includeManager ?? true)
    : 0

  // Per-turn timer (solo mode)
  const handleTimeout = useCallback(() => {
    if (!session || lineupOver) return
    // Timeout counts as a wrong guess (life deduction)
    const { state } = submitGuess(session, '\x00__timeout__\x00')
    setSession({ ...state, livesLeft: Math.max(0, state.livesLeft - 1) })
    setFocusKey((k) => k + 1)
  }, [session, lineupOver])

  const secondsLeft = useSoloTimer(
    session?.config.turnSeconds ?? 0,
    !lineupOver && session?.phase === 'playing',
    timerResetKey,
    handleTimeout,
  )

  const handleGuess = useCallback(
    (name: string) => {
      if (!session || lineupOver) return
      const { state, outcome } = submitGuess(session, name)
      setSession(state)
      feedbackSeq.current += 1
      setFeedback({ outcome, id: feedbackSeq.current })
      if (outcome.kind === 'correct') {
        setJustFoundSlotId(outcome.slotId)
        window.setTimeout(() => setJustFoundSlotId(null), 900)
      }
      setFocusKey((k) => k + 1)
      setTimerResetKey((k) => k + 1)
    },
    [session, lineupOver],
  )

  const handleNext = useCallback(() => {
    if (!session) return
    setFeedback(null)
    setJustFoundSlotId(null)
    setSession(advanceLineup(session))
    setFocusKey((k) => k + 1)
    setTimerResetKey((k) => k + 1)
  }, [session])

  const handlePlayAgain = useCallback(() => {
    finishedRef.current = false
    clearFamous11sSession()
    setFeedback(null)
    setJustFoundSlotId(null)
    setSession(buildSession(loadFamous11sConfig()))
  }, [])

  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-on-green-dim animate-pulse-soft">
        Loading…
      </div>
    )
  }

  if (session.phase === 'finished') {
    return <Famous11sEndScreen session={session} onPlayAgain={handlePlayAgain} />
  }

  if (!currentLineup) {
    return <Famous11sEndScreen session={session} onPlayAgain={handlePlayAgain} />
  }

  const cleared = session.foundSlotIds.length >= totalSlots

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col px-4 py-6 md:px-8">
      <Famous11sHUD
        lineup={currentLineup}
        lineupNumber={session.currentIndex + 1}
        totalLineups={session.lineups.length}
        foundCount={session.foundSlotIds.length}
        totalSlots={totalSlots}
        livesLeft={session.livesLeft === Infinity ? session.config.lives : session.livesLeft}
        maxLives={session.config.lives}
        score={session.score}
        secondsLeft={secondsLeft}
      />

      {/* Input / round-over controls */}
      <div className="mb-4 min-h-[88px]">
        {lineupOver ? (
          <div className="flex flex-col items-center gap-3 rounded-[12px] bg-black/20 px-4 py-4 text-center">
            <p className="font-display text-2xl font-black uppercase leading-none text-on-green">
              {cleared ? '🎉 Full XI!' : '💔 Out of lives'}
            </p>
            <p className="text-sm font-semibold text-on-green-soft">
              You found {session.foundSlotIds.length} of {totalSlots}.
            </p>
            <button onClick={handleNext} className="btn btn-primary btn-lg">
              {session.currentIndex + 1 >= session.lineups.length ? 'See results' : 'Next lineup'}
            </button>
          </div>
        ) : (
          <>
            <Famous11sAutocomplete onGuess={handleGuess} focusKey={focusKey} />
            <div className="mt-2 h-6">
              <AnimatePresence mode="wait">
                {feedback && (
                  <motion.p
                    key={feedback.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`text-center text-sm font-bold ${
                      feedback.outcome.kind === 'correct'
                        ? 'text-yellow'
                        : feedback.outcome.kind === 'already-found'
                          ? 'text-on-green-soft'
                          : 'text-pink'
                    }`}
                  >
                    {feedback.outcome.kind === 'correct'
                      ? `✓ ${feedback.outcome.name}`
                      : feedback.outcome.kind === 'already-found'
                        ? `Already found ${feedback.outcome.name}`
                        : '✗ Not in this lineup - lost a life'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <PitchBoard
        lineup={currentLineup}
        foundSlotIds={session.foundSlotIds}
        revealMissed={lineupOver}
        justFoundSlotId={justFoundSlotId}
        includeManager={session.config.includeManager}
      />
    </div>
  )
}
