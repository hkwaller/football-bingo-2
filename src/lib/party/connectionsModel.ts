import {
  DEFAULT_CONNECTIONS_CONFIG,
  type ConnectionsConfig,
  type ConnectionsPuzzle,
} from '../connections/types'

export type ConnectionsRoomPhase = 'lobby' | 'playing' | 'finished'

export interface ConnectionsRoomResult {
  puzzleId: string
  clubs: string[]
  /** playerId → points this puzzle (0 = missed). */
  points: Record<string, number>
}

export type ConnectionsGameStorage = {
  phase: ConnectionsRoomPhase
  /** Stable per-tab player ids - kept across reconnects. */
  hostPlayerId: string | null
  configJson: string // ConnectionsConfig
  puzzlesJson: string // ConnectionsPuzzle[] - dealt by the host from /api/connections/deal
  currentIndex: number
  roundStatesJson: string // RoundStates (see roomRound.ts)
  /** The current puzzle is closed: everyone done, clock ran out or host revealed it. */
  roundClosed: boolean
  roundDeadline: number // epoch ms, 0 = no clock
  resultsJson: string // ConnectionsRoomResult[]
  startedAt: number
  playerNames: Map<string, string> // playerId → display name
  playerScores: Map<string, string> // playerId → score (number as string)
}

export type ConnectionsGamePresence = {
  displayName: string
  /** Per-tab id (see lib/roomPlayer) - survives reconnects with the room seat. */
  playerId: string
}

export function createInitialConnectionsStorage(): ConnectionsGameStorage {
  return {
    phase: 'lobby',
    hostPlayerId: null,
    configJson: JSON.stringify(DEFAULT_CONNECTIONS_CONFIG),
    puzzlesJson: '[]',
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

export function parseConnectionsConfig(json: string | null | undefined): ConnectionsConfig {
  try {
    return {
      ...DEFAULT_CONNECTIONS_CONFIG,
      ...(JSON.parse(json ?? '{}') as Partial<ConnectionsConfig>),
    }
  } catch {
    return DEFAULT_CONNECTIONS_CONFIG
  }
}

export const parseConnectionsPuzzles = (json: string | null | undefined) =>
  parseArray<ConnectionsPuzzle>(json)

export const parseConnectionsResults = (json: string | null | undefined) =>
  parseArray<ConnectionsRoomResult>(json)

export const deadlineFor = (cfg: ConnectionsConfig) =>
  cfg.roundSeconds > 0 ? Date.now() + cfg.roundSeconds * 1000 : 0

function parseArray<T>(json: string | null | undefined): T[] {
  try {
    const arr = JSON.parse(json ?? '[]')
    return Array.isArray(arr) ? (arr as T[]) : []
  } catch {
    return []
  }
}
