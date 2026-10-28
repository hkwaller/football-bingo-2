import type { GameKind } from './types'
import { createInitialGameStorage } from './bingoModel'
import { DEFAULT_TRIVIA_CONFIG } from '../trivia/types'
import { DEFAULT_TENABLE_CONFIG } from '../tenable/types'
import { DEFAULT_FAMOUS11S_CONFIG } from '../famous11s/types'
import { DEFAULT_CONNECTIONS_CONFIG } from '../connections/types'
import { DEFAULT_CAREERS_CONFIG } from '../careers/types'

const choices: Record<string, readonly unknown[]> = {
  difficulty: ['easy', 'medium', 'hard', 'mixed'],
  boardDifficulty: ['easy', 'medium', 'hard'],
  boardSize: [3, 4, 5],
  boardLayout: ['shared', 'individual'],
  drawSource: ['shared', 'independent'],
  draftPolicy: ['open', 'placeable'],
  sessionType: ['survival', 'fixed', 'timed', 'category'],
  category: ['all', 'clubs', 'stats', 'achievements', 'nationalities'],
  multiplayerMechanic: ['race', 'simultaneous', 'turn-based'],
  answerOrder: ['any', 'topdown'],
  kind: ['all', 'club', 'national'],
  era: ['all', 'classic', 'big-nights'],
  clubCount: [2, 3],
  lineupCount: [1, 3, 5, 7],
}
const ranges: Record<string, [number, number]> = {
  questionCount: [1, 20],
  puzzleCount: [1, 20],
  playerCount: [1, 20],
  lineupCount: [1, 7],
  lives: [0, 20],
  hints: [0, 20],
  guesses: [1, 20],
  minFameScore: [0, 100],
  roundSeconds: [0, 600],
  turnSeconds: [0, 600],
  timeLimitSeconds: [1, 3600],
}
const defaults = {
  bingo: createInitialGameStorage(),
  trivia: DEFAULT_TRIVIA_CONFIG,
  tenable: DEFAULT_TENABLE_CONFIG,
  eleven: DEFAULT_FAMOUS11S_CONFIG,
  connections: DEFAULT_CONNECTIONS_CONFIG,
  careers: DEFAULT_CAREERS_CONFIG,
}
/** Copy setup fields one by one. Unknown keys never enter room storage. */
export function cleanConfig(kind: GameKind, value: unknown): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const input =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  const base = defaults[kind] as unknown as Record<string, unknown>
  const keys =
    kind === 'bingo'
      ? [
          'playMode',
          'boardSize',
          'categoryNationalities',
          'categoryClubs',
          'categoryAchievements',
          'categoryTraits',
          'categoryManagers',
          'boardDifficulty',
          'minFameScore',
          'boardLayout',
          'drawSource',
          'singleGuess',
          'draftPolicy',
        ]
      : [...Object.keys(base), 'selectedQuestionId', 'selectedLineupId', 'playMode', 'topics']
  for (const key of keys) {
    const v = input[key]
    if (v === undefined) continue
    if (key === 'playMode') {
      if ((kind === 'bingo' ? ['free', 'draft'] : ['versus', 'coop']).includes(String(v)))
        result[key] = v
      continue
    }
    if (choices[key]) {
      if (choices[key].includes(v)) result[key] = v
      continue
    }
    if (ranges[key]) {
      const [lo, hi] = ranges[key]
      if (Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi) result[key] = v
      continue
    }
    if (key === 'groups' || key === 'topics') {
      if (key === 'groups' && v === 'all') result[key] = v
      else if (
        Array.isArray(v) &&
        v.length <= 20 &&
        v.every((x) =>
          (key === 'groups'
            ? ['league', 'club', 'international', 'competition', 'transfers', 'misc']
            : ['clubs', 'stats', 'achievements', 'nationalities']
          ).includes(x),
        )
      )
        result[key] = v
      continue
    }
    if (key === 'selectedQuestionId' || key === 'selectedLineupId') {
      if (typeof v === 'string' && v.length < 120) result[key] = v
      continue
    }
    if (typeof base[key] === 'boolean' && typeof v === 'boolean') result[key] = v
  }
  return result
}
