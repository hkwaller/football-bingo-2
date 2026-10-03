'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScanLine } from 'lucide-react'

import { useIsNativeApp } from '@/hooks/useNative'
import { haptic, scanQr } from '@/lib/native'
import { roomPathFromScan } from '@/lib/roomScan'

/**
 * Native app only: scan a room's invite QR code to join it. In a browser the
 * phone's own camera app already opens the link, so this renders nothing.
 */
export function ScanToJoin({ className = '' }: { className?: string }) {
  const native = useIsNativeApp()
  const router = useRouter()
  const [notARoom, setNotARoom] = useState(false)

  if (!native) return null

  const scan = async () => {
    setNotARoom(false)
    const text = await scanQr('Point the camera at the room QR code')
    if (!text) return
    const path = roomPathFromScan(text)
    if (path) {
      haptic('right')
      router.push(path)
    } else {
      haptic('wrong')
      setNotARoom(true)
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={scan}
        className="btn btn-outline-light btn-lg inline-flex items-center gap-2"
      >
        <ScanLine className="size-5" aria-hidden />
        Scan to join a room
      </button>
      {notARoom && (
        <p role="status" className="mt-2.5 text-sm font-bold text-on-green-dim">
          That QR code isn&apos;t a Football Bingo room. Try the code on the host&apos;s screen.
        </p>
      )}
    </div>
  )
}
