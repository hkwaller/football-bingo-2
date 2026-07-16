'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { PlayMode } from '@/lib/playMode'
import { Sticker } from '@/components/Sticker'
import type { PhotoAttribution } from '@/types/player'

export type DrawnPlayer = {
  playerId: string
  name: string
  imageUrl?: string
  imageAttribution?: PhotoAttribution | null
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

/**
 * Thin action bar fixed to the bottom of the viewport showing the drawn player:
 * small portrait, name, and the Skip action. The photo credit lives in a
 * hover tooltip on the portrait. Game pages add bottom padding so the board
 * clears this bar.
 */
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

  const attr = player?.imageAttribution

  return (
    <motion.section
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-panel-white/95 backdrop-blur-sm shadow-[0_-8px_28px_-18px_rgba(0,0,0,0.6)]"
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2 md:px-9">
        {/* Portrait + credit tooltip */}
        <div className="group relative shrink-0">
          {loading ? (
            <div className="h-[46px] w-[46px] animate-pulse rounded-[5px] bg-panel shadow-sticker" />
          ) : (
            <Sticker
              key={player?.playerId ?? `round-${round}`}
              name={player?.name ?? '—'}
              imageUrl={player?.imageUrl}
              width={46}
              showName={false}
            />
          )}
          {attr ? (
            <div
              className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border-2 border-ink bg-panel-white px-3 py-2 text-[11px] leading-snug text-muted opacity-0 shadow-lg transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
              role="tooltip"
            >
              📷 {attr.author}
              <br />
              {attr.licenseUrl ? (
                <a href={attr.licenseUrl} target="_blank" rel="noreferrer" className="underline">
                  {attr.license}
                </a>
              ) : (
                attr.license
              )}
              {attr.source ? (
                <>
                  {' · '}
                  <a href={attr.source} target="_blank" rel="noreferrer" className="underline">
                    source
                  </a>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Name */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-red">
            Round {round + 1}
            {draftWarning ? <span className="ml-2 font-medium normal-case text-muted">· {draftWarning}</span> : null}
          </p>
          <p className="truncate font-display text-[20px] uppercase leading-none text-green">
            {loading ? 'Drawing…' : (player?.name ?? 'No player')}
          </p>
        </div>

        {/* Error (transient) */}
        {error ? (
          <span
            className="hidden max-w-[220px] truncate rounded-lg border-2 border-red/40 bg-red/10 px-2.5 py-1 text-xs font-semibold text-red sm:inline"
            role="alert"
          >
            {error}
          </span>
        ) : null}

        {/* Actions */}
        {onSkip ? (
          <button
            type="button"
            disabled={skipDisabled}
            onClick={onSkip}
            className="btn btn-outline btn-sm shrink-0"
            title="Skip (Space)"
          >
            Skip
          </button>
        ) : null}
        {extraActions}
      </div>
    </motion.section>
  )
}
