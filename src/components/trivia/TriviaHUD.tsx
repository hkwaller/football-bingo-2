'use client'

import { TriviaProgressBar } from './TriviaProgressBar'
import type { TriviaSessionType } from '@/lib/trivia/types'

interface Props {
  currentIndex: number
  totalQuestions: number | null   // null = infinite (survival/timed)
  sessionType: TriviaSessionType
  score: number
  streak: number
  questionStartedAt: number
  onTimerExpire?: () => void
  paused?: boolean
}

const QUESTION_TIME_MS = 15_000

export function TriviaHUD({
  currentIndex,
  totalQuestions,
  sessionType,
  score,
  streak,
  questionStartedAt,
  onTimerExpire,
  paused,
}: Props) {
  const showTotal = sessionType === 'fixed' || sessionType === 'category'
  const label = showTotal && totalQuestions
    ? `Question ${currentIndex + 1} of ${totalQuestions}`
    : sessionType === 'survival'
    ? `Question ${currentIndex + 1} · Survival`
    : `Question ${currentIndex + 1}`

  return (
    <div className="w-full flex flex-col gap-3 mb-6">
      <div className="flex items-end justify-between gap-4">
        {/* Question counter + title */}
        <div>
          <p className="eyebrow">{label}</p>
          <h1 className="mt-1 font-display text-[32px] uppercase leading-none text-green md:text-[36px]">
            Quick fire
          </h1>
        </div>

        {/* Score / streak */}
        <p className="shrink-0 text-right font-mono text-sm font-bold text-ink-soft tabular-nums">
          Score {score.toLocaleString()}
          {streak >= 2 && <span> · Streak ×{streak}</span>}
        </p>
      </div>

      <TriviaProgressBar
        durationMs={QUESTION_TIME_MS}
        startedAt={questionStartedAt}
        paused={paused}
        onExpire={onTimerExpire}
      />
    </div>
  )
}
