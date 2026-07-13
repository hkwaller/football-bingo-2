'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface Props {
  open: boolean
  onPlayAgain: () => void
  onClose: () => void
}

const FOIL_COLORS = ['#e8b93e', '#fdf0c0', '#d64533', '#1d3b2a']

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
            className="fixed inset-0 z-40 backdrop-blur-[2px]"
            style={{ backgroundColor: 'rgba(38,32,25,0.35)' }}
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
            <div
              className="w-[380px] max-w-full rounded-2xl bg-panel px-8 pb-7 pt-8 text-center"
              style={{
                transform: 'rotate(-0.6deg)',
                boxShadow: '0 30px 70px -20px rgba(0,0,0,0.8), inset 0 0 0 3px #b8862c',
              }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
                className="foil mx-auto mb-3.5 flex h-[76px] w-[76px] items-center justify-center rounded-full text-4xl shadow-sticker-lg"
              >
                ★
              </motion.div>

              <motion.h2
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="font-display text-[52px] uppercase leading-none text-green"
              >
                Bingo!
              </motion.h2>

              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.22 }}
                className="mt-2 text-sm font-medium text-muted"
              >
                You completed a line. Legend.
              </motion.p>

              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex flex-col gap-2.5"
              >
                <button type="button" onClick={onPlayAgain} className="btn btn-primary w-full">
                  Play again
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
