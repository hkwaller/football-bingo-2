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
    ? `Q ${currentIndex + 1} / ${totalQuestions}`
    : sessionType === 'survival'
    ? `Q ${currentIndex + 1} • Survival`
    : `Q ${currentIndex + 1}`

  return (
    <div className="w-full flex flex-col gap-2 mb-6">
      <div className="flex items-center justify-between gap-4">
        {/* Question counter */}
        <span className="font-mono text-sm font-bold uppercase tracking-widest text-chalk/70">
          {label}
        </span>

        {/* Score */}
        <div className="flex items-center gap-3">
          {streak >= 3 && (
            <span className="font-mono text-sm font-bold text-[var(--fb-accent-yellow)]">
              🔥 ×{streak}
            </span>
          )}
          <span className="font-display text-2xl text-[var(--fb-accent-lime)] tracking-wider">
            {score.toLocaleString()}
          </span>
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
