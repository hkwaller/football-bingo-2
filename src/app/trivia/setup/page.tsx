import { Suspense } from 'react'
import { TriviaSetup } from '@/components/trivia/TriviaSetup'

export default function TriviaSetupPage() {
  return (
    <Suspense>
      <TriviaSetup />
    </Suspense>
  )
}
