'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { boardConfigPayload, type BoardConfig } from '@/lib/boardConfig'
import { bingoHintKey, canBuyBingoHint } from '@/lib/bingoHints'

type Options = {
  seed: string
  round: number
  playerId?: string
  boardConfig: BoardConfig
  occupiedIndices: number[]
  points: number
  purchased: boolean
  enabled: boolean
  buy: (key: string) => boolean
}

/** A hint belongs to one draw. Late responses never charge a later draw. */
export function useBingoHint(options: Options) {
  const { seed, round, playerId, boardConfig, occupiedIndices, points, purchased, enabled, buy } = options
  const key = bingoHintKey(seed, round, playerId ?? '')
  const current = useRef(options)
  const mounted = useRef(false)
  useLayoutEffect(() => {
    current.current = options
    mounted.current = true
    return () => { mounted.current = false }
  })
  const pending = useRef(false)
  const [result, setResult] = useState<{ key: string; cells?: number[]; error?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const active = result?.key === key ? result : null
  const revealed = active?.cells !== undefined

  async function reveal() {
    if (pending.current || !enabled || !playerId || revealed || !canBuyBingoHint(points, purchased)) return
    pending.current = true
    setLoading(true)
    try {
      const response = await fetch('/api/game/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, playerId, boardConfig: boardConfigPayload(boardConfig), occupiedIndices }),
      })
      const data = await response.json() as { matchingCells?: number[]; error?: string }
      const latest = current.current
      if (!mounted.current || !latest.enabled || bingoHintKey(latest.seed, latest.round, latest.playerId ?? '') !== key) return
      if (!response.ok || !Array.isArray(data.matchingCells)) throw new Error('Could not load hint. Try again.')
      const cells = data.matchingCells.filter((i) => !latest.occupiedIndices.includes(i))
      if (cells.length > 0 && !latest.buy(key)) return
      setResult({ key, cells })
    } catch {
      const latest = current.current
      if (mounted.current && bingoHintKey(latest.seed, latest.round, latest.playerId ?? '') === key) {
        setResult({ key, error: 'Could not load hint. Try again. No points spent.' })
      }
    } finally {
      pending.current = false
      if (mounted.current) setLoading(false)
    }
  }

  const cells = enabled && active?.cells ? new Set(active.cells.filter((i) => !occupiedIndices.includes(i))) : null
  return {
    cells,
    loading,
    reveal,
    disabled: !enabled || !playerId || loading || revealed || !canBuyBingoHint(points, purchased),
    label: loading ? 'Checking…' : revealed ? active?.cells?.length ? 'Hint shown' : 'No match' : purchased ? 'Show hint' : 'Hint · 50 pts',
    message: active?.error ?? (enabled && revealed
      ? cells?.size ? `${cells.size} matching ${cells.size === 1 ? 'square' : 'squares'} marked. Choose where to play.`
        : 'No empty squares fit this player. No points spent.'
      : null),
  }
}
