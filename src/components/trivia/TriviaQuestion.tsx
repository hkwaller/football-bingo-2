'use client'

import type { TriviaQuestion } from '@/lib/trivia/types'
import { TrueFalse } from './questions/TrueFalse'
import { MultipleChoice } from './questions/MultipleChoice'
import { StatComparison } from './questions/StatComparison'
import { OpenText } from './questions/OpenText'

interface LastResult {
  correct: boolean
  correctAnswer: string
  statValues?: Record<string, number>
}

interface Props {
  question: TriviaQuestion
  onAnswer: (value: string) => void
  disabled: boolean
  lastResult?: LastResult | null
}

export function TriviaQuestion({ question, onAnswer, disabled, lastResult }: Props) {
  switch (question.type) {
    case 'true-false':
      return <TrueFalse question={question} onAnswer={onAnswer} disabled={disabled} lastResult={lastResult} />
    case 'multiple-choice':
      return <MultipleChoice question={question} onAnswer={onAnswer} disabled={disabled} lastResult={lastResult} />
    case 'stat-comparison':
      return <StatComparison question={question} onAnswer={onAnswer} disabled={disabled} lastResult={lastResult} />
    case 'open-text':
      return <OpenText question={question} onAnswer={onAnswer} disabled={disabled} lastResult={lastResult} />
  }
}
