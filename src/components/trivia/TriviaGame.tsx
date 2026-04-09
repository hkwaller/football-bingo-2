'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { generateQuestions } from '@/lib/trivia/questionGenerators'
import { advanceSession, isSessionOver } from '@/lib/trivia/sessionEngine'
import {
  loadTriviaConfig,
  loadTriviaSession,
  saveTriviaSession,
  clearTriviaSession,
} from '@/lib/trivia/triviaStorage'
import type { TriviaQuestion, TriviaSessionState } from '@/lib/trivia/types'
import { TriviaHUD } from './TriviaHUD'
import { TriviaQuestion as TriviaQuestionComp } from './TriviaQuestion'
import { TriviaEndScreen } from './TriviaEndScreen'

const QUESTION_TIME_MS = 15_000
const TIMED_BATCH_SIZE = 20
const ADVANCE_DELAY_MS = 1800  // time to show result before advancing

function buildInitialSession(): TriviaSessionState {
  const config = loadTriviaConfig()
  const sessionId = crypto.randomUUID()
  const count =
    config.sessionType === 'fixed' || config.sessionType === 'category'
      ? config.questionCount
      : config.sessionType === 'timed'
      ? TIMED_BATCH_SIZE
      : 30 // survival: pre-generate a batch

  const questions = generateQuestions(config, sessionId, count)
  const now = Date.now()

  return {
    sessionId,
    config,
    phase: 'playing',
    questions,
    currentIndex: 0,
    answers: [],
    scoreState: { score: 0, streak: 0, bestStreak: 0 },
    sessionStartedAt: now,
    questionStartedAt: now,
  }
}

function getCorrectAnswerForQuestion(q: TriviaQuestion): string {
  if (q.type === 'multiple-choice') return q.correctAnswer
  if (q.type === 'stat-comparison') return q.correctPlayerId
  if (q.type === 'open-text') return q.correctPlayerName
  if (q.type === 'true-false') return String(q.correct)
  return ''
}

function getStatValues(q: TriviaQuestion): Record<string, number> | undefined {
  if (q.type !== 'stat-comparison') return undefined
  // We'll look these up from the question; can't do it without player data here
  // so we return undefined and let the component handle it gracefully
  return undefined
}

export function TriviaGame() {
  const [session, setSession] = useState<TriviaSessionState | null>(null)
  const [lastResult, setLastResult] = useState<{ correct: boolean; correctAnswer: string } | null>(null)
  const [answerLocked, setAnswerLocked] = useState(false)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize on mount
  useEffect(() => {
    const saved = loadTriviaSession()
    if (saved && saved.phase === 'playing') {
      setSession({ ...saved, questionStartedAt: Date.now() })
    } else {
      setSession(buildInitialSession())
    }
  }, [])

  // Persist after every state change
  useEffect(() => {
    if (session && session.phase === 'playing') {
      saveTriviaSession(session)
    }
    if (session?.phase === 'finished') {
      clearTriviaSession()
    }
  }, [session])

  // Timed mode: watch for session time expiry
  useEffect(() => {
    if (!session || session.config.sessionType !== 'timed' || session.phase !== 'playing') return

    const check = setInterval(() => {
      const elapsed = Date.now() - session.sessionStartedAt
      if (elapsed >= session.config.timeLimitSeconds * 1000) {
        setSession((s) => s ? { ...s, phase: 'finished' } : s)
      }
    }, 500)

    return () => clearInterval(check)
  }, [session?.config.sessionType, session?.config.timeLimitSeconds, session?.sessionStartedAt, session?.phase])

  // Survival mode: generate more questions if running low
  useEffect(() => {
    if (!session) return
    if (session.config.sessionType !== 'survival' && session.config.sessionType !== 'timed') return
    if (session.phase !== 'playing') return
    const remaining = session.questions.length - session.currentIndex
    if (remaining > 5) return

    const moreQuestions = generateQuestions(
      session.config,
      session.sessionId,
      TIMED_BATCH_SIZE,
      session.questions.length,
    )
    setSession((s) => s ? { ...s, questions: [...s.questions, ...moreQuestions] } : s)
  }, [session?.currentIndex, session?.questions.length])

  const handleAnswer = useCallback(
    (value: string) => {
      if (!session || answerLocked || session.phase !== 'playing') return

      const currentQuestion = session.questions[session.currentIndex]
      if (!currentQuestion) return

      const correctAnswer = getCorrectAnswerForQuestion(currentQuestion)
      const correct =
        currentQuestion.type === 'true-false'
          ? value === String(currentQuestion.correct)
          : currentQuestion.type === 'stat-comparison'
          ? value === currentQuestion.correctPlayerId
          : currentQuestion.type === 'open-text'
          ? value.toLowerCase().trim() === currentQuestion.correctPlayerName.toLowerCase().trim()
          : value === currentQuestion.correctAnswer

      setLastResult({ correct, correctAnswer })
      setAnswerLocked(true)

      const now = Date.now()
      const newSession = advanceSession(session, value, correctAnswer, correct, now)

      // Show result briefly, then advance
      advanceTimer.current = setTimeout(() => {
        setSession(newSession)
        setLastResult(null)
        setAnswerLocked(false)
      }, ADVANCE_DELAY_MS)
    },
    [session, answerLocked],
  )

  const handleTimerExpire = useCallback(() => {
    if (!session || answerLocked || session.phase !== 'playing') return
    handleAnswer('') // empty string = no answer = wrong
  }, [session, answerLocked, handleAnswer])

  function handlePlayAgain() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    clearTriviaSession()
    setLastResult(null)
    setAnswerLocked(false)
    setSession(buildInitialSession())
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-chalk/50 font-mono">
        Loading…
      </div>
    )
  }

  if (session.phase === 'finished') {
    return (
      <TriviaEndScreen
        questions={session.questions.slice(0, session.answers.length)}
        answers={session.answers}
        scoreState={session.scoreState}
        onPlayAgain={handlePlayAgain}
      />
    )
  }

  const currentQuestion = session.questions[session.currentIndex]
  if (!currentQuestion) {
    // Questions exhausted (shouldn't happen but guard it)
    return (
      <TriviaEndScreen
        questions={session.questions}
        answers={session.answers}
        scoreState={session.scoreState}
        onPlayAgain={handlePlayAgain}
      />
    )
  }

  const totalQuestions =
    session.config.sessionType === 'fixed' || session.config.sessionType === 'category'
      ? session.config.questionCount
      : null

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col">
      <TriviaHUD
        currentIndex={session.currentIndex}
        totalQuestions={totalQuestions}
        sessionType={session.config.sessionType}
        score={session.scoreState.score}
        streak={session.scoreState.streak}
        questionStartedAt={session.questionStartedAt}
        onTimerExpire={handleTimerExpire}
        paused={answerLocked}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="flex-1"
        >
          <TriviaQuestionComp
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={answerLocked}
            lastResult={lastResult}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
