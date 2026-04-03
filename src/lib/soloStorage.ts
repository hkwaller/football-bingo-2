import type { BoardConfig } from '@/lib/boardConfig'
import {
  DEFAULT_BOARD_CONFIG,
  isBoardConfigViable,
  parseBoardConfig,
} from '@/lib/boardConfig'
import type { CellPick } from '@/lib/cellPick'
import type { DraftPolicy } from '@/lib/draftPolicy'
import type { PlayMode } from '@/lib/playMode'

const KEY_V2 = 'football-bingo-solo-v2'
const KEY_V1 = 'football-bingo-solo-v1'

export type SoloPersisted = {
  seed: string
  solved: Record<string, CellPick>
  playMode?: PlayMode
  round?: number
  boardConfig?: BoardConfig
  lineHighlight?: boolean
  draftPolicy?: DraftPolicy
}

function normalizeBoardConfig(raw: unknown): BoardConfig {
  const p = parseBoardConfig(raw)
  if (p && isBoardConfigViable(p)) return p
  return DEFAULT_BOARD_CONFIG
}

export function loadSolo(): SoloPersisted | null {
  if (typeof window === 'undefined') return null
  try {
    const tryParse = (key: string): SoloPersisted | null => {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const p = JSON.parse(raw) as SoloPersisted
      if (typeof p.seed !== 'string' || typeof p.solved !== 'object' || !p.solved) {
        return null
      }
      return p
    }

    const v2 = tryParse(KEY_V2)
    if (v2) {
      v2.boardConfig = normalizeBoardConfig(v2.boardConfig)
      return v2
    }

    const v1 = tryParse(KEY_V1)
    if (v1) {
      return {
        ...v1,
        boardConfig: DEFAULT_BOARD_CONFIG,
        lineHighlight: true,
        draftPolicy: 'open',
      }
    }
    return null
  } catch {
    return null
  }
}

export function saveSolo(state: SoloPersisted) {
  if (typeof window === 'undefined') return
  const boardConfig = normalizeBoardConfig(state.boardConfig)
  localStorage.setItem(
    KEY_V2,
    JSON.stringify({ ...state, boardConfig }),
  )
}

export function clearSolo() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY_V2)
  localStorage.removeItem(KEY_V1)
}

export function soloToMap(solved: Record<string, CellPick>): Map<number, CellPick> {
  const m = new Map<number, CellPick>()
  for (const [k, v] of Object.entries(solved)) {
    const i = Number(k)
    if (Number.isInteger(i)) m.set(i, v)
  }
  return m
}

export function mapToSolo(solved: Map<number, CellPick>): Record<string, CellPick> {
  const o: Record<string, CellPick> = {}
  for (const [k, v] of solved) o[String(k)] = v
  return o
}
