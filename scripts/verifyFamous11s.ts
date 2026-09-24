/**
 * Verify and enrich the Famous 11s lineup bank.
 *
 * Run: npx tsx scripts/verifyFamous11s.ts
 *
 * For each slot in every lineup:
 *   1. Tries to find the player in enrichedFootballPlayers by name/alias match.
 *   2. If found, backfills playerId + image URL into enrichment.json.
 *   3. WARNS on names that can't be matched (fix spelling, add alias, or add to
 *      manualPlayers.ts if the player should be in the main pool).
 *
 * enrichment.json is keyed by "<lineupId>#<slotId>" for players and
 * "<lineupId>#manager" for managers.
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'

// We load directly from the ts source files, not the compiled module.
// Use tsx to execute this script.

async function main() {
  // Dynamic imports to use the already-compiled data at runtime.
  const { famousLineups } = await import('../src/data/famous11s/lineups.js').catch(
    () => import('../src/data/famous11s/lineups'),
  )
  const { enrichedFootballPlayers } = await import('../src/data/players.js').catch(
    () => import('../src/data/players'),
  )

  // ── Normalise helper (same as Tenable) ────────────────────────────────────
  const TRANSLITERATION: Record<string, string> = {
    ø: 'o',
    œ: 'oe',
    æ: 'ae',
    ð: 'd',
    þ: 'th',
    ł: 'l',
    đ: 'd',
    ħ: 'h',
    ı: 'i',
    ĸ: 'k',
    ŋ: 'ng',
    ß: 'ss',
    ẞ: 'ss',
  }
  function normalize(input: string): string {
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[øœæðþłđħıĸŋßẞ]/g, (ch) => TRANSLITERATION[ch] ?? ch)
      .replace(/[''`]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
  }

  // ── Build player lookup by normalized name ────────────────────────────────
  type PlayerLite = { playerId: string; name: string; imageUrl?: string }
  const byKey = new Map<string, PlayerLite>()
  for (const p of enrichedFootballPlayers as PlayerLite[]) {
    const key = normalize(p.name)
    if (key && !byKey.has(key)) byKey.set(key, p)
  }

  // ── Walk all lineups ──────────────────────────────────────────────────────
  const enrichment: Record<string, { playerId?: string; image?: string }> = {}
  const warnings: string[] = []

  for (const lineup of famousLineups as typeof import('../src/data/famous11s/lineups').famousLineups) {
    for (const slot of lineup.slots) {
      const candidates = [slot.name, ...(slot.aliases ?? [])]
      let found: PlayerLite | undefined
      for (const c of candidates) {
        found = byKey.get(normalize(c))
        if (found) break
      }
      const key = `${lineup.id}#${slot.slotId}`
      if (found) {
        const entry: { playerId?: string; image?: string } = {}
        if (found.playerId) entry.playerId = found.playerId
        if (found.imageUrl) entry.image = found.imageUrl
        if (Object.keys(entry).length) enrichment[key] = entry
      } else {
        warnings.push(
          `[WARN] ${lineup.id} / ${slot.slotId}: "${slot.name}" not found in player pool`,
        )
      }
    }

    // Manager
    if (lineup.manager) {
      const m = lineup.manager
      const candidates = [m.name, ...(m.aliases ?? [])]
      let found: PlayerLite | undefined
      for (const c of candidates) {
        found = byKey.get(normalize(c))
        if (found) break
      }
      const key = `${lineup.id}#manager`
      if (found) {
        const entry: { playerId?: string; image?: string } = {}
        if (found.playerId) entry.playerId = found.playerId
        if (found.imageUrl) entry.image = found.imageUrl
        if (Object.keys(entry).length) enrichment[key] = entry
      }
      // Not all managers are in the player pool - that's expected, no warning.
    }
  }

  // ── Write enrichment.json ─────────────────────────────────────────────────
  const outPath = resolve(__dirname, '../src/data/famous11s/enrichment.json')
  writeFileSync(outPath, JSON.stringify(enrichment, null, 2) + '\n')
  console.log(`✓ Written ${Object.keys(enrichment).length} enrichment entries to ${outPath}`)

  // ── Report ────────────────────────────────────────────────────────────────
  if (warnings.length) {
    console.log('\nWarnings (names not matched in player pool - normal for historical players):')
    for (const w of warnings) console.log(w)
  } else {
    console.log('✓ All names matched in player pool')
  }
  console.log(`\n${famousLineups.length} lineups · ${warnings.length} unmatched names`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
