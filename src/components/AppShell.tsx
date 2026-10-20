'use client'

import Link from 'next/link'
import { ClerkProvider } from '@clerk/nextjs'
import { NativeBoot } from '@/components/NativeBoot'
import { SiteHeader } from '@/components/SiteHeader'
import { TwinkleDots } from '@/components/TwinkleDots'
import { useIsNativeApp } from '@/hooks/useNative'
import { ADS_ENABLED } from '@/lib/ads'

function SiteFooter() {
  const native = useIsNativeApp()
  return (
    <footer className="mt-10 border-t border-surface/15 px-6 py-5 text-center text-xs text-on-green-dim">
      Player photos from{' '}
      <a href="https://commons.wikimedia.org" className="underline" target="_blank" rel="noreferrer">
        Wikimedia Commons
      </a>{' '}
      ·{' '}
      <Link href="/credits" className="underline">
        Photo credits
      </Link>
      {ADS_ENABLED && !native && (
        <>
          {' '}
          ·{' '}
          <Link href="/go-ad-free" className="underline">
            Go ad-free
          </Link>
        </>
      )}
      <nav aria-label="Legal and Playam" className="mt-3 flex flex-wrap justify-center gap-4"><a href="/privacy" style={{ textDecoration: "underline" }}>Privacy</a> · <a href="/terms" style={{ textDecoration: "underline" }}>Terms</a> · <a href="https://playam.app" style={{ textDecoration: "underline" }}>A game from Playam</a></nav>
    </footer>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  const inner = (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <NativeBoot />
      <TwinkleDots />
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="relative z-10">{children}</main>
      <SiteFooter />
    </>
  )

  if (!pk) {
    return inner
  }

  return <ClerkProvider publishableKey={pk}>{inner}</ClerkProvider>
}
