/**
 * Data-integrity checks for the bingo category system. Run with `npm run verify:data`.
 *
 *  1. Every club/achievement/trait/manager category must match ≥1 player.
 *  2. Guardrail (Savic bug): report player club strings that DON'T resolve to a
 *     known canonical club - a missed alias for a tracked club hides here.
 *  3. Warn about categories with very few players (nearly unwinnable squares).
 */
import {
  achievements,
  clubs as clubCategories,
  managers,
  nationalities,
  traits,
} from '../src/data/categories'
import { getCanonicalName, isKnownClub } from '../src/data/clubs'
import { enrichedFootballPlayers } from '../src/data/players'

type P = (typeof enrichedFootballPlayers)[number]

const WARN_BELOW = 4
let failed = false

// ── 1 + 3: coverage per category kind ────────────────────────────────────────
function clubMatchCount(label: string): number {
  const target = getCanonicalName(label)
  let n = 0
  for (const p of enrichedFootballPlayers) {
    const names = [...(p.clubs ?? []), ...(p.youthClubs ?? [])]
    if (names.some((c) => getCanonicalName(c) === target)) n++
  }
  return n
}

function arrayMatchCount(label: string, sel: (p: P) => string[] | undefined): number {
  let n = 0
  for (const p of enrichedFootballPlayers) if ((sel(p) ?? []).includes(label)) n++
  return n
}

function checkKind(kind: string, labels: readonly string[], count: (label: string) => number) {
  const zero: string[] = []
  const low: { label: string; n: number }[] = []
  for (const label of labels) {
    const n = count(label)
    if (n === 0) zero.push(label)
    else if (n < WARN_BELOW) low.push({ label, n })
  }
  if (zero.length) {
    failed = true
    console.error(`✗ ${kind}: ${zero.length} categories with NO matching player:`)
    for (const l of zero) console.error(`    - ${l}`)
  }
  if (low.length) {
    console.warn(`⚠ ${kind}: ${low.length} categories with < ${WARN_BELOW} players:`)
    for (const { label, n } of low) console.warn(`    - ${label} (${n})`)
  }
  if (!zero.length && !low.length) {
    console.log(`✓ ${kind}: all ${labels.length} categories have ≥ ${WARN_BELOW} players.`)
  }
}

const nationalityCount = (label: string) =>
  enrichedFootballPlayers.filter((p) => p.nationality === label).length

checkKind('nationalities', nationalities, nationalityCount)
checkKind('clubs', clubCategories, clubMatchCount)
checkKind('achievements', achievements, (l) => arrayMatchCount(l, (p) => p.achievements))
checkKind('traits', traits, (l) => arrayMatchCount(l, (p) => (p as { tags?: string[] }).tags))
checkKind('managers', managers, (l) =>
  arrayMatchCount(l, (p) => (p as { managers?: string[] }).managers),
)

// ── 2: unresolved club strings (the Savic guardrail) ─────────────────────────
const unresolved = new Map<string, number>()
for (const p of enrichedFootballPlayers) {
  for (const c of p.clubs ?? []) {
    if (!isKnownClub(getCanonicalName(c))) {
      unresolved.set(c, (unresolved.get(c) ?? 0) + 1)
    }
  }
}
if (unresolved.size) {
  const sorted = [...unresolved.entries()].sort((a, b) => b[1] - a[1])
  console.warn(
    `\nℹ ${unresolved.size} distinct club strings on players don't resolve to a tracked club.`,
  )
  console.warn(
    '  (Untracked clubs are expected; scan for variants of tracked clubs needing an alias.)',
  )
  for (const [name, n] of sorted.slice(0, 40)) console.warn(`    ${String(n).padStart(4)}  ${name}`)
}

if (failed) {
  console.error('\nverify:data FAILED - some categories are unwinnable.')
  process.exit(1)
}
console.log('\nverify:data OK.')
