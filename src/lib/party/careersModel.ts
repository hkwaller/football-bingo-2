import { DEFAULT_CAREERS_CONFIG, type CareerPlayer, type CareersConfig } from '../careers/types'

export type CareersRoomPhase = 'lobby' | 'playing' | 'finished'

export interface CareersRoomResult {
  playerId: string
  name: string
  /** playerId → points this career (0 = missed). */
  points: Record<string, number>
}

export type CareersGameStorage = {
  phase: CareersRoomPhase
  /** Stable per-tab player ids - kept across reconnects. */
  hostPlayerId: string | null
  configJson: string // CareersConfig
  playersJson: string // CareerPlayer[] - dealt by the host from /api/careers/deal
  currentIndex: number
  roundStatesJson: string // RoundStates (see roomRound.ts)
  /** The current career is closed: everyone done, clock ran out or host revealed it. */
  roundClosed: boolean
  roundDeadline: number // epoch ms, 0 = no clock
  resultsJson: string // CareersRoomResult[]
  startedAt: number
  playerNames: Map<string, string> // playerId → display name
  playerScores: Map<string, string> // playerId → score (number as string)
}

export type CareersGamePresence = {
  displayName: string
  /** Per-tab id (see lib/roomPlayer) - survives reconnects with the room seat. */
  playerId: string
}

export function createInitialCareersStorage(): CareersGameStorage {
  return {
    phase: 'lobby',
    hostPlayerId: null,
    configJson: JSON.stringify(DEFAULT_CAREERS_CONFIG),
    playersJson: '[]',
    currentIndex: 0,
    roundStatesJson: '{}',
    roundClosed: false,
    roundDeadline: 0,
    resultsJson: '[]',
    startedAt: 0,
    playerNames: new Map(),
    playerScores: new Map(),
  }
}

export function parseCareersConfig(json: string | null | undefined): CareersConfig {
  try {
    return { ...DEFAULT_CAREERS_CONFIG, ...(JSON.parse(json ?? '{}') as Partial<CareersConfig>) }
  } catch {
    return DEFAULT_CAREERS_CONFIG
  }
}

export const parseCareerPlayers = (json: string | null | undefined) =>
  parseArray<CareerPlayer>(json)

export const parseCareersResults = (json: string | null | undefined) =>
  parseArray<CareersRoomResult>(json)

export const deadlineFor = (cfg: CareersConfig) =>
  cfg.roundSeconds > 0 ? Date.now() + cfg.roundSeconds * 1000 : 0

function parseArray<T>(json: string | null | undefined): T[] {
  try {
    const arr = JSON.parse(json ?? '[]')
    return Array.isArray(arr) ? (arr as T[]) : []
  } catch {
    return []
  }
}
