import { enrichedFootballPlayers } from '@/data/players'
import { hashSeed, mulberry32 } from '@/lib/seeded'

/** Deterministic player index for this board seed and round (0-based). */
export function pickDraftPlayerIndex(seed: string, round: number): number {
  const rand = mulberry32(hashSeed(`draft|${seed}|${round}`))
  const n = enrichedFootballPlayers.length
  if (n === 0) return 0
  return Math.min(Math.floor(rand() * n), n - 1)
}

export function pickDraftPlayer(seed: string, round: number) {
  return enrichedFootballPlayers[pickDraftPlayerIndex(seed, round)]
}

export function draftPlayerPublic(seed: string, round: number) {
  const p = pickDraftPlayer(seed, round)
  if (!p) return null
  return {
    playerId: p.playerId,
    name: p.name,
    imageUrl: p.imageUrl,
  }
}
