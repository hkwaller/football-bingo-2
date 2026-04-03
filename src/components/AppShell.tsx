'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { SiteHeader } from '@/components/SiteHeader'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  const inner = (
    <>
      <SiteHeader />
      <main>{children}</main>
    </>
  )

  if (!pk) {
    return inner
  }

  return <ClerkProvider publishableKey={pk}>{inner}</ClerkProvider>
}
