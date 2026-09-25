/**
 * Frozen mid-game states for the /games previews. Server-only: this pulls in
 * the full player and lineup data, so only the handful of picked records are
 * ever sent to the client as props.
 */
import { enrichedFootballPlayers } from '@/data/players'
import { getLineupById, type Famous11sLineup } from '@/data/famous11s'
import { getTenableQuestionById, type TenableQuestion } from '@/data/tenable'
import { DEFAULT_BOARD_CONFIG, freeIndexForConfig, generateBoard } from '@/lib/board'
import { type BingoCellView, toBingoCellView } from '@/lib/bingoCellView'
import type { CellPick } from '@/lib/cellPick'
import type { StatComparisonQuestion, StatKey } from '@/lib/trivia/types'
import { playerMatchesCategory } from '@/lib/validation'
import type { Player } from '@/types/player'

export interface BingoPreviewData {
  seed: string
  size: number
  cells: BingoCellView[]
  /** The middle row, FREE square included - lit up once every pick has landed. */
  line: number[]
  /** Placements in the order they land; the last few complete the middle row. */
  picks: { cell: number; pick: CellPick }[]
}

export interface GamesPreviewData {
  bingo: BingoPreviewData | null
  trivia: StatComparisonQuestion[]
  tenable: { question: TenableQuestion; foundOrder: number[] } | null
  famous11s: { lineup: Famous11sLineup; foundOrder: string[] } | null
}

const byFame = [...enrichedFootballPlayers]
  .filter((p) => p.imageUrl)
  .sort((a, b) => b.fameScore - a.fameScore)

const toPick = (p: Player): CellPick => ({ playerId: p.playerId, name: p.name, imageUrl: p.imageUrl })

/**
 * Find a seed whose middle row (through the FREE square) can be filled with
 * famous players, plus two scattered openers so the board doesn't start empty.
 */
function buildBingo(): BingoPreviewData | null {
  const size = DEFAULT_BOARD_CONFIG.size
  const free = freeIndexForConfig(DEFAULT_BOARD_CONFIG)
  const row = Math.floor(free / size)
  const lineCells = Array.from({ length: size }, (_, c) => row * size + c).filter((i) => i !== free)
  const openers = [0, size * size - 2]

  for (let attempt = 0; attempt < 50; attempt++) {
    const seed = `games-preview-${attempt}`
    const cells = generateBoard(seed, DEFAULT_BOARD_CONFIG)
    const used = new Set<string>()
    const picks: BingoPreviewData['picks'] = []

    for (const cell of [...openers, ...lineCells]) {
      const c = cells[cell]
      if (c?.kind !== 'category') break
      const player = byFame
        .slice(0, 250)
        .find((p) => !used.has(p.playerId) && playerMatchesCategory(p, c.label))
      if (!player) break
      used.add(player.playerId)
      picks.push({ cell, pick: toPick(player) })
    }
    if (picks.length === openers.length + lineCells.length) {
      return {
        seed,
        size,
        cells: cells.map(toBingoCellView),
        line: [...lineCells, free],
        picks,
      }
    }
  }
  return null
}

const TRIVIA_DUELS: [string, string, StatKey][] = [
  ['Lionel Messi', 'Cristiano Ronaldo', 'championsLeagueGoals'],
  ['Erling Haaland', 'Kylian Mbappé', 'goals'],
  ['Kevin De Bruyne', 'Luka Modrić', 'assists'],
]

const STAT_PROMPTS: Record<StatKey, string> = {
  goals: 'Who has scored more career goals?',
  appearances: 'Who has more career appearances?',
  assists: 'Who has more career assists?',
  championsLeagueGoals: 'Who has scored more CL goals?',
  championsLeagueGames: 'Who has played more CL games?',
}

function buildTrivia(): StatComparisonQuestion[] {
  const find = (name: string) => enrichedFootballPlayers.find((p) => p.name === name && p.imageUrl)
  return TRIVIA_DUELS.flatMap(([nameA, nameB, statKey], i) => {
    const a = find(nameA)
    const b = find(nameB)
    if (!a || !b || a.careerStats[statKey] === b.careerStats[statKey]) return []
    return [
      {
        id: `games-preview|${i}`,
        type: 'stat-comparison' as const,
        playerIds: [a.playerId, b.playerId],
        prompt: STAT_PROMPTS[statKey],
        playerA: { playerId: a.playerId, name: a.name, imageUrl: a.imageUrl },
        playerB: { playerId: b.playerId, name: b.name, imageUrl: b.imageUrl },
        statKey,
        correctPlayerId: a.careerStats[statKey] > b.careerStats[statKey] ? a.playerId : b.playerId,
      },
    ]
  })
}

function buildTenable(): GamesPreviewData['tenable'] {
  const question = getTenableQuestionById('pl-top-scorers')
  if (!question) return null
  return { question, foundOrder: [1, 4, 2, 7, 3, 9] }
}

function buildFamous11s(): GamesPreviewData['famous11s'] {
  const lineup = getLineupById('barcelona-cl-final-2011')
  if (!lineup) return null
  const order = ['Lionel Messi', 'Xavi', 'Andrés Iniesta', 'David Villa', 'Sergio Busquets', 'Gerard Piqué', 'Dani Alves']
  const foundOrder = order.flatMap((name) => lineup.slots.find((s) => s.name === name)?.slotId ?? [])
  return { lineup, foundOrder }
}

export function getGamesPreviewData(): GamesPreviewData {
  return {
    bingo: buildBingo(),
    trivia: buildTrivia(),
    tenable: buildTenable(),
    famous11s: buildFamous11s(),
  }
}
