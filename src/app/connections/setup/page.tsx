import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ConnectionsSetup } from '@/components/connections/ConnectionsSetup'
import { connectionsPoolSizes } from '@/data/connections'

export const metadata: Metadata = {
  title: 'Play Connections',
  description:
    'Two clubs, one player. Name a footballer who played for both - or all three. Solo, or race your mates in a room.',
  alternates: { canonical: '/connections/setup' },
}

export default function ConnectionsSetupPage() {
  return (
    <Suspense>
      <ConnectionsSetup pools={connectionsPoolSizes()} />
    </Suspense>
  )
}
