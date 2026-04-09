'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TrueFalseQuestion } from '@/lib/trivia/types'

interface Props {
  question: TrueFalseQuestion
  onAnswer: (value: string) => void
  disabled: boolean
  lastResult?: { correct: boolean; correctAnswer: string } | null
}

export function TrueFalse({ question, onAnswer, disabled, lastResult }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  function handlePick(value: string) {
    if (disabled || selected) return
    setSelected(value)
    onAnswer(value)
  }

  function btnClass(value: string) {
    const base =
      'relative flex-1 min-h-[120px] border-4 border-white text-3xl font-display tracking-widest uppercase transition-all duration-150 flex items-center justify-center shadow-brutal'
    if (!selected) {
      return `${base} hover:scale-[1.03] cursor-pointer ${
        value === 'true' ? 'bg-[var(--fb-accent-lime)] text-black' : 'bg-[var(--fb-accent-magenta)] text-black'
      }`
    }
    const isCorrect = value === String(question.correct)
    const wasChosen = value === selected
    if (isCorrect) return `${base} bg-[var(--fb-accent-lime)] text-black ring-4 ring-white`
    if (wasChosen && !isCorrect) return `${base} bg-[var(--fb-accent-magenta)] text-black opacity-70`
    return `${base} opacity-30 ${value === 'true' ? 'bg-[var(--fb-accent-lime)] text-black' : 'bg-[var(--fb-accent-magenta)] text-black'}`
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
      {/* Player card */}
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {question.playerImageUrl && (
          <div className="w-24 h-24 border-4 border-white shadow-brutal overflow-hidden rounded-sm">
            <img
              src={question.playerImageUrl}
              alt={question.playerName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <p className="font-mono text-chalk/70 text-sm uppercase tracking-widest">True or False?</p>
        <p className="font-display text-3xl md:text-4xl text-white text-center leading-tight tracking-wide">
          {question.statement}
        </p>
      </motion.div>

      {/* Buttons */}
      <div className="flex gap-4 w-full">
        <button className={btnClass('true')} onClick={() => handlePick('true')} disabled={disabled || !!selected}>
          TRUE
        </button>
        <button className={btnClass('false')} onClick={() => handlePick('false')} disabled={disabled || !!selected}>
          FALSE
        </button>
      </div>

      {/* Result feedback */}
      <AnimatePresence>
        {selected && lastResult && (
          <motion.div
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className={`font-mono font-bold uppercase tracking-widest text-lg ${lastResult.correct ? 'text-[var(--fb-accent-lime)]' : 'text-[var(--fb-accent-magenta)]'}`}>
              {lastResult.correct ? 'Correct!' : `Wrong — it's ${lastResult.correctAnswer === 'true' ? 'TRUE' : 'FALSE'}`}
            </p>
            {question.detail && (
              <p className="font-mono text-xs text-chalk/50 tracking-wide">{question.detail}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
