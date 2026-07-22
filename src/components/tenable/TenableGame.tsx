'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  advanceQuestion,
  buildSession,
  isQuestionOver,
  submitGuess,
} from '@/lib/tenable/sessionEngine'
import { tenableTarget } from '@/data/tenable'
import {
  clearTenableSession,
  loadTenableConfig,
  loadTenableSession,
  saveTenableSession,
} from '@/lib/tenable/tenableStorage'
import type { GuessOutcome, TenableSessionState } from '@/lib/tenable/types'
import { summarizeSession } from '@/lib/tenableStats'
import { TenableBoard } from './TenableBoard'
import { TenableHUD } from './TenableHUD'
import { NameAutocomplete } from './NameAutocomplete'
import { TenableEndScreen } from './TenableEndScreen'

type Feedback = { outcome: GuessOutcome; id: number }

export function TenableGame() {
  const [session, setSession] = useState<TenableSessionState | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [justFound, setJustFound] = useState<number | null>(null)
  const [focusKey, setFocusKey] = useState(0)
  const finishedRef = useRef(false)
  const feedbackSeq = useRef(0)

  useEffect(() => {
    const saved = loadTenableSession()
    setSession(saved && saved.phase === 'playing' ? saved : buildSession(loadTenableConfig()))
  }, [])

  useEffect(() => {
    if (!session) return
    if (session.phase === 'playing') saveTenableSession(session)
    else clearTenableSession()
  }, [session])

  // Persist the completed session once.
  useEffect(() => {
    if (!session || session.phase !== 'finished' || finishedRef.current) return
    finishedRef.current = true
    const summary = summarizeSession(session)
    fetch('/api/tenable/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, ...summary }),
    }).catch(() => {})
  }, [session])

  const currentQuestion = session?.questions[session.currentIndex]
  const questionOver = session ? isQuestionOver(session) : false

  const handleGuess = useCallback(
    (name: string) => {
      if (!session || questionOver) return
      const { state, outcome } = submitGuess(session, name)
      setSession(state)
      feedbackSeq.current += 1
      setFeedback({ outcome, id: feedbackSeq.current })
      if (outcome.kind === 'correct') {
        setJustFound(outcome.rank)
        window.setTimeout(() => setJustFound(null), 900)
      }
      setFocusKey((k) => k + 1)
    },
    [session, questionOver],
  )

  const handleNext = useCallback(() => {
    if (!session) return
    setFeedback(null)
    setJustFound(null)
    setSession(advanceQuestion(session))
    setFocusKey((k) => k + 1)
  }, [session])

  const handlePlayAgain = useCallback(() => {
    finishedRef.current = false
    clearTenableSession()
    setFeedback(null)
    setJustFound(null)
    setSession(buildSession(loadTenableConfig()))
  }, [])

  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-on-green-dim animate-pulse-soft">
        Loading…
      </div>
    )
  }

  if (session.phase === 'finished') {
    return <TenableEndScreen session={session} onPlayAgain={handlePlayAgain} />
  }

  if (!currentQuestion) {
    return <TenableEndScreen session={session} onPlayAgain={handlePlayAgain} />
  }

  const foundCount = session.foundRanks.length
  const totalAnswers = tenableTarget(currentQuestion)
  const cleared = foundCount >= totalAnswers

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col px-6 py-8 md:px-9">
      <TenableHUD
        category={currentQuestion.category}
        prompt={currentQuestion.prompt}
        questionNumber={session.currentIndex + 1}
        totalQuestions={session.questions.length}
        foundCount={foundCount}
        totalAnswers={totalAnswers}
        livesLeft={session.livesLeft}
        maxLives={session.config.lives}
        score={session.score}
      />

      {/* Input / round-over controls */}
      <div className="mb-4 min-h-[92px]">
        {questionOver ? (
          <div className="flex flex-col items-center gap-3 rounded-[16px] bg-black/20 px-4 py-4 text-center">
            <p className="font-display text-2xl font-black uppercase leading-none text-white">
              {cleared ? '🎉 All ten!' : '💔 Out of lives'}
            </p>
            <p className="text-sm font-semibold text-on-green-soft">
              You found {foundCount} of {totalAnswers}.
            </p>
            <button onClick={handleNext} className="btn btn-primary btn-lg">
              {session.currentIndex + 1 >= session.questions.length ? 'See results' : 'Next category'}
            </button>
          </div>
        ) : (
          <>
            <NameAutocomplete onGuess={handleGuess} focusKey={focusKey} />
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
                        : '✗ Not on the list — lost a life'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <TenableBoard
        question={currentQuestion}
        foundRanks={session.foundRanks}
        revealMissed={questionOver}
        justFound={justFound}
      />
    </div>
  )
}
