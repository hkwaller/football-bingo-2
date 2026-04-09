'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StatComparisonQuestion } from '@/lib/trivia/types'
import { STAT_KEY_LABELS } from '@/lib/trivia/types'

interface Props {
  question: StatComparisonQuestion
  onAnswer: (value: string) => void
  disabled: boolean
  lastResult?: { correct: boolean; correctAnswer: string; statValues?: Record<string, number> } | null
}

export function StatComparison({ question, onAnswer, disabled, lastResult }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  function handlePick(playerId: string) {
    if (disabled || selected) return
    setSelected(playerId)
    onAnswer(playerId)
  }

  function cardClass(playerId: string) {
    const base =
      'flex-1 flex flex-col items-center gap-4 p-6 border-4 border-white shadow-brutal transition-all duration-150 cursor-pointer min-h-[200px] justify-center'
    if (!selected) {
      return `${base} bg-black text-white hover:scale-[1.03] hover:bg-white hover:text-black`
    }
    const isCorrect = playerId === question.correctPlayerId
    const wasChosen = playerId === selected
    if (isCorrect) return `${base} bg-[var(--fb-accent-lime)] text-black border-[var(--fb-accent-lime)]`
    if (wasChosen) return `${base} bg-[var(--fb-accent-magenta)] text-black border-[var(--fb-accent-magenta)] opacity-80`
    return `${base} bg-black text-white opacity-30`
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl mx-auto">
      {/* Prompt */}
      <motion.p
        className="font-display text-3xl md:text-4xl text-white text-center leading-tight tracking-wide"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {question.prompt}
      </motion.p>

      {/* Player cards */}
      <div className="flex gap-6 w-full">
        {([question.playerA, question.playerB] as const).map((player, i) => (
          <motion.button
            key={player.playerId}
            className={cardClass(player.playerId)}
            onClick={() => handlePick(player.playerId)}
            disabled={disabled || !!selected}
            initial={{ x: i === 0 ? -30 : 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <div className="w-20 h-20 border-4 border-current shadow-brutal overflow-hidden rounded-sm">
              <img
                src={player.imageUrl}
                alt={player.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-display text-xl tracking-wide text-center leading-tight">
              {player.name}
            </p>
            {/* Show stat after answer */}
            {selected && lastResult?.statValues && (
              <p className="font-mono text-sm font-bold">
                {lastResult.statValues[player.playerId] ?? '?'} {STAT_KEY_LABELS[question.statKey]}
              </p>
            )}
          </motion.button>
        ))}
      </div>

      {/* VS divider */}
      {!selected && (
        <div className="absolute pointer-events-none">
          <span className="font-display text-2xl text-chalk/30 tracking-widest">VS</span>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {selected && lastResult && (
          <motion.p
            className={`font-mono font-bold uppercase tracking-widest text-lg ${lastResult.correct ? 'text-[var(--fb-accent-lime)]' : 'text-[var(--fb-accent-magenta)]'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {lastResult.correct ? 'Correct!' : `Wrong — ${question.correctPlayerId === question.playerA.playerId ? question.playerA.name : question.playerB.name} has more`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
