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
    'inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider'
  if (kind === 'nationality')
    return `${base} bg-[var(--fb-accent-cyan)]/25 text-[var(--fb-accent-cyan)]`
  if (kind === 'club')
    return `${base} bg-[var(--fb-accent-mint)]/25 text-[var(--fb-accent-mint)]`
  return `${base} bg-[var(--fb-accent-yellow)]/20 text-[var(--fb-accent-yellow)]`
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
      className="grid gap-2 p-2"
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
        const targetHi = restricted && allowed && label

        return (
          <motion.button
            key={`${seed}-${index}`}
            type="button"
            layout
            initial={false}
            animate={{
              scale:
                reduceMotion || !(isWinLine && solvedHere)
                  ? 1
                  : [1, 1.03, 1],
              boxShadow:
                isWinLine && solvedHere
                  ? '0 0 0 2px rgba(250, 204, 21, 0.6)'
                  : voteHi
                    ? '0 0 0 2px rgba(34, 211, 238, 0.65)'
                    : targetHi
                      ? '0 0 0 2px rgba(212, 255, 0, 0.45)'
                      : '0 0 0 0 transparent',
            }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
            disabled={isFree || !!pick || (restricted && !allowed)}
            onClick={() =>
              !isFree && !pick && allowed && onCellClick(index)
            }
            className={`relative flex min-h-[72px] flex-col items-center justify-center rounded-xl border p-2 text-center text-sm transition-colors sm:min-h-[100px] md:min-h-[118px] ${
              isFree
                ? 'cursor-default border-[var(--fb-accent-yellow)]/50 bg-[var(--fb-accent-yellow)]/12'
                : solvedHere
                  ? 'cursor-not-allowed border-[var(--fb-accent-mint)]/55 bg-[var(--fb-accent-mint)]/15'
                  : restricted && !allowed
                    ? 'cursor-not-allowed border-white/10 bg-black/20 opacity-45'
                    : voteHi
                      ? 'border-cyan-400/50 bg-cyan-500/10 hover:border-cyan-400/70'
                      : targetHi
                        ? 'border-[var(--fb-accent-lime)]/40 bg-[var(--fb-accent-lime)]/10 hover:border-[var(--fb-accent-lime)]/60'
                        : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
            }`}
          >
            <AnimatePresence mode="wait">
              {isFree ? (
                <motion.span
                  key="free"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  className="font-display text-lg font-bold tracking-wide text-[var(--fb-accent-yellow)]"
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
                  <span className="line-clamp-3 text-xs font-semibold text-chalk/95 sm:text-sm">
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
