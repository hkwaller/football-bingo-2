import { generateQuestions } from '../trivia/questionGenerators'
import { computePoints } from '../trivia/sessionEngine'
import type { TriviaConfig, TriviaPlayerAnswer } from '../trivia/types'
import { TriviaGameStorage, parseConfigJson } from './triviaModel'
import type { ActionContext } from './types'

export const triviaActions = {
  claimHost: (
    { storage }: ActionContext<TriviaGameStorage>,
    { id, displayName, config }: { id: number; displayName: string; config: TriviaConfig },
  ) => {
    if (storage.get('hostConnectionId') == null) {
      storage.set('hostConnectionId', id)
      storage.set('configJson', JSON.stringify(config))
    }
    if (displayName) storage.get('playerNames').set(String(id), displayName)
  },

  setPlayerName: (
    { storage }: ActionContext<TriviaGameStorage>,
    { id, displayName }: { id: number; displayName: string },
  ) => {
    storage.get('playerNames').set(String(id), displayName)
  },

  startGame: ({ storage, now, seed }: ActionContext<TriviaGameStorage>) => {
    const savedConfig = parseConfigJson(storage.get('configJson') ?? '{}')
    const newSessionId = seed
    const count =
      savedConfig.sessionType === 'fixed' || savedConfig.sessionType === 'category'
        ? savedConfig.questionCount
        : 20
    const qs = generateQuestions(savedConfig, newSessionId, count)
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
  },

  submitAnswer: (
    { storage, now, self }: ActionContext<TriviaGameStorage>,
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
    const elapsed = now - qsAt
    const points = correct ? computePoints(elapsed, myStreak) : 0

    const answer: TriviaPlayerAnswer = {
      answeredAt: now,
      questionStartedAt: qsAt,
      correct,
      pointsEarned: points,
      answerValue,
      questionIndex,
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

  advanceQuestion: ({ storage, now }: ActionContext<TriviaGameStorage>) => {
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
      storage.set('questionStartedAt', now)
    }
  },

  advanceTurnAndQuestion: (
    { storage, now }: ActionContext<TriviaGameStorage>,
    nextTurnId: number | null,
  ) => {
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
      storage.set('questionStartedAt', now)
    }
  },

  finishGame: ({ storage }: ActionContext<TriviaGameStorage>) => {
    storage.set('phase', 'finished')
  },

  dropPlayer: ({ storage }: ActionContext<TriviaGameStorage>, id: string) => {
    storage.get('playerNames').delete(id)
  },
}
