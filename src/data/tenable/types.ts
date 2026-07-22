/**
 * Tenable data shapes.
 *
 * An answer is intentionally lightweight — essentially just a name. Real-world
 * "top 10" lists can't be fetched (the transfermarkt-api has no leaderboards)
 * nor derived from our decorated players (they store career totals, not
 * competition splits), so the ordered answers are curated by hand in
 * `questions.ts`. `image`/`id`/full-name aliases are backfilled from the Kaggle
 * CSVs by `scripts/verifyTenable.ts` — never authored by hand.
 */

export type TenableGroup =
  | 'league'
  | 'club'
  | 'international'
  | 'competition'
  | 'transfers'
  | 'misc'

export type TenableDifficulty = 'easy' | 'medium' | 'hard'

/**
 * 'ranked' = a fixed top-10 where order matters (exactly 10 answers).
 * 'open'   = a set-membership category ("Swedes in the Premier League") with MORE
 *            than 10 valid members; the player names any 10. Order is irrelevant.
 */
export type TenableKind = 'ranked' | 'open'

export interface TenableAnswer {
  /** Unique id within the question. For 'ranked' it's the 1..10 position; for
   *  'open' it's just a stable id (fill order is by when the player names them). */
  rank: number
  /** Canonical display name, e.g. "Alan Shearer". */
  name: string
  /** Extra accepted spellings. Author-added; the verify script also appends full_name. */
  aliases?: string[]
  /** Reveal caption, e.g. "260 goals". */
  detail?: string
  /** Portrait URL, backfilled by the verify script (best-effort, optional). */
  image?: string
  /** Transfermarkt player_id from the CSV, backfilled by the verify script. */
  id?: string
}

export interface TenableQuestion {
  /** Stable slug, e.g. "pl-top-scorers". */
  id: string
  /** Headline shown to the player, e.g. "Top 10 Premier League goalscorers". */
  category: string
  /** Fuller subtitle / clarification. */
  prompt: string
  group: TenableGroup
  /** Defaults to 'ranked'. 'open' = name any ten of a larger valid set. */
  kind?: TenableKind
  /** true = rank order is meaningful (answers fill their exact slot). Always false for 'open'. */
  ordered: boolean
  difficulty: TenableDifficulty
  /** 'ranked' → exactly 10, ordered by `rank`. 'open' → the full valid set (≥10). */
  answers: TenableAnswer[]
}
