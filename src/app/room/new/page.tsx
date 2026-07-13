'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { randomUUID } from '@/lib/randomUUID'

export default function NewRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id = randomUUID()
    router.replace(`/room/${id}`)
  }, [router])
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm font-medium text-muted">
      <span className="inline-block size-2 animate-pulse rounded-full bg-red" />
      Creating room…
    </div>
  )
}
