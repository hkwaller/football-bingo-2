import type { TriviaAnswer, TriviaScoreState, TriviaSessionState } from './types'

const PER_QUESTION_MAX = 1000
const PER_QUESTION_TIME_MS = 15_000

export function speedPoints(elapsedMs: number): number {
  const fraction = Math.max(0, 1 - elapsedMs / PER_QUESTION_TIME_MS)
  return Math.round(PER_QUESTION_MAX * fraction)
}

export function streakMultiplier(streak: number): number {
  if (streak >= 10) return 3
  if (streak >= 5) return 2
  if (streak >= 3) return 1.5
  return 1
}

export function computePoints(elapsedMs: number, streak: number): number {
  return Math.round(speedPoints(elapsedMs) * streakMultiplier(streak))
}

export function advanceSession(
  state: TriviaSessionState,
  answerValue: string,
  correctAnswer: string,
  correct: boolean,
  now: number,
): TriviaSessionState {
  const elapsedMs = now - state.questionStartedAt
  const points = correct ? computePoints(elapsedMs, state.scoreState.streak) : 0
  const newStreak = correct ? state.scoreState.streak + 1 : 0
  const newBestStreak = Math.max(state.scoreState.bestStreak, newStreak)

  const answer: TriviaAnswer = {
    questionId: state.questions[state.currentIndex]?.id ?? '',
    answeredAt: now,
    questionStartedAt: state.questionStartedAt,
    correct,
    pointsEarned: points,
    answerValue,
    correctAnswer,
  }

  const newScoreState: TriviaScoreState = {
    score: state.scoreState.score + points,
    streak: newStreak,
    bestStreak: newBestStreak,
  }

  const nextIndex = state.currentIndex + 1
  const isOver = isSessionOver({ ...state, currentIndex: nextIndex, answers: [...state.answers, answer], scoreState: newScoreState }, correct)

  return {
    ...state,
    currentIndex: nextIndex,
    answers: [...state.answers, answer],
    scoreState: newScoreState,
    phase: isOver ? 'finished' : 'playing',
    questionStartedAt: now,
  }
}

export function isSessionOver(
  state: TriviaSessionState,
  lastAnswerCorrect?: boolean,
): boolean {
  const { config, currentIndex, questions, sessionStartedAt } = state

  if (config.sessionType === 'survival') {
    return lastAnswerCorrect === false
  }

  if (config.sessionType === 'fixed' || config.sessionType === 'category') {
    return currentIndex >= questions.length
  }

  if (config.sessionType === 'timed') {
    const elapsed = Date.now() - sessionStartedAt
    return elapsed >= config.timeLimitSeconds * 1000
  }

  return false
}

export function getCorrectAnswer(question: { type: string; correctAnswer?: string; correctPlayerId?: string; correct?: boolean; correctPlayerName?: string }): string {
  if (question.type === 'multiple-choice') return question.correctAnswer ?? ''
  if (question.type === 'stat-comparison') return question.correctPlayerId ?? ''
  if (question.type === 'open-text') return question.correctPlayerName ?? ''
  if (question.type === 'true-false') return String(question.correct ?? false)
  return ''
}
