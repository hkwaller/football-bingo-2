/**
 * Famous 11s data shapes.
 *
 * Each Famous11sLineup is a curated historical starting XI. Slots store
 * player info + pitch coordinates (x/y as 0-100 percentages). The pitch
 * is displayed vertically (attacking end at top, GK end at bottom):
 *   - y = 0  → attacking end (strikers)
 *   - y = 100 → GK end
 *   - x = 0  → left touchline
 *   - x = 100 → right touchline
 *
 * image/playerId are backfilled by `scripts/verifyFamous11s.ts` from the
 * enrichedFootballPlayers pool - never authored by hand.
 */

export interface LineupSlot {
  /** Stable ID within this lineup, e.g. "gk", "rb", "cb1", "st2". */
  slotId: string
  /** Short position label shown on empty slot, e.g. "GK", "CB", "ST". */
  positionLabel: string
  /** Pitch x-coordinate as percentage (0=left, 100=right). */
  x: number
  /** Pitch y-coordinate as percentage (0=attacking top, 100=GK end). */
  y: number
  /** Canonical player name, e.g. "Zinedine Zidane". */
  name: string
  /** Additional accepted spellings / nicknames. */
  aliases?: string[]
  /** Transfermarkt player ID - backfilled by verify script. */
  playerId?: string
  /** Portrait URL - backfilled by verify script from enrichedFootballPlayers. */
  image?: string
}

export interface ManagerSlot {
  name: string
  aliases?: string[]
  /** Transfermarkt player ID - backfilled if this manager is in our 641. */
  playerId?: string
  image?: string
}

export type LineupKind = 'national' | 'club'
export type LineupDifficulty = 'easy' | 'medium' | 'hard'

export interface Famous11sLineup {
  /** Stable slug, e.g. "france-wc98-final". */
  id: string
  /** Headline shown to the player, e.g. "France 1998 · World Cup Final". */
  title: string
  /** Subtitle / context, e.g. "vs Brazil · 12 July 1998 · Stade de France". */
  prompt: string
  kind: LineupKind
  year: number
  /** Competition name, e.g. "World Cup", "Champions League", "Premier League". */
  competition: string
  /** Formation string for display, e.g. "4-3-2-1". */
  formation: string
  difficulty: LineupDifficulty
  /** Exactly 11 starting players. */
  slots: LineupSlot[]
  /** Manager/coach - optional bonus slot; included in game only when config.includeManager is on. */
  manager?: ManagerSlot
}
