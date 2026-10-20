import 'server-only'
import careers from '@/data/careers/careers.json'
import { clubs as curatedClubs, getClubLogo } from '@/data/clubs'
import { enrichedFootballPlayers } from '@/data/players'
import type { CareerPlayer } from '@/lib/careers/types'
import type {
  ClubCount,
  ConnectionsAnswer,
  ConnectionsClub,
  ConnectionsDifficulty,
  ConnectionsDifficultyFilter,
  ConnectionsPuzzle,
  ConnectionsStint,
} from '@/lib/connections/types'

/**
 * Connections puzzles, generated on the fly from who played where.
 *
 * The bank is every Careers player (Transfermarkt careers, youth and reserve
 * sides already dropped, loans included) plus the curated players Careers
 * leaves out for having too few clubs - the one- and two-club legends like
 * Gerrard and Xavi. Those come with club names only (no years), mapped onto
 * Transfermarkt ids by name.
 *
 * Every 2- and 3-club combination that at least one bank player fits is a
 * puzzle, so there is always a right answer. Only clubs with enough bank
 * players to be recognisable make the board.
 */

/** A club needs this many bank players to appear on a puzzle. */
const MIN_CLUB_PLAYERS = 8
/** Clubs ranked by bank players: the top ones are household names. */
const BIG_CLUB_RANK = 40
const KNOWN_CLUB_RANK = 100
/** Only the reveal's top answers need a photo; the rest stay light for room storage. */
const ANSWERS_WITH_IMAGES = 6

/** players.ts club names that don't match a Careers or curated name. */
const EXTRA_CLUB_ALIASES: Record<string, string> = {
  miami: '69261',
  vancouver: '6321',
  'stade rennais': '273',
  besiktas: '114',
  '1.fc köln': '3',
  "1.fc k'lautern": '2',
  'honvéd se': '709',
  'kispesti fc': '709',
}

interface BankPlayer {
  id: string
  name: string
  nationality: string
  position: string
  fame: number
  imageUrl?: string
  /** clubId → stints there, oldest first. */
  clubs: Map<string, ConnectionsStint[]>
}

const careerPlayers = careers as CareerPlayer[]

const clubNames = new Map<string, string>()
const idByName = new Map<string, string>()
for (const p of careerPlayers) {
  for (const spell of p.career) {
    for (const s of [spell, ...spell.loans]) {
      clubNames.set(s.clubId, s.club)
      idByName.set(s.club.toLowerCase(), s.clubId)
    }
  }
}
for (const c of curatedClubs) {
  for (const n of [c.canonicalName, c.displayName, ...(c.aliases ?? [])]) {
    idByName.set(n.toLowerCase(), c.id)
  }
}
for (const [name, id] of Object.entries(EXTRA_CLUB_ALIASES)) idByName.set(name, id)

function addStint(clubs: BankPlayer['clubs'], stint: ConnectionsStint) {
  const list = clubs.get(stint.clubId) ?? []
  list.push(stint)
  clubs.set(stint.clubId, list)
}

const BANK: BankPlayer[] = (() => {
  const out: BankPlayer[] = []
  const seen = new Set<string>()
  for (const p of careerPlayers) {
    const clubs: BankPlayer['clubs'] = new Map()
    for (const spell of p.career) {
      addStint(clubs, { clubId: spell.clubId, loan: !!spell.loan, from: spell.from, to: spell.to })
      for (const l of spell.loans) {
        addStint(clubs, { clubId: l.clubId, loan: true, from: l.from, to: l.to })
      }
    }
    for (const list of clubs.values()) list.sort((a, b) => (a.from ?? 0) - (b.from ?? 0))
    seen.add(p.id)
    out.push({
      id: p.id,
      name: p.name,
      nationality: p.nationality,
      position: p.position,
      fame: p.fame,
      ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
      clubs,
    })
  }
  for (const p of enrichedFootballPlayers) {
    if (seen.has(p.playerId)) continue
    const clubs: BankPlayer['clubs'] = new Map()
    for (const name of p.clubs) {
      const clubId = idByName.get(name.toLowerCase())
      if (clubId && !clubs.has(clubId)) addStint(clubs, { clubId, loan: false })
    }
    out.push({
      id: p.playerId,
      name: p.name,
      nationality: p.nationality,
      position: p.position.main,
      fame: p.fameScore ?? 0,
      ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
      clubs,
    })
  }
  return out.sort((a, b) => b.fame - a.fame)
})()

/** Every name in the bank. A guess that isn't one of these can't be proven wrong. */
export const connectionsBankNames: string[] = BANK.map((p) => p.name)

const playersByClub = new Map<string, BankPlayer[]>()
for (const p of BANK) {
  for (const clubId of p.clubs.keys()) {
    const list = playersByClub.get(clubId) ?? []
    list.push(p)
    playersByClub.set(clubId, list)
  }
}

/** Puzzle clubs, biggest first; the index is the club's rank. */
const POOL_CLUBS: string[] = [...playersByClub]
  .filter(([id, players]) => players.length >= MIN_CLUB_PLAYERS && clubNames.has(id))
  .sort((a, b) => b[1].length - a[1].length)
  .map(([id]) => id)
const clubRank = new Map(POOL_CLUBS.map((id, i) => [id, i]))

function clubOf(id: string): ConnectionsClub {
  const name = clubNames.get(id) ?? id
  return { id, name, logo: getClubLogo(name) }
}

function combinations(items: string[], k: number): string[][] {
  if (k === 0) return [[]]
  const out: string[][] = []
  items.forEach((item, i) => {
    for (const rest of combinations(items.slice(i + 1), k - 1)) out.push([item, ...rest])
  })
  return out
}

/**
 * How hard a puzzle is, from its most famous answer, how many answers there
 * are and how well known the clubs are.
 */
export function difficultyOf(
  answerFames: number[],
  ranks: number[],
  clubCount: ClubCount,
): ConnectionsDifficulty {
  const top = answerFames[0] ?? 0
  const count = answerFames.length
  const worstRank = Math.max(...ranks)
  const plenty = clubCount === 2 ? 4 : 2
  if (count >= plenty && top >= 60 && worstRank < BIG_CLUB_RANK) return 'easy'
  if (count === 1 && (top < 60 || worstRank >= KNOWN_CLUB_RANK)) return 'hard'
  if (count <= 2 && top < 50) return 'hard'
  return 'medium'
}

interface Candidate {
  clubIds: string[]
  difficulty: ConnectionsDifficulty
}

function buildCandidates(clubCount: ClubCount): Candidate[] {
  const keys = new Set<string>()
  for (const p of BANK) {
    const mine = [...p.clubs.keys()].filter((id) => clubRank.has(id))
    for (const combo of combinations(mine, clubCount)) keys.add(combo.sort().join('+'))
  }
  return [...keys].map((key) => {
    const clubIds = key.split('+')
    const fames = answersFor(clubIds).map((p) => p.fame)
    const ranks = clubIds.map((id) => clubRank.get(id)!)
    return { clubIds, difficulty: difficultyOf(fames, ranks, clubCount) }
  })
}

function answersFor(clubIds: string[]): BankPlayer[] {
  const [first, ...rest] = clubIds
  return (playersByClub.get(first!) ?? []).filter((p) => rest.every((id) => p.clubs.has(id)))
}

const CANDIDATES: Record<ClubCount, Candidate[]> = { 2: buildCandidates(2), 3: buildCandidates(3) }

/** Puzzle counts per difficulty, for the setup screen. */
export function connectionsPoolSizes(): Record<ClubCount, Record<ConnectionsDifficulty, number>> {
  const count = (c: ClubCount) => {
    const out: Record<ConnectionsDifficulty, number> = { easy: 0, medium: 0, hard: 0 }
    for (const p of CANDIDATES[c]) out[p.difficulty]++
    return out
  }
  return { 2: count(2), 3: count(3) }
}

function toAnswer(p: BankPlayer, clubIds: string[], index: number): ConnectionsAnswer {
  return {
    id: p.id,
    name: p.name,
    nationality: p.nationality,
    position: p.position,
    fame: p.fame,
    ...(p.imageUrl && index < ANSWERS_WITH_IMAGES ? { imageUrl: p.imageUrl } : {}),
    stints: clubIds
      .flatMap((id) => p.clubs.get(id) ?? [])
      .sort((a, b) => (a.from ?? 0) - (b.from ?? 0)),
  }
}

export function buildPuzzle(clubIds: string[], difficulty: ConnectionsDifficulty): ConnectionsPuzzle {
  const ids = [...clubIds].sort()
  // Bigger club first reads better: "Liverpool & LA Galaxy".
  const shown = [...ids].sort((a, b) => (clubRank.get(a) ?? 1e9) - (clubRank.get(b) ?? 1e9))
  return {
    id: ids.join('+'),
    clubs: shown.map(clubOf),
    answers: answersFor(ids).map((p, i) => toAnswer(p, shown, i)),
    difficulty,
  }
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * Random puzzles for a run. No club appears twice in a run while the pool can
 * help it, and recently played puzzle ids are skipped where possible.
 */
export function dealConnections(
  difficulty: ConnectionsDifficultyFilter,
  clubCount: ClubCount,
  count: number,
  recent: readonly string[] = [],
): ConnectionsPuzzle[] {
  const pool = CANDIDATES[clubCount].filter(
    (c) => difficulty === 'mixed' || c.difficulty === difficulty,
  )
  const seen = new Set(recent)
  const key = (c: Candidate) => c.clubIds.join('+')
  const ordered = [
    ...shuffle(pool.filter((c) => !seen.has(key(c)))),
    ...shuffle(pool.filter((c) => seen.has(key(c)))),
  ]

  const picked: Candidate[] = []
  const usedClubs = new Set<string>()
  for (const c of ordered) {
    if (picked.length >= count) break
    if (c.clubIds.some((id) => usedClubs.has(id))) continue
    picked.push(c)
    for (const id of c.clubIds) usedClubs.add(id)
  }
  // Small pools: allow repeat clubs rather than a short run.
  for (const c of ordered) {
    if (picked.length >= count) break
    if (!picked.includes(c)) picked.push(c)
  }
  return picked.map((c) => buildPuzzle(c.clubIds, c.difficulty))
}
