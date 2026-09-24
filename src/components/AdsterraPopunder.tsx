'use client'

import { useEffect } from 'react'

import { useAdFree } from '@/hooks/useAdFree'
import { armPopunder } from '@/lib/popunder'

const POPUNDER_SRC = process.env.NEXT_PUBLIC_ADSTERRA_POPUNDER_SRC

/**
 * Adsterra popunder, active only while mounted. Self-gating: never injected for
 * ad-free users (or before Clerk hydrates). Mount this only where a popunder is
 * acceptable - e.g. the end-of-game screen on player devices. On unmount its
 * page-wide click listeners are detached, so it can't fire during the next game
 * (see lib/popunder).
 *
 * `suppressed` lets a caller inside a live room honor the host perk without this
 * component reading room storage itself.
 */
export function AdsterraPopunder({ suppressed = false }: { suppressed?: boolean }) {
  const { adFree, loading } = useAdFree()

  useEffect(() => {
    if (adFree || loading || suppressed || !POPUNDER_SRC) return
    return armPopunder(POPUNDER_SRC)
  }, [adFree, loading, suppressed])

  return null
}
