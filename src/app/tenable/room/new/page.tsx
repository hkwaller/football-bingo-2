'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { randomUUID } from '@/lib/randomUUID'
import { RoomConnecting } from '@/components/RoomConnecting'

export default function NewTenableRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id = `tenable-${randomUUID()}`
    router.replace(`/tenable/room/${id}`)
  }, [router])
  return <RoomConnecting mode="tenable" state="creating" />
}
