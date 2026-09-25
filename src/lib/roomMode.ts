/**
 * Co-op vs versus rules shared by the turn-based rooms (Tenable, Famous 11s).
 *
 * Both modes play one shared board and take turns. What differs is whose pool a
 * life (or hint) comes out of:
 * - versus: every player has their own lives/hints; a player who runs out sits
 *   out the rest of the category, and the most points wins.
 * - coop: the room draws from one team pool; points are summed into a team score
 *   (each player's own tally is still shown as their contribution).
 *
 * Pools are stored as "used" counters keyed by player id (or TEAM_KEY in co-op),
 * so a player who joins mid-game starts with a full pool.
 */

export type RoomPlayMode = 'versus' | 'coop'

export const DEFAULT_ROOM_PLAY_MODE: RoomPlayMode = 'versus'

export const ROOM_PLAY_MODES: Array<{ value: RoomPlayMode; label: string; explainer: string }> = [
  { value: 'versus', label: 'Versus', explainer: 'Own lives, own points - top scorer wins' },
  { value: 'coop', label: 'Co-op', explainer: 'Shared lives, one team score' },
]

export const ROOM_PLAY_MODE_LABEL: Record<RoomPlayMode, string> = {
  versus: 'Versus',
  coop: 'Co-op',
}

/** Pool key for the whole team in co-op. */
export const TEAM_KEY = '__team'

/** Pool (lives, hints) a player draws from under the given mode. */
export function poolKey(mode: RoomPlayMode, playerId: string): string {
  return mode === 'coop' ? TEAM_KEY : playerId
}

/** Pool key → amount used. Stored as a JSON string in Liveblocks storage. */
export type UsedCounts = Record<string, number>

export function parseUsedCounts(json: string | null | undefined): UsedCounts {
  try {
    const v = JSON.parse(json ?? '{}')
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as UsedCounts) : {}
  } catch {
    return {}
  }
}

export function bumpUsed(counts: UsedCounts, key: string, by = 1): UsedCounts {
  return { ...counts, [key]: (counts[key] ?? 0) + by }
}

/** What's left in a pool of `max`. */
export function leftFor(used: UsedCounts, key: string, max: number): number {
  return Math.max(0, max - (used[key] ?? 0))
}

/** Whether this player has no lives left under the given mode. */
export function isOutOfLives(
  mode: RoomPlayMode,
  livesLost: UsedCounts,
  playerId: string,
  maxLives: number,
): boolean {
  return leftFor(livesLost, poolKey(mode, playerId), maxLives) <= 0
}

/** Category over by lives: the team pool is empty (co-op) or every present player is out (versus). */
export function everyoneOutOfLives(
  mode: RoomPlayMode,
  livesLost: UsedCounts,
  presentIds: string[],
  maxLives: number,
): boolean {
  if (mode === 'coop') return leftFor(livesLost, TEAM_KEY, maxLives) <= 0
  return presentIds.length > 0 && presentIds.every((id) => leftFor(livesLost, id, maxLives) <= 0)
}

/**
 * Next player after `current` in the sorted ring of present players, skipping
 * anyone who can't play (out of lives). Falls back to `current` if nobody else can.
 */
export function nextTurnPlayer(
  current: string | null,
  presentIds: string[],
  canPlay: (id: string) => boolean = () => true,
): string | null {
  if (!presentIds.length) return null
  const ring = [...presentIds].sort()
  const start = current == null ? -1 : ring.indexOf(current)
  for (let step = 1; step <= ring.length; step++) {
    const id = ring[(start + step + ring.length) % ring.length]
    if (canPlay(id)) return id
  }
  return current
}

/** Sum of every player's points - the co-op team score. */
export function teamScore(scores: number[]): number {
  return scores.reduce((a, b) => a + b, 0)
}
