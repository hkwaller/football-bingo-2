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
    <div className="panel p-6">
      <p className="eyebrow eyebrow-sky mb-4">Season ticket</p>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="rounded-[12px] border-[3px] border-card-ink bg-white p-3">
          <QRCodeSVG
            value={joinUrl}
            size={148}
            level="M"
            bgColor="#ffffff"
            fgColor="#0a3d20"
          />
        </div>
        <div className="w-full flex-1 space-y-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-card-muted">
              Room ID
            </p>
            <code className="mt-1.5 block break-all rounded-[8px] border-[3px] border-card-ink bg-card-tint px-3 py-2 font-mono text-sm font-bold text-card-ink">
              {roomId}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy('link')}
              className="btn btn-primary btn-sm"
            >
              {copied === 'link' ? 'Copied link!' : 'Copy invite link'}
            </button>
            <button
              type="button"
              onClick={() => copy('id')}
              className="btn btn-outline btn-sm"
            >
              {copied === 'id' ? 'Copied ID!' : 'Copy room ID'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
