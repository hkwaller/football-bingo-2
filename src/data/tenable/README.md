# Tenable data

The **Tenable** game mode: a category with exactly ten correct answers; the player
names as many as they can.

## Adding a category

1. **Edit `questions.ts`** — append one `TenableQuestion` with exactly 10 `answers`
   (`rank` 1..10, a `name`, ideally a `detail` figure). Don't set `image`/`id` by hand.
   ```ts
   {
     id: 'swe-scorers',
     category: 'Top 10 Sweden goalscorers (men)',
     prompt: 'Most goals for the Sweden men’s national team',
     group: 'international',
     ordered: true,
     difficulty: 'hard',
     answers: [
       { rank: 1, name: 'Zlatan Ibrahimović', detail: '62 goals' },
       // …9 more
     ],
   }
   ```
2. **`npm run tenable:verify`** — validates structure and backfills portraits into
   `enrichment.json`. It **warns** on any name it can't resolve to a portrait; a miss just
   means "no image" (a name chip renders instead), not "unplayable". Fix genuine typos, or
   add an `aliases` entry for alternate spellings.
3. Play it. Answers are matched via the shared `normalize()` (accents, ø/ß/ł, punctuation all
   folded), so a user can type "orjan"/"muller" without the special keys. Only add `aliases`
   for genuinely different spellings or nicknames.

## Two kinds of category

- **`ranked`** (default): a fixed top-10 where order matters — exactly 10 answers, filled into
  their rank slots (e.g. "Top 10 Premier League goalscorers").
- **`open`**: set-membership — a larger valid set where the player names **any ten** (e.g.
  "Swedes in the Premier League"). Set `kind: 'open'`, `ordered: false`, and list ≥10 members;
  `rank` is just a stable id. Answers fill in the order named; on round-over the board shows a
  few of the members you missed. Curate the set from knowledge (web-verify if you like) — the
  Kaggle CSV can only source current squads, not all-time membership.

## Files

- `questions.ts` — **the curated bank (edit this).**
- `types.ts` — `TenableQuestion` / `TenableAnswer` shapes.
- `index.ts` — merges `enrichment.json` onto answers + seeded question selection.
- `enrichment.json` — generated portraits (`npm run tenable:verify`). Do not edit.

## Autocomplete pool

The typeahead pool is built **at runtime** in `src/lib/tenable/nameSearch.ts` from
`enrichedFootballPlayers` (the ~640 players we already curate for the other modes) + every
Tenable answer name. So every suggestion is a genuinely notable player — no scraped long tail —
and suggestions rank by `fameScore`. There is no generated name-index file.

## Why curated?

The transfermarkt-api has no leaderboard endpoints, and our decorated `players.ts` stores
career totals (not competition/international splits), so real-world "top 10" lists can be
neither fetched nor derived — they're authored by hand. The Kaggle `datasets/players.csv` is
used **only** to backfill best-effort answer portraits: `npm run tenable:index` builds a
name→{id,image} lookup, then `npm run tenable:verify` merges portraits into `enrichment.json`.
