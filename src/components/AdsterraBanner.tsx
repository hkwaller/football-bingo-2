'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

import { useAdFree } from '@/hooks/useAdFree'

const BANNER_KEY = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY

/**
 * Adsterra 468x60 banner. Self-gating: renders nothing for ad-free users (and
 * while Clerk hydrates, to avoid a flash). Includes a subtle "Remove ads" link
 * so the banner doubles as the upsell entry point.
 *
 * `suppressed` lets a caller inside a live room hide the banner via the host
 * perk (see useInGameAdsSuppressed) without this component reading room storage
 * itself - so it stays safe to render outside a RoomProvider too.
 *
 * `tone` styles the "Remove ads" link for its surface: 'green' (on the green
 * stage, the default) or 'card' (dark text, for use inside a white card).
 */
export function AdsterraBanner({
  suppressed = false,
  tone = 'green',
}: {
  suppressed?: boolean
  tone?: 'green' | 'card'
}) {
  const { adFree, loading } = useAdFree()
  const containerRef = useRef<HTMLDivElement>(null)
  // No key configured → no ad to show, so render nothing (incl. the upsell link).
  const hidden = adFree || loading || suppressed || !BANNER_KEY

  useEffect(() => {
    if (hidden || !containerRef.current || !BANNER_KEY) return
    const container = containerRef.current
    container.innerHTML = ''

    const optionsScript = document.createElement('script')
    optionsScript.type = 'text/javascript'
    optionsScript.text = `
      atOptions = {
        'key': '${BANNER_KEY}',
        'format': 'iframe',
        'height': 60,
        'width': 468,
        'params': {}
      };
    `

    const invokeScript = document.createElement('script')
    invokeScript.type = 'text/javascript'
    invokeScript.src = `//www.topcreativeformat.com/${BANNER_KEY}/invoke.js`

    container.appendChild(optionsScript)
    container.appendChild(invokeScript)

    return () => {
      container.innerHTML = ''
    }
  }, [hidden])

  if (hidden) return null

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div ref={containerRef} className="flex justify-center" style={{ minHeight: 60 }} />
      <Link
        href="/go-ad-free"
        className={
          tone === 'card'
            ? 'text-xs font-bold uppercase tracking-wide text-card-muted underline decoration-dotted underline-offset-2 hover:text-card-ink'
            : 'text-xs font-bold uppercase tracking-wide text-on-green-dim underline decoration-dotted underline-offset-2 hover:text-white'
        }
      >
        Remove ads
      </Link>
    </div>
  )
}
