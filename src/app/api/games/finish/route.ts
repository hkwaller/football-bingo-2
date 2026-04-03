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

  let body: {
    gameId?: string
    displayName?: string
    finalRank?: number
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.gameId !== 'string' || !body.gameId) {
    return Response.json({ error: 'Missing gameId' }, { status: 400 })
  }

  const userId = isClerkConfigured()
    ? (await auth()).userId ?? null
    : null
  const displayName =
    typeof body.displayName === 'string' && body.displayName.length > 0
      ? body.displayName
      : 'Player'

  const { error: pErr } = await admin.from(FB_TABLES.gameParticipants).insert({
    game_id: body.gameId,
    clerk_user_id: userId ?? null,
    display_name: displayName,
    finished_at: new Date().toISOString(),
    final_rank: typeof body.finalRank === 'number' ? body.finalRank : null,
  })

  if (pErr) {
    return Response.json({ error: pErr.message }, { status: 500 })
  }

  await admin
    .from(FB_TABLES.games)
    .update({ ended_at: new Date().toISOString() })
    .eq('id', body.gameId)
    .is('ended_at', null)

  return Response.json({ ok: true as const })
}
