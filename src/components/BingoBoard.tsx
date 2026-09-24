'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Target, Trophy } from 'lucide-react'
import {
  type BoardCell,
  type BoardConfig,
  bingoLinesForConfig,
  completedLineIndices,
  DEFAULT_BOARD_CONFIG,
  freeIndexForConfig,
  generateBoard,
} from '@/lib/board'
import { type CategoryKind, categoryLogo, displayCategory, getCategoryKind } from '@/lib/canonical'
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
  /** Shared board: who has voted for each square (roundels on the square's edge). */
  cellVoters?: Map<number, { key: string; initial: string; color: string }[]>
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
  cellVoters,
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
    <div className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-xl border-[2.5px] border-ink bg-pitch-deep/90 p-[7px] shadow-[0_6px_0_#0a2417] sm:rounded-2xl sm:p-[18px] sm:shadow-[0_10px_0_#0a2417]">
      {/* faint chalk ring bleeding through the tray */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface/[0.07]" />
      <div
        className="relative grid gap-[5px] sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {cells.map((cell, index) => {
          const isFree = cell.kind === 'free'
          const label = cell.kind === 'category' ? cell.label : null
          const logo = label ? categoryLogo(label) : null
          const catKind = label ? getCategoryKind(label) : null
          const meta = catKind ? KIND_META[catKind] : null
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
              style={isFree ? { transform: 'rotate(-1.5deg)' } : undefined}
              // bingo-cell = size container; everything that scales lives on .bingo-cell-inner.
              className={`bingo-cell overflow-hidden rounded-md text-center transition-all duration-150 sm:rounded-lg ${
                pick
                  ? isWinLine
                    ? 'cursor-not-allowed border-2 border-yellow bg-[#fff3b8]'
                    : 'cursor-not-allowed border-2 border-dashed border-surface/35 bg-surface/[0.14]'
                  : isFree
                    ? 'border-2 border-ink bg-yellow text-ink shadow-[0_3px_0_#0a2417] sm:shadow-[0_5px_0_#0a2417]'
                    : voteHi
                      ? 'border-2 border-ink bg-surface shadow-[0_3px_0_#0a2417] outline outline-4 outline-offset-2 outline-coral sm:shadow-[0_5px_0_#0a2417]'
                      : restricted && !allowed
                        ? 'cursor-not-allowed border-2 border-ink/50 bg-surface/40 opacity-40'
                        : 'border-2 border-ink bg-surface shadow-[0_3px_0_#0a2417] hover:-translate-y-[3px] sm:shadow-[0_5px_0_#0a2417]'
              }`}
            >
              {cellVoters?.get(index)?.length ? (
                <span className="pointer-events-none absolute bottom-[5cqi] right-[5cqi] z-10 flex" aria-hidden>
                  {cellVoters.get(index)!.map((v) => (
                    <span
                      key={v.key}
                      className={`-ml-[4cqi] flex h-[20cqi] w-[20cqi] items-center justify-center rounded-full border-2 border-ink font-display text-[length:clamp(8px,11cqi,13px)] font-black uppercase leading-none text-ink ${v.color}`}
                    >
                      {v.initial}
                    </span>
                  ))}
                </span>
              ) : null}
              <AnimatePresence>
                {isWrong ? (
                  <motion.div
                    key={`wrong-${wrongCell?.nonce}`}
                    className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] border-[4px] border-live-red"
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
                    className="bingo-cell-inner justify-center gap-[4cqi]"
                  >
                    <Star aria-hidden className="h-[26cqi] w-[26cqi] fill-ink stroke-none" />
                    <span className="font-display text-[length:clamp(11px,17cqi,22px)] font-black uppercase leading-none tracking-[0.06em]">
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
                    className="absolute inset-[9%] rounded-[6px] border-2 border-ink bg-surface-hi p-[4%] shadow-[0_3px_0_#0a2417]"
                  >
                    {/* portrait fills the sticker, name bar under it */}
                    <div className="halftone relative h-full w-full overflow-hidden rounded-[3px] bg-sky">
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
                          className="absolute inset-0 h-full w-full opacity-50"
                        >
                          <circle cx="22" cy="16" r="9" fill="#0a2417" />
                          <path d="M4 44 C4 30 14 26 22 26 C30 26 40 30 40 44 Z" fill="#0a2417" />
                        </svg>
                      )}
                      <span
                        className={`absolute inset-x-0 bottom-0 truncate px-1 py-[3%] text-center font-display text-[length:clamp(8px,11cqi,14px)] font-black uppercase leading-none tracking-[0.02em] ${
                          isWinLine ? 'bg-yellow text-ink' : 'bg-ink text-yellow'
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
                    className="bingo-cell-inner justify-center gap-[5cqi] px-[6cqi] pb-[6cqi] pt-[14cqi]"
                  >
                    {/* category bar: kind name on desktop, just the colour bar on mobile */}
                    {meta ? (
                      <span className="absolute inset-x-[7cqi] top-[7cqi] flex items-center justify-center gap-1 sm:justify-between">
                        <span className="hidden font-mono text-[length:clamp(8px,7.5cqi,10px)] font-semibold uppercase leading-none tracking-[0.08em] text-card-muted sm:inline">
                          {meta.label}
                        </span>
                        <span className={`h-[5cqi] min-h-[3px] w-[44cqi] rounded-sm sm:w-[16cqi] ${meta.bar}`} />
                      </span>
                    ) : null}
                    {managerName ? (
                      // Managers: tiny shared prefix, then the name gets the space.
                      <span className="flex w-full flex-col items-center gap-[3cqi]">
                        <span className="font-mono text-[length:clamp(6.5px,7.5cqi,10px)] font-semibold uppercase leading-none tracking-[0.1em] text-card-muted">
                          Played under
                        </span>
                        <span className="line-clamp-2 w-full break-words font-display text-[length:clamp(8.5px,12.5cqi,16px)] font-extrabold uppercase leading-[1.1] tracking-[0.02em] text-ink sm:line-clamp-3">
                          {managerName}
                        </span>
                      </span>
                    ) : (
                      <>
                        {logo ? (
                          <Image
                            src={logo}
                            alt={displayCategory(label)}
                            width={64}
                            height={64}
                            className="h-[32cqi] w-[32cqi] shrink-0 object-contain"
                            unoptimized
                          />
                        ) : catKind === 'trait' ? (
                          <Target aria-hidden className="hidden h-[22cqi] w-[22cqi] shrink-0 text-card-muted sm:block" strokeWidth={1.9} />
                        ) : (
                          // Honours have no crest - hide the trophy on mobile and let the text carry the clue.
                          <Trophy aria-hidden className="hidden h-[24cqi] w-[24cqi] shrink-0 text-[#9a7400] sm:block" strokeWidth={1.9} />
                        )}
                        <span
                          className={`line-clamp-2 w-full break-words font-display text-[length:clamp(8.5px,11.5cqi,15px)] font-extrabold uppercase leading-[1.1] tracking-[0.02em] text-ink sm:line-clamp-3 ${
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

const KIND_META: Record<CategoryKind, { label: string; bar: string }> = {
  club: { label: 'Club', bar: 'bg-green-go' },
  nationality: { label: 'Nation', bar: 'bg-sky' },
  achievement: { label: 'Honour', bar: 'bg-yellow' },
  trait: { label: 'Trait', bar: 'bg-card-muted' },
  manager: { label: 'Manager', bar: 'bg-card-muted' },
}

/** deterministic slap-down tilt for a solved sticker */
function solvedTilt(i: number) {
  return (((i * 7) % 5) - 2) * 1.2
}
