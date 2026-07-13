'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MultipleChoiceQuestion } from '@/lib/trivia/types'

interface Props {
  question: MultipleChoiceQuestion
  onAnswer: (value: string) => void
  disabled: boolean
  lastResult?: { correct: boolean; correctAnswer: string } | null
}

export function MultipleChoice({ question, onAnswer, disabled, lastResult }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  function handlePick(option: string) {
    if (disabled || selected) return
    setSelected(option)
    onAnswer(option)
  }

  function optionClass(option: string) {
    const base =
      'w-full rounded-xl border px-4 py-3.5 text-left text-sm font-semibold transition-all duration-200'
    if (!selected) {
      return `${base} border-line bg-pitch-light text-chalk hover:-translate-y-0.5 hover:border-line-strong hover:bg-pitch-lighter cursor-pointer`
    }
    const isCorrect = option === question.correctAnswer
    const wasChosen = option === selected
    if (isCorrect) return `${base} border-turf bg-turf/15 text-turf shadow-glow-turf`
    if (wasChosen) return `${base} border-flare bg-flare/10 text-flare`
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
        <p className="font-display text-3xl md:text-4xl font-semibold text-chalk text-center leading-tight tracking-wide">
          {question.prompt}
        </p>
      </motion.div>

      {/* Options */}
      <div className="flex flex-col gap-3 w-full">
        {question.options.map((option, i) => (
          <motion.button
            key={option}
            className={optionClass(option)}
            onClick={() => handlePick(option)}
            disabled={disabled || !!selected}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
          >
            <span className="mr-3 font-mono text-xs text-chalk-dim">{String.fromCharCode(65 + i)}</span>
            {option}
          </motion.button>
        ))}
      </div>

      {/* Result feedback */}
      <AnimatePresence>
        {selected && lastResult && (
          <motion.p
            className={`font-display text-lg font-semibold uppercase tracking-wide ${lastResult.correct ? 'text-turf' : 'text-flare'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {lastResult.correct ? 'Correct!' : `Wrong — ${lastResult.correctAnswer}`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
