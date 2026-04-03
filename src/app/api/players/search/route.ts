import { searchPlayers } from '@/lib/validation'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const limitRaw = Number(searchParams.get('limit') ?? '20')
  const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20))

  const players = searchPlayers(q, limit).map((p) => ({
    playerId: p.playerId,
    name: p.name,
    imageUrl: p.imageUrl,
  }))

  return Response.json({ players })
}
