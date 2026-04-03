import { hashSeed, mulberry32, shuffle } from '@/lib/seeded'
import {
  type BoardConfig,
  boardConfigKey,
  categoriesRequired,
  categoryPoolForConfig,
  cellCountForConfig,
  DEFAULT_BOARD_CONFIG,
} from '@/lib/boardConfig'

export type { BoardConfig } from '@/lib/boardConfig'
export {
  DEFAULT_BOARD_CONFIG,
  boardConfigKey,
  categoryPoolForConfig,
  cellCountForConfig,
  categoriesRequired,
  isBoardConfigViable,
  parseBoardConfig,
} from '@/lib/boardConfig'

/** @deprecated use cellCountForConfig */
export const BOARD_SIZE = 5
/** @deprecated use freeSquareIndex(5) */
export const FREE_INDEX = 12

export type BoardCell =
  | { kind: 'free' }
  | { kind: 'category'; label: string }

/** Odd n: geometric center. Even n: top-left of central 2×2 block. */
export function freeSquareIndex(n: number): number {
  if (n % 2 === 1) return (n * n - 1) / 2
  const half = n / 2
  return (half - 1) * n + (half - 1)
}

export function buildBingoLines(n: number): number[][] {
  const lines: number[][] = []
  for (let r = 0; r < n; r++) {
    lines.push(Array.from({ length: n }, (_, c) => r * n + c))
  }
  for (let c = 0; c < n; c++) {
    lines.push(Array.from({ length: n }, (_, r) => r * n + c))
  }
  lines.push(Array.from({ length: n }, (_, i) => i * n + i))
  lines.push(Array.from({ length: n }, (_, i) => i * n + (n - 1 - i)))
  return lines
}

export function bingoLinesForConfig(
  config: BoardConfig,
): readonly (readonly number[])[] {
  return buildBingoLines(config.size)
}

export function freeIndexForConfig(config: BoardConfig): number {
  return freeSquareIndex(config.size)
}

/** Legacy 5×5 lines; prefer bingoLinesForConfig */
export const BINGO_LINES: readonly (readonly number[])[] = buildBingoLines(5)

export function generateBoard(
  seed: string,
  config: BoardConfig = DEFAULT_BOARD_CONFIG,
): BoardCell[] {
  const pool = categoryPoolForConfig(config)
  const need = categoriesRequired(config)
  if (pool.length < need) {
    throw new Error('Not enough categories for board config')
  }
  const rand = mulberry32(
    hashSeed(`board|${seed}|${boardConfigKey(config)}`),
  )
  const shuffled = shuffle(pool, rand)
  const picked = shuffled.slice(0, need)
  const n = config.size
  const total = n * n
  const freeAt = freeSquareIndex(n)
  const cells: BoardCell[] = []
  let p = 0
  for (let i = 0; i < total; i++) {
    if (i === freeAt) cells.push({ kind: 'free' })
    else {
      const label = picked[p++]
      if (!label) throw new Error('Not enough categories for board')
      cells.push({ kind: 'category', label })
    }
  }
  return cells
}

export function cellCategory(cells: BoardCell[], index: number): string | null {
  const c = cells[index]
  if (!c || c.kind === 'free') return null
  return c.label
}

export function completedLineIndices(
  solved: Set<number>,
  lines: readonly (readonly number[])[],
): number[] {
  const done: number[] = []
  lines.forEach((line, lineIdx) => {
    if (line.every((i) => solved.has(i))) done.push(lineIdx)
  })
  return done
}

export function hasBingo(
  solved: Set<number>,
  lines: readonly (readonly number[])[],
): boolean {
  return completedLineIndices(solved, lines).length > 0
}

export function hasBingoForConfig(
  solved: Set<number>,
  config: BoardConfig,
): boolean {
  return hasBingo(solved, bingoLinesForConfig(config))
}
