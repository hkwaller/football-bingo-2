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
      'w-full p-4 border-4 border-white text-left font-mono font-bold uppercase tracking-wide shadow-brutal transition-all duration-150 text-base'
    if (!selected) {
      return `${base} bg-black text-white hover:bg-white hover:text-black hover:scale-[1.01] cursor-pointer`
    }
    const isCorrect = option === question.correctAnswer
    const wasChosen = option === selected
    if (isCorrect) return `${base} bg-[var(--fb-accent-lime)] text-black border-[var(--fb-accent-lime)]`
    if (wasChosen) return `${base} bg-[var(--fb-accent-magenta)] text-black border-[var(--fb-accent-magenta)] opacity-80`
    return `${base} bg-black text-white opacity-30`
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
        <p className="font-display text-3xl md:text-4xl text-white text-center leading-tight tracking-wide">
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
            <span className="text-chalk/40 mr-3">{String.fromCharCode(65 + i)}.</span>
            {option}
          </motion.button>
        ))}
      </div>

      {/* Result feedback */}
      <AnimatePresence>
        {selected && lastResult && (
          <motion.p
            className={`font-mono font-bold uppercase tracking-widest text-lg ${lastResult.correct ? 'text-[var(--fb-accent-lime)]' : 'text-[var(--fb-accent-magenta)]'}`}
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
