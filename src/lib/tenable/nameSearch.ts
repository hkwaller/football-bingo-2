import { enrichedFootballPlayers } from '@/data/players'
import { tenableQuestions } from '@/data/tenable'
import { normalize } from './normalize'

type Entry = { display: string; key: string; fame: number }

/**
 * Autocomplete pool = the players we already curate for the other game modes
 * (`enrichedFootballPlayers`, all genuinely notable) + every Tenable answer name
 * (so any answer is suggestable). No giant scraped list — every suggestion is a
 * player worth knowing, which is exactly the decoy set we want. Built once.
 *
 * Ranked by `fameScore` so the biggest names surface first. Answer-only names
 * (legends not in our 641) get a low default so they don't get spotlighted at
 * the top of short queries — you reveal them by typing more.
 */
const ENTRIES: Entry[] = (() => {
  const byKey = new Map<string, Entry>()
  const add = (name: string, fame: number) => {
    const key = normalize(name)
    if (!key) return
    const existing = byKey.get(key)
    if (!existing || fame > existing.fame) byKey.set(key, { display: name, key, fame })
  }
  for (const p of enrichedFootballPlayers) add(p.name, p.fameScore ?? 0)
  for (const q of tenableQuestions) {
    for (const a of q.answers) {
      add(a.name, 0)
      for (const alias of a.aliases ?? []) add(alias, 0)
    }
  }
  return [...byKey.values()]
})()

export interface NameSuggestion {
  name: string
}

/** Prefix matches rank above substring matches; within each, by fame desc. */
export function searchNames(query: string, limit = 8): NameSuggestion[] {
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
