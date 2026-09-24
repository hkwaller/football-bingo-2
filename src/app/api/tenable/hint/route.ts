import { getTenableQuestionById } from '@/data/tenable'
import { buildHint } from '@/lib/tenable/hints'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { questionId, exclude: number[] } → a hint for one unfound answer, or 404 when none are left. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    questionId?: unknown
    exclude?: unknown
  } | null
  const question =
    typeof body?.questionId === 'string' ? getTenableQuestionById(body.questionId) : undefined
  if (!question) return Response.json({ error: 'unknown-question' }, { status: 400 })

  const exclude = Array.isArray(body?.exclude)
    ? body.exclude.filter((n): n is number => typeof n === 'number')
    : []
  const hint = buildHint(question, exclude)
  if (!hint) return Response.json({ error: 'no-hint' }, { status: 404 })
  return Response.json({ hint })
}
