'use client'

import { type BaseUserMeta, createClient, LiveMap } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'
import type { TriviaConfig, TriviaQuestion, TriviaRoomPhase } from './types'

export type TriviaRoomEvent =
  | { type: 'question_advance'; index: number }
  | { type: 'race_lock'; connectionId: number; questionIndex: number }
  | { type: 'session_end' }

// Config is stored as a JSON string to satisfy Liveblocks LsonObject constraint
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
  // LiveMap<connectionId string, JSON TriviaPlayerAnswer[]>
  playerAnswers: LiveMap<string, string>
  // LiveMap<connectionId string, displayName>
  playerNames: LiveMap<string, string>
  // LiveMap<questionIndex string, connectionId string>
  raceWinner: LiveMap<string, string>
  currentTurnConnectionId: number | null
}

export type TriviaGamePresence = {
  displayName: string
  answeredCurrentQuestion: boolean
  score: number
  streak: number
}

const triviaClient = createClient({
  authEndpoint: async (room) => {
    const anonId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('fb_anon_id') ?? undefined
        : undefined
    const res = await fetch('/api/liveblocks-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, anonId }),
    })
    return await res.json()
  },
})

export const {
  RoomProvider: TriviaRoomProvider,
  useStorage: useTriviaStorage,
  useMutation: useTriviaM,
  useOthers: useTriviaOthers,
  useMyPresence: useTriviaMyPresence,
  useStatus: useTriviaStatus,
  useErrorListener: useTriviaErrorListener,
  useSelf: useTriviaeSelf,
  useBroadcastEvent: useTriviaBroadcast,
  useEventListener: useTriviaEventListener,
} = createRoomContext<TriviaGamePresence, TriviaGameStorage, BaseUserMeta, TriviaRoomEvent>(
  triviaClient,
)

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
    playerAnswers: new LiveMap(),
    playerNames: new LiveMap(),
    raceWinner: new LiveMap(),
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
