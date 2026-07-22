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

  // Solo results are per-user; without a signed-in user there is nowhere to save.
  const userId = isClerkConfigured() ? (await auth()).userId ?? null : null
  if (!userId) {
    return Response.json({ ok: true, skipped: true as const })
  }

  let body: {
    seed?: string
    playMode?: string
    boardSize?: number
    correctCount?: number
    wrongCount?: number
    totalCells?: number
    durationMs?: number
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.seed !== 'string' || !body.seed) {
    return Response.json({ error: 'Missing seed' }, { status: 400 })
  }

  const int = (v: unknown, fallback = 0) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : fallback

  const { error } = await admin.from(FB_TABLES.soloResults).insert({
    clerk_user_id: userId,
    seed: body.seed,
    play_mode: body.playMode === 'free' ? 'free' : 'draft',
    board_size: int(body.boardSize, 5),
    correct_count: int(body.correctCount),
    wrong_count: int(body.wrongCount),
    total_cells: int(body.totalCells),
    duration_ms: typeof body.durationMs === 'number' ? int(body.durationMs) : null,
    won: true,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true as const })
}
