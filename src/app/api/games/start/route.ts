import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isClerkConfigured } from '@/lib/env'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const admin = getSupabaseAdmin()
  if (!admin) {
    return Response.json({ ok: true, skipped: true as const })
  }

  let body: { seed?: string; liveblocksRoomId?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.seed !== 'string' || !body.seed) {
    return Response.json({ error: 'Missing seed' }, { status: 400 })
  }

  const userId = isClerkConfigured()
    ? (await auth()).userId ?? null
    : null
  const { data, error } = await admin
    .from('games')
    .insert({
      seed: body.seed,
      liveblocks_room_id: body.liveblocksRoomId ?? null,
      host_clerk_user_id: userId ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true as const, gameId: data.id })
}
