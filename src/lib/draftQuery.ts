import { boardConfigPayload, type BoardConfig } from '@/lib/boardConfig'
import type { DraftPolicy } from '@/lib/draftPolicy'

export function draftApiUrl(opts: {
  seed: string
  round: number
  policy: DraftPolicy
  boardConfig: BoardConfig
  occupiedIndices: number[]
}): string {
  const params = new URLSearchParams({
    seed: opts.seed,
    round: String(opts.round),
    policy: opts.policy,
    boardConfig: JSON.stringify(boardConfigPayload(opts.boardConfig)),
    occupied: [...opts.occupiedIndices].sort((a, b) => a - b).join(','),
  })
  return `/api/game/draft?${params.toString()}`
}
