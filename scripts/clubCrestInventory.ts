import { clubs } from '../src/data/clubs'
import careers from '../src/data/careers/careers.json'
import { enrichedFootballPlayers } from '../src/data/players'
import { famousLineups } from '../src/data/famous11s/lineups'

/** All names shown by games, grouped by stable club ID where available. */
export function clubCrestInventory(): string[][] {
  const groups = new Map<string, Set<string>>()
  const add = (id: string, names: string[]) => {
    const group = groups.get(id) ?? new Set<string>()
    for (const name of names) group.add(name)
    groups.set(id, group)
  }
  for (const c of clubs) add(c.id, [c.displayName, c.canonicalName, ...(c.aliases ?? [])])
  for (const p of careers) for (const s of p.career) {
    for (const stint of [s, ...s.loans]) add(stint.clubId, [stint.club])
  }
  const known = new Map<string, string>()
  for (const [id, names] of groups) for (const name of names) known.set(name, id)
  for (const p of enrichedFootballPlayers) for (const name of p.clubs) add(known.get(name) ?? `name:${name}`, [name])
  for (const lineup of famousLineups.filter(l => l.kind === 'club')) {
    for (const name of [lineup.side, lineup.opponent]) {
      if (name) add(known.get(name) ?? `name:${name}`, [name])
    }
  }
  return [...groups.values()].map(names => [...names])
}
