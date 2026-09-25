'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { randomUUID } from '@/lib/randomUUID'
import { RoomConnecting } from '@/components/RoomConnecting'

export default function NewRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id = randomUUID()
    router.replace(`/room/${id}`)
  }, [router])
  return <RoomConnecting mode="bingo" state="creating" />
}
