import { clubs } from '../src/data/categories'
import { toBackendClubName } from '../src/data/clubMapping'
import { enrichedFootballPlayers } from '../src/data/players'

const playerClubSet = new Set<string>()
for (const p of enrichedFootballPlayers) {
  for (const c of p.clubs ?? []) playerClubSet.add(c)
  for (const c of p.youthClubs ?? []) playerClubSet.add(c)
}

const missing: { category: string; backend: string }[] = []
for (const c of clubs) {
  const backend = toBackendClubName(c)
  if (!playerClubSet.has(backend)) missing.push({ category: c, backend })
}

if (missing.length) {
  console.error('Clubs in categories with no matching player.clubs entry:')
  console.error(missing)
  process.exit(1)
}
console.log('OK: all category clubs exist on at least one player.')
