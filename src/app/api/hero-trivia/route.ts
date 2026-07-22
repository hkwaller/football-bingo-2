import { NextResponse } from 'next/server'
import { enrichedFootballPlayers } from '@/data/players'
import { getClubDisplayNames } from '@/data/clubs'
import { nationalities, achievements } from '@/data/categories'
import type { Player } from '@/types/player'

/**
 * Samples a fresh round of trivia questions from the *real* 641-player dataset
 * for the landing-page taster. Runs on the server so the 3MB player file is
 * never shipped to the client bundle — the browser only receives the handful
 * of questions it needs.
 */

export const dynamic = 'force-dynamic'

const ROUND_SIZE = 5

// Filter out youth / reserve / B-team entries so club questions stay fair.
function isSeniorClub(name: string): boolean {
  return !(
    /Yth\.|Youth/i.test(name) ||
    /\bSub-\d/i.test(name) ||
    /\bU\d{2}\b/i.test(name) ||
    /\bY\d{2}\b/.test(name) ||
    / [BC]$/.test(name) ||
    / II{1,2}$/.test(name) ||
    /\bPrimavera\b/i.test(name) ||
    /\bReserv/i.test(name) ||
    /\bJV\b/.test(name)
  )
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

type HeroQuestion = {
  name: string
  imageUrl: string
  prompt: string
  options: string[]
  correctAnswer: string
}

const ALL_SENIOR_CLUBS = getClubDisplayNames().filter(isSeniorClub)

function seniorClubs(player: Player): string[] {
  return player.clubs.filter(isSeniorClub)
}

function clubQuestion(player: Player): HeroQuestion | null {
  const owned = seniorClubs(player)
  if (!owned.length) return null
  const correct = pick(owned)
  const decoys = shuffle(ALL_SENIOR_CLUBS.filter((c) => !player.clubs.includes(c))).slice(0, 2)
  if (decoys.length < 2) return null
  return {
    name: player.name,
    imageUrl: player.imageUrl,
    prompt: `Which club did ${player.name} play for?`,
    options: shuffle([correct, ...decoys]),
    correctAnswer: correct,
  }
}

function nationalityQuestion(player: Player): HeroQuestion | null {
  if (!player.nationality) return null
  const decoys = shuffle(nationalities.filter((n) => n !== player.nationality)).slice(0, 2)
  if (decoys.length < 2) return null
  return {
    name: player.name,
    imageUrl: player.imageUrl,
    prompt: `What nationality is ${player.name}?`,
    options: shuffle([player.nationality, ...decoys]),
    correctAnswer: player.nationality,
  }
}

function trueFalseQuestion(player: Player): HeroQuestion | null {
  const owned = seniorClubs(player)
  if (!owned.length) return null
  const asTrue = Math.random() > 0.5
  const club = asTrue
    ? pick(owned)
    : pick(ALL_SENIOR_CLUBS.filter((c) => !player.clubs.includes(c)))
  if (!club) return null
  return {
    name: player.name,
    imageUrl: player.imageUrl,
    prompt: `${player.name} played for ${club}`,
    options: ['True', 'False'],
    correctAnswer: asTrue ? 'True' : 'False',
  }
}

function achievementQuestion(player: Player): HeroQuestion | null {
  const owned = player.achievements.filter((a) => achievements.includes(a))
  if (!owned.length) return null
  const correct = pick(owned)
  const decoys = shuffle(achievements.filter((a) => !player.achievements.includes(a))).slice(0, 2)
  if (decoys.length < 2) return null
  return {
    name: player.name,
    imageUrl: player.imageUrl,
    prompt: `Which of these has ${player.name} won?`,
    options: shuffle([correct, ...decoys]),
    correctAnswer: correct,
  }
}

// Players that carry enough data to build a fair, well-illustrated question.
const POOL = enrichedFootballPlayers.filter(
  (p) => !!p.imageUrl && !!p.nationality && seniorClubs(p).length > 0,
)

// Fame-weighted order (Efraimidis–Spirakis): key = random^(1/weight), highest
// keys first. Recognisable names dominate, but lower-fame players still slip in
// so the round stays a genuine challenge rather than the same five faces.
function famePriority(): Player[] {
  return [...POOL]
    .map((p) => {
      const fame = Math.max(p.fameScore, 1)
      return { p, key: Math.random() ** (1 / fame) }
    })
    .sort((a, b) => b.key - a.key)
    .map((x) => x.p)
}

function buildRound(): HeroQuestion[] {
  const builders = [clubQuestion, nationalityQuestion, trueFalseQuestion, achievementQuestion]
  const questions: HeroQuestion[] = []

  for (const player of famePriority()) {
    if (questions.length >= ROUND_SIZE) break
    // Try builders in a random order; achievement questions only work for
    // decorated players, so fall through to a shape this player supports.
    for (const build of shuffle(builders)) {
      const q = build(player)
      if (q) {
        questions.push(q)
        break
      }
    }
  }

  return questions
}

export function GET() {
  return NextResponse.json({ questions: buildRound() })
}
