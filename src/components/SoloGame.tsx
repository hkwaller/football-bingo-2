'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { BingoBoard } from '@/components/BingoBoard'
import { DrawnPlayerPanel, type DrawnPlayer } from '@/components/DrawnPlayerPanel'
import { PlayerPickModal } from '@/components/PlayerPickModal'
import type { CellPick } from '@/lib/cellPick'
import {
  loadSolo,
  mapToSolo,
  saveSolo,
  soloToMap,
} from '@/lib/soloStorage'
import {
  cellCategory,
  FREE_INDEX,
  generateBoard,
  hasBingo,
} from '@/lib/board'
import { displayCategory } from '@/lib/canonical'
import type { PlayMode } from '@/lib/playMode'
import { PLAY_MODE_LABEL } from '@/lib/playMode'

const DRAFT_COOLDOWN_MS = 2500

export function SoloGame() {
  const [hydrated, setHydrated] = useState(false)
  const [seed, setSeed] = useState('')
  const [playMode, setPlayMode] = useState<PlayMode>('draft')
  const [round, setRound] = useState(0)
  const [solved, setSolved] = useState<Map<number, CellPick>>(new Map())
  const [modalCell, setModalCell] = useState<number | null>(null)

  const [drawn, setDrawn] = useState<DrawnPlayer | null>(null)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [nowTick, setNowTick] = useState(0)

  useEffect(() => {
    const saved = loadSolo()
    if (saved) {
      setSeed(saved.seed)
      setSolved(soloToMap(saved.solved))
      // Legacy saves had no playMode — keep previous “pick square then search” behavior.
      setPlayMode(saved.playMode === 'draft' ? 'draft' : 'free')
      setRound(
        typeof saved.round === 'number' && saved.round >= 0 ? saved.round : 0,
      )
    } else {
      setSeed(crypto.randomUUID())
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || !seed) return
    saveSolo({
      seed,
      solved: mapToSolo(solved),
      playMode,
      round,
    })
  }, [hydrated, seed, solved, playMode, round])

  useEffect(() => {
    if (playMode !== 'draft' || !seed || !hydrated) {
      setDrawn(null)
      setDraftLoading(false)
      return
    }
    let cancelled = false
    setDraftLoading(true)
    setDraftError(null)
    void fetch(
      `/api/game/draft?seed=${encodeURIComponent(seed)}&round=${round}`,
    )
      .then(async (res) => {
        const j = (await res.json()) as {
          player?: DrawnPlayer
          error?: string
        }
        if (cancelled) return
        if (!res.ok) {
          setDrawn(null)
          setDraftError(j.error ?? 'Could not load draw')
          return
        }
        setDrawn(j.player ?? null)
      })
      .catch(() => {
        if (!cancelled) {
          setDrawn(null)
          setDraftError('Could not load draw')
        }
      })
      .finally(() => {
        if (!cancelled) setDraftLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [playMode, seed, round, hydrated])

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const t = window.setInterval(() => setNowTick(Date.now()), 200)
    return () => window.clearInterval(t)
  }, [cooldownUntil])

  const cooldownRemainingMs = Math.max(0, cooldownUntil - nowTick)

  const won = useMemo(() => {
    const set = new Set(solved.keys())
    set.add(FREE_INDEX)
    return hasBingo(set)
  }, [solved])

  const modalLabel = useMemo(() => {
    if (modalCell === null || !seed) return null
    return cellCategory(generateBoard(seed), modalCell)
  }, [modalCell, seed])

  const resetBoard = useCallback(() => {
    const s = crypto.randomUUID()
    setSeed(s)
    setSolved(new Map())
    setRound(0)
    setModalCell(null)
    setDraftError(null)
    setCooldownUntil(0)
    saveSolo({
      seed: s,
      solved: {},
      playMode,
      round: 0,
    })
  }, [playMode])

  const switchMode = (m: PlayMode) => {
    if (m === playMode) return
    setPlayMode(m)
    setModalCell(null)
    setDraftError(null)
    setCooldownUntil(0)
    const s = crypto.randomUUID()
    setSeed(s)
    setSolved(new Map())
    setRound(0)
    saveSolo({ seed: s, solved: {}, playMode: m, round: 0 })
  }

  const handleFreePick = useCallback(
    async (playerId: string) => {
      if (modalCell === null) return { ok: false as const, error: 'No cell' }
      const res = await fetch('/api/game/validate-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, cellIndex: modalCell, playerId }),
      })
      const j = (await res.json()) as {
        ok?: boolean
        reason?: string
        player?: { playerId: string; name: string; imageUrl?: string }
      }
      if (!j.ok || !j.player) {
        return { ok: false as const, error: j.reason ?? 'No match' }
      }
      const pick: CellPick = {
        playerId: j.player.playerId,
        name: j.player.name,
        imageUrl: j.player.imageUrl,
      }
      setSolved((prev) => {
        const m = new Map(prev)
        m.set(modalCell, pick)
        return m
      })
      setModalCell(null)
      return { ok: true as const }
    },
    [modalCell, seed],
  )

  const handleDraftCell = useCallback(
    async (cellIndex: number) => {
      if (
        playMode !== 'draft' ||
        !drawn ||
        draftLoading ||
        won ||
        Date.now() < cooldownUntil
      ) {
        return
      }
      setDraftError(null)
      const res = await fetch('/api/game/validate-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed,
          cellIndex,
          playerId: drawn.playerId,
        }),
      })
      const j = (await res.json()) as {
        ok?: boolean
        reason?: string
        player?: { playerId: string; name: string; imageUrl?: string }
      }
      if (!j.ok || !j.player) {
        setDraftError(j.reason ?? 'That square does not match this player.')
        setCooldownUntil(Date.now() + DRAFT_COOLDOWN_MS)
        return
      }
      const pick: CellPick = {
        playerId: j.player.playerId,
        name: j.player.name,
        imageUrl: j.player.imageUrl,
      }
      setSolved((prev) => {
        const m = new Map(prev)
        m.set(cellIndex, pick)
        return m
      })
      setRound((r) => r + 1)
    },
    [playMode, drawn, draftLoading, won, cooldownUntil, seed],
  )

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-chalk/60">
        Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-chalk">Solo</h1>
          <p className="mt-1 text-sm text-chalk/60">
            {playMode === 'draft'
              ? 'Each round you get a player — place them on the right square.'
              : 'Pick a square, then search for a player who fits that clue.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-white/15 p-0.5">
            {(['draft', 'free'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  playMode === m
                    ? 'bg-emerald-600 text-white'
                    : 'text-chalk/70 hover:text-chalk'
                }`}
              >
                {PLAY_MODE_LABEL[m]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={resetBoard}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-chalk hover:bg-white/10"
          >
            New board
          </button>
          <Link
            href="/"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-chalk/80 hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {won ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-center text-yellow-100"
          >
            Bingo! You cleared a line.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DrawnPlayerPanel
        mode={playMode}
        round={round}
        loading={draftLoading}
        player={drawn}
        error={draftError}
        cooldownRemainingMs={cooldownRemainingMs}
      />

      {seed ? (
        <BingoBoard
          seed={seed}
          solved={solved}
          onCellClick={(i) => {
            if (won) return
            if (playMode === 'draft') void handleDraftCell(i)
            else setModalCell(i)
          }}
        />
      ) : null}

      <AnimatePresence>
        {playMode === 'free' && modalCell !== null && modalLabel ? (
          <PlayerPickModal
            open
            title={`Pick a player: ${displayCategory(modalLabel)}`}
            onClose={() => setModalCell(null)}
            onPick={handleFreePick}
            cooldownMs={DRAFT_COOLDOWN_MS}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
