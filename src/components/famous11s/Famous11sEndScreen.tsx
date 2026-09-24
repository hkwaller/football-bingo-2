'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { Famous11sSessionState } from '@/lib/famous11s/types'
import { AdsterraBanner } from '@/components/AdsterraBanner'
import { AdsterraPopunder } from '@/components/AdsterraPopunder'

interface Props {
  session: Famous11sSessionState
  onPlayAgain?: () => void
}

function summarize(session: Famous11sSessionState) {
  const slotsFound = session.results.reduce((acc, r) => acc + r.foundSlotIds.length, 0)
  const slotsTotal = session.results.reduce((acc, r) => acc + r.slotsTotal, 0)
  const cleared = session.results.filter((r) => r.cleared).length
  const livesUsed = session.results.reduce((acc, r) => acc + r.livesUsed, 0)
  return { slotsFound, slotsTotal, cleared, livesUsed }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-card-muted">{label}</p>
      <p className="font-display text-2xl font-black uppercase leading-none text-card-ink tabular-nums">{value}</p>
    </div>
  )
}

export function Famous11sEndScreen({ session, onPlayAgain }: Props) {
  const { slotsFound, slotsTotal, cleared, livesUsed } = summarize(session)

  useEffect(() => {
    if (slotsFound > 0) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } })
    }
  }, [slotsFound])

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
          <Stat label="Players" value={`${slotsFound}/${slotsTotal}`} />
          <Stat label="Cleared" value={`${cleared}/${session.lineups.length}`} />
          <Stat label="Lives used" value={String(livesUsed)} />
        </div>
      </motion.div>

      {/* Per-lineup review */}
      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-2xl font-black uppercase leading-none text-on-green">Review</h2>
        {session.results.map((r) => (
          <div
            key={r.lineupId}
            className={`panel flex items-center justify-between gap-4 border-l-4 px-4 py-3 ${
              r.cleared ? 'border-l-green' : 'border-l-red'
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{r.title}</p>
              {r.managerFound && (
                <p className="mt-0.5 text-[11px] font-semibold text-muted">+ manager ✓</p>
              )}
            </div>
            <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-muted">
              {r.foundSlotIds.length}/{r.slotsTotal}
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
        <Link href="/famous-11s/setup" className="btn btn-outline-light btn-lg">
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
