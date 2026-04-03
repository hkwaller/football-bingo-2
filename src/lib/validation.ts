import { toBackendClubName } from '@/data/clubMapping'
import { enrichedFootballPlayers } from '@/data/players'
import { getCategoryKind } from '@/lib/canonical'

export type EnrichedPlayer = (typeof enrichedFootballPlayers)[number]

export function findPlayerById(playerId: string): EnrichedPlayer | undefined {
  return enrichedFootballPlayers.find((p) => p.playerId === playerId)
}

function clubMatches(player: EnrichedPlayer, categoryLabel: string): boolean {
  const target = toBackendClubName(categoryLabel)
  const names = [
    ...(player.clubs ?? []),
    ...(player.youthClubs ?? []),
  ]
  return names.some((c) => toBackendClubName(c) === target)
}

export function playerMatchesCategory(
  player: EnrichedPlayer,
  categoryLabel: string,
): boolean {
  const kind = getCategoryKind(categoryLabel)
  if (!kind) return false
  if (kind === 'nationality') {
    return player.nationality === categoryLabel
  }
  if (kind === 'club') {
    return clubMatches(player, categoryLabel)
  }
  const ach = player.achievements as readonly string[] | undefined
  return ach?.includes(categoryLabel) ?? false
}

export function validateCellAnswer(
  categoryLabel: string,
  playerId: string,
): { ok: true; player: EnrichedPlayer } | { ok: false; reason: string } {
  const player = findPlayerById(playerId)
  if (!player) return { ok: false, reason: 'Unknown player' }
  if (!getCategoryKind(categoryLabel))
    return { ok: false, reason: 'Invalid category' }
  if (!playerMatchesCategory(player, categoryLabel))
    return { ok: false, reason: 'Player does not match this square' }
  return { ok: true, player }
}

const searchIndex = (() => {
  const lowerNames = enrichedFootballPlayers.map((p) => p.name.toLowerCase())
  return { lowerNames, players: enrichedFootballPlayers }
})()

export function searchPlayers(query: string, limit: number): EnrichedPlayer[] {
  const q = query.trim().toLowerCase()
  if (q.length < 1) return []
  const out: EnrichedPlayer[] = []
  for (let i = 0; i < searchIndex.players.length && out.length < limit; i++) {
    if (searchIndex.lowerNames[i].includes(q)) {
      out.push(searchIndex.players[i])
    }
  }
  return out
}
