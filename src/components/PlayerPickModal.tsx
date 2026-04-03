'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

type SearchPlayer = { playerId: string; name: string; imageUrl?: string }

type PlayerPickModalProps = {
  open: boolean
  title: string
  onClose: () => void
  onPick: (playerId: string) => Promise<{ ok: boolean; error?: string }>
  cooldownMs?: number
}

export function PlayerPickModal({
  open,
  title,
  onClose,
  onPick,
  cooldownMs = 0,
}: PlayerPickModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchPlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedUntil, setBlockedUntil] = useState(0)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setError(null)
      return
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const q = query.trim()
    if (q.length < 1) {
      setResults([])
      return
    }
    setLoading(true)
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/players/search?q=${encodeURIComponent(q)}&limit=20`,
        )
        const data = (await res.json()) as { players?: SearchPlayer[] }
        if (!cancelled) setResults(data.players ?? [])
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 220)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [query, open])

  const tryPick = useCallback(
    async (playerId: string) => {
      const now = Date.now()
      if (now < blockedUntil) return
      setSubmitting(true)
      setError(null)
      try {
        const r = await onPick(playerId)
        if (!r.ok) {
          setError(r.error ?? 'Does not match this square')
          if (cooldownMs > 0) setBlockedUntil(Date.now() + cooldownMs)
        }
      } finally {
        setSubmitting(false)
      }
    },
    [onPick, blockedUntil, cooldownMs],
  )

  if (!open) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-[#0c1018] shadow-2xl shadow-[var(--fb-accent-magenta)]/10"
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-xl font-bold tracking-wide text-chalk">
            {title}
          </h2>
          <p className="mt-1 text-sm text-chalk/60">
            Search players — pick someone who fits the square.
          </p>
        </div>
        <div className="p-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a name…"
            className="mb-3 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-base text-chalk placeholder:text-chalk/40 focus:border-[var(--fb-accent-lime)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--fb-accent-lime)]/25"
          />
          {error ? (
            <p className="mb-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <ul className="max-h-[45vh] space-y-1 overflow-y-auto pr-1">
            {loading ? (
              <li className="py-6 text-center text-sm text-chalk/50">Searching…</li>
            ) : results.length === 0 && query.trim().length >= 1 ? (
              <li className="py-6 text-center text-sm text-chalk/50">No matches</li>
            ) : (
              results.map((p) => (
                <li key={p.playerId}>
                  <button
                    type="button"
                    disabled={submitting || Date.now() < blockedUntil}
                    onClick={() => tryPick(p.playerId)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/10 disabled:opacity-50"
                  >
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs text-chalk/60">
                        ?
                      </span>
                    )}
                    <span className="text-base font-medium text-chalk">{p.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="flex justify-end border-t border-white/10 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-chalk/70 hover:text-chalk"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
