import type { PlayMode } from '@/lib/playMode'

/** Stats for a single completed solo board. */
export type SoloStats = {
  seed: string
  playMode: PlayMode
  boardSize: number
  /** Correct placements (excludes the free square). */
  correctCount: number
  /** Wrong placements / picks. */
  wrongCount: number
  /** Non-free squares on the board. */
  totalCells: number
  /** Time from first interaction to bingo, in ms. */
  durationMs: number
}

/** Total guesses = correct + wrong. */
export function totalGuesses(s: Pick<SoloStats, 'correctCount' | 'wrongCount'>): number {
  return s.correctCount + s.wrongCount
}

/** Accuracy as a 0-100 integer. Returns 0 when there are no guesses. */
export function accuracyPct(s: Pick<SoloStats, 'correctCount' | 'wrongCount'>): number {
  const total = totalGuesses(s)
  if (total <= 0) return 0
  return Math.round((s.correctCount / total) * 100)
}

/** "1m 04s" / "48s" style formatting. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

/** One persisted solo result as read back from Supabase. */
export type SoloResultRow = {
  id: string
  seed: string
  play_mode: string
  board_size: number
  correct_count: number
  wrong_count: number
  total_cells: number
  duration_ms: number | null
  won: boolean
  created_at: string
}

/** Aggregate stats shown on the profile page. */
export type ProfileSummary = {
  boardsCompleted: number
  totalCorrect: number
  totalGuesses: number
  overallAccuracy: number
  bestAccuracy: number
  fastestMs: number | null
}

export function summarizeResults(rows: SoloResultRow[]): ProfileSummary {
  let totalCorrect = 0
  let totalWrong = 0
  let bestAccuracy = 0
  let fastestMs: number | null = null

  for (const r of rows) {
    totalCorrect += r.correct_count
    totalWrong += r.wrong_count
    const acc = accuracyPct({ correctCount: r.correct_count, wrongCount: r.wrong_count })
    if (acc > bestAccuracy) bestAccuracy = acc
    if (typeof r.duration_ms === 'number' && r.duration_ms > 0) {
      if (fastestMs === null || r.duration_ms < fastestMs) fastestMs = r.duration_ms
    }
  }

  return {
    boardsCompleted: rows.length,
    totalCorrect,
    totalGuesses: totalCorrect + totalWrong,
    overallAccuracy: accuracyPct({ correctCount: totalCorrect, wrongCount: totalWrong }),
    bestAccuracy,
    fastestMs,
  }
}
