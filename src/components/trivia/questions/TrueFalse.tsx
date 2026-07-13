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
      'relative flex-1 min-h-[120px] rounded-xl border font-display text-3xl font-semibold uppercase tracking-wide transition-all duration-200 flex items-center justify-center'
    if (!selected) {
      return `${base} border-line bg-pitch-light text-chalk hover:-translate-y-0.5 hover:border-line-strong hover:bg-pitch-lighter cursor-pointer`
    }
    const isCorrect = value === String(question.correct)
    const wasChosen = value === selected
    if (isCorrect) return `${base} border-turf bg-turf/15 text-turf shadow-glow-turf`
    if (wasChosen && !isCorrect) return `${base} border-flare bg-flare/10 text-flare`
    return `${base} border-line bg-pitch-light text-chalk-dim opacity-40`
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
          <div className="w-24 h-24 rounded-xl border border-line bg-pitch-light shadow-soft overflow-hidden">
            <img
              src={question.playerImageUrl}
              alt={question.playerName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">True or False?</p>
        <p className="font-display text-3xl md:text-4xl font-semibold text-chalk text-center leading-tight tracking-wide">
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
            <p className={`font-display text-lg font-semibold uppercase tracking-wide ${lastResult.correct ? 'text-turf' : 'text-flare'}`}>
              {lastResult.correct ? 'Correct!' : `Wrong — it's ${lastResult.correctAnswer === 'true' ? 'TRUE' : 'FALSE'}`}
            </p>
            {question.detail && (
              <p className="text-xs text-chalk-dim">{question.detail}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
