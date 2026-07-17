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
      'flex items-center gap-3.5 rounded-[16px] p-[18px] text-left text-base font-extrabold transition-all duration-150'
    if (!selected) {
      return `${base} bg-white text-card-ink shadow-[0_5px_0_rgba(0,0,0,0.22)] hover:-translate-y-[3px] cursor-pointer`
    }
    const isCorrect = option === question.correctAnswer
    const wasChosen = option === selected
    if (isCorrect) return `${base} bg-green-go text-white shadow-[0_5px_0_rgba(0,0,0,0.3)]`
    if (wasChosen) return `${base} bg-pink text-white shadow-[0_5px_0_rgba(0,0,0,0.3)]`
    return `${base} bg-white/55 text-card-muted opacity-70`
  }

  function letterTileClass(option: string) {
    const base =
      'flex h-[34px] w-[34px] shrink-0 -rotate-3 items-center justify-center rounded-[10px] font-display text-[19px] font-black uppercase leading-none'
    if (!selected) return `${base} bg-yellow text-pitch-deep`
    const isCorrect = option === question.correctAnswer
    const wasChosen = option === selected
    if (isCorrect) return `${base} bg-yellow text-pitch-deep`
    if (wasChosen) return `${base} bg-white text-pink`
    return `${base} bg-card-tint text-card-muted`
  }

  return (
    <div className="flex flex-col gap-[26px] w-full max-w-[760px] mx-auto">
      {/* Question — sticker overlapping the prompt card */}
      <div className="flex flex-col items-center">
        {question.playerImageUrl && (
          <motion.div
            className="relative z-[2]"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.4, ease: 'easeInOut', repeat: Infinity }}
          >
            <Sticker
              name={question.playerName}
              imageUrl={question.playerImageUrl}
              rotate={-3}
              width={112}
              nameSize={12}
              drawn
            />
          </motion.div>
        )}
        <motion.div
          className="w-full rounded-[20px] bg-white px-8 pb-7 pt-11 text-center shadow-[0_8px_0_rgba(0,0,0,0.22)]"
          style={{ marginTop: question.playerImageUrl ? -28 : 0, transform: 'rotate(0.4deg)' }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="font-display text-[30px] font-black leading-[1.1] text-card-ink md:text-[34px]">
            {question.prompt}
          </p>
        </motion.div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3.5">
        {question.options.map((option, i) => {
          const isCorrect = !!selected && option === question.correctAnswer
          return (
            <motion.button
              key={option}
              className={optionClass(option)}
              onClick={() => handlePick(option)}
              disabled={disabled || !!selected}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
            >
              <span className={letterTileClass(option)}>{String.fromCharCode(65 + i)}</span>
              <span className="flex-1">{option}</span>
              {isCorrect && <span aria-hidden>✓</span>}
            </motion.button>
          )
        })}
      </div>

      {/* Result feedback pill */}
      <AnimatePresence>
        {selected && lastResult && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: [0.6, 1.08, 1] }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          >
            <span
              className={`inline-block -rotate-[1.5deg] rounded-full px-6 py-2.5 font-display text-[22px] font-black uppercase leading-none shadow-[0_5px_0_rgba(0,0,0,0.25)] ${
                lastResult.correct ? 'bg-yellow text-pitch-deep' : 'bg-pink text-white'
              }`}
            >
              {lastResult.correct ? 'GOOOAL! Correct!' : `Off the post — ${lastResult.correctAnswer}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
