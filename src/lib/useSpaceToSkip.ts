'use client'

import { useEffect } from 'react'
import { createSpaceToSkipHandler } from './spaceToSkip'

/** Space skips from the game background and board, preserving other controls. */
export function useSpaceToSkip(enabled: boolean, onSkip: () => void) {
  useEffect(() => {
    if (!enabled) return
    const onKey = createSpaceToSkipHandler(onSkip)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, onSkip])
}
