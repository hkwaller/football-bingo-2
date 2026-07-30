import type { BoardConfig } from '@/lib/boardConfig'
import { DEFAULT_BOARD_CONFIG, isBoardConfigViable, parseBoardConfig } from '@/lib/boardConfig'
import type { DraftPolicy } from '@/lib/draftPolicy'
import { parseDraftPolicy } from '@/lib/draftPolicy'
import type { PlayMode } from '@/lib/playMode'
import type { InitialGameConfig } from '@/lib/liveblocks/client'

const KEY = 'football-bingo-room-config-v1'

/**
 * The full multiplayer-bingo config a host picks on the setup screen, before a
 * room exists. Mirrors trivia/tenable: the setup screen writes this, and the
 * room seeds its Liveblocks storage from it on creation.
 */
export type BingoRoomConfig = {
  boardConfig: BoardConfig
  playMode: PlayMode
  boardLayout: 'shared' | 'individual'
  drawSource: 'shared' | 'independent'
  singleGuess: boolean
  draftPolicy: DraftPolicy
}

export const DEFAULT_BINGO_ROOM_CONFIG: BingoRoomConfig = {
  boardConfig: DEFAULT_BOARD_CONFIG,
  playMode: 'draft',
  boardLayout: 'individual',
  drawSource: 'shared',
  singleGuess: false,
  draftPolicy: 'open',
}

export function loadBingoRoomConfig(): BingoRoomConfig {
  if (typeof window === 'undefined') return DEFAULT_BINGO_ROOM_CONFIG
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_BINGO_ROOM_CONFIG
    const o = JSON.parse(raw) as Record<string, unknown>
    const boardConfig = parseBoardConfig(o.boardConfig)
    return {
      boardConfig: boardConfig && isBoardConfigViable(boardConfig) ? boardConfig : DEFAULT_BOARD_CONFIG,
      playMode: o.playMode === 'free' ? 'free' : 'draft',
      boardLayout: o.boardLayout === 'shared' ? 'shared' : 'individual',
      drawSource: o.drawSource === 'independent' ? 'independent' : 'shared',
      singleGuess: o.singleGuess === true,
      draftPolicy: parseDraftPolicy(typeof o.draftPolicy === 'string' ? o.draftPolicy : null),
    }
  } catch {
    return DEFAULT_BINGO_ROOM_CONFIG
  }
}

export function saveBingoRoomConfig(config: BingoRoomConfig) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(config))
}

/** Flatten a room config into the storage seed the room is created with. */
export function bingoRoomConfigToStorage(config: BingoRoomConfig): InitialGameConfig {
  const { boardConfig } = config
  return {
    playMode: config.playMode,
    boardSize: boardConfig.size,
    categoryNationalities: boardConfig.categoryKinds.nationalities,
    categoryClubs: boardConfig.categoryKinds.clubs,
    categoryAchievements: boardConfig.categoryKinds.achievements,
    categoryTraits: boardConfig.categoryKinds.traits,
    categoryManagers: boardConfig.categoryKinds.managers,
    minFameScore: boardConfig.minFameScore,
    boardLayout: config.boardLayout,
    drawSource: config.drawSource,
    singleGuess: config.singleGuess,
    // Individual boards always play "open"; the room enforces this too.
    draftPolicy: config.boardLayout === 'individual' ? 'open' : config.draftPolicy,
  }
}
