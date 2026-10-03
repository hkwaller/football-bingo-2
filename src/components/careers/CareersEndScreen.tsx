'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { CareersSessionState } from '@/lib/careers/types'
import { AdsterraBanner } from '@/components/AdsterraBanner'
import { AdsterraPopunder } from '@/components/AdsterraPopunder'

interface Props {
  session: CareersSessionState
  onPlayAgain?: () => void
}

export function CareersEndScreen({ session, onPlayAgain }: Props) {
  const solved = session.results.filter((r) => r.solved).length
  const firstTry = session.results.filter((r) => r.solved && r.guessesUsed === 1).length

  useEffect(() => {
    if (solved > 0) confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } })
  }, [solved])

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-6 py-8 md:px-9">
      <motion.div
        className="flex flex-col items-center gap-3 text-center"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <span className="eyebrow">Full time</span>
        <div>
          <h1 className="font-display text-[72px] font-black uppercase leading-none text-on-green tabular-nums">
            {session.score.toLocaleString()}
          </h1>
          <p className="mt-1 text-sm font-semibold text-on-green-soft">points</p>
        </div>

        <div className="panel flex w-full max-w-md items-stretch justify-center divide-x divide-[var(--line)] px-2 py-4">
          <Stat label="Named" value={`${solved}/${session.results.length}`} />
          <Stat label="First guess" value={String(firstTry)} />
        </div>
      </motion.div>

      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-2xl font-black uppercase leading-none text-on-green">
          Review
        </h2>
        {session.results.map((r) => (
          <div
            key={r.playerId}
            className={`panel flex items-center justify-between gap-4 border-l-4 px-4 py-3 ${
              r.solved ? 'border-l-green' : 'border-l-red'
            }`}
          >
            <span className="text-sm font-bold text-ink">{r.name}</span>
            <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-muted">
              {r.solved ? `+${r.points}` : '-'}
            </span>
          </div>
        ))}
      </motion.div>

      <div className="flex flex-wrap justify-center gap-3">
        {onPlayAgain && (
          <button onClick={onPlayAgain} className="btn btn-primary btn-lg">
            Play again
          </button>
        )}
        <Link href="/careers/setup" className="btn btn-outline-light btn-lg">
          Change setup
        </Link>
        <Link href="/" className="btn btn-ghost btn-lg">
          Home
        </Link>
      </div>

      <AdsterraBanner />
      <AdsterraPopunder />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-card-muted">
        {label}
      </p>
      <p className="font-display text-2xl font-black uppercase leading-none text-card-ink tabular-nums">
        {value}
      </p>
    </div>
  )
}
