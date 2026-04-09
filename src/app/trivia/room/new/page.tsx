'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NewTriviaRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `trivia-${crypto.randomUUID()}`
        : `trivia-room-${Date.now()}`
    router.replace(`/trivia/room/${id}`)
  }, [router])
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-chalk/60 font-mono">
      Creating trivia room…
    </div>
  )
}
