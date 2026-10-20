/** A club on a Connections puzzle. */
export interface ConnectionsClub {
  /** Transfermarkt club id. */
  id: string
  name: string
  /** Downloaded crest in public/logos/clubs/, when available. */
  logo: string | null
}

/**
 * One stint at a puzzle club, in calendar years. `to: null` = still there.
 * Years are missing for the few legends we only know the clubs of.
 */
export interface ConnectionsStint {
  clubId: string
  loan: boolean
  from?: number
  to?: number | null
}

/** A player who played for every club on the puzzle. */
export interface ConnectionsAnswer {
  id: string
  name: string
  nationality: string
  position: string
  fame: number
  imageUrl?: string
  /** Their stints at the puzzle clubs only, oldest first. */
  stints: ConnectionsStint[]
}

export type ConnectionsDifficulty = 'easy' | 'medium' | 'hard'
export type ConnectionsDifficultyFilter = ConnectionsDifficulty | 'mixed'

export interface ConnectionsPuzzle {
  /** Sorted club ids joined with "+", so the same clubs always share an id. */
  id: string
  clubs: ConnectionsClub[]
  /** Every player in the bank who fits, most famous first. Never empty. */
  answers: ConnectionsAnswer[]
  difficulty: ConnectionsDifficulty
}

export type ClubCount = 2 | 3

export interface ConnectionsConfig {
  difficulty: ConnectionsDifficultyFilter
  /** Clubs per puzzle. */
  clubCount: ClubCount
  /** Puzzles per run. */
  puzzleCount: number
  /** Wrong guesses per puzzle; each miss reveals the next clue. */
  guesses: number
  /** Multiplayer: seconds per puzzle before it's revealed. 0 = no clock. */
  roundSeconds: number
}

export const DEFAULT_CONNECTIONS_CONFIG: ConnectionsConfig = {
  difficulty: 'mixed',
  clubCount: 2,
  puzzleCount: 10,
  guesses: 3,
  roundSeconds: 60,
}

/** Points for a first-guess answer; each clue revealed costs CLUE_COST. */
export const MAX_POINTS = 100
export const CLUE_COST = 25
export const MIN_POINTS = 25
/** Extra points for naming someone outside the most famous few answers. */
export const DEEP_CUT_BONUS = 25
/** The top this-many answers by fame are the obvious ones - no deep-cut bonus. */
export const OBVIOUS_ANSWERS = 3
/** Multiplayer: extra points for the first player to connect them. */
export const FIRST_BONUS = 25

export type ConnectionsClueKind = 'nationality' | 'position' | 'initials'
export const CLUE_ORDER: ConnectionsClueKind[] = ['nationality', 'position', 'initials']

export interface ConnectionsClue {
  kind: ConnectionsClueKind
  label: string
  value: string
}

/**
 * - correct: an answer that fits every club.
 * - wrong: a player we know who doesn't fit - costs a guess.
 * - unknown: not a player in our bank. We can't prove it wrong, so it's free.
 * - repeat: already tried, or empty.
 */
export type ConnectionsGuessOutcome =
  | { kind: 'correct'; answer: ConnectionsAnswer; points: number; deepCut: boolean }
  | { kind: 'wrong'; guessesLeft: number }
  | { kind: 'unknown' }
  | { kind: 'repeat' }

export interface ConnectionsRoundResult {
  puzzleId: string
  clubs: string[]
  solved: boolean
  /** The answer they gave, when solved. */
  answerName: string | null
  points: number
  deepCut: boolean
}

export type ConnectionsPhase = 'playing' | 'finished'

export interface ConnectionsSessionState {
  sessionId: string
  config: ConnectionsConfig
  phase: ConnectionsPhase
  puzzles: ConnectionsPuzzle[]
  currentIndex: number
  /** Normalized wrong guesses for the current puzzle. */
  wrongGuesses: string[]
  /** Current puzzle is over: solved, out of guesses or given up. */
  roundOver: boolean
  /** Answer id they connected the clubs with. */
  solvedWith: string | null
  results: ConnectionsRoundResult[]
  score: number
  startedAt: number
}
