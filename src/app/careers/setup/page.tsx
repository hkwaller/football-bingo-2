import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CareersSetup } from '@/components/careers/CareersSetup'

export const metadata: Metadata = {
  title: 'Play Careers',
  description:
    'Years and clubs, nothing else. Name the footballer from his career path - loans included. Solo, or race your mates in a room.',
}

export default function CareersSetupPage() {
  return (
    <Suspense>
      <CareersSetup />
    </Suspense>
  )
}
