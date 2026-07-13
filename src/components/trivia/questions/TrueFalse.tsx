'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TrueFalseQuestion } from '@/lib/trivia/types'
import { Sticker } from '@/components/Sticker'

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
      'relative flex-1 min-h-[140px] rounded-xl font-display text-3xl uppercase leading-none transition-all duration-200 flex items-center justify-center gap-2'
    if (!selected) {
      return `${base} border-2 border-ink bg-panel-white text-ink hover:-translate-y-0.5 cursor-pointer`
    }
    const isCorrect = value === String(question.correct)
    const wasChosen = value === selected
    if (isCorrect) return `${base} bg-green text-cream shadow-sticker`
    if (wasChosen && !isCorrect) return `${base} border-2 border-red bg-panel-white text-red`
    return `${base} border-2 border-[rgba(38,32,25,0.3)] text-muted`
  }

  const correctBtn = (value: string) => !!selected && value === String(question.correct)

  return (
    <div className="flex flex-col gap-6 w-full max-w-[720px] mx-auto">
      {/* Statement */}
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
          <p className="eyebrow mb-2">True or false?</p>
          <p className="font-display text-[28px] leading-[1.2] text-ink">
            {question.statement}
          </p>
        </div>
      </motion.div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className={btnClass('true')}
          onClick={() => handlePick('true')}
          disabled={disabled || !!selected}
          style={correctBtn('true') ? { transform: 'rotate(-0.8deg)' } : undefined}
        >
          True{correctBtn('true') && <span aria-hidden>✓</span>}
        </button>
        <button
          className={btnClass('false')}
          onClick={() => handlePick('false')}
          disabled={disabled || !!selected}
          style={correctBtn('false') ? { transform: 'rotate(-0.8deg)' } : undefined}
        >
          False{correctBtn('false') && <span aria-hidden>✓</span>}
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
            <p className={`font-display text-lg uppercase leading-none ${lastResult.correct ? 'text-green' : 'text-red'}`}>
              {lastResult.correct ? 'Correct!' : `Wrong — it's ${lastResult.correctAnswer === 'true' ? 'TRUE' : 'FALSE'}`}
            </p>
            {question.detail && (
              <p className="text-xs text-muted">{question.detail}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
