import { searchNames } from '@/lib/tenable/nameSearch'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const limitRaw = Number(searchParams.get('limit') ?? '8')
  const limit = Math.min(20, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 8))

  return Response.json({ suggestions: searchNames(q, limit) })
}
