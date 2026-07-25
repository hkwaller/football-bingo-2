import type { Metadata } from 'next'
import { TriviaGame } from '@/components/trivia/TriviaGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function TriviaPlayPage() {
  return <TriviaGame />
}
