'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface Props {
  open: boolean
  onPlayAgain: () => void
  onClose: () => void
}

export function BingoWinModal({ open, onPlayAgain, onClose }: Props) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (!open || firedRef.current) return
    firedRef.current = true

    const fire = (opts: confetti.Options) =>
      confetti({ zIndex: 9999, ...opts })

    // Initial burst
    fire({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#e2ff00', '#ff00cc', '#00fff7', '#ffffff', '#ffcc00'],
    })

    // Two side cannons
    setTimeout(() => {
      fire({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } })
      fire({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } })
    }, 250)

    setTimeout(() => {
      fire({ particleCount: 40, spread: 100, origin: { y: 0.4 }, gravity: 0.6, scalar: 1.2 })
    }, 600)
  }, [open])

  // Reset so confetti fires again on next win
  useEffect(() => {
    if (!open) firedRef.current = false
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="relative w-full max-w-sm rounded-2xl border-2 border-[var(--fb-accent-lime)] bg-[#0a0a0a] p-8 shadow-[0_0_60px_rgba(226,255,0,0.25)] text-center">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-[var(--fb-accent-lime)]/5 pointer-events-none" />

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
                className="mb-4 text-6xl"
              >
                🎉
              </motion.div>

              <motion.h2
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="font-display text-5xl font-bold tracking-tight text-[var(--fb-accent-lime)] mb-2"
              >
                BINGO!
              </motion.h2>

              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.22 }}
                className="font-mono text-sm text-chalk/60 mb-8"
              >
                You cleared a line. Legend.
              </motion.p>

              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-3"
              >
                <button
                  type="button"
                  onClick={onPlayAgain}
                  className="w-full rounded-xl bg-[var(--fb-accent-lime)] px-6 py-3 font-display text-lg font-bold tracking-wide text-black transition hover:brightness-110 active:scale-95"
                >
                  Play again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl border border-white/20 px-6 py-3 font-mono text-sm text-chalk/60 transition hover:border-white/40 hover:text-chalk"
                >
                  Keep board
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
