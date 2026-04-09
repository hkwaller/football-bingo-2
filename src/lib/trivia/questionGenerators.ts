import { hashSeed, mulberry32, shuffle } from '@/lib/seeded'
import { nationalities, clubs, achievements } from '@/data/categories'
import type { Player } from '@/types/player'
import type {
  TriviaConfig,
  TriviaQuestion,
  TriviaCategory,
  MultipleChoiceQuestion,
  StatComparisonQuestion,
  OpenTextQuestion,
  TrueFalseQuestion,
  StatKey,
  OpenTextClue,
} from './types'
import { filterPlayersByDifficulty } from './difficulty'

const STAT_KEYS: StatKey[] = [
  'goals',
  'appearances',
  'assists',
  'championsLeagueGoals',
  'championsLeagueGames',
]

const STAT_PROMPTS: Record<StatKey, string> = {
  goals: 'Who has scored more career goals?',
  appearances: 'Who has more career appearances?',
  assists: 'Who has more career assists?',
  championsLeagueGoals: 'Who has scored more Champions League goals?',
  championsLeagueGames: 'Who has played more Champions League games?',
}

// ── Seeded RNG helper ─────────────────────────────────────────────────────────

function makeRand(sessionId: string, questionIndex: number): () => number {
  return mulberry32(hashSeed(`trivia|${sessionId}|${questionIndex}`))
}

function randInt(rand: () => number, max: number): number {
  return Math.floor(rand() * max)
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[randInt(rand, arr.length)]
}

function pickN<T>(rand: () => number, arr: T[], n: number): T[] {
  return shuffle(arr, rand).slice(0, n)
}

// ── Multiple choice generator ─────────────────────────────────────────────────

function generateMultipleChoice(
  player: Player,
  rand: () => number,
  id: string,
): MultipleChoiceQuestion {
  // Pick a template based on available data
  const templates: Array<() => MultipleChoiceQuestion | null> = [
    () => clubTemplate(player, rand, id),
    () => nationalityTemplate(player, rand, id),
    () => achievementTemplate(player, rand, id),
  ]

  const shuffledTemplates = shuffle(templates, rand)
  for (const tpl of shuffledTemplates) {
    const q = tpl()
    if (q) return q
  }

  // Fallback to nationality (always possible)
  return nationalityTemplate(player, rand, id)!
}

function clubTemplate(
  player: Player,
  rand: () => number,
  id: string,
): MultipleChoiceQuestion | null {
  if (!player.clubs.length) return null
  const correctClub = pick(rand, player.clubs)
  const distractors = shuffle(
    clubs.filter((c) => !player.clubs.includes(c)),
    rand,
  ).slice(0, 3)
  if (distractors.length < 3) return null
  const options = shuffle([correctClub, ...distractors], rand)
  return {
    id,
    type: 'multiple-choice',
    playerIds: [player.playerId],
    prompt: `Which club did ${player.name} play for?`,
    playerId: player.playerId,
    playerName: player.name,
    playerImageUrl: player.imageUrl,
    options,
    correctAnswer: correctClub,
  }
}

function nationalityTemplate(
  player: Player,
  rand: () => number,
  id: string,
): MultipleChoiceQuestion | null {
  const distractors = shuffle(
    nationalities.filter((n) => n !== player.nationality),
    rand,
  ).slice(0, 3)
  if (distractors.length < 3) return null
  const options = shuffle([player.nationality, ...distractors], rand)
  return {
    id,
    type: 'multiple-choice',
    playerIds: [player.playerId],
    prompt: `What nationality is ${player.name}?`,
    playerId: player.playerId,
    playerName: player.name,
    playerImageUrl: player.imageUrl,
    options,
    correctAnswer: player.nationality,
  }
}

function achievementTemplate(
  player: Player,
  rand: () => number,
  id: string,
): MultipleChoiceQuestion | null {
  const playerAchievements = player.achievements.filter((a) =>
    achievements.includes(a),
  )
  if (!playerAchievements.length) return null
  const correctAchievement = pick(rand, playerAchievements)
  const distractors = shuffle(
    achievements.filter((a) => !player.achievements.includes(a)),
    rand,
  ).slice(0, 3)
  if (distractors.length < 3) return null
  const options = shuffle([correctAchievement, ...distractors], rand)
  return {
    id,
    type: 'multiple-choice',
    playerIds: [player.playerId],
    prompt: `Which achievement does ${player.name} hold?`,
    playerId: player.playerId,
    playerName: player.name,
    playerImageUrl: player.imageUrl,
    options,
    correctAnswer: correctAchievement,
  }
}

// ── Stat comparison generator ─────────────────────────────────────────────────

function generateStatComparison(
  playerA: Player,
  playerB: Player,
  rand: () => number,
  id: string,
): StatComparisonQuestion | null {
  const shuffledKeys = shuffle(STAT_KEYS, rand)
  for (const statKey of shuffledKeys) {
    const valA = playerA.careerStats[statKey]
    const valB = playerB.careerStats[statKey]
    if (valA === valB) continue
    const correctPlayerId = valA > valB ? playerA.playerId : playerB.playerId
    return {
      id,
      type: 'stat-comparison',
      playerIds: [playerA.playerId, playerB.playerId],
      prompt: STAT_PROMPTS[statKey],
      playerA: {
        playerId: playerA.playerId,
        name: playerA.name,
        imageUrl: playerA.imageUrl,
      },
      playerB: {
        playerId: playerB.playerId,
        name: playerB.name,
        imageUrl: playerB.imageUrl,
      },
      statKey,
      correctPlayerId,
    }
  }
  return null
}

// ── Open text generator ───────────────────────────────────────────────────────

function generateOpenText(
  player: Player,
  rand: () => number,
  id: string,
): OpenTextQuestion {
  const clues: OpenTextClue[] = []

  clues.push({ kind: 'era', value: player.era })
  if (player.height > 0) clues.push({ kind: 'height', value: player.height })
  clues.push({ kind: 'position', value: player.position.main })
  clues.push({ kind: 'nationality', value: player.nationality })

  // Least-famous club (last in array tends to be earliest/least famous)
  if (player.clubs.length > 1) {
    clues.push({ kind: 'club', label: 'Former club', value: player.clubs[player.clubs.length - 1] })
  }
  // Most-famous club (first)
  if (player.clubs.length > 0) {
    clues.push({ kind: 'club', label: 'Known for playing at', value: player.clubs[0] })
  }

  // One career stat — pick at random
  const statPick = pick(rand, STAT_KEYS)
  const statVal = player.careerStats[statPick]
  clues.push({ kind: 'stat', label: STAT_PROMPTS[statPick].replace('Who has ', '').replace('?', ''), value: String(statVal) })

  return {
    id,
    type: 'open-text',
    playerIds: [player.playerId],
    clues,
    correctPlayerId: player.playerId,
    correctPlayerName: player.name,
  }
}

// ── True/False generator ──────────────────────────────────────────────────────

function generateTrueFalse(
  player: Player,
  allPlayers: Player[],
  rand: () => number,
  id: string,
): TrueFalseQuestion {
  type TFTemplate = () => TrueFalseQuestion | null

  const makeTrue = (statement: string): TrueFalseQuestion => ({
    id,
    type: 'true-false',
    playerIds: [player.playerId],
    statement,
    correct: true,
    playerId: player.playerId,
    playerName: player.name,
    playerImageUrl: player.imageUrl,
  })
  const makeFalse = (statement: string): TrueFalseQuestion => ({
    id,
    type: 'true-false',
    playerIds: [player.playerId],
    statement,
    correct: false,
    playerId: player.playerId,
    playerName: player.name,
    playerImageUrl: player.imageUrl,
  })

  const templates: TFTemplate[] = [
    // Left foot
    () => {
      if (rand() > 0.5) {
        return player.leftFooted ? makeTrue(`${player.name} is left-footed`) : makeFalse(`${player.name} is left-footed`)
      }
      // Flip: always generate based on actual fact + coin flip for true/false framing
      return player.leftFooted ? makeTrue(`${player.name} is left-footed`) : makeFalse(`${player.name} is left-footed`)
    },
    // Nationality true/false
    () => {
      const isTrue = rand() > 0.5
      if (isTrue) {
        return makeTrue(`${player.name} is from ${player.nationality}`)
      }
      const wrongNat = pick(rand, nationalities.filter((n) => n !== player.nationality))
      return makeFalse(`${player.name} is from ${wrongNat}`)
    },
    // Achievement true/false
    () => {
      const playerAchievements = player.achievements.filter((a) => achievements.includes(a))
      const isTrue = rand() > 0.5
      if (isTrue && playerAchievements.length) {
        const achievement = pick(rand, playerAchievements)
        return makeTrue(`${player.name} has "${achievement}"`)
      }
      const notHeld = achievements.filter((a) => !player.achievements.includes(a))
      if (!notHeld.length) return null
      const achievement = pick(rand, notHeld)
      return makeFalse(`${player.name} has "${achievement}"`)
    },
    // Height comparison
    () => {
      const others = allPlayers.filter(
        (p) => p.playerId !== player.playerId && p.height > 0,
      )
      if (!others.length || player.height === 0) return null
      const other = pick(rand, others)
      const isTrue = player.height > other.height
      if (player.height === other.height) return null
      const statement = `${player.name} is taller than ${other.name}`
      return isTrue ? makeTrue(statement) : makeFalse(statement)
    },
    // Club history
    () => {
      const isTrue = rand() > 0.5
      if (isTrue && player.clubs.length) {
        const club = pick(rand, player.clubs)
        return makeTrue(`${player.name} has played for ${club}`)
      }
      const notPlayed = clubs.filter((c) => !player.clubs.includes(c))
      if (!notPlayed.length) return null
      const club = pick(rand, notPlayed)
      return makeFalse(`${player.name} has played for ${club}`)
    },
  ]

  const shuffled = shuffle(templates, rand)
  for (const tpl of shuffled) {
    const q = tpl()
    if (q) return q
  }

  // Ultimate fallback
  return makeTrue(`${player.name} is from ${player.nationality}`)
}

// ── Category-constrained type picker ─────────────────────────────────────────

type QuestionTypeName = 'multiple-choice' | 'stat-comparison' | 'open-text' | 'true-false'

function pickQuestionType(
  category: TriviaCategory,
  rand: () => number,
): QuestionTypeName {
  const weights: Record<TriviaCategory, QuestionTypeName[]> = {
    all: [
      'multiple-choice', 'multiple-choice', 'multiple-choice',
      'stat-comparison', 'stat-comparison',
      'open-text', 'open-text',
      'true-false', 'true-false',
    ],
    clubs: ['multiple-choice', 'true-false'],
    stats: ['stat-comparison', 'stat-comparison', 'open-text'],
    achievements: ['multiple-choice', 'true-false'],
    nationalities: ['multiple-choice', 'true-false'],
  }
  return pick(rand, weights[category])
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export function generateQuestions(
  config: TriviaConfig,
  sessionId: string,
  count: number,
  offset = 0,
): TriviaQuestion[] {
  const pool = filterPlayersByDifficulty(config.difficulty)
  const questions: TriviaQuestion[] = []

  for (let i = 0; i < count; i++) {
    const idx = offset + i
    const rand = makeRand(sessionId, idx)
    const id = `trivia|${sessionId}|${idx}`

    const type = pickQuestionType(config.category, rand)
    const shuffledPool = shuffle(pool, makeRand(sessionId, idx * 1000))

    let question: TriviaQuestion | null = null

    if (type === 'multiple-choice') {
      const player = shuffledPool[idx % shuffledPool.length]
      question = generateMultipleChoice(player, rand, id)
    } else if (type === 'stat-comparison') {
      const playerA = shuffledPool[idx % shuffledPool.length]
      const playerB = shuffledPool[(idx + 1) % shuffledPool.length]
      if (playerA.playerId !== playerB.playerId) {
        question = generateStatComparison(playerA, playerB, rand, id)
      }
    } else if (type === 'open-text') {
      const player = shuffledPool[idx % shuffledPool.length]
      question = generateOpenText(player, rand, id)
    } else {
      const player = shuffledPool[idx % shuffledPool.length]
      question = generateTrueFalse(player, pool, rand, id)
    }

    // Fallback: generate a nationality multiple choice if something failed
    if (!question) {
      const player = shuffledPool[idx % shuffledPool.length]
      question = nationalityTemplate(player, rand, id) ?? {
        id,
        type: 'true-false',
        playerIds: [player.playerId],
        statement: `${player.name} is from ${player.nationality}`,
        correct: true,
        playerId: player.playerId,
        playerName: player.name,
        playerImageUrl: player.imageUrl,
      }
    }

    questions.push(question)
  }

  return questions
}
