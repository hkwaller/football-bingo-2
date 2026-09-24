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

  const add = (name: string, fame: number) => {
    const key = normalize(name)
    if (!key) return
    const existing = byKey.get(key)
    if (!existing || fame > existing.fame) byKey.set(key, { display: name, key, fame })
  }

  // Main player pool - rich fame scores for good ranking.
  for (const p of enrichedFootballPlayers) add(p.name, p.fameScore ?? 0)

  // Famous 11s names - appear at fame=0 so they surface when typed but don't
  // dominate short queries (which would give away answers).
  for (const lineup of famousLineups) {
    for (const slot of lineup.slots) {
      add(slot.name, 0)
      for (const alias of slot.aliases ?? []) add(alias, 0)
    }
    if (lineup.manager) {
      add(lineup.manager.name, 0)
      for (const alias of lineup.manager.aliases ?? []) add(alias, 0)
    }
  }

  return [...byKey.values()]
})()

export interface NameSuggestion {
  name: string
}

/** Prefix matches rank above substring; within each group, by fame desc. */
export function searchFamous11sNames(query: string, limit = 8): NameSuggestion[] {
  const q = normalize(query)
  if (q.length < 2) return []

  const prefix: Entry[] = []
  const contains: Entry[] = []
  for (const e of ENTRIES) {
    if (e.key.startsWith(q)) prefix.push(e)
    else if (e.key.includes(q)) contains.push(e)
  }
  const byFame = (a: Entry, b: Entry) => b.fame - a.fame
  prefix.sort(byFame)
  contains.sort(byFame)
  return [...prefix, ...contains].slice(0, limit).map((e) => ({ name: e.display }))
}
