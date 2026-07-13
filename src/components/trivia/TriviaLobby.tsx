'use client'

import { useCallback, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import type { TriviaConfig } from '@/lib/trivia/types'
import { DIFFICULTY_LABELS } from '@/lib/trivia/difficulty'

interface Player {
  connectionId: number
  displayName: string
  isHost: boolean
}

interface Props {
  roomId: string
  players: Player[]
  isHost: boolean
  config: TriviaConfig
  onStart: () => void
  onConfigChange?: (config: TriviaConfig) => void
}

export function TriviaLobby({ roomId, players, isHost, config, onStart }: Props) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const joinUrl = origin ? `${origin}/trivia/room/${roomId}` : `/trivia/room/${roomId}`

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [joinUrl])

  const sessionLabel: Record<string, string> = {
    fixed: `Fixed (${config.questionCount} questions)`,
    survival: 'Survival',
    timed: `Timed (${config.timeLimitSeconds}s)`,
    category: `Category: ${config.category}`,
  }

  const mechanicLabel: Record<string, string> = {
    race: 'Race — first correct wins',
    simultaneous: 'Simultaneous — everyone answers',
    'turn-based': 'Turn-based',
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 flex flex-col gap-8">
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="chip mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-turf" />
          Trivia room
        </div>
        <h1 className="font-display text-5xl font-bold uppercase tracking-wide text-chalk">
          Lobby
        </h1>
      </motion.div>

      {/* Config summary */}
      <div className="card flex flex-col gap-3 p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">Game settings</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <span className="text-chalk-dim">Session</span>
          <span className="font-medium text-chalk">{sessionLabel[config.sessionType] ?? config.sessionType}</span>
          <span className="text-chalk-dim">Difficulty</span>
          <span className="font-medium text-chalk">{DIFFICULTY_LABELS[config.difficulty]}</span>
          <span className="text-chalk-dim">Mechanic</span>
          <span className="font-medium text-chalk">{mechanicLabel[config.multiplayerMechanic] ?? config.multiplayerMechanic}</span>
        </div>
        {isHost && (
          <a href="/trivia/setup" className="mt-1 w-fit text-xs font-medium text-turf hover:underline">
            Change settings →
          </a>
        )}
      </div>

      {/* Invite */}
      <div className="card p-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">Invite players</p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0 rounded-xl bg-white p-3">
            <QRCodeSVG value={joinUrl} size={140} bgColor="#ffffff" fgColor="#070d09" />
          </div>
          <div className="flex flex-col gap-3 flex-1">
            <code className="block break-all rounded-xl border border-line bg-pitch px-3 py-2 font-mono text-sm text-turf">
              {roomId}
            </code>
            <button
              type="button"
              onClick={copy}
              className="btn btn-secondary btn-sm w-fit"
            >
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="flex flex-col gap-2.5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">
          Players ({players.length})
        </p>
        {players.map((p) => (
          <div
            key={p.connectionId}
            className="card flex items-center gap-3 rounded-xl px-4 py-3"
          >
            <span
              className={`h-2 w-2 rounded-full ${p.isHost ? 'bg-gold' : 'bg-turf'}`}
            />
            <span className="flex-1 text-sm font-semibold text-chalk">{p.displayName}</span>
            {p.isHost && (
              <span className="chip text-gold">host</span>
            )}
          </div>
        ))}
      </div>

      {/* Start button (host only) */}
      {isHost ? (
        <button
          onClick={onStart}
          disabled={players.length < 1}
          className="btn btn-primary btn-lg disabled:cursor-not-allowed"
        >
          Start game
        </button>
      ) : (
        <p className="text-center text-sm text-chalk-dim animate-pulse-soft">Waiting for host to start…</p>
      )}
    </div>
  )
}
