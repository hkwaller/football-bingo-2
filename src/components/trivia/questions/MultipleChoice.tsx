'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MultipleChoiceQuestion } from '@/lib/trivia/types'
import { Sticker } from '@/components/Sticker'

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
      'flex items-center gap-3 rounded-xl px-4 py-4 text-left text-base font-bold transition-all duration-200'
    if (!selected) {
      return `${base} border-2 border-ink bg-panel-white text-ink hover:-translate-y-0.5 cursor-pointer`
    }
    const isCorrect = option === question.correctAnswer
    const wasChosen = option === selected
    if (isCorrect) return `${base} bg-green text-cream shadow-sticker`
    if (wasChosen) return `${base} border-2 border-red bg-panel-white text-red`
    return `${base} border-2 border-[rgba(38,32,25,0.3)] text-muted`
  }

  function letterClass(option: string) {
    if (!selected) return 'text-red'
    const isCorrect = option === question.correctAnswer
    const wasChosen = option === selected
    if (isCorrect) return 'text-link'
    if (wasChosen) return 'text-red'
    return 'text-muted'
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[720px] mx-auto">
      {/* Question */}
      <motion.div
        className="flex flex-col items-center gap-5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {question.playerImageUrl && (
          <Sticker
            name={question.playerName}
            imageUrl={question.playerImageUrl}
            rotate={-2}
            width={108}
            nameSize={11.5}
          />
        )}
        <div className="panel w-full p-7">
          <p className="font-display text-[28px] leading-[1.2] text-ink">
            {question.prompt}
          </p>
        </div>
      </motion.div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option, i) => {
          const isCorrect = !!selected && option === question.correctAnswer
          return (
            <motion.button
              key={option}
              className={optionClass(option)}
              onClick={() => handlePick(option)}
              disabled={disabled || !!selected}
              style={isCorrect ? { transform: 'rotate(-0.8deg)' } : undefined}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
            >
              <span className={`font-display text-lg uppercase leading-none ${letterClass(option)}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{option}</span>
              {isCorrect && <span aria-hidden>✓</span>}
            </motion.button>
          )
        })}
      </div>

      {/* Result feedback */}
      <AnimatePresence>
        {selected && lastResult && (
          <motion.p
            className={`text-center font-display text-lg uppercase leading-none ${lastResult.correct ? 'text-green' : 'text-red'}`}
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
