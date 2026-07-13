'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { randomUUID } from '@/lib/randomUUID'

export default function NewTriviaRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id = `trivia-${randomUUID()}`
    router.replace(`/trivia/room/${id}`)
  }, [router])
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-chalk-dim">
      <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-turf shadow-glow-turf" />
      Creating trivia room…
    </div>
  )
}
