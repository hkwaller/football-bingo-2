import { cellCategory, generateBoard } from '@/lib/board'
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

  const { seed, cellIndex, playerId } = body as Record<string, unknown>

  if (typeof seed !== 'string' || seed.length === 0) {
    return Response.json({ error: 'Missing seed' }, { status: 400 })
  }
  if (typeof cellIndex !== 'number' || !Number.isInteger(cellIndex)) {
    return Response.json({ error: 'Invalid cellIndex' }, { status: 400 })
  }
  if (typeof playerId !== 'string' || playerId.length === 0) {
    return Response.json({ error: 'Missing playerId' }, { status: 400 })
  }

  if (cellIndex < 0 || cellIndex > 24) {
    return Response.json({ error: 'cellIndex out of range' }, { status: 400 })
  }

  const cells = generateBoard(seed)
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
