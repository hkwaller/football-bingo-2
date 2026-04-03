import { categories } from '@/data/categories'
import { hashSeed, mulberry32, shuffle } from '@/lib/seeded'

export const BOARD_SIZE = 5
export const FREE_INDEX = 12

export type BoardCell =
  | { kind: 'free' }
  | { kind: 'category'; label: string }

export const BINGO_LINES: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
]

export function generateBoard(seed: string): BoardCell[] {
  const rand = mulberry32(hashSeed(seed))
  const pool = shuffle(categories, rand)
  const picked = pool.slice(0, 24)
  const cells: BoardCell[] = []
  let p = 0
  for (let i = 0; i < 25; i++) {
    if (i === FREE_INDEX) cells.push({ kind: 'free' })
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

export function completedLineIndices(solved: Set<number>): number[] {
  const done: number[] = []
  BINGO_LINES.forEach((line, lineIdx) => {
    if (line.every((i) => solved.has(i))) done.push(lineIdx)
  })
  return done
}

export function hasBingo(solved: Set<number>): boolean {
  return completedLineIndices(solved).length > 0
}
