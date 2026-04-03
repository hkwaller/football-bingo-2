'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NewRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `room-${Date.now()}`
    router.replace(`/room/${id}`)
  }, [router])
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-chalk/60">
      Creating room…
    </div>
  )
}
