'use client'

import { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type RoomInviteProps = {
  roomId: string
  /** Path players open to join; defaults to the bingo room. */
  joinPath?: string
}

export function RoomInvite({ roomId, joinPath = `/room/${roomId}` }: RoomInviteProps) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState<'link' | 'id' | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

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
        <div className="rounded-[10px] border-[2.5px] border-card-ink bg-surface-hi p-3">
          <QRCodeSVG
            value={joinUrl}
            size={148}
            level="M"
            bgColor="#fffdf6"
            fgColor="#0a2417"
          />
        </div>
        <div className="w-full flex-1 space-y-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-card-muted">
              Room ID
            </p>
            <code className="mt-1.5 block break-all rounded-md border-2 border-card-ink bg-surface-2 px-3 py-2 font-mono text-sm font-medium text-card-ink">
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
