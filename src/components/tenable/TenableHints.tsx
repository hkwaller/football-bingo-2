'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HINTED_POINTS, type TenableHint } from '@/lib/tenable/types'

export type HintResult = TenableHint | 'none-left' | 'failed'

/**
 * Ask the server for a hint on one answer not in `exclude`. 'none-left' only when
 * every unfound answer already has a hint; 'failed' for network/server errors.
 */
export async function fetchTenableHint(questionId: string, exclude: number[]): Promise<HintResult> {
  try {
    const res = await fetch('/api/tenable/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, exclude }),
    })
    const data = (await res.json().catch(() => null)) as { hint?: TenableHint; error?: string } | null
    if (data?.hint) return data.hint
    return data?.error === 'no-hint' ? 'none-left' : 'failed'
  } catch {
    return 'failed'
  }
}

interface Props {
  hints: TenableHint[]
  foundRanks: number[]
  hintsLeft: number
  /** Resolves to how the request went; the hint itself arrives via `hints`. */
  onRequest: () => Promise<'ok' | 'none-left' | 'failed'>
  /** Hide the button (e.g. not your turn) but keep showing active hints. */
  canRequest?: boolean
  /** Multiplayer: label who used each hint. */
  byLabel?: (connId: number) => string
}

/** Hint button + a card of clues for each hinted answer that's still unfound. */
export function TenableHints({ hints, foundRanks, hintsLeft, onRequest, canRequest = true, byLabel }: Props) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'none-left' | 'failed'>('idle')
  const active = hints.filter((h) => !foundRanks.includes(h.rank))

  async function request() {
    if (loading || hintsLeft <= 0) return
    setLoading(true)
    const result = await onRequest()
    setLoading(false)
    setStatus(result === 'ok' ? 'idle' : result)
  }

  if (hintsLeft <= 0 && hints.length === 0) return null

  return (
    <div className="mb-4 flex flex-col gap-2">
      {canRequest && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={request}
            disabled={loading || hintsLeft <= 0 || status === 'none-left'}
            className="inline-flex items-center gap-2 rounded-full bg-yellow px-4 py-2 text-[13px] font-extrabold uppercase tracking-[0.06em] text-ink transition-opacity disabled:opacity-40"
          >
            <span aria-hidden>💡</span>
            {loading ? 'Thinking…' : 'Hint'}
            <span className="rounded-full bg-ink/10 px-2 py-0.5 font-mono text-[11px] tabular-nums">
              {hintsLeft} left
            </span>
          </button>
          <span className="text-[12px] font-semibold text-on-green-dim">
            {status === 'none-left'
              ? 'Every answer left already has a hint'
              : status === 'failed'
                ? "Couldn't get a hint - tap to try again"
                : `Hinted answers score ${HINTED_POINTS}`}
          </span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {active.map((h) => (
          <motion.div
            key={h.rank}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-[14px] border-2 border-yellow/60 bg-black/20 px-4 py-3"
          >
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-yellow">
              💡 Who am I?{h.by != null && byLabel ? ` · hint from ${byLabel(h.by)}` : ''}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {h.clues.map((c) => (
                <li
                  key={c}
                  className="rounded-full bg-surface/15 px-3 py-1 text-[13px] font-semibold text-on-green"
                >
                  {c}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
