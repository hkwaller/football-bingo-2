import { dealConnections } from '@/data/connections'
import type { ClubCount, ConnectionsDifficultyFilter } from '@/lib/connections/types'

export const runtime = 'nodejs'

const DIFFICULTIES = new Set<ConnectionsDifficultyFilter>(['easy', 'medium', 'hard', 'mixed'])
const MAX_COUNT = 20
const MAX_RECENT = 200

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    difficulty?: string
    clubCount?: number
    count?: number
    recent?: unknown
  }
  const difficulty = DIFFICULTIES.has(body.difficulty as ConnectionsDifficultyFilter)
    ? (body.difficulty as ConnectionsDifficultyFilter)
    : 'mixed'
  const clubCount: ClubCount = body.clubCount === 3 ? 3 : 2
  const count = Math.min(MAX_COUNT, Math.max(1, Math.floor(Number(body.count) || 10)))
  const recent = Array.isArray(body.recent)
    ? body.recent.filter((id): id is string => typeof id === 'string').slice(-MAX_RECENT)
    : []

  return Response.json({ puzzles: dealConnections(difficulty, clubCount, count, recent) })
}
