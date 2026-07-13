'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  type BoardCell,
  type BoardConfig,
  bingoLinesForConfig,
  completedLineIndices,
  DEFAULT_BOARD_CONFIG,
  freeIndexForConfig,
  generateBoard,
} from '@/lib/board'
import { displayCategory, getCategoryKind } from '@/lib/canonical'
import type { CellPick } from '@/lib/cellPick'

type BingoBoardProps = {
  seed: string
  boardConfig?: BoardConfig
  solved: Map<number, CellPick>
  onCellClick: (index: number) => void
  lineHighlight?: boolean
  /** When set, cell is outlined as the current vote target (draft multiplayer). */
  voteHighlightIndex?: number | null
  /** Draft: only these empty cells accept clicks (placeable / multi-match). */
  draftTargetCells?: Set<number> | null
  reduceMotion?: boolean
}

function categoryBadge(label: string) {
  const kind = getCategoryKind(label)
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]'
  if (kind === 'nationality')
    return `${base} bg-[#9fd8ff]/10 text-[#9fd8ff]`
  if (kind === 'club') return `${base} bg-turf/10 text-turf`
  return `${base} bg-gold/10 text-gold`
}

export function BingoBoard({
  seed,
  boardConfig = DEFAULT_BOARD_CONFIG,
  solved,
  onCellClick,
  lineHighlight = true,
  voteHighlightIndex = null,
  draftTargetCells = null,
  reduceMotion = false,
}: BingoBoardProps) {
  const lines = bingoLinesForConfig(boardConfig)
  const freeIdx = freeIndexForConfig(boardConfig)
  const size = boardConfig.size
  const cells: BoardCell[] = generateBoard(seed, boardConfig)
  const solvedSet = new Set(solved.keys())
  solvedSet.add(freeIdx)
  const winningLines = lineHighlight ? completedLineIndices(solvedSet, lines) : []
  const winningCells = new Set<number>()
  for (const li of winningLines) {
    for (const i of lines[li] ?? []) winningCells.add(i)
  }

  return (
    <div
      className="grid gap-2 rounded-3xl border border-line bg-pitch p-2.5 shadow-soft sm:gap-2.5 sm:p-3"
      style={{
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
      }}
    >
      {cells.map((cell, index) => {
        const isFree = cell.kind === 'free'
        const label = cell.kind === 'category' ? cell.label : null
        const pick = solved.get(index)
        const solvedHere = isFree || pick !== undefined
        const isWinLine = winningCells.has(index)
        const voteHi = voteHighlightIndex === index
        const restricted =
          draftTargetCells !== null &&
          draftTargetCells.size > 0 &&
          !solvedHere &&
          !isFree
        const allowed = !restricted || draftTargetCells.has(index)

        return (
          <motion.button
            key={`${seed}-${index}`}
            type="button"
            layout
            initial={false}
            animate={{
              scale:
                reduceMotion || !(isWinLine && solvedHere) ? 1 : [1, 1.04, 1],
            }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
            disabled={isFree || !!pick || (restricted && !allowed)}
            onClick={() => !isFree && !pick && allowed && onCellClick(index)}
            className={`relative flex min-h-[80px] flex-col items-center justify-center rounded-xl border text-center text-sm transition-all duration-200 sm:min-h-[110px] md:min-h-[130px] ${
              isFree
                ? 'cursor-default border-turf/30 bg-turf/10 text-turf'
                : solvedHere
                  ? isWinLine
                    ? 'cursor-not-allowed border-gold/50 bg-gradient-to-b from-gold/25 to-gold/10 shadow-glow-gold'
                    : 'cursor-not-allowed border-turf/40 bg-gradient-to-b from-turf/20 to-turf/5'
                  : restricted && !allowed
                    ? 'cursor-not-allowed border-line bg-pitch opacity-40'
                    : voteHi
                      ? 'border-turf bg-turf/10 shadow-glow-turf'
                      : 'border-line bg-pitch-light hover:-translate-y-0.5 hover:border-line-strong hover:bg-pitch-lighter'
            }`}
          >
            <AnimatePresence mode="wait">
              {isFree ? (
                <motion.span
                  key="free"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-xl">⚽</span>
                  <span className="font-display text-lg font-semibold uppercase tracking-[0.18em]">
                    Free
                  </span>
                </motion.span>
              ) : pick ? (
                <motion.div
                  key="picked"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex w-full flex-col items-center gap-1.5 px-1"
                >
                  {pick.imageUrl ? (
                    <Image
                      src={pick.imageUrl}
                      alt=""
                      width={44}
                      height={44}
                      className={`rounded-full border object-cover ${
                        isWinLine ? 'border-gold/60' : 'border-turf/50'
                      }`}
                      unoptimized
                    />
                  ) : null}
                  <span
                    className={`line-clamp-2 text-xs font-semibold leading-tight ${
                      isWinLine ? 'text-gold' : 'text-chalk'
                    }`}
                  >
                    {pick.name}
                  </span>
                </motion.div>
              ) : label ? (
                <motion.div
                  key="cat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-1.5 p-1.5"
                >
                  <span className={categoryBadge(label)}>
                    {getCategoryKind(label) ?? 'square'}
                  </span>
                  <span className="line-clamp-3 px-1 text-xs font-medium leading-snug text-chalk sm:text-sm">
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
