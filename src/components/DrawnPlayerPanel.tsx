'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { SkipForward } from 'lucide-react'
import { wikimediaLoader } from '@/lib/playerImage'
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
  reduceMotion?: boolean
}

/** Cap on how long the sticker waits for its photo before popping in regardless. */
const PORTRAIT_WAIT_MS = 2500

/**
 * The drawn-player HUD. Below lg it is a slim bar docked to the bottom of the
 * viewport (mini sticker, round, name, Skip) so the board gets the screen.
 * From lg up it becomes a paper card in the left column with a big sticker.
 * The photo credit lives in a hover tooltip on the portrait.
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
  reduceMotion = false,
}: DrawnPlayerPanelProps) {
  const attr = player?.imageAttribution
  // Re-mounts the portrait/name (and fires the glow) whenever a new player is drawn.
  const drawKey = player?.playerId ?? `round-${round}`
  const imageUrl = player?.imageUrl

  // The sticker animation only looks right on a decoded photo - a progressive
  // JPEG otherwise wipes in top-to-bottom mid-spring. Hold the frame on the
  // placeholder until the image is loaded, then pop it in whole.
  const [portraitLoaded, setPortraitLoaded] = useState(false)
  const [useRawImage, setUseRawImage] = useState(false)

  useEffect(() => {
    setPortraitLoaded(false)
    setUseRawImage(false)
  }, [drawKey, imageUrl])

  useEffect(() => {
    if (portraitLoaded || !imageUrl) return
    const t = window.setTimeout(() => setPortraitLoaded(true), PORTRAIT_WAIT_MS)
    return () => window.clearTimeout(t)
  }, [portraitLoaded, imageUrl, drawKey])

  if (mode !== 'draft') return null

  const portraitReady = !loading && (portraitLoaded || !imageUrl)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:pointer-events-auto lg:static lg:z-auto">
      <motion.section
        className="pointer-events-auto relative flex w-full items-center gap-3 border-t-[3px] border-ink bg-surface px-3.5 pb-[max(16px,env(safe-area-inset-bottom))] pt-2.5 text-ink shadow-[0_-5px_0_rgba(10,36,23,0.35)] lg:flex-col lg:items-stretch lg:gap-0 lg:rounded-[14px] lg:border-[2.5px] lg:p-5 lg:shadow-[0_6px_0_#0a2417]"
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
              className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border-[4px] border-live-red"
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
        {/* One-shot glow when a new player is drawn */}
        <AnimatePresence>
          {portraitReady && player ? (
            <motion.div
              key={`glow-${drawKey}`}
              className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] ring-4 ring-yellow"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: reduceMotion ? 0 : 0.7, ease: 'easeOut' }}
              exit={{ opacity: 0 }}
              aria-hidden
            />
          ) : null}
        </AnimatePresence>
        {/* Desktop card header */}
        <div className="hidden items-center justify-between lg:order-1 lg:flex">
          <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-card-muted">
            Now drawn
          </span>
          <span className="eyebrow rotate-2">Round {round + 1}</span>
        </div>

        {/* Portrait + credit tooltip */}
        <div className="group relative z-[1] shrink-0 lg:order-2 lg:mx-auto lg:my-5">
          {loading ? (
            <div className="h-14 w-12 animate-pulse rounded-md bg-surface-2 lg:h-[220px] lg:w-[190px]" />
          ) : (
            <div className="relative">
            {!portraitReady ? (
              <div
                className="absolute inset-0 animate-pulse rounded-md bg-surface-2"
                aria-hidden
              />
            ) : null}
            <motion.div
              key={`portrait-${drawKey}`}
              initial={reduceMotion ? false : { scale: 0.5, rotate: -12, opacity: 0 }}
              animate={
                portraitReady
                  ? { scale: 1, rotate: 0, opacity: 1 }
                  : { scale: reduceMotion ? 1 : 0.5, rotate: reduceMotion ? 0 : -12, opacity: 0 }
              }
              transition={
                reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 18 }
              }
              className="relative"
            >
              {/* sticker frame: tilted, ink border, halftone backdrop */}
              <div className="-rotate-[4deg] rounded-md border-2 border-ink bg-surface-hi p-[3px] shadow-[0_3px_0_#0a2417] lg:-rotate-3 lg:p-[7px] lg:shadow-[0_5px_0_#0a2417]">
              <div className="halftone relative h-[48px] w-[42px] overflow-hidden rounded-[3px] bg-sky lg:h-[172px] lg:w-[174px]">
              {imageUrl ? (
                <Image
                  key={useRawImage ? 'raw' : 'thumb'}
                  src={imageUrl}
                  loader={useRawImage ? undefined : wikimediaLoader}
                  unoptimized={useRawImage}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 174px, 42px"
                  loading="eager"
                  className="object-cover"
                  style={{ objectPosition: '50% 16%' }}
                  onLoad={() => setPortraitLoaded(true)}
                  onError={() => {
                    // Commons won't thumbnail past the source width; retry raw.
                    if (useRawImage) setPortraitLoaded(true)
                    else setUseRawImage(true)
                  }}
                />
              ) : (
                <svg
                  viewBox="0 0 44 44"
                  aria-hidden
                  className="absolute inset-0 h-full w-full opacity-50"
                >
                  <circle cx="22" cy="16" r="9" fill="#0a2417" />
                  <path d="M4 44 C4 30 14 26 22 26 C30 26 40 30 40 44 Z" fill="#0a2417" />
                </svg>
              )}
              </div>
              </div>
            </motion.div>
            </div>
          )}
          {attr ? (
            <div
              className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border-2 border-card-ink bg-surface-hi px-3 py-2 text-[11px] leading-snug text-card-muted opacity-0 shadow-lg transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
              role="tooltip"
            >
              Photo: {attr.author}
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
        <div className="min-w-0 flex-1 lg:order-3 lg:text-center">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-coral-ink lg:hidden">
            Round {round + 1} · Now drawn
          </span>
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={loading ? 'loading' : drawKey}
                initial={reduceMotion ? false : { y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { y: -14, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
                className="font-display text-[26px] font-black uppercase leading-[0.95] text-ink max-lg:truncate lg:text-[34px]"
              >
                {loading ? 'Drawing…' : (player?.name ?? 'No player')}
              </motion.p>
            </AnimatePresence>
          </div>
          {error ? (
            <span
              className="mt-0.5 block truncate text-[12px] font-bold text-coral-ink"
              role="alert"
            >
              {error}
            </span>
          ) : draftWarning ? (
            <span className="mt-0.5 block truncate text-[12px] font-semibold text-card-muted">
              {draftWarning}
            </span>
          ) : null}
          {!error && !draftWarning ? (
            <p className="mt-3 hidden text-[14.5px] leading-snug text-card-muted lg:block">
              Tap a square he genuinely fits.
            </p>
          ) : null}
          {wrongNonce ? (
            <span key={`sr-wrong-${wrongNonce}`} role="alert" className="sr-only">
              Player does not match this square
            </span>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 lg:order-4 lg:mt-4 lg:[&>*]:flex-1">
          {onSkip ? (
            <button
              type="button"
              disabled={skipDisabled}
              onClick={onSkip}
              className="btn btn-outline btn-sm min-h-[44px]"
              title="Skip (Space)"
            >
              Skip <SkipForward aria-hidden className="size-4" strokeWidth={2.5} />
            </button>
          ) : null}
          {extraActions}
        </div>
      </motion.section>
    </div>
  )
}
