import { dealCareers } from '@/data/careers'
import type { CareersDifficultyFilter } from '@/lib/careers/types'

export const runtime = 'nodejs'

const DIFFICULTIES = new Set<CareersDifficultyFilter>(['easy', 'medium', 'hard', 'mixed'])
const MAX_COUNT = 20
const MAX_RECENT = 200

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    difficulty?: string
    count?: number
    recent?: unknown
  }
  const difficulty = DIFFICULTIES.has(body.difficulty as CareersDifficultyFilter)
    ? (body.difficulty as CareersDifficultyFilter)
    : 'mixed'
  const count = Math.min(MAX_COUNT, Math.max(1, Math.floor(Number(body.count) || 5)))
  const recent = Array.isArray(body.recent)
    ? body.recent.filter((id): id is string => typeof id === 'string').slice(-MAX_RECENT)
    : []

  return Response.json({ players: dealCareers(difficulty, count, recent) })
}
