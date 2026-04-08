import { clubs } from '../src/data/categories'
import { getCanonicalName } from '../src/data/clubs'
import { enrichedFootballPlayers } from '../src/data/players'

const playerClubSet = new Set<string>()
for (const p of enrichedFootballPlayers) {
  for (const c of p.clubs ?? []) playerClubSet.add(c)
  for (const c of p.youthClubs ?? []) playerClubSet.add(c)
}

const missing: { category: string; canonical: string }[] = []
for (const c of clubs) {
  const canonical = getCanonicalName(c)
  if (!playerClubSet.has(canonical)) missing.push({ category: c, canonical })
}

if (missing.length) {
  console.error('Clubs in categories with no matching player.clubs entry:')
  console.error(missing)
  process.exit(1)
}
console.log('OK: all category clubs exist on at least one player.')
