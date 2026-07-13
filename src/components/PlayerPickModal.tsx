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
      className="fixed inset-0 z-50 flex items-center justify-center bg-pitch-dark/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        className="card max-h-[85vh] w-full max-w-md overflow-hidden"
        initial={{ scale: 0.97, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-3xl font-semibold uppercase tracking-wide text-chalk">
            {title}
          </h2>
          <p className="mt-1 text-sm text-chalk-dim">
            Search players and pick a match.
          </p>
        </div>
        <div className="p-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a name…"
            className="input mb-3"
          />
          {error ? (
            <p className="mb-3 rounded-xl border border-flare/40 bg-flare/10 px-3 py-2 text-sm font-medium text-flare" role="alert">
              {error}
            </p>
          ) : null}
          <ul className="max-h-[45vh] space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <li className="py-6 text-center text-sm text-chalk-dim">Searching…</li>
            ) : results.length === 0 && query.trim().length >= 1 ? (
              <li className="py-6 text-center text-sm text-chalk-dim">No matches found</li>
            ) : (
              results.map((p) => (
                <li key={p.playerId}>
                  <button
                    type="button"
                    disabled={submitting || Date.now() < blockedUntil}
                    onClick={() => tryPick(p.playerId)}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-all duration-150 hover:border-turf/40 hover:bg-pitch-lighter disabled:pointer-events-none disabled:opacity-40"
                  >
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-full border border-line object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-pitch font-display text-lg text-chalk-dim">
                        ?
                      </span>
                    )}
                    <span className="text-sm font-semibold text-chalk">{p.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="flex justify-end border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
