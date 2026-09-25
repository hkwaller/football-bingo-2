'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { randomUUID } from '@/lib/randomUUID'
import { RoomConnecting } from '@/components/RoomConnecting'

export default function NewFamous11sRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id = `eleven-${randomUUID()}`
    router.replace(`/famous-11s/room/${id}`)
  }, [router])
  return <RoomConnecting mode="famous11s" state="creating" />
}
