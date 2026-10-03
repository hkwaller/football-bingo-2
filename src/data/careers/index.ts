import 'server-only'
import type { CareerPlayer, CareersDifficultyFilter } from '@/lib/careers/types'
import careers from './careers.json'

/** Built by `npm run careers:build` - see scripts/buildCareers.ts. Server only: it's large. */
export const careerPlayers = careers as CareerPlayer[]

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * Random players for a run. Recently seen ids are skipped while the pool can
 * spare them, so back-to-back runs don't repeat.
 */
export function dealCareers(
  difficulty: CareersDifficultyFilter,
  count: number,
  recent: readonly string[] = [],
): CareerPlayer[] {
  const pool = careerPlayers.filter((p) => difficulty === 'mixed' || p.difficulty === difficulty)
  const seen = new Set(recent)
  const fresh = shuffle(pool.filter((p) => !seen.has(p.id)))
  if (fresh.length >= count) return fresh.slice(0, count)
  return [...fresh, ...shuffle(pool.filter((p) => seen.has(p.id)))].slice(0, count)
}
