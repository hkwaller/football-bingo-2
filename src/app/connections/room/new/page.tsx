'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { randomUUID } from '@/lib/randomUUID'
import { RoomConnecting } from '@/components/RoomConnecting'

export default function NewConnectionsRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id = `connections-${randomUUID()}`
    router.replace(`/connections/room/${id}`)
  }, [router])
  return <RoomConnecting mode="connections" state="creating" />
}
