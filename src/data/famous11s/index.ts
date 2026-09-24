import { hashSeed, mulberry32, shuffle } from '@/lib/seeded'
import { famousLineups as rawLineups } from './lineups'
import enrichment from './enrichment.json'
import { enrichedFootballPlayers } from '@/data/players'
import { normalize } from '@/lib/tenable/normalize'
import type { Famous11sLineup, LineupDifficulty, LineupEra, LineupKind } from './types'

export type {
  Famous11sLineup,
  LineupSlot,
  ManagerSlot,
  LineupKind,
  LineupEra,
  LineupDifficulty,
} from './types'

/**
 * Curated bank with portraits merged in.
 *
 * Priority order for images:
 *   1. Hand-authored `slot.image` (never set in practice)
 *   2. `enrichment.json` — written by `npm run famous11s:verify`
 *   3. Live lookup against `enrichedFootballPlayers` by normalized name match
 *
 * Step 3 means portraits work out-of-the-box without running the verify script.
 */
const enrichmentMap = enrichment as Record<string, { playerId?: string; image?: string }>

// Build a fast normalized-name → { playerId, imageUrl } lookup from the
// enriched player pool (954 players, built once at module load).
const playerByNormName = new Map<string, { playerId: string; imageUrl: string }>()
for (const p of enrichedFootballPlayers) {
  if (p.imageUrl) {
    playerByNormName.set(normalize(p.name), { playerId: p.playerId, imageUrl: p.imageUrl })
  }
}

/** Try all name candidates (name + aliases) against the live player pool. */
function resolveImage(name: string, aliases?: string[]): { playerId?: string; image?: string } {
  for (const candidate of [name, ...(aliases ?? [])]) {
    const hit = playerByNormName.get(normalize(candidate))
    if (hit) return { playerId: hit.playerId, image: hit.imageUrl }
  }
  return {}
}

export const famousLineups: Famous11sLineup[] = rawLineups.map((lineup) => ({
  ...lineup,
  slots: lineup.slots.map((slot) => {
    const key = `${lineup.id}#${slot.slotId}`
    const fromEnrichment = enrichmentMap[key]
    const fromPlayers = resolveImage(slot.name, slot.aliases)
    return {
      ...slot,
      playerId: slot.playerId ?? fromEnrichment?.playerId ?? fromPlayers.playerId,
      image: slot.image ?? fromEnrichment?.image ?? fromPlayers.image,
    }
  }),
  manager: lineup.manager
    ? (() => {
        const key = `${lineup.id}#manager`
        const fromEnrichment = enrichmentMap[key]
        const fromPlayers = resolveImage(lineup.manager.name, lineup.manager.aliases)
        return {
          ...lineup.manager,
          playerId: lineup.manager.playerId ?? fromEnrichment?.playerId ?? fromPlayers.playerId,
          image: lineup.manager.image ?? fromEnrichment?.image ?? fromPlayers.image,
        }
      })()
    : undefined,
}))

export function getLineupById(id: string): Famous11sLineup | undefined {
  return famousLineups.find((l) => l.id === id)
}

export function getLineupsByKind(kind: LineupKind): Famous11sLineup[] {
  return famousLineups.filter((l) => l.kind === kind)
}

export interface SelectLineupOptions {
  kind?: LineupKind | 'all'
  era?: LineupEra | 'all'
  difficulty?: LineupDifficulty | 'mixed'
  excludeIds?: string[]
}

/**
 * Deterministically pick `count` lineups for a session. Same seed + filters →
 * same set (so a puzzle is stable/shareable).
 */
export function selectLineups(
  seed: string,
  count: number,
  opts?: SelectLineupOptions,
): Famous11sLineup[] {
  const kind = opts?.kind
  const era = opts?.era
  const difficulty = opts?.difficulty
  const excluded = new Set(opts?.excludeIds ?? [])

  const pool = famousLineups.filter((l) => {
    if (excluded.has(l.id)) return false
    if (kind && kind !== 'all' && l.kind !== kind) return false
    if (era && era !== 'all' && l.era !== era) return false
    if (difficulty && difficulty !== 'mixed' && l.difficulty !== difficulty) return false
    return true
  })

  const rand = mulberry32(hashSeed(seed))
  return shuffle(pool, rand).slice(0, count)
}

/** Total players (slots) in a lineup - 11 plus 1 for manager if present. */
export function lineupTarget(lineup: Famous11sLineup, includeManager: boolean): number {
  return lineup.slots.length + (includeManager && lineup.manager ? 1 : 0)
}
