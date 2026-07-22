'use client'

import { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import type { TenableConfig } from '@/lib/tenable/types'

interface Player {
  connectionId: number
  displayName: string
  isHost: boolean
}

interface Props {
  roomId: string
  players: Player[]
  isHost: boolean
  config: TenableConfig
  onStart: () => void
}

export function TenableLobby({ roomId, players, isHost, config, onStart }: Props) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const joinUrl = origin ? `${origin}/tenable/room/${roomId}` : `/tenable/room/${roomId}`

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }, [joinUrl])

  const focusLabel = config.groups === 'all' ? 'All topics' : config.groups.join(', ')

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-[18px] px-6 py-8 md:px-9">
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <span className="eyebrow">Tenable · turn-based</span>
        <h1 className="mt-2.5 font-display text-[48px] font-black uppercase leading-[0.9] text-white md:text-[56px]">
          The squad gathers
        </h1>
        <p className="mt-2 text-[14.5px] font-semibold text-on-green-soft">
          Take turns naming the ten. Share lives — a wrong guess costs the whole room.
        </p>
      </motion.div>

      <div className="panel flex flex-col gap-3 p-6">
        <p className="eyebrow">Game settings</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <span className="text-muted">Lives</span>
          <span className="font-semibold text-ink">{config.lives}</span>
          <span className="text-muted">Categories</span>
          <span className="font-semibold text-ink">{config.questionCount}</span>
          <span className="text-muted">Topic</span>
          <span className="font-semibold text-ink capitalize">{focusLabel}</span>
          <span className="text-muted">Difficulty</span>
          <span className="font-semibold text-ink capitalize">{config.difficulty}</span>
        </div>
        {isHost && (
          <a
            href="/tenable/setup?mode=multiplayer"
            className="mt-1 w-fit text-xs font-bold uppercase tracking-[0.06em] text-red hover:underline"
          >
            Change settings →
          </a>
        )}
      </div>

      <div className="panel p-6">
        <p className="eyebrow mb-4">Room code</p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0 rounded-[12px] border-[3px] border-card-ink bg-white p-2">
            <QRCodeSVG value={joinUrl} size={140} bgColor="#ffffff" fgColor="#0a3d20" />
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <code className="block break-all rounded-xl border-[3px] border-card-ink bg-card-tint px-3 py-2 font-mono text-sm font-bold text-card-ink">
              {roomId}
            </code>
            <button type="button" onClick={copy} className="btn btn-outline btn-sm w-fit">
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="eyebrow">In the room ({players.length})</p>
        {players.map((p) => (
          <div key={p.connectionId} className="panel flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-go font-display text-lg font-black uppercase leading-none text-white">
              {p.displayName.charAt(0) || '?'}
            </span>
            <span className="flex-1 text-sm font-bold text-card-ink">{p.displayName}</span>
            {p.isHost && (
              <span className="-rotate-2 rounded-md bg-yellow px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-pitch-deep shadow-[0_2px_0_rgba(0,0,0,0.2)]">
                Gaffer
              </span>
            )}
          </div>
        ))}
      </div>

      {isHost ? (
        <button
          onClick={onStart}
          disabled={players.length < 1}
          className="btn btn-primary btn-lg disabled:cursor-not-allowed"
        >
          Start match
        </button>
      ) : (
        <p className="text-center text-sm font-semibold text-on-green-soft animate-pulse-soft">
          In the tunnel - waiting for the gaffer…
        </p>
      )}
    </div>
  )
}
