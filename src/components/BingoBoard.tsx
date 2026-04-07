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
    'inline-block font-mono border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_#000]'
  if (kind === 'nationality')
    return `${base} bg-[var(--fb-accent-cyan)] text-black`
  if (kind === 'club')
    return `${base} bg-[var(--fb-accent-mint)] text-black`
  return `${base} bg-[var(--fb-accent-yellow)] text-black`
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
      className="grid gap-3 p-2 bg-black border-4 border-white shadow-brutal-lg"
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
                  : [1, 1.05, 1],
              boxShadow:
                isWinLine && solvedHere
                  ? '4px 4px 0px 0px var(--fb-accent-yellow)'
                  : voteHi
                    ? '4px 4px 0px 0px var(--fb-accent-cyan)'
                    : targetHi
                      ? '4px 4px 0px 0px var(--fb-accent-lime)'
                      : (isFree || solvedHere) 
                        ? '3px 3px 0px 0px #000'
                        : '3px 3px 0px 0px #fff',
            }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
            disabled={isFree || !!pick || (restricted && !allowed)}
            onClick={() =>
              !isFree && !pick && allowed && onCellClick(index)
            }
            className={`relative flex min-h-[80px] flex-col items-center justify-center border-4 text-center text-sm transition-all sm:min-h-[110px] md:min-h-[130px] ${
              isFree
                ? 'cursor-default border-black bg-striped-yellow text-black shadow-brutal active:shadow-none'
                : solvedHere
                  ? 'cursor-not-allowed border-black bg-[var(--fb-accent-mint)] text-black'
                  : restricted && !allowed
                    ? 'cursor-not-allowed border-white/20 bg-[#111] opacity-70 grayscale'
                    : voteHi
                      ? 'border-[var(--fb-accent-cyan)] bg-cyan-950'
                      : targetHi
                        ? 'border-[var(--fb-accent-lime)] bg-lime-950'
                        : 'border-white bg-[#09090b] hover:border-[var(--fb-accent-magenta)] hover:bg-[#1a001a] hover:-translate-y-1 hover:shadow-[4px_6px_0px_var(--fb-accent-magenta)]'
            }`}
            style={{
              backgroundImage: isFree ? 'repeating-linear-gradient(45deg, var(--fb-accent-yellow) 0px, var(--fb-accent-yellow) 10px, #000 10px, #000 20px)' : undefined
            }}
          >
            <AnimatePresence mode="wait">
              {isFree ? (
                <motion.span
                  key="free"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  className="font-display text-3xl font-black tracking-widest text-[#fff] px-2 py-1 bg-black border-2 border-white rotate-[-5deg]"
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
                      width={50}
                      height={50}
                      className="border-2 border-black object-cover shadow-brutal-sm"
                      unoptimized
                    />
                  ) : null}
                  <span className="line-clamp-2 text-xs font-black leading-tight text-black font-mono bg-[var(--fb-accent-mint)] px-1">
                    {pick.name}
                  </span>
                </motion.div>
              ) : label ? (
                <motion.div
                  key="cat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-2 p-1"
                >
                  <span className={categoryBadge(label)}>
                    {getCategoryKind(label) ?? 'square'}
                  </span>
                  <span className="line-clamp-3 text-xs font-bold font-mono text-chalk/95 sm:text-sm uppercase bg-black px-1 mx-1 border border-white/30">
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
