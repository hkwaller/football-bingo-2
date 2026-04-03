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
      className="fb-panel mb-6 rounded-2xl border border-white/15 bg-gradient-to-br from-[var(--fb-accent-mint)]/18 to-black/50 p-4 sm:p-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--fb-accent-mint)]">
            This round
          </p>
          <p className="mt-1 text-sm text-chalk/75">
            Place this player on the square that matches them.
          </p>
          <p className="mt-1 font-mono text-xs text-chalk/45">Round {round + 1}</p>
          {onSkip ? (
            <p className="mt-1 text-xs text-chalk/50">Space to skip</p>
          ) : null}
          {placementHint ? (
            <p className="mt-2 text-sm font-medium text-[var(--fb-accent-lime)]/95">
              {placementHint}
            </p>
          ) : null}
          {draftWarning ? (
            <p className="mt-2 text-xs text-amber-200/90" role="status">
              {draftWarning}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
                    className="rounded-full border-2 border-[var(--fb-accent-mint)]/50 object-cover shadow-lg"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/5 text-chalk/50">
                    ?
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-chalk">{player.name}</p>
                  <p className="text-xs text-chalk/50">Tap the correct square</p>
                </div>
              </>
            ) : null}
          </div>
          {onSkip || extraActions ? (
            <div className="flex flex-wrap items-center gap-2">
              {onSkip ? (
                <button
                  type="button"
                  disabled={skipDisabled}
                  onClick={onSkip}
                  className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-chalk transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
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
