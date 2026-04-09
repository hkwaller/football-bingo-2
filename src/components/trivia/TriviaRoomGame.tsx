'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  TriviaRoomProvider,
  useTriviaStorage,
  useTriviaM,
  useTriviaOthers,
  useTriviaMyPresence,
  useTriviaStatus,
  useTriviaErrorListener,
  useTriviaeSelf,
  createInitialTriviaStorage,
  parseQuestionsJson,
  parseConfigJson,
} from '@/lib/trivia/liveblocksTrivia'
import { loadTriviaConfig } from '@/lib/trivia/triviaStorage'
import { generateQuestions } from '@/lib/trivia/questionGenerators'
import { computePoints } from '@/lib/trivia/sessionEngine'
import type { TriviaQuestion, TriviaPlayerAnswer } from '@/lib/trivia/types'
import { TriviaLobby } from './TriviaLobby'
import { TriviaHUD } from './TriviaHUD'
import { TriviaQuestion as TriviaQuestionComp } from './TriviaQuestion'
import { TriviaEndScreen } from './TriviaEndScreen'

const REVIEW_DELAY_MS = 3000

// ── Correct-answer checker (pure) ─────────────────────────────────────────────

function checkCorrect(question: TriviaQuestion, value: string): boolean {
  if (question.type === 'true-false') return value === String(question.correct)
  if (question.type === 'stat-comparison') return value === question.correctPlayerId
  if (question.type === 'open-text')
    return value.toLowerCase().trim() === question.correctPlayerName.toLowerCase().trim()
  if (question.type === 'multiple-choice') return value === question.correctAnswer
  return false
}

function getCorrectAnswerForQuestion(question: TriviaQuestion | undefined): string {
  if (!question) return ''
  if (question.type === 'multiple-choice') return question.correctAnswer
  if (question.type === 'stat-comparison') return question.correctPlayerId
  if (question.type === 'open-text') return question.correctPlayerName
  if (question.type === 'true-false') return String(question.correct)
  return ''
}

// ── Inner room component ──────────────────────────────────────────────────────

function TriviaRoomInner({ roomId }: { roomId: string }) {
  const status = useTriviaStatus()
  const self = useTriviaeSelf()
  const others = useTriviaOthers()
  const [presence, updatePresence] = useTriviaMyPresence()
  const [roomError, setRoomError] = useState<string | null>(null)

  useTriviaErrorListener((err) => {
    const msg = (err as { message?: string })?.message ?? 'Connection error'
    setRoomError(msg)
  })

  const phase = useTriviaStorage((s) => s.phase)
  const hostConnectionId = useTriviaStorage((s) => s.hostConnectionId)
  const configJson = useTriviaStorage((s) => s.configJson)
  const questionsJson = useTriviaStorage((s) => s.questionsJson)
  const currentQuestionIndex = useTriviaStorage((s) => s.currentQuestionIndex)
  const questionStartedAt = useTriviaStorage((s) => s.questionStartedAt)
  const sessionStartedAt = useTriviaStorage((s) => s.sessionStartedAt)
  const playerAnswers = useTriviaStorage((s) => s.playerAnswers)
  const playerNames = useTriviaStorage((s) => s.playerNames)
  const raceWinner = useTriviaStorage((s) => s.raceWinner)

  const [localAnswer, setLocalAnswer] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const reviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isHost = self?.connectionId === hostConnectionId
  const config = useMemo(() => parseConfigJson(configJson ?? '{}'), [configJson])
  const questions = useMemo(() => parseQuestionsJson(questionsJson ?? '[]'), [questionsJson])
  const currentQuestion = questions[currentQuestionIndex ?? 0] ?? null

  // ── Mutations ─────────────────────────────────────────────────────────────

  const claimHost = useTriviaM(({ storage }, displayName: string) => {
    if (!storage.get('hostConnectionId') && self?.connectionId) {
      storage.set('hostConnectionId', self.connectionId)
    }
    const names = storage.get('playerNames')
    if (self?.connectionId) {
      names.set(String(self.connectionId), displayName)
    }
  }, [self?.connectionId])

  const startGame = useTriviaM(({ storage }) => {
    const savedConfig = loadTriviaConfig()
    const newSessionId = crypto.randomUUID()
    const count =
      savedConfig.sessionType === 'fixed' || savedConfig.sessionType === 'category'
        ? savedConfig.questionCount
        : 20
    const qs = generateQuestions(savedConfig, newSessionId, count)
    const now = Date.now()
    storage.set('configJson', JSON.stringify(savedConfig))
    storage.set('sessionId', newSessionId)
    storage.set('questionsJson', JSON.stringify(qs))
    storage.set('currentQuestionIndex', 0)
    storage.set('questionStartedAt', now)
    storage.set('sessionStartedAt', now)
    storage.set('phase', 'playing')

    const pa = storage.get('playerAnswers')
    const rw = storage.get('raceWinner')
    for (const k of [...pa.keys()]) pa.delete(k)
    for (const k of [...rw.keys()]) rw.delete(k)
  }, [])

  const submitAnswer = useTriviaM(({ storage }, {
    answerValue,
    correct,
    questionIndex,
    questionStartedAt: qsAt,
    myStreak,
  }: {
    answerValue: string
    correct: boolean
    questionIndex: number
    questionStartedAt: number
    myStreak: number
  }) => {
    if (!self?.connectionId) return
    const connId = String(self.connectionId)
    const elapsed = Date.now() - qsAt
    const points = correct ? computePoints(elapsed, myStreak) : 0

    const answer: TriviaPlayerAnswer = {
      answeredAt: Date.now(),
      questionStartedAt: qsAt,
      correct,
      pointsEarned: points,
      answerValue,
    }

    const existing = storage.get('playerAnswers').get(connId)
    const prev: TriviaPlayerAnswer[] = existing ? (JSON.parse(existing) as TriviaPlayerAnswer[]) : []
    storage.get('playerAnswers').set(connId, JSON.stringify([...prev, answer]))

    const mechanic = parseConfigJson(storage.get('configJson') ?? '{}').multiplayerMechanic
    if (mechanic === 'race' && correct) {
      const key = String(questionIndex)
      if (!storage.get('raceWinner').get(key)) {
        storage.get('raceWinner').set(key, connId)
      }
    }
  }, [self?.connectionId])

  const advanceQuestion = useTriviaM(({ storage }) => {
    const idx = (storage.get('currentQuestionIndex') ?? 0) + 1
    const cfg = parseConfigJson(storage.get('configJson') ?? '{}')
    const isOver =
      cfg.sessionType === 'fixed' || cfg.sessionType === 'category'
        ? idx >= cfg.questionCount
        : false
    if (isOver) {
      storage.set('phase', 'finished')
    } else {
      storage.set('currentQuestionIndex', idx)
      storage.set('questionStartedAt', Date.now())
    }
  }, [])

  const finishGame = useTriviaM(({ storage }) => {
    storage.set('phase', 'finished')
  }, [])

  // ── Initialization ────────────────────────────────────────────────────────

  useEffect(() => {
    const displayName =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('fb_display_name') ?? `Player ${Math.floor(Math.random() * 1000)}`
        : 'Player'
    claimHost(displayName)
    updatePresence({ displayName, answeredCurrentQuestion: false, score: 0, streak: 0 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset local answer when question changes
  useEffect(() => {
    setLocalAnswer(null)
    setShowReview(false)
    updatePresence({ answeredCurrentQuestion: false })
    if (reviewTimer.current) clearTimeout(reviewTimer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex])

  useEffect(() => {
    return () => { if (reviewTimer.current) clearTimeout(reviewTimer.current) }
  }, [])

  // ── Timer expiry (host controls) ──────────────────────────────────────────

  const handleTimerExpire = useCallback(() => {
    if (!isHost) return
    if (config.multiplayerMechanic === 'simultaneous' || config.multiplayerMechanic === 'race') {
      if (showReview) return
      setShowReview(true)
      reviewTimer.current = setTimeout(() => {
        advanceQuestion()
      }, REVIEW_DELAY_MS)
    }
  }, [isHost, config.multiplayerMechanic, showReview, advanceQuestion])

  // All players answered → host auto-advances (simultaneous)
  const allPlayerPresences = [
    { connectionId: self?.connectionId ?? -1, presence },
    ...others.map((o) => ({ connectionId: o.connectionId, presence: o.presence })),
  ]

  useEffect(() => {
    if (!isHost || config.multiplayerMechanic !== 'simultaneous' || phase !== 'playing') return
    const total = allPlayerPresences.length
    const answered = allPlayerPresences.filter((p) => p.presence?.answeredCurrentQuestion).length
    if (total > 0 && answered >= total && !showReview) {
      setShowReview(true)
      reviewTimer.current = setTimeout(() => {
        advanceQuestion()
      }, REVIEW_DELAY_MS)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [others, presence.answeredCurrentQuestion])

  // Timed mode: host monitors elapsed time
  useEffect(() => {
    if (!isHost || config.sessionType !== 'timed' || phase !== 'playing') return
    const interval = setInterval(() => {
      const elapsed = Date.now() - (sessionStartedAt ?? 0)
      if (elapsed >= config.timeLimitSeconds * 1000) {
        finishGame()
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, config.sessionType, config.timeLimitSeconds, sessionStartedAt, phase])

  // ── Answer handler ────────────────────────────────────────────────────────

  function handleAnswer(value: string) {
    if (localAnswer || !currentQuestion || !questionStartedAt) return
    setLocalAnswer(value)
    updatePresence({ answeredCurrentQuestion: true })

    const correct = checkCorrect(currentQuestion, value)
    const myStreak = presence.streak ?? 0
    const newStreak = correct ? myStreak + 1 : 0
    const elapsed = Date.now() - questionStartedAt
    const points = correct ? computePoints(elapsed, myStreak) : 0

    updatePresence({
      score: (presence.score ?? 0) + points,
      streak: newStreak,
    })

    submitAnswer({
      answerValue: value,
      correct,
      questionIndex: currentQuestionIndex ?? 0,
      questionStartedAt,
      myStreak,
    })

    // Race mechanic: host advances after first correct answer
    if (config.multiplayerMechanic === 'race' && correct && isHost && !showReview) {
      setShowReview(true)
      reviewTimer.current = setTimeout(() => {
        advanceQuestion()
      }, REVIEW_DELAY_MS)
    }
  }

  // ── Players list ──────────────────────────────────────────────────────────

  const playersList = allPlayerPresences
    .filter((p) => p.presence?.displayName)
    .map((p) => ({
      connectionId: p.connectionId,
      displayName: p.presence!.displayName,
      isHost: p.connectionId === hostConnectionId,
    }))

  // ── Render ─────────────────────────────────────────────────────────────────

  if (roomError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="border-4 border-[var(--fb-accent-magenta)] p-6 text-[var(--fb-accent-magenta)] font-mono text-sm max-w-lg">
          {roomError}
        </div>
      </div>
    )
  }

  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-chalk/50 font-mono">
        Connecting…
      </div>
    )
  }

  if (phase === 'lobby') {
    return (
      <TriviaLobby
        roomId={roomId}
        players={playersList}
        isHost={isHost}
        config={config}
        onStart={startGame}
      />
    )
  }

  if (phase === 'finished') {
    const entries = Array.from((playerAnswers?.entries() ?? []) as Iterable<[string, string]>)
    const leaderboard = entries.map(([connId, answersJson]) => {
      const name = playerNames?.get(connId) ?? `Player ${connId}`
      const answers = JSON.parse(answersJson) as TriviaPlayerAnswer[]
      const score = answers.reduce((acc, a) => acc + a.pointsEarned, 0)
      const correctCount = answers.filter((a) => a.correct).length
      return {
        displayName: name,
        score,
        correctCount,
        totalAnswered: answers.length,
        isMe: connId === String(self?.connectionId),
      }
    })

    const myAnswersJson = playerAnswers?.get(String(self?.connectionId))
    const myAnswers: TriviaPlayerAnswer[] = myAnswersJson ? (JSON.parse(myAnswersJson) as TriviaPlayerAnswer[]) : []

    return (
      <TriviaEndScreen
        questions={questions.slice(0, myAnswers.length)}
        answers={myAnswers.map((a, i) => ({
          questionId: questions[i]?.id ?? '',
          answeredAt: a.answeredAt,
          questionStartedAt: a.questionStartedAt,
          correct: a.correct,
          pointsEarned: a.pointsEarned,
          answerValue: a.answerValue,
          correctAnswer: getCorrectAnswerForQuestion(questions[i]),
        }))}
        scoreState={{ score: presence.score ?? 0, streak: 0, bestStreak: 0 }}
        leaderboard={leaderboard}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-chalk/50 font-mono">
        Loading question…
      </div>
    )
  }

  const raceWinnerForCurrentQ = raceWinner?.get(String(currentQuestionIndex))
  const raceLocked =
    config.multiplayerMechanic === 'race' &&
    !!raceWinnerForCurrentQ &&
    raceWinnerForCurrentQ !== String(self?.connectionId)

  const answeredCount = allPlayerPresences.filter((p) => p.presence?.answeredCurrentQuestion).length

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col">
      <TriviaHUD
        currentIndex={currentQuestionIndex ?? 0}
        totalQuestions={
          config.sessionType === 'fixed' || config.sessionType === 'category'
            ? config.questionCount
            : null
        }
        sessionType={config.sessionType}
        score={presence.score ?? 0}
        streak={presence.streak ?? 0}
        questionStartedAt={questionStartedAt ?? Date.now()}
        onTimerExpire={handleTimerExpire}
        paused={!!localAnswer || showReview}
      />

      <div className="flex justify-end mb-2">
        <span className="font-mono text-xs text-chalk/40">
          {answeredCount}/{allPlayerPresences.length} answered
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
        >
          <TriviaQuestionComp
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={!!localAnswer || raceLocked || showReview}
            lastResult={
              localAnswer || showReview
                ? {
                    correct: checkCorrect(currentQuestion, localAnswer ?? ''),
                    correctAnswer: getCorrectAnswerForQuestion(currentQuestion),
                  }
                : null
            }
          />
        </motion.div>
      </AnimatePresence>

      {raceLocked && (
        <motion.p
          className="text-center font-mono text-sm text-chalk/50 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Another player answered first…
        </motion.p>
      )}
    </div>
  )
}

// ── Public wrapper with RoomProvider ─────────────────────────────────────────

export function TriviaRoomGame({ roomId }: { roomId: string }) {
  return (
    <TriviaRoomProvider
      id={roomId}
      initialPresence={{ displayName: '', answeredCurrentQuestion: false, score: 0, streak: 0 }}
      initialStorage={createInitialTriviaStorage}
    >
      <TriviaRoomInner roomId={roomId} />
    </TriviaRoomProvider>
  )
}
