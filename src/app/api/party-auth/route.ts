import { auth } from '@clerk/nextjs/server'
import { isClerkConfigured } from '@/lib/env'
import { signRoomTicket, roomPlayerIdentity } from '@/lib/roomTicket'
import { gameKind } from '@/lib/party/types'

export const runtime = 'nodejs'

/** Each ticket binds the authenticated/guest identity and tab to one room. */
export async function POST(request: Request) {
  const secret = process.env.PARTY_SECRET
  if (!secret) return Response.json({ error: 'Room server is not configured' }, { status: 503 })
  const body = await request.json().catch(() => null)
  if (!body || typeof body.room !== 'string' || !gameKind(body.room))
    return Response.json({ error: 'Invalid room' }, { status: 400 })
  const validId = (v: unknown): v is string =>
    typeof v === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(v)
  if (!validId(body.playerId) || !validId(body.anonId))
    return Response.json({ error: 'Invalid player identity' }, { status: 400 })
  const userId = isClerkConfigured() ? (await auth()).userId : null
  const id = await roomPlayerIdentity(userId ?? `anon:${body.anonId}`, body.playerId, secret)
  const ticket = await signRoomTicket(
    { room: body.room, id, name: userId ? 'Player' : 'Guest' },
    secret,
  )
  return Response.json({ ticket }, { headers: { 'Cache-Control': 'no-store' } })
}
