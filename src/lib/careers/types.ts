/** One stint at a club, in calendar years. `to: null` = still there. */
export interface CareerStint {
  clubId: string
  club: string
  from: number
  to: number | null
}

/** A permanent spell at a club, with any loans out taken during it. */
export interface CareerSpell extends CareerStint {
  loans: CareerStint[]
  /** A loan with no tracked parent club (loaned straight out of the academy). */
  loan?: boolean
}

/** A player in the Careers bank (src/data/careers/careers.json). */
export interface CareerPlayer {
  id: string
  name: string
  nationality: string
  position: string
  fame: number
  difficulty: CareersDifficulty
  imageUrl?: string
  career: CareerSpell[]
}

export type CareersDifficulty = 'easy' | 'medium' | 'hard'
export type CareersDifficultyFilter = CareersDifficulty | 'mixed'

export interface CareersConfig {
  difficulty: CareersDifficultyFilter
  /** Players per run. */
  playerCount: number
  /** Guesses per player; each miss reveals the next clue. */
  guesses: number
  /** Multiplayer: seconds per career before it's revealed. 0 = no clock. */
  roundSeconds: number
}

export const DEFAULT_CAREERS_CONFIG: CareersConfig = {
  difficulty: 'mixed',
  playerCount: 5,
  guesses: 3,
  roundSeconds: 60,
}

/** Points for a first-guess answer; each clue revealed costs CLUE_COST. */
export const MAX_POINTS = 100
export const CLUE_COST = 25
export const MIN_POINTS = 25
/** Multiplayer: extra points for the first player to name him. */
export const FIRST_BONUS = 25

export type CareersClueKind = 'nationality' | 'position' | 'initials'
export const CLUE_ORDER: CareersClueKind[] = ['nationality', 'position', 'initials']

export interface CareersClue {
  kind: CareersClueKind
  label: string
  value: string
}

export type CareersGuessOutcome =
  | { kind: 'correct'; points: number }
  | { kind: 'wrong'; guessesLeft: number }
  | { kind: 'repeat' }

export interface CareersRoundResult {
  playerId: string
  name: string
  solved: boolean
  guessesUsed: number
  points: number
}

export type CareersPhase = 'playing' | 'finished'

export interface CareersSessionState {
  sessionId: string
  config: CareersConfig
  phase: CareersPhase
  players: CareerPlayer[]
  currentIndex: number
  /** Normalized wrong guesses for the current player. */
  wrongGuesses: string[]
  /** Current player is over: solved, out of guesses or given up. */
  roundOver: boolean
  solved: boolean
  results: CareersRoundResult[]
  score: number
  startedAt: number
}
