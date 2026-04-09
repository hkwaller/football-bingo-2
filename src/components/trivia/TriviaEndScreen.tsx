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
        className="text-center flex flex-col gap-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="inline-block border-4 border-white bg-black px-6 py-2 shadow-brutal-lime -rotate-1 mx-auto">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--fb-accent-lime)]">
            Game over
          </p>
        </div>
        <h1 className="font-display text-6xl text-white tracking-wider" style={{ textShadow: '4px 4px 0px var(--fb-accent-magenta)' }}>
          {scoreState.score.toLocaleString()}
        </h1>
        <p className="font-mono text-chalk/60 text-sm">points</p>

        <div className="flex justify-center gap-8 font-mono text-sm">
          <div className="text-center">
            <p className="text-chalk/40 uppercase tracking-widest text-xs">Accuracy</p>
            <p className="text-white font-bold text-lg">{accuracy}%</p>
          </div>
          <div className="text-center">
            <p className="text-chalk/40 uppercase tracking-widest text-xs">Best Streak</p>
            <p className="text-[var(--fb-accent-yellow)] font-bold text-lg">{scoreState.bestStreak}x</p>
          </div>
          <div className="text-center">
            <p className="text-chalk/40 uppercase tracking-widest text-xs">Answered</p>
            <p className="text-white font-bold text-lg">{answers.length}</p>
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
          <h2 className="font-display text-2xl text-white uppercase tracking-widest">Leaderboard</h2>
          {leaderboard
            .sort((a, b) => b.score - a.score)
            .map((entry, i) => (
              <div
                key={entry.displayName}
                className={`flex items-center gap-4 border-4 px-4 py-3 ${entry.isMe ? 'border-[var(--fb-accent-lime)] bg-[var(--fb-accent-lime)]/10' : 'border-white/20'}`}
              >
                <span className="font-display text-2xl text-chalk/40 w-8">{i + 1}</span>
                <span className="font-mono font-bold text-white flex-1">{entry.displayName}{entry.isMe && ' (you)'}</span>
                <span className="font-mono text-sm text-chalk/60">
                  {entry.correctCount}/{entry.totalAnswered}
                </span>
                <span className="font-display text-xl text-[var(--fb-accent-lime)]">
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
        <h2 className="font-display text-2xl text-white uppercase tracking-widest">Review</h2>
        {questions.map((q, i) => {
          const answer = answers[i]
          if (!answer) return null
          return (
            <div
              key={q.id}
              className={`border-4 px-4 py-3 flex flex-col gap-1 ${answer.correct ? 'border-[var(--fb-accent-lime)]/40' : 'border-[var(--fb-accent-magenta)]/40'}`}
            >
              <p className="font-mono text-xs text-chalk/40 uppercase tracking-widest">
                Q{i + 1} • {q.type.replace('-', ' ')} • {answer.pointsEarned > 0 ? `+${answer.pointsEarned}` : '0'} pts
              </p>
              <p className="font-mono text-sm text-white">{getQuestionPrompt(q)}</p>
              <div className="flex gap-4 mt-1 text-xs font-mono">
                <span className={answer.correct ? 'text-[var(--fb-accent-lime)]' : 'text-[var(--fb-accent-magenta)]'}>
                  You: {answer.answerValue || '(no answer)'}
                </span>
                {!answer.correct && (
                  <span className="text-chalk/50">
                    Correct: {getCorrectAnswerDisplay(q)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Actions */}
      <div className="flex gap-4 flex-wrap justify-center">
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="fb-brutal-btn px-6 py-3 text-lg"
          >
            Play again
          </button>
        )}
        <Link href="/trivia/setup" className="fb-brutal-btn px-6 py-3 text-lg bg-[var(--fb-accent-cyan)] !shadow-brutal-magenta">
          Change setup
        </Link>
        <Link href="/" className="fb-brutal-btn px-6 py-3 text-lg bg-black text-white border-white">
          Home
        </Link>
      </div>
    </div>
  )
}
