import { DEFAULT_BOARD_CONFIG, parseBoardConfig } from '@/lib/boardConfig'
import { resolveDraftPlayer } from '@/lib/draftResolve'
import { parseDraftPolicy } from '@/lib/draftPolicy'

export const runtime = 'nodejs'

function parseOccupied(raw: string | null): number[] {
  if (!raw || !raw.trim()) return []
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 0)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seed = searchParams.get('seed') ?? ''
  const roundRaw = searchParams.get('round') ?? '0'
  const round = Number(roundRaw)
  const policy = parseDraftPolicy(searchParams.get('policy'))
  const boardConfigRaw = searchParams.get('boardConfig')
  const occupied = parseOccupied(searchParams.get('occupied'))

  if (!seed) {
    return Response.json({ error: 'Missing seed' }, { status: 400 })
  }
  if (!Number.isInteger(round) || round < 0) {
    return Response.json({ error: 'Invalid round' }, { status: 400 })
  }

  let boardConfig = DEFAULT_BOARD_CONFIG
  if (boardConfigRaw) {
    try {
      const parsed = parseBoardConfig(JSON.parse(boardConfigRaw))
      if (parsed) boardConfig = parsed
    } catch {
      return Response.json({ error: 'Invalid boardConfig' }, { status: 400 })
    }
  }

  const result = resolveDraftPlayer({
    seed,
    round,
    policy,
    boardConfig,
    occupiedIndices: occupied,
  })

  if (!result) {
    return Response.json({ error: 'No players' }, { status: 500 })
  }

  return Response.json({
    player: result.player,
    validSquares: result.validSquares,
    restrictToValidSquares: result.restrictToValidSquares,
    usedOpenFallback: result.usedOpenFallback,
  })
}
