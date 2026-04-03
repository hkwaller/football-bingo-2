'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import type { PlayMode } from '@/lib/playMode'

export type DrawnPlayer = {
  playerId: string
  name: string
  imageUrl?: string
}

type DrawnPlayerPanelProps = {
  mode: PlayMode
  round: number
  loading: boolean
  player: DrawnPlayer | null
  error?: string | null
  cooldownRemainingMs?: number
}

export function DrawnPlayerPanel({
  mode,
  round,
  loading,
  player,
  error,
  cooldownRemainingMs = 0,
}: DrawnPlayerPanelProps) {
  if (mode !== 'draft') return null

  return (
    <motion.section
      layout
      className="mb-6 rounded-xl border border-white/15 bg-gradient-to-br from-emerald-950/50 to-black/40 p-4 sm:p-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/90">
            This round
          </p>
          <p className="mt-1 text-sm text-chalk/70">
            Place this player on the square that matches them.
          </p>
          <p className="mt-1 font-mono text-xs text-chalk/40">Round {round + 1}</p>
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="flex h-20 w-20 animate-pulse rounded-full bg-white/10" />
          ) : player ? (
            <>
              {player.imageUrl ? (
                <Image
                  src={player.imageUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="rounded-full border-2 border-emerald-500/40 object-cover shadow-lg"
                  unoptimized
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/5 text-chalk/50">
                  ?
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-chalk">{player.name}</p>
                <p className="text-xs text-chalk/50">Tap the correct square</p>
              </div>
            </>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      {cooldownRemainingMs > 0 ? (
        <p className="mt-2 text-xs text-chalk/50">
          Try again in {Math.ceil(cooldownRemainingMs / 1000)}s…
        </p>
      ) : null}
    </motion.section>
  )
}
