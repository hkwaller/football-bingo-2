'use client'

import { useEffect, useRef } from 'react'

import { useAdFree } from '@/hooks/useAdFree'

const POPUNDER_SRC = process.env.NEXT_PUBLIC_ADSTERRA_POPUNDER_SRC

/**
 * Adsterra popunder, fired once on mount. Self-gating: never injected for
 * ad-free users (or before Clerk hydrates). Mount this only where a popunder is
 * acceptable - e.g. the end-of-game screen on player devices.
 *
 * `suppressed` lets a caller inside a live room honor the host perk without this
 * component reading room storage itself.
 */
export function AdsterraPopunder({ suppressed = false }: { suppressed?: boolean }) {
  const { adFree, loading } = useAdFree()
  const fired = useRef(false)

  useEffect(() => {
    if (adFree || loading || suppressed || fired.current || !POPUNDER_SRC) return
    fired.current = true

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = POPUNDER_SRC
    document.body.appendChild(script)
  }, [adFree, loading, suppressed])

  return null
}
