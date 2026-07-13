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
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-6 py-8 md:px-9">
      {/* Header */}
      <motion.div
        className="text-center flex flex-col items-center gap-3"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
          className="foil flex h-[76px] w-[76px] items-center justify-center rounded-full text-4xl shadow-sticker-lg"
        >
          ★
        </motion.div>
        <p className="eyebrow">Full time</p>
        <div>
          <h1 className="font-display text-[64px] uppercase leading-none text-green tabular-nums">
            {scoreState.score.toLocaleString()}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted">points</p>
        </div>

        <div className="panel flex w-full max-w-sm items-stretch justify-center divide-x divide-[var(--line)] px-2 py-4">
          <div className="flex-1 text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-soft">Accuracy</p>
            <p className="font-display text-2xl uppercase leading-none text-ink tabular-nums">{accuracy}%</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-soft">Best streak</p>
            <p className="font-display text-2xl uppercase leading-none text-gold tabular-nums">{scoreState.bestStreak}x</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-soft">Answered</p>
            <p className="font-display text-2xl uppercase leading-none text-ink tabular-nums">{answers.length}</p>
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
          <h2 className="font-display text-2xl uppercase leading-none text-green">Leaderboard</h2>
          {leaderboard
            .sort((a, b) => b.score - a.score)
            .map((entry, i) => (
              <div
                key={entry.displayName}
                className={`panel flex items-center gap-4 px-4 py-3 ${
                  i === 0
                    ? 'border-2 border-foil shadow-sticker'
                    : entry.isMe
                    ? 'border-2 border-green'
                    : ''
                }`}
              >
                <span className={`font-display text-2xl uppercase leading-none w-8 tabular-nums ${i === 0 ? 'text-gold' : 'text-muted'}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-bold text-ink">
                  {i === 0 && <span aria-hidden className="mr-1.5">🏆</span>}
                  {entry.displayName}{entry.isMe && ' (you)'}
                </span>
                <span className="font-mono text-sm font-bold text-muted tabular-nums">
                  {entry.correctCount}/{entry.totalAnswered}
                </span>
                <span className={`font-display text-xl uppercase leading-none tabular-nums ${i === 0 ? 'text-gold' : 'text-ink'}`}>
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
        <h2 className="font-display text-2xl uppercase leading-none text-green">Review</h2>
        {questions.map((q, i) => {
          const answer = answers[i]
          if (!answer) return null
          return (
            <div
              key={q.id}
              className={`panel flex flex-col gap-1 border-l-4 px-4 py-3 ${
                answer.correct ? 'border-l-green' : 'border-l-red'
              }`}
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-soft">
                Q{i + 1} · {q.type.replace('-', ' ')} · {answer.pointsEarned > 0 ? `+${answer.pointsEarned}` : '0'} pts
              </p>
              <p className="text-sm font-medium text-ink">{getQuestionPrompt(q)}</p>
              <div className="flex gap-4 mt-1 text-xs font-semibold">
                <span className={answer.correct ? 'text-green' : 'text-red'}>
                  You: {answer.answerValue ? getAnswerDisplay(q, answer.answerValue) : '(no answer)'}
                </span>
                {!answer.correct && (
                  <span className="text-muted">
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
        <Link href="/trivia/setup" className="btn btn-outline btn-lg">
          Change setup
        </Link>
        <Link href="/" className="btn btn-ghost btn-lg">
          Home
        </Link>
      </div>
    </div>
  )
}
