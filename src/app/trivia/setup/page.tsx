import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TriviaSetup } from '@/components/trivia/TriviaSetup'

export const metadata: Metadata = {
  title: 'Play Trivia',
  description:
    'Quick-fire football trivia where the fastest correct answer wins the round. Play solo or against a full room.',
  alternates: { canonical: '/trivia/setup' },
}

export default function TriviaSetupPage() {
  return (
    <Suspense>
      <TriviaSetup />
    </Suspense>
  )
}
