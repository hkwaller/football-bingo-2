'use client'

import type { ReactNode } from 'react'
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
  onSkip?: () => void
  skipDisabled?: boolean
  /** Extra actions (e.g. multiplayer Skip vote) shown next to solo Skip */
  extraActions?: ReactNode
  placementHint?: string | null
  draftWarning?: string | null
}

export function DrawnPlayerPanel({
  mode,
  round,
  loading,
  player,
  error,
  cooldownRemainingMs = 0,
  onSkip,
  skipDisabled,
  extraActions,
  placementHint,
  draftWarning,
}: DrawnPlayerPanelProps) {
  if (mode !== 'draft') return null

  return (
    <motion.section
      layout
      className="mb-6 border-4 border-white bg-black p-4 sm:p-5 shadow-brutal shadow-[#00f0ff]"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="border-l-4 border-[var(--fb-accent-mint)] pl-4">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--fb-accent-mint)]">
            &gt; Active player
          </p>
          <p className="mt-2 font-mono text-sm text-chalk">
            Place this player on the square that matches them.
          </p>
          <p className="mt-1 font-display text-4xl text-[var(--fb-accent-cyan)] shadow-none">ROUND {round + 1}</p>
          {onSkip ? (
            <p className="mt-1 font-mono text-xs text-chalk/50">[SPACE] to skip</p>
          ) : null}
          {placementHint ? (
            <p className="mt-2 text-sm font-bold text-[var(--fb-accent-lime)] bg-[#111] border border-[var(--fb-accent-lime)] p-2 rounded-none">
              {placementHint}
            </p>
          ) : null}
          {draftWarning ? (
            <p className="mt-2 text-xs font-mono font-bold text-[#fffa00] bg-black border border-[#fffa00] p-1" role="status">
              ! {draftWarning}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 bg-[#111] border-2 border-white p-3 shadow-brutal-sm">
            {loading ? (
              <div className="flex h-20 w-20 animate-pulse bg-white/20 border-2 border-white" />
            ) : player ? (
              <>
                {player.imageUrl ? (
                  <Image
                    src={player.imageUrl}
                    alt=""
                    width={80}
                    height={80}
                    className="border-2 border-white object-cover grayscale contrast-125"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center border-2 border-white bg-black font-display text-4xl text-white">
                    ?
                  </div>
                )}
                <div>
                  <p className="font-display text-3xl font-black text-white">{player.name}</p>
                  <p className="font-mono text-xs font-bold uppercase text-[var(--fb-accent-yellow)]">&gt; Awaiting action</p>
                </div>
              </>
            ) : null}
          </div>
          {onSkip || extraActions ? (
            <div className="flex flex-col items-stretch gap-2">
              {onSkip ? (
                <button
                  type="button"
                  disabled={skipDisabled}
                  onClick={onSkip}
                  className="border-2 border-white bg-black px-4 py-2 font-mono text-sm font-bold uppercase text-white shadow-brutal-sm hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none hover:bg-[var(--fb-accent-magenta)] hover:text-white transition-all disabled:cursor-not-allowed disabled:border-white/30 disabled:text-white/30 disabled:shadow-none"
                >
                  Skip
                </button>
              ) : null}
              {extraActions}
            </div>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="mt-4 border-2 border-[var(--fb-accent-magenta)] bg-black p-2 font-mono text-sm font-bold text-[var(--fb-accent-magenta)]" role="alert">
          ERROR: {error}
        </p>
      ) : null}
      {cooldownRemainingMs > 0 ? (
        <p className="mt-2 font-mono text-xs font-bold text-[var(--fb-accent-yellow)]">
          COOLDOWN: {Math.ceil(cooldownRemainingMs / 1000)}s
        </p>
      ) : null}
    </motion.section>
  )
}
