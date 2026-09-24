'use client'

import { useEffect, useState } from 'react'

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
        <div className="flex items-center gap-1" aria-label={`${livesLeft} of ${maxLives} lives`}>
          {Array.from({ length: maxLives }, (_, i) => (
            <span
              key={i}
              className={`text-lg leading-none ${i < livesLeft ? '' : 'opacity-25 grayscale'}`}
            >
              {i < livesLeft ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
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
