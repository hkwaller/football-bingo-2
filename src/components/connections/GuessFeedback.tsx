'use client'

import { motion } from 'framer-motion'

/** The line under the input after a miss. Correct answers get the round panel instead. */
export function GuessFeedback({
  outcome,
  guess,
}: {
  outcome: { kind: string; guessesLeft?: number }
  guess: string
}) {
  if (outcome.kind !== 'wrong' && outcome.kind !== 'unknown') return null
  const wrong = outcome.kind === 'wrong'
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={`truncate text-sm font-bold ${wrong ? 'text-pink' : 'text-yellow'}`}
    >
      {wrong
        ? `✗ ${guess} doesn't connect them${outcome.guessesLeft ? ' - new clue below' : ''}`
        : '? Not in our book - free go'}
    </motion.p>
  )
}
