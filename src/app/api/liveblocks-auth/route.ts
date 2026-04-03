import { auth } from '@clerk/nextjs/server'
import { Liveblocks } from '@liveblocks/node'
import { isClerkConfigured } from '@/lib/env'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) {
    return Response.json(
      { error: 'Liveblocks is not configured' },
      { status: 503 },
    )
  }

  let room: string
  let anonId: string | undefined
  try {
    const body = await request.json()
    room = typeof body.room === 'string' ? body.room : ''
    anonId = typeof body.anonId === 'string' ? body.anonId : undefined
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!room) {
    return Response.json({ error: 'Missing room' }, { status: 400 })
  }

  const userId = isClerkConfigured()
    ? (await auth()).userId ?? null
    : null
  const user =
    userId ?? (anonId && anonId.length > 0 ? `anon:${anonId}` : `anon:${crypto.randomUUID()}`)

  const liveblocks = new Liveblocks({ secret })
  const session = liveblocks.prepareSession(user, {
    userInfo: {
      name: user.startsWith('anon:') ? 'Guest' : undefined,
    },
  })
  session.allow(room, session.FULL_ACCESS)
  const { status, body } = await session.authorize()
  return new Response(body, { status })
}
