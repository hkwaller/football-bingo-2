import type { CareerStats } from '@/types/player'

// ── Config ────────────────────────────────────────────────────────────────────

export type TriviaDifficulty = 'easy' | 'medium' | 'hard'
export type TriviaSessionType = 'survival' | 'fixed' | 'timed' | 'category'
export type TriviaCategory = 'all' | 'clubs' | 'stats' | 'achievements' | 'nationalities'
export type TriviaMultiplayerMechanic = 'race' | 'simultaneous' | 'turn-based'

export interface TriviaConfig {
  sessionType: TriviaSessionType
  difficulty: TriviaDifficulty
  category: TriviaCategory
  questionCount: number          // 5 | 10 | 20 — for 'fixed' and 'category'
  timeLimitSeconds: number       // 60 | 120 | 180 — for 'timed'
  multiplayerMechanic: TriviaMultiplayerMechanic
}

export const DEFAULT_TRIVIA_CONFIG: TriviaConfig = {
  sessionType: 'fixed',
  difficulty: 'medium',
  category: 'all',
  questionCount: 10,
  timeLimitSeconds: 60,
  multiplayerMechanic: 'simultaneous',
}

// ── Questions ─────────────────────────────────────────────────────────────────

export type QuestionType = 'multiple-choice' | 'stat-comparison' | 'open-text' | 'true-false'

export type StatKey = keyof Pick<
  CareerStats,
  'goals' | 'appearances' | 'assists' | 'championsLeagueGoals' | 'championsLeagueGames'
>

export const STAT_KEY_LABELS: Record<StatKey, string> = {
  goals: 'career goals',
  appearances: 'career appearances',
  assists: 'career assists',
  championsLeagueGoals: 'Champions League goals',
  championsLeagueGames: 'Champions League appearances',
}

interface BaseQuestion {
  id: string            // `trivia|${sessionId}|${index}`
  type: QuestionType
  playerIds: string[]   // for image preloading
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice'
  prompt: string
  playerId: string
  playerName: string
  playerImageUrl: string
  options: string[]
  correctAnswer: string
}

export interface StatComparisonQuestion extends BaseQuestion {
  type: 'stat-comparison'
  prompt: string
  playerA: { playerId: string; name: string; imageUrl: string }
  playerB: { playerId: string; name: string; imageUrl: string }
  statKey: StatKey
  correctPlayerId: string
}

export type OpenTextClue =
  | { kind: 'era'; value: string }
  | { kind: 'height'; value: number }
  | { kind: 'position'; value: string }
  | { kind: 'nationality'; value: string }
  | { kind: 'club'; label: string; value: string }
  | { kind: 'stat'; label: string; value: string }

export interface OpenTextQuestion extends BaseQuestion {
  type: 'open-text'
  clues: OpenTextClue[]
  correctPlayerId: string
  correctPlayerName: string
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false'
  statement: string
  correct: boolean
  playerId: string
  playerName: string
  playerImageUrl: string
  detail?: string  // shown after answering, e.g. heights for comparison questions
}

export type TriviaQuestion =
  | MultipleChoiceQuestion
  | StatComparisonQuestion
  | OpenTextQuestion
  | TrueFalseQuestion

// ── Answers & scoring ─────────────────────────────────────────────────────────

export interface TriviaAnswer {
  questionId: string
  answeredAt: number     // Date.now()
  questionStartedAt: number
  correct: boolean
  pointsEarned: number
  answerValue: string
  correctAnswer: string
}

export interface TriviaScoreState {
  score: number
  streak: number
  bestStreak: number
}

// ── Session state (solo) ──────────────────────────────────────────────────────

export type TriviaPhase = 'playing' | 'finished'

export interface TriviaSessionState {
  sessionId: string
  config: TriviaConfig
  phase: TriviaPhase
  questions: TriviaQuestion[]
  currentIndex: number
  answers: TriviaAnswer[]
  scoreState: TriviaScoreState
  sessionStartedAt: number
  questionStartedAt: number
}

// ── Multiplayer ───────────────────────────────────────────────────────────────

export type TriviaRoomPhase = 'lobby' | 'playing' | 'review' | 'finished'

export interface TriviaPlayerAnswer {
  answeredAt: number
  questionStartedAt: number
  correct: boolean
  pointsEarned: number
  answerValue: string
}
