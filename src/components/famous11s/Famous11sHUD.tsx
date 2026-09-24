'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

// ── SVG heart ────────────────────────────────────────────────────────────

function HeartIcon({ alive, reduceMotion }: { alive: boolean; reduceMotion: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden
      animate={alive && !reduceMotion ? { scale: [1, 1.35, 0.9, 1] } : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={alive ? '#ef4444' : 'transparent'}
        stroke={alive ? '#ef4444' : 'rgba(255,255,255,0.25)'}
        strokeWidth="1.5"
      />
    </motion.svg>
  )
}

function LivesRow({
  livesLeft,
  maxLives,
  prevLivesRef,
}: {
  livesLeft: number
  maxLives: number
  prevLivesRef: React.MutableRefObject<number>
}) {
  const reduceMotion = useReducedMotion() ?? false
  // Track which heart was just lost so we can burst it
  const justLost = prevLivesRef.current > livesLeft ? prevLivesRef.current - 1 : null
  prevLivesRef.current = livesLeft

  return (
    <div className="flex items-center gap-1.5" aria-label={`${livesLeft} of ${maxLives} lives`}>
      {Array.from({ length: maxLives }, (_, i) => {
        const alive = i < livesLeft
        const isBursting = !alive && justLost !== null && i === justLost

        return (
          <AnimatePresence key={i} mode="wait">
            {isBursting && !reduceMotion ? (
              <motion.div
                key="burst"
                className="relative"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.6, 0], opacity: [1, 1, 0] }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                onAnimationComplete={() => {}}
              >
                <HeartIcon alive={true} reduceMotion />
              </motion.div>
            ) : (
              <motion.div
                key="heart"
                initial={false}
                animate={!alive && !reduceMotion ? { scale: [1, 0.85, 1] } : {}}
                transition={{ duration: 0.25 }}
              >
                <HeartIcon alive={alive} reduceMotion={reduceMotion} />
              </motion.div>
            )}
          </AnimatePresence>
        )
      })}
    </div>
  )
}

// ── HUD ───────────────────────────────────────────────────────────────────

interface Props {
  lineup: { title: string; prompt: string; formation: string }
  lineupNumber: number
  totalLineups: number
  foundCount: number
  totalSlots: number
  livesLeft: number
  maxLives: number
  score: number
  /** Seconds remaining on the turn timer; undefined = no timer. */
  secondsLeft?: number
}

export function Famous11sHUD({
  lineup,
  lineupNumber,
  totalLineups,
  foundCount,
  totalSlots,
  livesLeft,
  maxLives,
  score,
  secondsLeft,
}: Props) {
  const timerUrgent = secondsLeft !== undefined && secondsLeft <= 5
  const prevLivesRef = useRef(livesLeft)

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="eyebrow eyebrow-sky">
            Lineup {lineupNumber} of {totalLineups} · {lineup.formation}
          </span>
          <h1 className="mt-2 font-display text-[28px] font-black uppercase leading-[0.92] text-on-green md:text-[34px]">
            {lineup.title}
          </h1>
          <p className="mt-1 text-[12px] font-semibold text-on-green-soft">{lineup.prompt}</p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-lg bg-black/25 px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-yellow">
          {score.toLocaleString()} pts
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Lives */}
        <LivesRow livesLeft={livesLeft} maxLives={maxLives} prevLivesRef={prevLivesRef} />
        <div className="flex items-center gap-3">
          {/* Timer */}
          {secondsLeft !== undefined && (
            <span
              className={`font-mono text-[13px] font-bold tabular-nums ${
                timerUrgent ? 'animate-pulse text-pink' : 'text-on-green-dim'
              }`}
              aria-live="polite"
            >
              {secondsLeft}s
            </span>
          )}
          {/* Progress */}
          <span className="font-display text-lg font-black uppercase leading-none text-on-green tabular-nums">
            {foundCount}/{totalSlots}
          </span>
        </div>
      </div>
    </div>
  )
}

/** Solo timer hook - returns seconds remaining, fires onTimeout when it hits 0. */
export function useSoloTimer(
  turnSeconds: number,
  active: boolean,
  resetKey: number,
  onTimeout: () => void,
): number | undefined {
  const [secondsLeft, setSecondsLeft] = useState<number | undefined>(
    turnSeconds > 0 ? turnSeconds : undefined,
  )

  useEffect(() => {
    if (turnSeconds <= 0 || !active) {
      setSecondsLeft(turnSeconds > 0 ? turnSeconds : undefined)
      return
    }
    setSecondsLeft(turnSeconds)
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === undefined) return undefined
        if (prev <= 1) {
          window.clearInterval(interval)
          onTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
    // resetKey changes whenever a guess is made, restarting the timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnSeconds, active, resetKey])

  return secondsLeft
}
