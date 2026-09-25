import { enrichedFootballPlayers } from '@/data/players'
import { famousLineups } from '@/data/famous11s'
import { normalize } from '@/lib/tenable/normalize'

type Entry = { display: string; key: string; fame: number }

/**
 * Autocomplete pool = enrichedFootballPlayers (641 notable players) + every
 * Famous 11s slot name/alias + every manager name/alias. This means any correct
 * answer is always suggestable while also providing useful decoys.
 * Built once at module load time.
 */
const ENTRIES: Entry[] = (() => {
  const byKey = new Map<string, Entry>()

  // displayOverride: store a different display string than the lookup key.
  // Used for aliases so "Guivarch" (key) → "Stéphane Guivarch" (display).
  const add = (name: string, fame: number, displayOverride?: string) => {
    const key = normalize(name)
    if (!key) return
    const display = displayOverride ?? name
    const existing = byKey.get(key)
    if (!existing || fame > existing.fame) byKey.set(key, { display, key, fame })
  }

  // Main player pool - rich fame scores for good ranking.
  for (const p of enrichedFootballPlayers) add(p.name, p.fameScore ?? 0)

  // Famous 11s names - appear at fame=0 so they surface when typed but don't
  // dominate short queries (which would give away answers).
  for (const lineup of famousLineups) {
    for (const slot of lineup.slots) {
      add(slot.name, 0)
      // Aliases use the canonical full name as display so the dropdown never
      // shows a bare surname like "Guivarch" alongside "Stéphane Guivarch".
      for (const alias of slot.aliases ?? []) add(alias, 0, slot.name)
    }
    if (lineup.manager) {
      add(lineup.manager.name, 0)
      for (const alias of lineup.manager.aliases ?? []) add(alias, 0, lineup.manager.name)
    }
    // Squad members appear in autocomplete but are wrong answers - this lets
    // players type a name from the squad and get a "not in this lineup" response
    // rather than no autocomplete at all.
    for (const name of lineup.squad ?? []) add(name, 0)
  }

  return [...byKey.values()]
})()

export interface NameSuggestion {
  name: string
}

/**
 * An exact name/alias match ranks first (so a typed surname like "Vieira" puts
 * "Patrick Vieira" on top for Enter to pick), then prefix matches, then
 * substring; within each group, by fame desc.
 */
export function searchFamous11sNames(query: string, limit = 8): NameSuggestion[] {
  const q = normalize(query)
  if (q.length < 2) return []

  const exact: Entry[] = []
  const prefix: Entry[] = []
  const contains: Entry[] = []
  for (const e of ENTRIES) {
    if (e.key === q) exact.push(e)
    else if (e.key.startsWith(q)) prefix.push(e)
    else if (e.key.includes(q)) contains.push(e)
  }
  const byFame = (a: Entry, b: Entry) => b.fame - a.fame
  prefix.sort(byFame)
  contains.sort(byFame)

  // Deduplicate by display name (alias entries share the canonical display).
  const seen = new Set<string>()
  const results: NameSuggestion[] = []
  for (const e of [...exact, ...prefix, ...contains]) {
    const dk = normalize(e.display)
    if (!seen.has(dk)) {
      seen.add(dk)
      results.push({ name: e.display })
    }
    if (results.length >= limit) break
  }
  return results
}
