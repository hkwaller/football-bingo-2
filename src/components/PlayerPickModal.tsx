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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        className="max-h-[85vh] w-full max-w-md overflow-hidden border-4 border-white bg-black shadow-brutal-lg"
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-4 border-white bg-[var(--fb-accent-lime)] px-5 py-4">
          <h2 className="font-display text-4xl font-black uppercase text-black">
            {title}
          </h2>
          <p className="mt-1 font-mono text-xs font-bold text-black/80">
            &gt; SEARCH PLAYERS — PICK A MATCH.
          </p>
        </div>
        <div className="p-4 bg-black">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="TYPE A NAME..."
            className="mb-3 w-full border-2 border-white bg-black px-4 py-3 font-mono text-base font-bold text-white uppercase placeholder:text-white/40 focus:border-[var(--fb-accent-cyan)] focus:outline-none focus:ring-0 shadow-brutal-sm"
          />
          {error ? (
            <p className="mb-3 border-2 border-[var(--fb-accent-magenta)] bg-black p-2 font-mono text-sm font-bold text-[var(--fb-accent-magenta)]" role="alert">
              ERROR: {error}
            </p>
          ) : null}
          <ul className="max-h-[45vh] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <li className="py-6 text-center font-mono text-sm font-bold text-white">SEARCHING...</li>
            ) : results.length === 0 && query.trim().length >= 1 ? (
              <li className="py-6 text-center font-mono text-sm font-bold text-[var(--fb-accent-yellow)]">NO MATCHES FOUND</li>
            ) : (
              results.map((p) => (
                <li key={p.playerId}>
                  <button
                    type="button"
                    disabled={submitting || Date.now() < blockedUntil}
                    onClick={() => tryPick(p.playerId)}
                    className="flex w-full items-center gap-3 border-2 border-white/50 bg-[#111] px-3 py-2.5 text-left transition-all hover:-translate-y-1 hover:border-[var(--fb-accent-lime)] hover:shadow-brutal-lime disabled:opacity-50 disabled:grayscale"
                  >
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="border-2 border-white object-cover grayscale contrast-125"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center border-2 border-white bg-black font-display text-xl text-white">
                        ?
                      </span>
                    )}
                    <span className="font-display text-2xl font-bold uppercase text-white">{p.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="flex justify-end border-t-4 border-white bg-black px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-transparent px-4 py-2 font-mono text-sm font-bold uppercase text-white hover:border-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
