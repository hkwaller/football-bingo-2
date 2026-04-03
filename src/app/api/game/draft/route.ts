import { draftPlayerPublic } from '@/lib/draftPick'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seed = searchParams.get('seed') ?? ''
  const roundRaw = searchParams.get('round') ?? '0'
  const round = Number(roundRaw)

  if (!seed) {
    return Response.json({ error: 'Missing seed' }, { status: 400 })
  }
  if (!Number.isInteger(round) || round < 0) {
    return Response.json({ error: 'Invalid round' }, { status: 400 })
  }

  const player = draftPlayerPublic(seed, round)
  if (!player) {
    return Response.json({ error: 'No players' }, { status: 500 })
  }

  return Response.json({ player })
}
