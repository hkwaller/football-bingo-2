import type { BoardConfig } from '@/lib/boardConfig'
import { enrichedFootballPlayers } from '@/data/players'
import { generateBoard, type BoardCell } from '@/lib/board'
import type { DraftPolicy } from '@/lib/draftPolicy'
import { hashSeed, mulberry32 } from '@/lib/seeded'
import type { EnrichedPlayer } from '@/lib/validation'
import { playerMatchesCategory } from '@/lib/validation'

export type DraftResolveResult = {
  player: { playerId: string; name: string; imageUrl?: string }
  /** Empty = client treats as no restriction (any empty category cell). */
  validSquares: number[]
  /** True when placeable pool was empty and full player list was used. */
  usedOpenFallback: boolean
  /** When true, only validSquares (if non-empty) are valid click targets. */
  restrictToValidSquares: boolean
}

function occupiedKey(indices: number[]): string {
  return [...new Set(indices)].sort((a, b) => a - b).join(',')
}

function emptyCategoryCellIndices(
  cells: BoardCell[],
  occupied: Set<number>,
): number[] {
  const out: number[] = []
  cells.forEach((c, i) => {
    if (c.kind === 'category' && !occupied.has(i)) out.push(i)
  })
  return out
}

function validIndicesForPlayer(
  player: EnrichedPlayer,
  cells: BoardCell[],
  emptyIndices: number[],
): number[] {
  return emptyIndices.filter((i) => {
    const c = cells[i]
    if (!c || c.kind !== 'category') return false
    return playerMatchesCategory(player, c.label)
  })
}

function pickIndexFromPool(hashKey: string, n: number): number {
  if (n <= 0) return 0
  const rand = mulberry32(hashSeed(hashKey))
  return Math.min(Math.floor(rand() * n), n - 1)
}

function toPublic(p: EnrichedPlayer) {
  return {
    playerId: p.playerId,
    name: p.name,
    imageUrl: p.imageUrl,
  }
}

/** All players who match at least one empty category cell. */
function placeablePool(
  cells: BoardCell[],
  emptyIndices: number[],
): EnrichedPlayer[] {
  return enrichedFootballPlayers.filter(
    (p) => validIndicesForPlayer(p, cells, emptyIndices).length > 0,
  )
}

export function resolveDraftPlayer(params: {
  seed: string
  round: number
  policy: DraftPolicy
  boardConfig: BoardConfig
  occupiedIndices: number[]
}): DraftResolveResult | null {
  const cells = generateBoard(params.seed, params.boardConfig)
  const occ = new Set(params.occupiedIndices)
  const emptyIdx = emptyCategoryCellIndices(cells, occ)
  const occKey = occupiedKey(params.occupiedIndices)

  if (params.policy === 'open') {
    const hashKey = `draft|${params.seed}|${params.round}`
    const n = enrichedFootballPlayers.length
    if (n === 0) return null
    const i = pickIndexFromPool(hashKey, n)
    const p = enrichedFootballPlayers[i]
    if (!p) return null
    const vs = validIndicesForPlayer(p, cells, emptyIdx)
    return {
      player: toPublic(p),
      validSquares: vs,
      usedOpenFallback: false,
      restrictToValidSquares: false,
    }
  }

  let pool = placeablePool(cells, emptyIdx)
  let usedOpenFallback = false
  if (pool.length === 0) {
    pool = [...enrichedFootballPlayers]
    usedOpenFallback = true
  }

  const hashKey = usedOpenFallback
    ? `placeable_fb|${params.seed}|${params.round}|${occKey}`
    : `placeable|${params.seed}|${params.round}|${occKey}`

  const pi = pickIndexFromPool(hashKey, pool.length)
  const p = pool[pi]
  if (!p) return null

  let vs = validIndicesForPlayer(p, cells, emptyIdx)
  if (vs.length === 0) {
    vs = [...emptyIdx]
  }

  return {
    player: toPublic(p),
    validSquares: vs,
    usedOpenFallback,
    restrictToValidSquares: true,
  }
}
