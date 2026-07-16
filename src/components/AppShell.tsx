'use client'

import Link from 'next/link'
import { ClerkProvider } from '@clerk/nextjs'
import { SiteHeader } from '@/components/SiteHeader'

function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-line px-6 py-5 text-center text-xs text-muted">
      Player photos from{' '}
      <a href="https://commons.wikimedia.org" className="underline" target="_blank" rel="noreferrer">
        Wikimedia Commons
      </a>{' '}
      ·{' '}
      <Link href="/credits" className="underline">
        Photo credits
      </Link>
    </footer>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  const inner = (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  )

  if (!pk) {
    return inner
  }

  return <ClerkProvider publishableKey={pk}>{inner}</ClerkProvider>
}
