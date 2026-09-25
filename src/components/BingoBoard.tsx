'use client'

import { type ComponentProps, useMemo } from 'react'
import {
  type BoardConfig,
  bingoLinesForConfig,
  completedLineIndices,
  DEFAULT_BOARD_CONFIG,
  freeIndexForConfig,
  generateBoard,
} from '@/lib/board'
import { toBingoCellView } from '@/lib/bingoCellView'
import { BingoBoardView } from '@/components/BingoBoardView'

type BingoBoardProps = Omit<
  ComponentProps<typeof BingoBoardView>,
  'cells' | 'size' | 'boardKey' | 'winningCells'
> & {
  seed: string
  boardConfig?: BoardConfig
  lineHighlight?: boolean
}

export function BingoBoard({
  seed,
  boardConfig = DEFAULT_BOARD_CONFIG,
  lineHighlight = true,
  solved,
  ...rest
}: BingoBoardProps) {
  const cells = useMemo(() => generateBoard(seed, boardConfig).map(toBingoCellView), [seed, boardConfig])
  const lines = bingoLinesForConfig(boardConfig)
  const solvedSet = new Set(solved.keys())
  solvedSet.add(freeIndexForConfig(boardConfig))
  const winningLines = lineHighlight ? completedLineIndices(solvedSet, lines) : []
  const winningCells = new Set<number>()
  for (const li of winningLines) {
    for (const i of lines[li] ?? []) winningCells.add(i)
  }

  return (
    <BingoBoardView
      cells={cells}
      size={boardConfig.size}
      boardKey={seed}
      winningCells={winningCells}
      solved={solved}
      {...rest}
    />
  )
}
