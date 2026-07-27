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
import { randomUUID } from '@/lib/randomUUID'
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

// Next player in the (sorted, wrapping) turn order. If the current holder has
// dropped out (`ids` no longer contains them) we restart from the first player.
function nextTurnConnectionId(current: number | null, ids: number[]): number | null {
  if (ids.length === 0) return null
  if (current == null) return ids[0]
  const i = ids.indexOf(current)
  if (i === -1) return ids[0]
  return ids[(i + 1) % ids.length]
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
  const currentTurnConnectionId = useTriviaStorage((s) => s.currentTurnConnectionId)

  const [localAnswer, setLocalAnswer] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const reviewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Synchronous guard: `showReview` state updates async, so two effect runs in
  // the same tick could both pass a `!showReview` check and schedule twice.
  const advanceScheduledRef = useRef(false)

  // Schedule a single host-side advance after the review delay. Idempotent
  // within a question — the reset effect clears the guard on question change.
  const scheduleAdvance = useCallback((run: () => void) => {
    if (advanceScheduledRef.current) return
    advanceScheduledRef.current = true
    setShowReview(true)
    reviewTimer.current = setTimeout(run, REVIEW_DELAY_MS)
  }, [])

  const isHost = self?.connectionId === hostConnectionId
  const config = useMemo(() => parseConfigJson(configJson ?? '{}'), [configJson])
  const questions = useMemo(() => parseQuestionsJson(questionsJson ?? '[]'), [questionsJson])
  const currentQuestion = questions[currentQuestionIndex ?? 0] ?? null

  // ── Turn order (turn-based mechanic) ──────────────────────────────────────
  const isTurnBased = config.multiplayerMechanic === 'turn-based'
  // Sorted so every client derives the same rotation independent of join order.
  const participantIds = useMemo(() => {
    const ids = [self?.connectionId, ...others.map((o) => o.connectionId)].filter(
      (x): x is number => x != null,
    )
    return ids.sort((a, b) => a - b)
  }, [self?.connectionId, others])
  // Non-turn-based: everyone may always answer. Turn-based: only the active player.
  const isMyTurn =
    !isTurnBased ||
    (currentTurnConnectionId != null && self?.connectionId === currentTurnConnectionId)

  // ── Mutations ─────────────────────────────────────────────────────────────

  // Host claim takes the connection id explicitly (rather than closing over
  // `self`) and uses a null check so connection id 0 can't be mistaken for
  // "unclaimed". The effect below gates on self being ready and re-runs when it
  // becomes available, so the first player in the room reliably wins host.
  const claimHost = useTriviaM(
    ({ storage }, { id, displayName }: { id: number; displayName: string }) => {
      if (storage.get('hostConnectionId') == null) {
        storage.set('hostConnectionId', id)
      }
      storage.get('playerNames').set(String(id), displayName)
    },
    [],
  )

  const setPlayerName = useTriviaM(
    ({ storage }, { id, displayName }: { id: number; displayName: string }) => {
      storage.get('playerNames').set(String(id), displayName)
    },
    [],
  )

  const startGame = useTriviaM(({ storage }) => {
    const savedConfig = loadTriviaConfig()
    const newSessionId = randomUUID()
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
    // Turn-based starts with the host (the first player in the room); the host
    // rotates the turn from here. Harmless for other mechanics, which ignore it.
    storage.set('currentTurnConnectionId', storage.get('hostConnectionId'))

    const pa = storage.get('playerAnswers')
    const rw = storage.get('raceWinner')
    for (const k of [...pa.keys()]) pa.delete(k)
    for (const k of [...rw.keys()]) rw.delete(k)
  }, [])

  const submitAnswer = useTriviaM(
    (
      { storage },
      {
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
      },
    ) => {
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
      const prev: TriviaPlayerAnswer[] = existing
        ? (JSON.parse(existing) as TriviaPlayerAnswer[])
        : []
      storage.get('playerAnswers').set(connId, JSON.stringify([...prev, answer]))

      const mechanic = parseConfigJson(storage.get('configJson') ?? '{}').multiplayerMechanic
      if (mechanic === 'race' && correct) {
        const key = String(questionIndex)
        if (!storage.get('raceWinner').get(key)) {
          storage.get('raceWinner').set(key, connId)
        }
      }
    },
    [self?.connectionId],
  )

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

  // Turn-based advance: hand the turn to `nextTurnId` AND move to the next
  // question in one mutation, so a fresh question is drawn for each turn.
  const advanceTurnAndQuestion = useTriviaM(({ storage }, nextTurnId: number | null) => {
    storage.set('currentTurnConnectionId', nextTurnId)
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
  // Gate on phase being non-null - phase comes from useStorage, so it will be
  // null until Liveblocks storage has fully loaded. Calling a mutation before
  // storage loads throws "This mutation cannot be used until storage has been loaded".

  useEffect(() => {
    if (phase !== 'lobby' || self?.connectionId == null) return
    let displayName =
      typeof window !== 'undefined' ? window.localStorage.getItem('fb_display_name') : null
    if (!displayName) {
      displayName = `Player ${Math.floor(Math.random() * 1000)}`
      // Persist the fallback so a reconnect (new connection id) keeps the same name.
      if (typeof window !== 'undefined') window.localStorage.setItem('fb_display_name', displayName)
    }
    claimHost({ id: self.connectionId, displayName })
    updatePresence({ displayName, answeredCurrentQuestion: false, score: 0, streak: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, self?.connectionId])

  // Reset local answer when question changes
  useEffect(() => {
    setLocalAnswer(null)
    setShowReview(false)
    advanceScheduledRef.current = false
    updatePresence({ answeredCurrentQuestion: false })
    if (reviewTimer.current) clearTimeout(reviewTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex])

  useEffect(() => {
    return () => {
      if (reviewTimer.current) clearTimeout(reviewTimer.current)
    }
  }, [])

  // ── Timer expiry (host controls) ──────────────────────────────────────────

  const handleTimerExpire = useCallback(() => {
    if (!isHost) return
    if (config.multiplayerMechanic === 'simultaneous' || config.multiplayerMechanic === 'race') {
      scheduleAdvance(() => advanceQuestion())
    } else if (config.multiplayerMechanic === 'turn-based') {
      // The active player ran out of time → forfeit this turn and rotate on.
      scheduleAdvance(() =>
        advanceTurnAndQuestion(nextTurnConnectionId(currentTurnConnectionId, participantIds)),
      )
    }
  }, [
    isHost,
    config.multiplayerMechanic,
    scheduleAdvance,
    advanceQuestion,
    advanceTurnAndQuestion,
    currentTurnConnectionId,
    participantIds,
  ])

  // All players answered → host auto-advances (simultaneous)
  const allPlayerPresences = [
    { connectionId: self?.connectionId ?? -1, presence },
    ...others.map((o) => ({ connectionId: o.connectionId, presence: o.presence })),
  ]

  useEffect(() => {
    if (!isHost || config.multiplayerMechanic !== 'simultaneous' || phase !== 'playing') return
    const total = allPlayerPresences.length
    const answered = allPlayerPresences.filter((p) => p.presence?.answeredCurrentQuestion).length
    if (total > 0 && answered >= total) {
      scheduleAdvance(() => advanceQuestion())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [others, presence.answeredCurrentQuestion])

  // Turn-based: the host advances once the active player has answered (after a
  // review delay), or immediately rotates past a player who dropped mid-turn.
  useEffect(() => {
    if (!isHost || !isTurnBased || phase !== 'playing') return
    if (currentTurnConnectionId == null) return
    // Active player gone (disconnected/reconnected mid-turn, so their old
    // connection id is no longer present) → rotate on now, no review delay.
    if (!participantIds.includes(currentTurnConnectionId)) {
      advanceTurnAndQuestion(nextTurnConnectionId(currentTurnConnectionId, participantIds))
      return
    }
    const activePresence = allPlayerPresences.find(
      (p) => p.connectionId === currentTurnConnectionId,
    )?.presence
    if (activePresence?.answeredCurrentQuestion) {
      scheduleAdvance(() =>
        advanceTurnAndQuestion(nextTurnConnectionId(currentTurnConnectionId, participantIds)),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [others, presence.answeredCurrentQuestion, currentTurnConnectionId, isTurnBased, isHost, phase])

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

  // ── Rename handler (lobby) ────────────────────────────────────────────────

  const handleRename = useCallback(
    (name: string) => {
      const trimmed = name.trim() || 'Player'
      if (self?.connectionId != null) setPlayerName({ id: self.connectionId, displayName: trimmed })
      updatePresence({ displayName: trimmed })
      if (typeof window !== 'undefined') window.localStorage.setItem('fb_display_name', trimmed)
    },
    [self?.connectionId, setPlayerName, updatePresence],
  )

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
    if (config.multiplayerMechanic === 'race' && correct && isHost) {
      scheduleAdvance(() => advanceQuestion())
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
        <div className="panel max-w-lg border-2 border-red/40 p-6 text-sm font-semibold text-red">
          {roomError}
        </div>
      </div>
    )
  }

  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted animate-pulse-soft">
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
        myName={presence.displayName ?? ''}
        onRename={handleRename}
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
    const myAnswers: TriviaPlayerAnswer[] = myAnswersJson
      ? (JSON.parse(myAnswersJson) as TriviaPlayerAnswer[])
      : []

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
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted animate-pulse-soft">
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

  const activeTurnName =
    currentTurnConnectionId != null
      ? (allPlayerPresences.find((p) => p.connectionId === currentTurnConnectionId)?.presence
          ?.displayName ??
        playerNames?.get(String(currentTurnConnectionId)) ??
        'a player')
      : 'a player'

  // In turn-based, only the active player has a local answer. Spectators derive
  // the reveal from shared state: the active player's `answeredCurrentQuestion`
  // presence gates it, and their stored answer supplies correct/incorrect.
  const activeAnswered =
    isTurnBased &&
    currentTurnConnectionId != null &&
    !!allPlayerPresences.find((p) => p.connectionId === currentTurnConnectionId)?.presence
      ?.answeredCurrentQuestion
  const activeLastAnswer = ((): TriviaPlayerAnswer | null => {
    if (!activeAnswered || currentTurnConnectionId == null) return null
    const json = playerAnswers?.get(String(currentTurnConnectionId))
    if (!json) return null
    const arr = JSON.parse(json) as TriviaPlayerAnswer[]
    return arr[arr.length - 1] ?? null
  })()
  const revealTurn = isTurnBased && !isMyTurn && activeAnswered

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col px-6 py-8 md:px-9">
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

      <div className="flex justify-end mb-4">
        {isTurnBased ? (
          <span
            className={`font-mono text-xs font-bold tabular-nums ${
              isMyTurn ? 'text-green-go' : 'text-muted'
            }`}
          >
            {isMyTurn ? '⚡ Your turn' : `${activeTurnName}'s turn`}
          </span>
        ) : (
          <span className="font-mono text-xs font-bold text-muted tabular-nums">
            {answeredCount}/{allPlayerPresences.length} answered
          </span>
        )}
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
            disabled={!!localAnswer || raceLocked || showReview || !isMyTurn}
            lastResult={
              localAnswer || showReview || revealTurn
                ? {
                    correct: localAnswer
                      ? checkCorrect(currentQuestion, localAnswer)
                      : (activeLastAnswer?.correct ?? false),
                    correctAnswer: getCorrectAnswerForQuestion(currentQuestion),
                  }
                : null
            }
          />
        </motion.div>
      </AnimatePresence>

      {raceLocked && (
        <motion.p
          className="mt-4 text-center text-sm font-medium text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Another player answered first…
        </motion.p>
      )}

      {isTurnBased && !isMyTurn && !revealTurn && (
        <motion.p
          className="mt-4 text-center text-sm font-medium text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Waiting for {activeTurnName} to answer…
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
