'use client'

import { useEffect, useRef, useState } from 'react'

/** Tracks player ids drawn on earlier rounds so they are not pulled again. */
export function useDrawnPlayerHistory(round: number, resetKey: string, persistenceKey?: string) {
  const [drawnPlayerIds, setDrawnPlayerIds] = useState<string[]>([])
  const lastDrawnPlayerIdRef = useRef<string | null>(null)
  const prevRoundRef = useRef(0)

  useEffect(() => {
    let restored: string[] = []
    if (persistenceKey) {
      try {
        const saved: unknown = JSON.parse(
          sessionStorage.getItem(`fb_draws:${persistenceKey}`) ?? '[]',
        )
        if (Array.isArray(saved) && saved.every((x) => typeof x === 'string')) restored = saved
      } catch {}
    }
    setDrawnPlayerIds(restored)
    lastDrawnPlayerIdRef.current = null
    prevRoundRef.current = 0
  }, [resetKey, persistenceKey])

  useEffect(() => {
    if (round > prevRoundRef.current) {
      const pid = lastDrawnPlayerIdRef.current
      if (pid) {
        setDrawnPlayerIds((prev) => {
          const next = prev.includes(pid) ? prev : [...prev, pid]
          if (persistenceKey) {
            try {
              sessionStorage.setItem(`fb_draws:${persistenceKey}`, JSON.stringify(next))
            } catch {}
          }
          return next
        })
      }
    }
    prevRoundRef.current = round
  }, [round, persistenceKey])

  const noteDrawnPlayer = (playerId: string | null | undefined) => {
    lastDrawnPlayerIdRef.current = playerId ?? null
  }

  const restoreDrawnPlayerIds = (ids: string[]) => {
    setDrawnPlayerIds(ids)
    prevRoundRef.current = round
  }

  return { drawnPlayerIds, noteDrawnPlayer, restoreDrawnPlayerIds }
}
