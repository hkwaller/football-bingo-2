import type { Metadata } from 'next'
import { SoloPlaySetup } from '@/components/SoloPlaySetup'

export const metadata: Metadata = {
  title: 'Play Bingo',
  description:
    'Build your board of clubs, countries and honours, then slap each drawn player on the square he fits and race to a line.',
  alternates: { canonical: '/play/setup' },
}

export default function SoloSetupPage() {
  return <SoloPlaySetup />
}
