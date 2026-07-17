'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface Props {
  open: boolean
  onPlayAgain: () => void
  onClose: () => void
}

const FOIL_COLORS = ['#ffe23a', '#ff4d8d', '#4de1ff', '#ffffff']

export function BingoWinModal({ open, onPlayAgain, onClose }: Props) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (!open || firedRef.current) return
    firedRef.current = true

    const fire = (opts: confetti.Options) =>
      confetti({ zIndex: 9999, colors: FOIL_COLORS, ...opts })

    fire({ particleCount: 120, spread: 80, origin: { y: 0.55 } })

    setTimeout(() => {
      fire({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } })
      fire({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } })
    }, 250)

    setTimeout(() => {
      fire({ particleCount: 40, spread: 100, origin: { y: 0.4 }, gravity: 0.6, scalar: 1.2 })
    }, 600)
  }, [open])

  useEffect(() => {
    if (!open) firedRef.current = false
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — dim + blur the board underneath */}
          <motion.div
            className="fixed inset-0 z-40 backdrop-blur-[3px]"
            style={{ backgroundColor: 'rgba(4,40,20,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.6, y: 24 }}
            animate={{ opacity: 1, scale: [0.6, 1.08, 1], y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ duration: 0.5, ease: [0.2, 1.4, 0.4, 1] }}
          >
            <div className="w-[420px] max-w-full rounded-[26px] bg-white px-9 pb-7 pt-9 text-center shadow-[0_14px_0_rgba(0,0,0,0.3),0_40px_90px_rgba(0,0,0,0.5)]">
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
                className="mb-1.5 inline-block -rotate-2 rounded-lg bg-pink px-4 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_4px_0_rgba(0,0,0,0.22)]"
              >
                Full line
              </motion.span>

              <motion.h2
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mt-2.5 font-display text-[80px] font-black uppercase leading-[0.9] text-card-ink"
              >
                Bin<span className="text-pink">go</span>!
              </motion.h2>

              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.22 }}
                className="mt-2.5 text-[15px] font-semibold text-card-muted"
              >
                You completed a line. The crowd goes wild. 🎉
              </motion.p>

              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="mt-5 flex justify-center gap-2"
              >
                {[
                  { e: '🤯', bg: 'bg-yellow' },
                  { e: '🎉', bg: 'bg-sky' },
                  { e: '🏆', bg: 'bg-pink' },
                ].map((r) => (
                  <span
                    key={r.e}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-[18px] ${r.bg}`}
                  >
                    {r.e}
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.34 }}
                className="mt-6 flex flex-col gap-3"
              >
                <button type="button" onClick={onPlayAgain} className="btn btn-primary w-full">
                  Run it back
                </button>
                <button type="button" onClick={onClose} className="btn btn-outline w-full">
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
