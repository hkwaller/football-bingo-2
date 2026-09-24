import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Famous11sSetup } from '@/components/famous11s/Famous11sSetup'

export const metadata: Metadata = {
  title: 'Play Famous 11s',
  description:
    'Name all eleven players from iconic football lineups - World Cup finals, Champions League classics and legendary club sides. Solo or in a live room.',
  alternates: { canonical: '/famous-11s/setup' },
}

export default function Famous11sSetupPage() {
  return (
    <Suspense>
      <Famous11sSetup />
    </Suspense>
  )
}
