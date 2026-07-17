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
      'flex-1 flex flex-col items-center gap-4 p-6 rounded-xl transition-all duration-200 cursor-pointer min-h-[220px] justify-center'
    if (!selected) {
      return `${base} bg-white text-card-ink shadow-[0_5px_0_rgba(0,0,0,0.22)] hover:-translate-y-[3px]`
    }
    const isCorrect = playerId === question.correctPlayerId
    const wasChosen = playerId === selected
    if (isCorrect) return `${base} bg-green-go text-white shadow-[0_5px_0_rgba(0,0,0,0.3)]`
    if (wasChosen) return `${base} bg-pink text-white shadow-[0_5px_0_rgba(0,0,0,0.3)]`
    return `${base} bg-white/55 text-card-muted opacity-70`
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[720px] mx-auto">
      {/* Prompt */}
      <motion.div
        className="panel p-7"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <p className="font-display text-[28px] leading-[1.2] text-ink">
          {question.prompt}
        </p>
      </motion.div>

      {/* Player cards */}
      <div className="relative flex items-center gap-4">
        {([question.playerA, question.playerB] as const).map((player, i) => {
          const isCorrect = !!selected && player.playerId === question.correctPlayerId
          return (
            <motion.button
              key={player.playerId}
              className={cardClass(player.playerId)}
              onClick={() => handlePick(player.playerId)}
              disabled={disabled || !!selected}
              style={isCorrect ? { transform: 'rotate(-0.8deg)' } : undefined}
              initial={{ x: i === 0 ? -30 : 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              <div className="w-20 h-20 overflow-hidden rounded-[6px] border-2 border-card-ink bg-white p-[3px]">
                <img
                  src={player.imageUrl}
                  alt={player.name}
                  className="h-full w-full rounded-[3px] object-cover"
                />
              </div>
              <p className="font-display text-xl uppercase leading-none text-center">
                {player.name}
              </p>
              {/* Show stat after answer */}
              {selected && lastResult?.statValues && (
                <p className="font-mono text-sm font-bold">
                  {lastResult.statValues[player.playerId] ?? '?'} {STAT_KEY_LABELS[question.statKey]}
                </p>
              )}
            </motion.button>
          )
        })}

        {/* VS divider */}
        {!selected && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="font-display text-2xl font-black uppercase leading-none text-pink">VS</span>
          </div>
        )}
      </div>

      {/* Result */}
      <AnimatePresence>
        {selected && lastResult && (
          <motion.p
            className={`text-center font-display text-lg uppercase leading-none ${lastResult.correct ? 'text-green' : 'text-red'}`}
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
