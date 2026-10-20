import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { getClubLogo } from './clubs'

test('crest lookup resolves canonical names, display names and aliases', () => {
  const crest = getClubLogo('Barcelona')
  assert.ok(crest)
  assert.equal(getClubLogo('FC Barcelona'), crest)
  assert.equal(getClubLogo('fc barcelona'), crest)
  assert.equal(getClubLogo('  BARCELONA  '), crest)
})

test('unknown clubs have no invented image path', () => {
  assert.equal(getClubLogo('Definitely not a football club 98765'), null)
})

test('club sides and opponents in Famous 11s all have crests', async () => {
  const { famousLineups } = await import('./famous11s/lineups')
  for (const lineup of famousLineups.filter(l => l.kind === 'club')) {
    for (const name of [lineup.side, lineup.opponent]) {
      if (name) assert.ok(getClubLogo(name), `Missing crest: ${name}`)
    }
  }
})

test('frequently occurring career clubs have crests', async () => {
  const { default: players } = await import('./careers/careers.json')
  const appearances = new Map<string, Set<string>>()
  for (const player of players) for (const spell of player.career) {
    for (const stint of [spell, ...spell.loans]) {
      const ids = appearances.get(stint.club) ?? new Set<string>()
      ids.add(player.id)
      appearances.set(stint.club, ids)
    }
  }
  for (const [name, ids] of appearances) {
    if (ids.size >= 8) assert.ok(getClubLogo(name), `Missing crest: ${name}`)
  }
})
