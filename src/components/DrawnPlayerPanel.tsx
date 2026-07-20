'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import type { PlayMode } from '@/lib/playMode'
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
  /** Bumps on each rejected placement - flashes a pulsing red border on the bar. */
  wrongNonce?: number | null
  onSkip?: () => void
  skipDisabled?: boolean
  /** Extra actions (e.g. multiplayer Skip vote) shown next to solo Skip */
  extraActions?: ReactNode
  draftWarning?: string | null
}

/**
 * The drawn-player HUD: a slim, fixed horizontal bar pinned to the bottom of the
 * viewport showing the drawn player's portrait, name + round, and the Skip
 * action. Stays visible while the board scrolls. The photo credit lives in a
 * hover tooltip on the portrait.
 */
export function DrawnPlayerPanel({
  mode,
  round,
  loading,
  player,
  error,
  wrongNonce,
  onSkip,
  skipDisabled,
  extraActions,
  draftWarning,
}: DrawnPlayerPanelProps) {
  if (mode !== 'draft') return null

  const attr = player?.imageAttribution

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <motion.section
        className="pointer-events-auto relative flex w-full max-w-[560px] items-center gap-3 rounded-[18px] bg-white p-2.5 pr-3.5 shadow-[0_8px_0_rgba(0,0,0,0.22)] sm:gap-4"
        role="status"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* Rejected-placement flash */}
        <AnimatePresence>
          {wrongNonce ? (
            <motion.div
              key={`bar-wrong-${wrongNonce}`}
              className="pointer-events-none absolute inset-0 z-10 rounded-[18px] border-[5px] border-live-red"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0.4, 1, 0],
                transition: { duration: 0.6, ease: 'easeInOut' },
              }}
              exit={{ opacity: 0 }}
              aria-hidden
            />
          ) : null}
        </AnimatePresence>
        {/* Portrait + credit tooltip */}
        <div className="group relative shrink-0">
          {loading ? (
            <div className="h-[52px] w-[52px] animate-pulse rounded-[10px] bg-card-tint" />
          ) : (
            <div className="relative h-[52px] w-[52px] overflow-hidden rounded-[10px] bg-[#dceee2] ring-2 ring-yellow">
              {player?.imageUrl ? (
                <Image
                  src={player.imageUrl}
                  alt=""
                  fill
                  sizes="52px"
                  className="object-cover"
                  style={{ objectPosition: '50% 16%' }}
                  unoptimized
                />
              ) : (
                <svg
                  viewBox="0 0 44 44"
                  aria-hidden
                  className="absolute inset-0 h-full w-full opacity-25"
                >
                  <circle cx="22" cy="16" r="9" fill="#0a3d20" />
                  <path d="M4 44 C4 30 14 26 22 26 C30 26 40 30 40 44 Z" fill="#0a3d20" />
                </svg>
              )}
            </div>
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

        {/* Round + name (or error / warning) */}
        <div className="min-w-0 flex-1">
          <span className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-pink-deep">
            Round {round + 1}
          </span>
          <p className="font-display text-lg md:text-[22px] font-bold uppercase leading-none text-card-ink sm:text-[26px]">
            {loading ? 'Drawing…' : (player?.name ?? 'No player')}
          </p>
          {error ? (
            <span
              className="mt-0.5 block truncate text-[12px] font-bold text-pink-deep"
              role="alert"
            >
              {error}
            </span>
          ) : draftWarning ? (
            <span className="mt-0.5 block truncate text-[12px] font-semibold text-card-muted">
              {draftWarning}
            </span>
          ) : null}
          {wrongNonce ? (
            <span key={`sr-wrong-${wrongNonce}`} role="alert" className="sr-only">
              Player does not match this square
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
              <span className="hidden md:inline">Skip</span> ⏭
            </button>
          ) : null}
          {extraActions}
        </div>
      </motion.section>
    </div>
  )
}
