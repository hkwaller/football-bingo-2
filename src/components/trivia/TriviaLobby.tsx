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
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="inline-block border-4 border-white bg-black px-6 py-2 shadow-brutal-lime -rotate-1 mb-4">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--fb-accent-lime)]">
            Trivia Room
          </p>
        </div>
        <h1 className="font-display text-5xl text-white tracking-wider" style={{ textShadow: '4px 4px 0 var(--fb-accent-magenta)' }}>
          LOBBY
        </h1>
      </motion.div>

      {/* Config summary */}
      <div className="border-4 border-white/20 p-4 flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-chalk/40">Game settings</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm">
          <span className="text-chalk/50">Session</span>
          <span className="text-white font-bold">{sessionLabel[config.sessionType] ?? config.sessionType}</span>
          <span className="text-chalk/50">Difficulty</span>
          <span className="text-white font-bold">{DIFFICULTY_LABELS[config.difficulty]}</span>
          <span className="text-chalk/50">Mechanic</span>
          <span className="text-white font-bold">{mechanicLabel[config.multiplayerMechanic] ?? config.multiplayerMechanic}</span>
        </div>
        {isHost && (
          <a href="/trivia/setup" className="text-xs font-mono text-[var(--fb-accent-cyan)] hover:underline mt-1 w-fit">
            Change settings →
          </a>
        )}
      </div>

      {/* Invite */}
      <div className="border-4 border-white/20 p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-chalk/40 mb-4">Invite players</p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="bg-white p-3 shrink-0">
            <QRCodeSVG value={joinUrl} size={140} bgColor="#ffffff" fgColor="#06060a" />
          </div>
          <div className="flex flex-col gap-3 flex-1">
            <code className="block break-all border-2 border-white/20 bg-black/40 px-3 py-2 font-mono text-sm text-[var(--fb-accent-cyan)]">
              {roomId}
            </code>
            <button
              type="button"
              onClick={copy}
              className="fb-brutal-btn px-4 py-2 text-sm w-fit"
            >
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-chalk/40">
          Players ({players.length})
        </p>
        {players.map((p) => (
          <div
            key={p.connectionId}
            className="flex items-center gap-3 border-2 border-white/20 px-4 py-3"
          >
            <span
              className={`w-2 h-2 rounded-full ${p.isHost ? 'bg-[var(--fb-accent-yellow)]' : 'bg-[var(--fb-accent-lime)]'}`}
            />
            <span className="font-mono text-white font-bold flex-1">{p.displayName}</span>
            {p.isHost && (
              <span className="font-mono text-xs text-[var(--fb-accent-yellow)] uppercase tracking-widest">host</span>
            )}
          </div>
        ))}
      </div>

      {/* Start button (host only) */}
      {isHost ? (
        <button
          onClick={onStart}
          disabled={players.length < 1}
          className="fb-brutal-btn px-8 py-5 text-2xl disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start game
        </button>
      ) : (
        <p className="font-mono text-chalk/50 text-center">Waiting for host to start…</p>
      )}
    </div>
  )
}
