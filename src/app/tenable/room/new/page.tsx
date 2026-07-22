'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { randomUUID } from '@/lib/randomUUID'

export default function NewTenableRoomPage() {
  const router = useRouter()
  useEffect(() => {
    const id = `tenable-${randomUUID()}`
    router.replace(`/tenable/room/${id}`)
  }, [router])
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm font-medium text-muted">
      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-red" />
      Creating Tenable room…
    </div>
  )
}
