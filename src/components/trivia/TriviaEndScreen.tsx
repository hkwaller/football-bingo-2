'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { TriviaAnswer, TriviaQuestion, TriviaScoreState } from '@/lib/trivia/types'

interface LeaderboardEntry {
  displayName: string
  score: number
  correctCount: number
  totalAnswered: number
  isMe?: boolean
}

interface Props {
  questions: TriviaQuestion[]
  answers: TriviaAnswer[]
  scoreState: TriviaScoreState
  onPlayAgain?: () => void
  leaderboard?: LeaderboardEntry[]
}

function getQuestionPrompt(q: TriviaQuestion): string {
  if (q.type === 'multiple-choice') return q.prompt
  if (q.type === 'stat-comparison') return q.prompt
  if (q.type === 'open-text') return 'Name the player'
  if (q.type === 'true-false') return q.statement
  return ''
}

function getAnswerDisplay(q: TriviaQuestion, answerValue: string): string {
  if (q.type === 'stat-comparison') {
    if (answerValue === q.playerA.playerId) return q.playerA.name
    if (answerValue === q.playerB.playerId) return q.playerB.name
  }
  return answerValue
}

function getCorrectAnswerDisplay(q: TriviaQuestion): string {
  if (q.type === 'multiple-choice') return q.correctAnswer
  if (q.type === 'stat-comparison') {
    return q.correctPlayerId === q.playerA.playerId ? q.playerA.name : q.playerB.name
  }
  if (q.type === 'open-text') return q.correctPlayerName
  if (q.type === 'true-false') return q.correct ? 'TRUE' : 'FALSE'
  return ''
}

export function TriviaEndScreen({ questions, answers, scoreState, onPlayAgain, leaderboard }: Props) {
  const accuracy = answers.length
    ? Math.round((answers.filter((a) => a.correct).length / answers.length) * 100)
    : 0

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 py-8 px-4">
      {/* Header */}
      <motion.div
        className="text-center flex flex-col items-center gap-4"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="chip">
          <span className="h-1.5 w-1.5 rounded-full bg-turf" />
          Full time
        </div>
        <div>
          <h1 className="font-display text-7xl font-bold uppercase leading-none tracking-wide text-turf drop-shadow-[0_0_28px_rgba(60,233,126,0.3)] tabular-nums">
            {scoreState.score.toLocaleString()}
          </h1>
          <p className="mt-1 text-sm text-chalk-dim">points</p>
        </div>

        <div className="card flex w-full max-w-sm items-stretch justify-center divide-x divide-[var(--line)] px-2 py-4">
          <div className="flex-1 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">Accuracy</p>
            <p className="font-display text-2xl font-semibold text-chalk tabular-nums">{accuracy}%</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">Best streak</p>
            <p className="font-display text-2xl font-semibold text-gold tabular-nums">{scoreState.bestStreak}x</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">Answered</p>
            <p className="font-display text-2xl font-semibold text-chalk tabular-nums">{answers.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard (multiplayer) */}
      {leaderboard && leaderboard.length > 0 && (
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-chalk">Leaderboard</h2>
          {leaderboard
            .sort((a, b) => b.score - a.score)
            .map((entry, i) => (
              <div
                key={entry.displayName}
                className={`card flex items-center gap-4 rounded-xl px-4 py-3 ${
                  i === 0
                    ? 'border-gold/40 shadow-glow-gold'
                    : entry.isMe
                    ? 'border-turf/40'
                    : ''
                }`}
              >
                <span className={`font-display text-2xl font-semibold w-8 tabular-nums ${i === 0 ? 'text-gold' : 'text-chalk-dim'}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-chalk">
                  {i === 0 && <span aria-hidden className="mr-1.5">🏆</span>}
                  {entry.displayName}{entry.isMe && ' (you)'}
                </span>
                <span className="font-mono text-sm text-chalk-dim tabular-nums">
                  {entry.correctCount}/{entry.totalAnswered}
                </span>
                <span className={`font-display text-xl font-semibold tabular-nums ${i === 0 ? 'text-gold' : 'text-chalk'}`}>
                  {entry.score.toLocaleString()}
                </span>
              </div>
            ))}
        </motion.div>
      )}

      {/* Question review */}
      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-chalk">Review</h2>
        {questions.map((q, i) => {
          const answer = answers[i]
          if (!answer) return null
          return (
            <div
              key={q.id}
              className={`card flex flex-col gap-1 rounded-xl border-l-2 px-4 py-3 ${
                answer.correct ? 'border-l-turf' : 'border-l-flare'
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim">
                Q{i + 1} • {q.type.replace('-', ' ')} • {answer.pointsEarned > 0 ? `+${answer.pointsEarned}` : '0'} pts
              </p>
              <p className="text-sm text-chalk">{getQuestionPrompt(q)}</p>
              <div className="flex gap-4 mt-1 text-xs">
                <span className={answer.correct ? 'text-turf' : 'text-flare'}>
                  You: {answer.answerValue ? getAnswerDisplay(q, answer.answerValue) : '(no answer)'}
                </span>
                {!answer.correct && (
                  <span className="text-chalk-dim">
                    Correct: {getCorrectAnswerDisplay(q)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap justify-center">
        {onPlayAgain && (
          <button onClick={onPlayAgain} className="btn btn-primary btn-lg">
            Play again
          </button>
        )}
        <Link href="/trivia/setup" className="btn btn-secondary btn-lg">
          Change setup
        </Link>
        <Link href="/" className="btn btn-ghost btn-lg">
          Home
        </Link>
      </div>
    </div>
  )
}
