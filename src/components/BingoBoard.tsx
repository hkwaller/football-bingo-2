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
import { categoryLogo, displayCategory } from '@/lib/canonical'
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
  /** A rejected placement attempt - flashes a red pulse on that cell. `nonce` re-triggers the animation on repeats. */
  wrongCell?: { cell: number; nonce: number } | null
  reduceMotion?: boolean
  /**
   * Mobile only: reveal the text label under every crest/flag cell. Desktop
   * always shows labels regardless. Toggled from the game's settings panel.
   */
  showLabels?: boolean
}

export function BingoBoard({
  seed,
  boardConfig = DEFAULT_BOARD_CONFIG,
  solved,
  onCellClick,
  lineHighlight = true,
  voteHighlightIndex = null,
  draftTargetCells = null,
  wrongCell = null,
  reduceMotion = false,
  showLabels = false,
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
    <div className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-[24px] bg-black/[0.22] p-3.5 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.25)] sm:p-6">
      {/* faint chalk ring bleeding through the tray */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/[0.09]" />
      <div
        className="relative grid gap-2.5 sm:gap-[13px]"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, index) => {
          const isFree = cell.kind === 'free'
          const label = cell.kind === 'category' ? cell.label : null
          const logo = label ? categoryLogo(label) : null
          // "Played under X" clues waste half the cell on the shared prefix.
          // Split it so the manager's name gets the room instead.
          const managerName =
            label && /^played under\s+/i.test(label) ? label.replace(/^played under\s+/i, '') : null
          const pick = solved.get(index)
          const solvedHere = isFree || pick !== undefined
          const isWinLine = winningCells.has(index)
          const voteHi = voteHighlightIndex === index
          const isWrong = wrongCell?.cell === index
          const restricted =
            draftTargetCells !== null && draftTargetCells.size > 0 && !solvedHere && !isFree
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
              style={isFree ? { transform: 'rotate(-1deg)' } : undefined}
              className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[14px] text-center transition-all duration-150 ${
                pick
                  ? 'cursor-not-allowed'
                  : isFree
                    ? 'bg-yellow text-pitch-deep shadow-[0_6px_0_rgba(0,0,0,0.25)]'
                    : voteHi
                      ? 'bg-white ring-[3px] ring-pink shadow-[0_5px_0_rgba(0,0,0,0.22)]'
                      : restricted && !allowed
                        ? 'cursor-not-allowed bg-white/40 opacity-40 shadow-[0_5px_0_rgba(0,0,0,0.15)]'
                        : 'bg-white/[0.92] shadow-[0_5px_0_rgba(0,0,0,0.22)] hover:-translate-y-[3px] hover:bg-white'
              }`}
            >
              <AnimatePresence>
                {isWrong ? (
                  <motion.div
                    key={`wrong-${wrongCell?.nonce}`}
                    className="pointer-events-none absolute inset-0 z-20 rounded-[14px] border-[5px] border-live-red"
                    initial={{ opacity: 0 }}
                    animate={
                      reduceMotion
                        ? { opacity: [0, 1, 0], transition: { duration: 0.5 } }
                        : {
                            opacity: [0, 1, 0.4, 1, 0],
                            x: [0, -5, 5, -3, 3, 0],
                            transition: { duration: 0.6, ease: 'easeInOut' },
                          }
                    }
                    exit={{ opacity: 0 }}
                  />
                ) : null}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                {isFree ? (
                  <motion.span
                    key="free"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-[30px] leading-none">★</span>
                    <span className="mt-1.5 font-display text-[16px] font-black uppercase tracking-[0.12em]">
                      Free
                    </span>
                  </motion.span>
                ) : pick ? (
                  <motion.div
                    key="picked"
                    initial={
                      reduceMotion
                        ? { opacity: 1 }
                        : { scale: 1.4, y: -40, opacity: 0, rotate: solvedTilt(index) - 10 }
                    }
                    animate={{ scale: 1, y: 0, opacity: 1, rotate: solvedTilt(index) }}
                    exit={{ opacity: 0 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 320, damping: 18 }
                    }
                    className="absolute inset-[6px] rounded-[6px] bg-white p-[5px] pb-[7px] shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
                  >
                    {/* portrait fills the sticker, name bar under it */}
                    <div className="relative h-full w-full overflow-hidden rounded-[4px] bg-[#dceee2]">
                      {pick.imageUrl ? (
                        <Image
                          src={pick.imageUrl}
                          alt=""
                          fill
                          sizes="150px"
                          className="object-cover"
                          style={{ objectPosition: '50% 16%' }}
                          unoptimized
                        />
                      ) : (
                        <svg
                          viewBox="0 0 44 44"
                          aria-hidden
                          className="absolute inset-0 h-full w-full opacity-25"
                        >
                          <circle cx="22" cy="16" r="9" fill="#0a3d20" />
                          <path d="M4 44 C4 30 14 26 22 26 C30 26 40 30 40 44 Z" fill="#0a3d20" />
                        </svg>
                      )}
                      <span
                        className={`absolute inset-x-0 bottom-0 truncate px-1 py-[3px] text-center font-display font-bold uppercase leading-tight tracking-[0.04em] text-[10px] ${
                          isWinLine ? 'bg-yellow text-pitch-deep' : 'bg-pitch-deep text-yellow'
                        }`}
                      >
                        {pick.name}
                      </span>
                    </div>
                  </motion.div>
                ) : label ? (
                  <motion.div
                    key="cat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex w-full flex-col items-center gap-1.5 px-1 py-2 sm:px-2"
                  >
                    {managerName ? (
                      // Managers: tiny shared prefix, then the name gets the space.
                      <span className="flex w-full flex-col items-center gap-1 px-0.5">
                        <span className="text-[6.5px] font-extrabold uppercase leading-none tracking-[0.14em] text-card-muted-2 sm:text-[9px]">
                          Played under
                        </span>
                        <span className="line-clamp-3 w-full text-[10px] font-extrabold uppercase leading-tight tracking-[0.01em] text-card-ink break-words sm:text-[14px]">
                          {managerName}
                        </span>
                      </span>
                    ) : (
                      <>
                        {logo ? (
                          <Image
                            src={logo}
                            alt={displayCategory(label)}
                            width={44}
                            height={44}
                            className="h-11 w-11 object-contain sm:h-[38px] sm:w-[38px]"
                            unoptimized
                          />
                        ) : (
                          // Honours/squares have no crest - hide the trophy on mobile
                          // and let the text carry the clue.
                          <span
                            className="hidden text-[28px] leading-none sm:block sm:text-[30px]"
                            aria-hidden
                          >
                            🏆
                          </span>
                        )}
                        <span
                          className={`line-clamp-3 px-0.5 text-[11px] font-extrabold uppercase leading-tight tracking-[0.01em] text-card-ink sm:text-[12.5px] ${
                            // Crested cells stay icon-only on mobile unless labels are on.
                            logo && !showLabels ? 'max-sm:hidden' : ''
                          }`}
                        >
                          {displayCategory(label)}
                        </span>
                      </>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/** deterministic slap-down tilt for a solved sticker */
function solvedTilt(i: number) {
  return (((i * 7) % 5) - 2) * 1.2
}
