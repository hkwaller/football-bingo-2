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
    <div className="rounded-2xl border border-white/12 bg-black/30 p-5">
      <p className="font-display text-lg font-bold text-chalk">Invite players</p>
      <p className="mt-1 text-sm text-chalk/60">
        Scan the QR code or share the link. Everyone needs the same room to play
        together.
      </p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-xl bg-white p-3 shadow-lg">
          <QRCodeSVG
            value={joinUrl}
            size={168}
            level="M"
            bgColor="#ffffff"
            fgColor="#06060a"
          />
        </div>
        <div className="w-full flex-1 space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-chalk/50">
              Room ID
            </p>
            <code className="mt-1 block break-all rounded-lg border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-[var(--fb-accent-cyan)]">
              {roomId}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy('link')}
              className="rounded-xl bg-[var(--fb-accent-lime)] px-4 py-2 text-sm font-bold text-black hover:opacity-95"
            >
              {copied === 'link' ? 'Copied link!' : 'Copy invite link'}
            </button>
            <button
              type="button"
              onClick={() => copy('id')}
              className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-chalk hover:bg-white/10"
            >
              {copied === 'id' ? 'Copied ID!' : 'Copy room ID'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
