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
    <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm font-medium text-muted">
      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-red" />
      Creating trivia room…
    </div>
  )
}
