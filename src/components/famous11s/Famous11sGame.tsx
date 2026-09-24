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
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
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
        setActiveSlotId(null)
        window.setTimeout(() => setJustFoundSlotId(null), 900)
      }
      setFocusKey((k) => k + 1)
      setTimerResetKey((k) => k + 1)
    },
    [session, lineupOver],
  )

  const handleSlotClick = useCallback((slotId: string) => {
    setActiveSlotId((prev) => (prev === slotId ? null : slotId))
    setFocusKey((k) => k + 1) // re-focus the input
  }, [])

  const handleNext = useCallback(() => {
    if (!session) return
    setFeedback(null)
    setJustFoundSlotId(null)
    setActiveSlotId(null)
    setRevealed(false)
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

  const isLastLineup = session.currentIndex + 1 >= session.lineups.length
  const inputArea = lineupOver ? (
    <div className="flex flex-col items-center gap-3 rounded-[12px] bg-black/20 px-4 py-4 text-center">
      <p className="font-display text-2xl font-black uppercase leading-none text-on-green">
        {cleared ? '🎉 Full XI!' : 'Out of lives'}
      </p>
      <p className="text-sm font-semibold text-on-green-soft">
        You found {session.foundSlotIds.length} of {totalSlots}.
      </p>
      <div className="flex w-full flex-col gap-2">
        <button onClick={handleNext} className="btn btn-primary btn-lg w-full">
          {isLastLineup ? 'See results' : 'Next lineup'}
        </button>
        {!cleared && !revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="btn btn-outline-light btn-lg w-full"
          >
            Reveal answers
          </button>
        )}
      </div>
    </div>
  ) : (
    <>
      <Famous11sAutocomplete
        onGuess={handleGuess}
        focusKey={focusKey}
        placeholder={
          activeSlotId
            ? `Name the ${currentLineup.slots.find((s) => s.slotId === activeSlotId)?.positionLabel ?? 'player'}…`
            : 'Name a player…'
        }
      />
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
                  : `✗ ${feedback.outcome.name} didn't start`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  )

  return (
    <>
      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-[680px] flex-col px-4 py-6 pb-[96px] md:px-8 lg:pb-6">
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

        {/* Input - hidden on mobile (replaced by fixed bottom bar) */}
        <div className="mb-4 hidden min-h-[88px] lg:block">{inputArea}</div>

        {/* On mobile, show round-over inline (bottom bar can't hold the Next button) */}
        {lineupOver && <div className="mb-4 lg:hidden">{inputArea}</div>}

        <PitchBoard
          lineup={currentLineup}
          foundSlotIds={session.foundSlotIds}
          revealMissed={cleared || revealed}
          justFoundSlotId={justFoundSlotId}
          includeManager={session.config.includeManager}
          onSlotClick={!lineupOver ? handleSlotClick : undefined}
          activeSlotId={activeSlotId}
        />
      </div>

      {/* ── Mobile fixed bottom input bar ────────────────────────────── */}
      {!lineupOver && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden">
          <div className="pointer-events-auto border-t-[3px] border-ink bg-surface px-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-4px_0_rgba(10,36,23,0.4)]">
            <div className="mt-1.5 h-5">
              <AnimatePresence mode="wait">
                {feedback && (
                  <motion.p
                    key={feedback.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`text-center text-xs font-bold ${
                      feedback.outcome.kind === 'correct'
                        ? 'text-yellow'
                        : feedback.outcome.kind === 'already-found'
                          ? 'text-card-muted'
                          : 'text-pink'
                    }`}
                  >
                    {feedback.outcome.kind === 'correct'
                      ? `✓ ${feedback.outcome.name}`
                      : feedback.outcome.kind === 'already-found'
                        ? `Already found ${feedback.outcome.name}`
                        : `✗ ${feedback.outcome.name} didn't start`}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <Famous11sAutocomplete
              onGuess={handleGuess}
              focusKey={focusKey}
              variant="bar"
              placeholder="Name a player…"
            />
          </div>
        </div>
      )}
    </>
  )
}
