import type { Famous11sLineup } from '../../data/famous11s'
import {
  DEFAULT_FAMOUS11S_CONFIG,
  type Famous11sConfig,
  type LineupResult,
} from '../famous11s/types'

export type ElevenRoomPhase = 'lobby' | 'playing' | 'finished'

export interface ElevenLastGuess {
  seq: number
  by: string // player id
  name: string
  kind: 'correct' | 'already-found' | 'wrong'
  slotId?: string
  displayName?: string
}

export type ElevenGameStorage = {
  phase: ElevenRoomPhase
  /** Stable per-tab player ids - kept across reconnects. */
  hostPlayerId: string | null
  configJson: string // Famous11sConfig
  seed: string
  lineupsJson: string // Famous11sLineup[]
  currentLineupIndex: number
  foundSlotIdsJson: string // string[] - current lineup slot IDs found
  livesLostJson: string // UsedCounts - lives lost this lineup, per player (versus) or team (co-op)
  currentTurnPlayerId: string | null
  turnOrderJson: string // string[] - player ids, ring order
  resultsJson: string // LineupResult[]
  lastGuessJson: string // ElevenLastGuess
  turnDeadline: number // epoch ms, 0 = no timer active
  startedAt: number
  playerNames: Map<string, string> // playerId → display name
  playerScores: Map<string, string> // playerId → score (number as string)
}

export type ElevenGamePresence = {
  displayName: string
  /** Per-tab id (see lib/roomPlayer) - survives reconnects with the room seat. */
  playerId: string
}

export function createInitialElevenStorage(): ElevenGameStorage {
  return {
    phase: 'lobby',
    hostPlayerId: null,
    configJson: JSON.stringify(DEFAULT_FAMOUS11S_CONFIG),
    seed: '',
    lineupsJson: '[]',
    currentLineupIndex: 0,
    foundSlotIdsJson: '[]',
    livesLostJson: '{}',
    currentTurnPlayerId: null,
    turnOrderJson: '[]',
    resultsJson: '[]',
    lastGuessJson: '',
    turnDeadline: 0,
    startedAt: 0,
    playerNames: new Map(),
    playerScores: new Map(),
  }
}

export function parseElevenConfig(json: string): Famous11sConfig {
  try {
    return { ...DEFAULT_FAMOUS11S_CONFIG, ...(JSON.parse(json) as Partial<Famous11sConfig>) }
  } catch {
    return DEFAULT_FAMOUS11S_CONFIG
  }
}

export function parseElevenLineups(json: string): Famous11sLineup[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? (arr as Famous11sLineup[]) : []
  } catch {
    return []
  }
}

export function parseStringArray(json: string): string[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? (arr as string[]) : []
  } catch {
    return []
  }
}

export function parseNumberArray(json: string): number[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? (arr as number[]) : []
  } catch {
    return []
  }
}

export function parseLastGuess(json: string): ElevenLastGuess | null {
  if (!json) return null
  try {
    return JSON.parse(json) as ElevenLastGuess
  } catch {
    return null
  }
}

export function parseResults(json: string): LineupResult[] {
  try {
    const arr = JSON.parse(json)
    return Array.isArray(arr) ? (arr as LineupResult[]) : []
  } catch {
    return []
  }
}
