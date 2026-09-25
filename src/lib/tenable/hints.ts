import { enrichedFootballPlayers } from '@/data/players'
import { getKnownClubDisplayNames } from '@/data/clubs'
import type { TenableAnswer, TenableQuestion } from '@/data/tenable'
import type { Player } from '@/types/player'
import { normalize } from './normalize'
import type { TenableHint } from './types'

/**
 * Server-only (pulls in the 4.6MB player file). Prefers an unfound answer that we
 * have a full player record for - so hints point at a genuinely famous player -
 * and phrases a few clues about them. Clues the category already gives away
 * (every Brazilian at Barcelona is Brazilian and played for Barcelona) are
 * skipped by checking what most of the category's players have in common.
 * Once those run out, any unfound answer gets a plainer hint from the list itself,
 * so a hint is only unavailable when every unfound answer already has one.
 */

const byId = new Map(enrichedFootballPlayers.map((p) => [p.playerId, p]))
const byName = new Map(enrichedFootballPlayers.map((p) => [normalize(p.name), p]))

function playerFor(a: TenableAnswer): Player | undefined {
  if (a.id && byId.has(a.id)) return byId.get(a.id)
  for (const n of [a.name, ...(a.aliases ?? [])]) {
    const p = byName.get(normalize(n))
    if (p) return p
  }
  return undefined
}

/** Biggest honours first; the first one the category doesn't imply becomes a clue. */
const PRESTIGE = [
  "Ballon d'Or winner",
  'FIFA World Player of the Year',
  'World Cup winner',
  'Treble winner',
  'CL winner with different clubs',
  'CL winner',
  'Euro champion',
  'Copa America champion',
  'African Cup of Nations winner',
  'European Golden Boot winner',
  'CL top scorer',
  '500+ career goals',
  'Copa Libertadores winner',
  'Premier League top scorer',
  'La Liga top scorer',
  'Serie A top scorer',
  'Bundesliga top scorer',
  'Ligue 1 top scorer',
  'Premier League winner',
  'La Liga winner',
  'Serie A winner',
  'Bundesliga winner',
  'Ligue 1 winner',
  'UEFA Cup/Europa League winner',
  'League title in multiple countries',
  '200+ career goals',
  '100+ CL appearances',
  'Eredivisie winner',
  'FA Cup winner',
]

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** "Attacking Midfield" → "Attacking midfielder", "Centre-Forward" → "Centre-forward". */
function positionClue(main: string): string {
  const s = main.replace(/ Midfield$/, ' Midfielder').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function eraClue(p: Player): string | null {
  const m = /^(\d{4})-(\d{4}|present)$/.exec(p.era)
  if (m) return m[2] === 'present' ? `Active since ${m[1]}` : `Played ${m[1]}–${m[2]}`
  const year = Number(p.dateOfBirth?.slice(0, 4))
  return year ? `Born in the ${Math.floor(year / 10) * 10}s` : null
}

function initialsClue(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return `One name, starts with ${parts[0][0].toUpperCase()}`
  return `Initials ${parts.map((w) => `${w[0].toUpperCase()}.`).join(' ')}`
}

/** Clues that only need the answer itself: its place on the list, then initials. */
function listClues(question: TenableQuestion, a: TenableAnswer): string[] {
  const clues: string[] = []
  if (question.ordered) clues.push(a.detail ? `No. ${a.rank} · ${a.detail}` : `No. ${a.rank}`)
  else if (a.detail) clues.push(a.detail)
  clues.push(initialsClue(a.name))
  return clues
}

/** For answers without a player record: list clues plus the length of the name. */
function basicHint(question: TenableQuestion, a: TenableAnswer): TenableHint {
  const parts = a.name.split(/\s+/).filter(Boolean)
  const last = parts[parts.length - 1]
  const length =
    parts.length === 1 ? `${last.length} letters` : `Surname has ${last.length} letters`
  const clues = listClues(question, a)
  clues.splice(clues.length - 1, 0, length) // before the initials
  return { rank: a.rank, clues }
}

export function buildHint(question: TenableQuestion, excludeRanks: number[]): TenableHint | null {
  const excluded = new Set(excludeRanks)
  const linked = question.answers
    .map((a) => ({ a, p: playerFor(a) }))
    .filter((x): x is { a: TenableAnswer; p: Player } => !!x.p)
  const candidates = linked.filter((x) => !excluded.has(x.a.rank))
  if (!candidates.length) {
    const rest = question.answers.filter((a) => !excluded.has(a.rank))
    return rest.length ? basicHint(question, pick(rest)) : null
  }

  // Fame-weighted draw (Efraimidis–Spirakis): the big names come up most, but
  // not always the same one.
  const { a, p } = candidates
    .map((x) => ({ ...x, key: Math.random() ** (1 / Math.max(x.p.fameScore, 1)) }))
    .sort((x, y) => y.key - x.key)[0]

  // Something shared by most of the category's players is implied by the category.
  const share = (has: (q: Player) => boolean) =>
    linked.filter((x) => has(x.p)).length / linked.length
  const category = question.category.toLowerCase()

  const clues: string[] = []
  if (share((q) => q.position.main === p.position.main) < 0.7) {
    clues.push(positionClue(p.position.main))
  }
  const era = eraClue(p)
  if (era) clues.push(era)

  const extras: string[] = []
  const clubs = getKnownClubDisplayNames(p.clubs).filter(
    (c) =>
      !category.includes(c.toLowerCase()) &&
      share((q) => getKnownClubDisplayNames(q.clubs).includes(c)) < 0.4,
  )
  if (clubs.length) extras.push(`Played for ${pick(clubs)}`)
  const honour = PRESTIGE.find(
    (h) => p.achievements.includes(h) && share((q) => q.achievements.includes(h)) < 0.5,
  )
  if (honour) extras.push(honour.replace(/\bCL\b/, 'Champions League'))
  if (p.nationality && share((q) => q.nationality === p.nationality) < 0.5) {
    extras.push(`From ${p.nationality}`)
  }
  clues.push(...extras.slice(0, 2))

  clues.push(...listClues(question, a))

  return { rank: a.rank, clues }
}
