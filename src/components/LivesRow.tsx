'use client'

import { useRef } from 'react'
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

/** Row of SVG hearts; the heart that was just lost bursts. Shared by the Famous 11s and Tenable HUDs. */
export function LivesRow({ livesLeft, maxLives }: { livesLeft: number; maxLives: number }) {
  const prevLivesRef = useRef(livesLeft)
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
