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

  // Results are per-user; without a signed-in user there is nowhere to save.
  const userId = isClerkConfigured() ? (await auth()).userId ?? null : null
  if (!userId) {
    return Response.json({ ok: true, skipped: true as const })
  }

  let body: {
    sessionId?: string
    categoriesPlayed?: number
    categoriesCleared?: number
    answersFound?: number
    totalAnswers?: number
    livesUsed?: number
    score?: number
    won?: boolean
    durationMs?: number
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.sessionId !== 'string' || !body.sessionId) {
    return Response.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const int = (v: unknown, fallback = 0) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : fallback

  const { error } = await admin.from(FB_TABLES.tenableResults).insert({
    clerk_user_id: userId,
    session_id: body.sessionId,
    categories_played: int(body.categoriesPlayed),
    categories_cleared: int(body.categoriesCleared),
    answers_found: int(body.answersFound),
    total_answers: int(body.totalAnswers),
    lives_used: int(body.livesUsed),
    score: int(body.score),
    won: body.won === true,
    duration_ms: typeof body.durationMs === 'number' ? int(body.durationMs) : null,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true as const })
}
