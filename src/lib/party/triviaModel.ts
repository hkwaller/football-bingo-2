import type { TriviaConfig, TriviaQuestion, TriviaRoomPhase } from '../trivia/types'
import type { KickEvent } from './types'

export type TriviaRoomEvent =
  | { type: 'question_advance'; index: number }
  | { type: 'race_lock'; connectionId: number; questionIndex: number }
  | { type: 'session_end' }
  | KickEvent

export type TriviaGameStorage = {
  phase: TriviaRoomPhase
  hostConnectionId: number | null
  // TriviaConfig serialized as JSON string
  configJson: string
  sessionId: string
  // TriviaQuestion[] serialized as JSON string
  questionsJson: string
  currentQuestionIndex: number
  questionStartedAt: number
  sessionStartedAt: number
  // Map<connectionId string, JSON TriviaPlayerAnswer[]>
  playerAnswers: Map<string, string>
  // Map<connectionId string, displayName>
  playerNames: Map<string, string>
  // Map<questionIndex string, connectionId string>
  raceWinner: Map<string, string>
  currentTurnConnectionId: number | null
}

export type TriviaGamePresence = {
  displayName: string
  answeredCurrentQuestion: boolean
  score: number
  streak: number
}

export function createInitialTriviaStorage(): TriviaGameStorage {
  return {
    phase: 'lobby',
    hostConnectionId: null,
    configJson: JSON.stringify({
      sessionType: 'fixed',
      difficulty: 'medium',
      category: 'all',
      questionCount: 10,
      timeLimitSeconds: 60,
      multiplayerMechanic: 'simultaneous',
    }),
    sessionId: '',
    questionsJson: '[]',
    currentQuestionIndex: 0,
    questionStartedAt: 0,
    sessionStartedAt: 0,
    playerAnswers: new Map(),
    playerNames: new Map(),
    raceWinner: new Map(),
    currentTurnConnectionId: null,
  }
}

export function parseConfigJson(json: string): TriviaConfig {
  try {
    return JSON.parse(json) as TriviaConfig
  } catch {
    return {
      sessionType: 'fixed',
      difficulty: 'medium',
      category: 'all',
      questionCount: 10,
      timeLimitSeconds: 60,
      multiplayerMechanic: 'simultaneous',
    }
  }
}

export function parseQuestionsJson(json: string): TriviaQuestion[] {
  try {
    return JSON.parse(json) as TriviaQuestion[]
  } catch {
    return []
  }
}
