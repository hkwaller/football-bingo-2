import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TenableSetup } from '@/components/tenable/TenableSetup'

export const metadata: Metadata = {
  title: 'Play Tenable',
  description:
    'Name the ten - top scorers, most caps, biggest transfers. Fill the list before your lives run out, solo or in a room.',
  alternates: { canonical: '/tenable/setup' },
}

export default function TenableSetupPage() {
  return (
    <Suspense>
      <TenableSetup />
    </Suspense>
  )
}
