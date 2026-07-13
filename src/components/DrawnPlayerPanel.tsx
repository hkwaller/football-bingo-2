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
  draftWarning,
}: DrawnPlayerPanelProps) {
  if (mode !== 'draft') return null

  return (
    <motion.section
      layout
      className="card mb-6 p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-turf">
            Active player
          </p>
          <p className="mt-2 text-sm leading-relaxed text-chalk-dim">
            Place this player on the square that matches them.
          </p>
          <p className="mt-1 font-display text-4xl font-semibold uppercase tracking-wide text-chalk">
            Round {round + 1}
          </p>
          {onSkip ? (
            <p className="mt-1 text-xs text-chalk-dim">
              Press <span className="font-mono text-chalk">Space</span> to skip
            </p>
          ) : null}
          {draftWarning ? (
            <p
              className="mt-2 inline-flex rounded-lg border border-line bg-pitch px-2.5 py-1.5 text-xs text-chalk-dim"
              role="status"
            >
              {draftWarning}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 rounded-xl border border-line bg-pitch p-3">
            {loading ? (
              <div className="h-20 w-20 animate-pulse rounded-xl bg-pitch-lighter" />
            ) : player ? (
              <>
                {player.imageUrl ? (
                  <Image
                    src={player.imageUrl}
                    alt=""
                    width={80}
                    height={80}
                    className="rounded-xl border border-line object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-line bg-pitch-lighter font-display text-4xl text-chalk-dim">
                    ?
                  </div>
                )}
                <div>
                  <p className="font-display text-3xl font-semibold text-chalk">{player.name}</p>
                  <p className="mt-1 text-xs font-medium text-turf">Awaiting action</p>
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
                  className="btn btn-secondary btn-sm"
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
        <p
          className="mt-4 rounded-xl border border-flare/30 bg-flare/10 px-3 py-2 text-sm text-flare"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {cooldownRemainingMs > 0 ? (
        <p className="mt-2 font-mono text-xs text-chalk-dim">
          Cooldown: {Math.ceil(cooldownRemainingMs / 1000)}s
        </p>
      ) : null}
    </motion.section>
  )
}
