'use client'

import { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type RoomInviteProps = {
  roomId: string
}

export function RoomInvite({ roomId }: RoomInviteProps) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState<'link' | 'id' | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const joinPath = `/room/${roomId}`
  const joinUrl = origin ? `${origin}${joinPath}` : joinPath

  const copy = useCallback(async (kind: 'link' | 'id') => {
    const text = kind === 'link' ? joinUrl : roomId
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied(null)
    }
  }, [joinUrl, roomId])

  return (
    <div className="card p-5">
      <p className="font-display text-2xl font-semibold uppercase tracking-wide text-chalk">
        Invite players
      </p>
      <p className="mt-1 text-sm text-chalk-dim">
        Scan the QR code or share the link. Everyone needs the same room to play
        together.
      </p>
      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="rounded-xl border border-line bg-white p-3 shadow-soft">
          <QRCodeSVG
            value={joinUrl}
            size={168}
            level="M"
            bgColor="#ffffff"
            fgColor="#06060a"
          />
        </div>
        <div className="w-full flex-1 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">
              Room ID
            </p>
            <code className="mt-1.5 block break-all rounded-xl border border-line bg-pitch px-3 py-2 font-mono text-sm text-turf">
              {roomId}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy('link')}
              className="btn btn-primary"
            >
              {copied === 'link' ? 'Copied link!' : 'Copy invite link'}
            </button>
            <button
              type="button"
              onClick={() => copy('id')}
              className="btn btn-secondary"
            >
              {copied === 'id' ? 'Copied ID!' : 'Copy room ID'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
