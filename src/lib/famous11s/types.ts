import type { Famous11sLineup, LineupDifficulty, LineupKind } from '@/data/famous11s'

export type { Famous11sLineup }

export type Famous11sDifficultyFilter = LineupDifficulty | 'mixed'
export type Famous11sKindFilter = LineupKind | 'all'

/** Points per correctly guessed player slot. */
export const POINTS_PER_SLOT = 100
/** Bonus for clearing all slots (including manager if enabled). */
export const CLEAR_BONUS = 300
/** Score penalty per wrong guess when penaltyOnMiss is on. */
export const MISS_PENALTY = 50

export interface Famous11sConfig {
  /** How many lineups to play in a session. */
  lineupCount: 1 | 3 | 5 | 7
  /** Kind filter - national, club, or both. */
  kind: Famous11sKindFilter
  /** Difficulty filter. */
  difficulty: Famous11sDifficultyFilter
  /** Whether the manager is an extra guessable slot. */
  includeManager: boolean
  /** Wrong guesses allowed per lineup (0 = unlimited). */
  lives: number
  /** Deduct MISS_PENALTY points on each wrong guess. */
  penaltyOnMiss: boolean
  /** Per-turn timer in seconds; 0 = no timer. */
  turnSeconds: number
  /** If set, play exactly this one lineup (gallery pick). */
  selectedLineupId?: string
  /** Multiplayer mechanic - always turn-based. */
  multiplayerMechanic: 'turn-based'
}

export const DEFAULT_FAMOUS11S_CONFIG: Famous11sConfig = {
  lineupCount: 1,
  kind: 'all',
  difficulty: 'mixed',
  includeManager: true,
  lives: 3,
  penaltyOnMiss: false,
  turnSeconds: 0,
  multiplayerMechanic: 'turn-based',
}

/** Outcome of a single name guess. */
export type GuessOutcome =
  | { kind: 'correct'; slotId: string; name: string }
  | { kind: 'already-found'; slotId: string; name: string }
  | { kind: 'wrong' }

/** Finalized record of one played lineup. */
export interface LineupResult {
  lineupId: string
  title: string
  foundSlotIds: string[]
  slotsTotal: number
  managerFound: boolean
  livesUsed: number
  cleared: boolean
}

export type Famous11sPhase = 'playing' | 'finished'

export interface Famous11sSessionState {
  sessionId: string
  seed: string
  config: Famous11sConfig
  phase: Famous11sPhase
  /** Lineups queued for this session (1–N). */
  lineups: Famous11sLineup[]
  currentIndex: number
  /** Slot IDs and special key 'manager' that have been correctly guessed. */
  foundSlotIds: string[]
  livesLeft: number
  results: LineupResult[]
  score: number
  startedAt: number
}
