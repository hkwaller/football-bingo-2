import {
  cellCategory,
  generateBoard,
  cellCountForConfig,
} from '@/lib/board'
import {
  isBoardConfigViable,
  parseBoardConfig,
  DEFAULT_BOARD_CONFIG,
} from '@/lib/boardConfig'
import { validateCellAnswer } from '@/lib/validation'

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

  const { seed, cellIndex, playerId, boardConfig: rawConfig } = body as Record<
    string,
    unknown
  >

  if (typeof seed !== 'string' || seed.length === 0) {
    return Response.json({ error: 'Missing seed' }, { status: 400 })
  }
  if (typeof cellIndex !== 'number' || !Number.isInteger(cellIndex)) {
    return Response.json({ error: 'Invalid cellIndex' }, { status: 400 })
  }
  if (typeof playerId !== 'string' || playerId.length === 0) {
    return Response.json({ error: 'Missing playerId' }, { status: 400 })
  }

  const boardConfig =
    rawConfig !== undefined ? parseBoardConfig(rawConfig) : DEFAULT_BOARD_CONFIG
  if (!boardConfig) {
    return Response.json({ error: 'Invalid boardConfig' }, { status: 400 })
  }
  if (!isBoardConfigViable(boardConfig)) {
    return Response.json({ error: 'boardConfig has too few categories' }, { status: 400 })
  }

  const maxIndex = cellCountForConfig(boardConfig) - 1
  if (cellIndex < 0 || cellIndex > maxIndex) {
    return Response.json({ error: 'cellIndex out of range' }, { status: 400 })
  }

  let cells
  try {
    cells = generateBoard(seed, boardConfig)
  } catch {
    return Response.json({ error: 'Could not build board' }, { status: 500 })
  }

  const category = cellCategory(cells, cellIndex)
  if (category === null) {
    return Response.json({ error: 'This is the free square' }, { status: 400 })
  }

  const result = validateCellAnswer(category, playerId)
  if (!result.ok) {
    return Response.json({ ok: false, reason: result.reason })
  }

  return Response.json({
    ok: true,
    player: {
      playerId: result.player.playerId,
      name: result.player.name,
      imageUrl: result.player.imageUrl,
    },
  })
}
