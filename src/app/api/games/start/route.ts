import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isClerkConfigured } from '@/lib/env'
import { FB_TABLES } from '@/lib/supabase/tables'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const admin = getSupabaseAdmin()
  if (!admin) {
    return Response.json({ ok: true, skipped: true as const })
  }

  let body: { seed?: string; roomId?: string }
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
    .from(FB_TABLES.games)
    .insert({
      seed: body.seed,
      room_id: body.roomId ?? null,
      host_clerk_user_id: userId ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true as const, gameId: data.id })
}
