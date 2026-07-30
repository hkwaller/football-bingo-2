import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BingoSetup } from '@/components/BingoSetup'

export const metadata: Metadata = {
  title: 'Play Bingo',
  description:
    'Build your board of clubs, countries and honours, then slap each drawn player on the square he fits and race to a line.',
  alternates: { canonical: '/play/setup' },
}

export default function BingoSetupPage() {
  return (
    <Suspense>
      <BingoSetup />
    </Suspense>
  )
}
