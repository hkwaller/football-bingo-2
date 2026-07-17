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
 * The drawn-player card: a big white "prime time" card sitting above the board
 * with the drawn player mounted as a bobbing sticker (yellow outline), a pink
 * round tag, the name in Passion One, a Space-to-skip hint and the Skip action.
 * The photo credit lives in a hover tooltip on the portrait.
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
      className="relative mb-6 rounded-[20px] bg-white p-5 shadow-[0_10px_0_rgba(0,0,0,0.22)] md:px-7"
      style={{ transform: 'rotate(-0.5deg)' }}
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        {/* Portrait + credit tooltip */}
        <div className="group relative shrink-0">
          {loading ? (
            <div className="h-[112px] w-[104px] animate-pulse rounded-[8px] bg-card-tint shadow-sticker" />
          ) : (
            <motion.div
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 4.6, ease: 'easeInOut', repeat: Infinity }}
            >
              <Sticker
                key={player?.playerId ?? `round-${round}`}
                name={player?.name ?? '—'}
                imageUrl={player?.imageUrl}
                width={104}
                nameSize={11}
                rotate={-4}
                drawn
              />
            </motion.div>
          )}
          {attr ? (
            <div
              className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border-2 border-card-ink bg-white px-3 py-2 text-[11px] leading-snug text-card-muted opacity-0 shadow-lg transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
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

        {/* Name + hint */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <span className="inline-block -rotate-[1.5deg] rounded-md bg-pink px-3 py-1.5 text-[11.5px] font-extrabold uppercase leading-none tracking-[0.14em] text-white">
            Round {round + 1} · drawn
          </span>
          <p className="mt-2 truncate font-display text-[36px] font-black uppercase leading-none text-card-ink md:text-[40px]">
            {loading ? 'Drawing…' : (player?.name ?? 'No player')}
          </p>
          <p className="mt-1.5 text-[14px] font-semibold text-card-muted">
            {draftWarning ? (
              draftWarning
            ) : (
              <>
                Slap him on a matching square — club, country or honour.
                {onSkip ? (
                  <>
                    {' '}Press{' '}
                    <span className="rounded bg-card-tint px-[7px] py-0.5 font-mono font-bold text-card-ink">
                      Space
                    </span>{' '}
                    to skip.
                  </>
                ) : null}
              </>
            )}
          </p>
          {error ? (
            <span
              className="mt-2 inline-block max-w-full truncate rounded-lg bg-pink/15 px-2.5 py-1 text-xs font-bold text-pink-deep"
              role="alert"
            >
              {error}
            </span>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {onSkip ? (
            <button
              type="button"
              disabled={skipDisabled}
              onClick={onSkip}
              className="btn btn-outline btn-sm"
              title="Skip (Space)"
            >
              Skip ⏭
            </button>
          ) : null}
          {extraActions}
        </div>
      </div>
    </motion.section>
  )
}
