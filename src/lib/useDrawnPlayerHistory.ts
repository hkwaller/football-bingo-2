'use client'

import { useEffect, useRef, useState } from 'react'

/** Tracks player ids drawn on earlier rounds so they are not pulled again. */
export function useDrawnPlayerHistory(round: number, resetKey: string) {
  const [drawnPlayerIds, setDrawnPlayerIds] = useState<string[]>([])
  const lastDrawnPlayerIdRef = useRef<string | null>(null)
  const prevRoundRef = useRef(0)

  useEffect(() => {
    setDrawnPlayerIds([])
    lastDrawnPlayerIdRef.current = null
    prevRoundRef.current = 0
  }, [resetKey])

  useEffect(() => {
    if (round > prevRoundRef.current) {
      const pid = lastDrawnPlayerIdRef.current
      if (pid) {
        setDrawnPlayerIds((prev) => (prev.includes(pid) ? prev : [...prev, pid]))
      }
    }
    prevRoundRef.current = round
  }, [round])

  const noteDrawnPlayer = (playerId: string | null | undefined) => {
    lastDrawnPlayerIdRef.current = playerId ?? null
  }

  const restoreDrawnPlayerIds = (ids: string[]) => {
    setDrawnPlayerIds(ids)
    prevRoundRef.current = round
  }

  return { drawnPlayerIds, noteDrawnPlayer, restoreDrawnPlayerIds }
}
