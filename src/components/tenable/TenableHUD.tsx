'use client'

import { LivesRow } from '@/components/LivesRow'

interface Props {
  category: string
  prompt: string
  questionNumber: number
  totalQuestions: number
  foundCount: number
  totalAnswers: number
  livesLeft: number
  maxLives: number
  score: number
}

export function TenableHUD({
  category,
  prompt,
  questionNumber,
  totalQuestions,
  foundCount,
  totalAnswers,
  livesLeft,
  maxLives,
  score,
}: Props) {
  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow eyebrow-sky">
            Category {questionNumber} of {totalQuestions}
          </span>
          <h1 className="mt-2 font-display text-[32px] font-black uppercase leading-[0.92] text-on-green md:text-[40px]">
            {category}
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-on-green-soft">{prompt}</p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-lg bg-black/25 px-4 py-2 font-mono text-sm font-bold tabular-nums text-yellow">
          {score.toLocaleString()} pts
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <LivesRow livesLeft={livesLeft} maxLives={maxLives} />
        {/* Progress */}
        <span className="font-display text-lg font-black uppercase leading-none text-on-green tabular-nums">
          {foundCount}/{totalAnswers}
        </span>
      </div>
    </div>
  )
}
