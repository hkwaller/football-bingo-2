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
          <span className="eyebrow eyebrow-sky">{label}</span>
          <h1 className="mt-2.5 font-display text-[40px] font-black uppercase leading-[0.9] text-white md:text-[52px]">
            Quick fire ⚡
          </h1>
        </div>

        {/* Score / streak */}
        <div className="flex shrink-0 gap-2">
          <span className="inline-flex items-center rounded-full bg-black/25 px-4 py-2 font-mono text-sm font-bold tabular-nums text-yellow">
            {score.toLocaleString()} pts
          </span>
          {streak >= 2 && (
            <span className="inline-flex items-center rounded-full bg-black/25 px-4 py-2 text-[13px] font-extrabold text-pink">
              🔥 ×{streak}
            </span>
          )}
        </div>
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
