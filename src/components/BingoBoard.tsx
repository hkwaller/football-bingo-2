'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BINGO_LINES,
  BOARD_SIZE,
  type BoardCell,
  FREE_INDEX,
  completedLineIndices,
  generateBoard,
} from '@/lib/board'
import { displayCategory, getCategoryKind } from '@/lib/canonical'
import type { CellPick } from '@/lib/cellPick'

type BingoBoardProps = {
  seed: string
  solved: Map<number, CellPick>
  onCellClick: (index: number) => void
  lineHighlight?: boolean
}

function categoryBadge(label: string) {
  const kind = getCategoryKind(label)
  const base =
    'inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide'
  if (kind === 'nationality') return `${base} bg-sky-500/20 text-sky-200`
  if (kind === 'club') return `${base} bg-emerald-500/20 text-emerald-200`
  return `${base} bg-amber-500/20 text-amber-100`
}

export function BingoBoard({
  seed,
  solved,
  onCellClick,
  lineHighlight = true,
}: BingoBoardProps) {
  const cells: BoardCell[] = generateBoard(seed)
  const solvedSet = new Set(solved.keys())
  solvedSet.add(FREE_INDEX)
  const winningLines = lineHighlight ? completedLineIndices(solvedSet) : []
  const winningCells = new Set<number>()
  for (const li of winningLines) {
    for (const i of BINGO_LINES[li] ?? []) winningCells.add(i)
  }

  return (
    <div
      className="grid gap-2 p-2"
      style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((cell, index) => {
        const isFree = cell.kind === 'free'
        const label = cell.kind === 'category' ? cell.label : null
        const pick = solved.get(index)
        const solvedHere = isFree || pick !== undefined
        const isWinLine = winningCells.has(index)

        return (
          <motion.button
            key={`${seed}-${index}`}
            type="button"
            layout
            initial={false}
            animate={{
              scale: isWinLine && solvedHere ? [1, 1.03, 1] : 1,
              boxShadow:
                isWinLine && solvedHere
                  ? '0 0 0 2px rgba(250, 204, 21, 0.6)'
                  : '0 0 0 0 transparent',
            }}
            transition={{ duration: 0.35 }}
            disabled={isFree || !!pick}
            onClick={() => !isFree && !pick && onCellClick(index)}
            className={`relative flex min-h-[100px] flex-col items-center justify-center rounded-lg border p-2 text-center text-sm transition-colors sm:min-h-[110px] ${
              isFree
                ? 'cursor-default border-yellow-500/40 bg-yellow-500/10'
                : solvedHere
                  ? 'cursor-not-allowed border-emerald-500/50 bg-emerald-950/40'
                  : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
            }`}
          >
            <AnimatePresence mode="wait">
              {isFree ? (
                <motion.span
                  key="free"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  className="font-bold text-yellow-200"
                >
                  FREE
                </motion.span>
              ) : pick ? (
                <motion.div
                  key="picked"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex w-full flex-col items-center gap-1"
                >
                  {pick.imageUrl ? (
                    <Image
                      src={pick.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  ) : null}
                  <span className="line-clamp-2 text-xs font-medium leading-tight text-chalk">
                    {pick.name}
                  </span>
                </motion.div>
              ) : label ? (
                <motion.div
                  key="cat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-1"
                >
                  <span className={categoryBadge(label)}>
                    {getCategoryKind(label) ?? 'square'}
                  </span>
                  <span className="line-clamp-3 text-xs text-chalk/90">
                    {displayCategory(label)}
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}
