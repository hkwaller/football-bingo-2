import { generateBoard, cellCountForConfig } from '@/lib/board'
import { DEFAULT_BOARD_CONFIG, isBoardConfigViable, parseBoardConfig } from '@/lib/boardConfig'
import { findPlayerById, playerMatchesCategory } from '@/lib/validation'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { seed, playerId, boardConfig: rawConfig, occupiedIndices } = body as Record<string, unknown>
  const config = rawConfig === undefined ? DEFAULT_BOARD_CONFIG : parseBoardConfig(rawConfig)
  if (typeof seed !== 'string' || !seed || typeof playerId !== 'string' || !playerId) {
    return Response.json({ error: 'Missing seed or player' }, { status: 400 })
  }
  if (!config || !isBoardConfigViable(config)) {
    return Response.json({ error: 'Invalid boardConfig' }, { status: 400 })
  }
  const count = cellCountForConfig(config)
  if (!Array.isArray(occupiedIndices) || occupiedIndices.length > count ||
    !occupiedIndices.every((i) => Number.isInteger(i) && i >= 0 && i < count)) {
    return Response.json({ error: 'Invalid occupiedIndices' }, { status: 400 })
  }
  const player = findPlayerById(playerId)
  if (!player) return Response.json({ error: 'Unknown player' }, { status: 400 })
  const occupied = new Set<number>(occupiedIndices)
  const matchingCells = generateBoard(seed, config).flatMap((cell, index) =>
    cell.kind === 'category' && !occupied.has(index) && playerMatchesCategory(player, cell.label)
      ? [index] : [],
  )
  return Response.json({ matchingCells })
}
