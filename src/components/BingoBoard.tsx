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
import { categoryLogo, displayCategory, getCategoryKind } from '@/lib/canonical'
import type { CellPick } from '@/lib/cellPick'
import { Sticker } from '@/components/Sticker'

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

const KIND_SHORT: Record<string, string> = {
  nationality: 'Nation',
  club: 'Club',
  achievement: 'Honour',
}

function kindTabClass(kind: string | null) {
  const base =
    'inline-flex items-center rounded-[3px] px-2 py-0.5 text-[9.5px] font-extrabold uppercase leading-none tracking-[0.14em]'
  if (kind === 'nationality') return `${base} bg-nation text-cream`
  if (kind === 'club') return `${base} bg-green text-cream`
  return `${base} bg-foil text-white`
}

/** deterministic tilt, matches the design's ((i*7)%5 - 2) * 0.9 */
const rotFor = (i: number) => (((i * 7) % 5) - 2) * 0.9

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
      className="grid gap-2.5 rounded-2xl bg-panel p-4 shadow-[inset_0_0_0_1px_rgba(38,32,25,0.18),inset_0_2px_12px_rgba(120,90,40,0.12)] sm:gap-3.5 sm:p-[22px]"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, index) => {
        const isFree = cell.kind === 'free'
        const label = cell.kind === 'category' ? cell.label : null
        const kind = label ? getCategoryKind(label) : null
        const logo = label ? categoryLogo(label) : null
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
              scale: reduceMotion || !(isWinLine && solvedHere) ? 1 : [1, 1.05, 1],
            }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
            disabled={isFree || !!pick || (restricted && !allowed)}
            onClick={() => !isFree && !pick && allowed && onCellClick(index)}
            className={`relative flex min-h-[120px] flex-col items-center justify-center rounded-[6px] p-2 text-center transition-all duration-200 sm:min-h-[150px] ${
              pick
                ? 'cursor-not-allowed'
                : isFree
                  ? 'foil cursor-default shadow-sticker'
                  : voteHi
                    ? 'border-2 border-red bg-panel-white ring-2 ring-red/40'
                    : restricted && !allowed
                      ? 'cursor-not-allowed border-2 border-dashed border-line bg-white/30 opacity-40'
                      : 'border-2 border-dashed border-line bg-white/35 hover:-translate-y-0.5 hover:border-line-strong hover:bg-white/60'
            }`}
          >
            <AnimatePresence mode="wait">
              {isFree ? (
                <motion.span
                  key="free"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-3xl leading-none">★</span>
                  <span className="mt-1.5 font-display text-[15px] uppercase tracking-[0.12em]">
                    Free
                  </span>
                </motion.span>
              ) : pick ? (
                <motion.div
                  key="picked"
                  initial={{ opacity: 0, scale: 0.85, rotate: rotFor(index) - 4 }}
                  animate={{ opacity: 1, scale: 1, rotate: rotFor(index) }}
                  exit={{ opacity: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 20 }}
                  className="w-full"
                >
                  <Sticker
                    name={pick.name}
                    imageUrl={pick.imageUrl}
                    nameSize={12}
                    win={isWinLine}
                  />
                </motion.div>
              ) : label ? (
                <motion.div
                  key="cat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-1"
                >
                  {logo ? (
                    <Image
                      src={logo}
                      alt=""
                      width={40}
                      height={40}
                      className="h-9 w-9 object-contain opacity-90"
                      unoptimized
                    />
                  ) : (
                    <svg width="40" height="40" viewBox="0 0 44 44" aria-hidden className="opacity-[0.28]">
                      <circle cx="22" cy="15" r="9" fill="#262019" />
                      <path d="M4 44 C4 30 14 26 22 26 C30 26 40 30 40 44 Z" fill="#262019" />
                    </svg>
                  )}
                  <span className={kindTabClass(kind)}>{KIND_SHORT[kind ?? ''] ?? 'Square'}</span>
                  <span className="mt-1 line-clamp-3 px-0.5 text-[12.5px] font-bold uppercase leading-tight tracking-[0.02em] text-ink-soft">
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
