'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { randomUUID } from '@/lib/randomUUID'
import { RoomConnecting } from '@/components/RoomConnecting'

export default function NewTriviaRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id = `trivia-${randomUUID()}`
    router.replace(`/trivia/room/${id}`)
  }, [router])
  return <RoomConnecting mode="trivia" state="creating" />
}
