import type { TenableSessionState } from '@/lib/tenable/types'

/** Session-level aggregate posted to /api/tenable/finish and shown on the end screen. */
export interface TenableSummary {
  categoriesPlayed: number
  categoriesCleared: number
  answersFound: number
  totalAnswers: number
  livesUsed: number
  score: number
  /** Every played category cleared (all ten). */
  won: boolean
  durationMs: number
}

export function summarizeSession(session: TenableSessionState): TenableSummary {
  const { results } = session
  const categoriesPlayed = results.length
  const categoriesCleared = results.filter((r) => r.cleared).length
  const answersFound = results.reduce((n, r) => n + r.foundRanks.length, 0)
  const totalAnswers = categoriesPlayed * 10
  const livesUsed = results.reduce((n, r) => n + r.livesUsed, 0)
  return {
    categoriesPlayed,
    categoriesCleared,
    answersFound,
    totalAnswers,
    livesUsed,
    score: session.score,
    won: categoriesPlayed > 0 && categoriesCleared === categoriesPlayed,
    durationMs: Math.max(0, Date.now() - session.startedAt),
  }
}

/** "1m 04s" / "48s" — matches soloStats formatting. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

/** One persisted Tenable result row as read back from Supabase. */
export type TenableResultRow = {
  id: string
  session_id: string
  categories_played: number
  categories_cleared: number
  answers_found: number
  total_answers: number
  lives_used: number
  score: number
  won: boolean
  duration_ms: number | null
  created_at: string
}

export type TenableProfileSummary = {
  sessionsPlayed: number
  categoriesCleared: number
  totalAnswersFound: number
  bestScore: number
}

export function summarizeTenableResults(rows: TenableResultRow[]): TenableProfileSummary {
  let categoriesCleared = 0
  let totalAnswersFound = 0
  let bestScore = 0
  for (const r of rows) {
    categoriesCleared += r.categories_cleared
    totalAnswersFound += r.answers_found
    if (r.score > bestScore) bestScore = r.score
  }
  return {
    sessionsPlayed: rows.length,
    categoriesCleared,
    totalAnswersFound,
    bestScore,
  }
}
