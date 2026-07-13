'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { PlayMode } from '@/lib/playMode'
import { Sticker } from '@/components/Sticker'

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
  onSkip,
  skipDisabled,
  extraActions,
  draftWarning,
}: DrawnPlayerPanelProps) {
  if (mode !== 'draft') return null

  return (
    <motion.section
      layout
      className="panel mb-6 p-4 sm:px-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* Sticker of the drawn player */}
        <div className="shrink-0">
          {loading ? (
            <div className="h-[120px] w-[108px] animate-pulse rounded-[6px] bg-panel-white shadow-sticker" />
          ) : (
            <Sticker
              key={player?.playerId ?? `round-${round}`}
              name={player?.name ?? '—'}
              imageUrl={player?.imageUrl}
              rotate={-2}
              width={108}
              showName={false}
            />
          )}
        </div>

        {/* Copy */}
        <div className="flex-1">
          <p className="eyebrow">Round {round + 1}</p>
          <p className="mt-1 font-display text-[32px] uppercase leading-none text-green">
            {loading ? 'Drawing…' : (player?.name ?? 'No player')}
          </p>
          <p className="mt-1.5 text-[13.5px] font-medium text-muted">
            Place them on a matching square — club, country or honour.
            {onSkip ? (
              <>
                {' '}
                Press <span className="font-mono font-bold text-ink">Space</span> to skip.
              </>
            ) : null}
          </p>
          {draftWarning ? (
            <p
              className="mt-2 inline-flex rounded-lg border border-line bg-panel-white px-2.5 py-1.5 text-xs text-muted"
              role="status"
            >
              {draftWarning}
            </p>
          ) : null}
        </div>

        {/* Actions */}
        {onSkip || extraActions ? (
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {onSkip ? (
              <button
                type="button"
                disabled={skipDisabled}
                onClick={onSkip}
                className="btn btn-outline btn-sm"
              >
                Skip
              </button>
            ) : null}
            {extraActions}
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          className="mt-4 rounded-xl border-2 border-red/40 bg-red/10 px-3 py-2 text-sm font-semibold text-red"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </motion.section>
  )
}
