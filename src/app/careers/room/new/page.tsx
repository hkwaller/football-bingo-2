'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { randomUUID } from '@/lib/randomUUID'
import { RoomConnecting } from '@/components/RoomConnecting'

export default function NewCareersRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id = `careers-${randomUUID()}`
    router.replace(`/careers/room/${id}`)
  }, [router])
  return <RoomConnecting mode="careers" state="creating" />
}
