'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import {
  RoomProvider,
  useMutation,
  useMyPresence,
  useOthers,
  useStatus,
  useStorage,
  useErrorListener,
} from '@/lib/liveblocks/client'
import { BingoBoard } from '@/components/BingoBoard'
import type { CellPick } from '@/lib/cellPick'
import { DrawnPlayerPanel, type DrawnPlayer } from '@/components/DrawnPlayerPanel'
import { PlayerPickModal } from '@/components/PlayerPickModal'
import { cellCategory, generateBoard, FREE_INDEX, hasBingo } from '@/lib/board'
import { displayCategory } from '@/lib/canonical'
import type { PlayMode } from '@/lib/playMode'
import { PLAY_MODE_LABEL } from '@/lib/playMode'

const DRAFT_COOLDOWN_MS = 2500

function RoomInner({ roomId }: { roomId: string }) {
  const status = useStatus()
  const [roomError, setRoomError] = useState<string | null>(null)
  useErrorListener((err) => {
    const msg = err?.message ?? 'Connection error'
    if (msg.toLowerCase().includes('auth') || msg.includes('503')) {
      setRoomError(
        'Liveblocks is not configured or auth failed. Set LIVEBLOCKS_SECRET_KEY and use a valid project.',
      )
    } else setRoomError(msg)
  })
  const phase = useStorage((s) => s.phase)
  const seed = useStorage((s) => s.seed)
  const supabaseGameId = useStorage((s) => s.supabaseGameId)
  const playModeRaw = useStorage((s) => s.playMode)
  const playMode: PlayMode = playModeRaw === 'free' ? 'free' : 'draft'

  const [presence, updatePresence] = useMyPresence()
  const others = useOthers()

  const setRoomPlayMode = useMutation(({ storage }, m: PlayMode) => {
    storage.set('playMode', m)
  }, [])

  const applyStart = useMutation(
    (
      { storage },
      payload: { seed: string; supabaseGameId: string | null },
    ) => {
      storage.set('phase', 'playing')
      storage.set('seed', payload.seed)
      storage.set('startedAt', Date.now())
      storage.set('supabaseGameId', payload.supabaseGameId)
    },
    [],
  )

  const setFinished = useMutation(({ storage }) => {
    storage.set('phase', 'finished')
  }, [])

  const [nameDraft, setNameDraft] = useState('')
  const [solved, setSolved] = useState<Map<number, CellPick>>(new Map())
  const [modalCell, setModalCell] = useState<number | null>(null)
  const [starting, setStarting] = useState(false)
  const [localBingo, setLocalBingo] = useState(false)
  const bingoRecordedRef = useRef(false)

  const [round, setRound] = useState(0)
  const [drawn, setDrawn] = useState<DrawnPlayer | null>(null)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [nowTick, setNowTick] = useState(0)

  useEffect(() => {
    const n = presence?.displayName
    if (n) setNameDraft(n)
  }, [presence?.displayName])

  useEffect(() => {
    setSolved(new Map())
    setLocalBingo(false)
    bingoRecordedRef.current = false
    setRound(0)
    setModalCell(null)
    setDraftError(null)
    setCooldownUntil(0)
  }, [seed])

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const t = window.setInterval(() => setNowTick(Date.now()), 200)
    return () => window.clearInterval(t)
  }, [cooldownUntil])

  const cooldownRemainingMs = Math.max(0, cooldownUntil - nowTick)

  const activeSeed = phase === 'playing' && seed ? seed : ''

  useEffect(() => {
    if (playMode !== 'draft' || !activeSeed || phase !== 'playing') {
      setDrawn(null)
      setDraftLoading(false)
      return
    }
    let cancelled = false
    setDraftLoading(true)
    setDraftError(null)
    void fetch(
      `/api/game/draft?seed=${encodeURIComponent(activeSeed)}&round=${round}`,
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
  }, [playMode, activeSeed, round, phase])

  const modalLabel = useMemo(() => {
    if (modalCell === null || !activeSeed) return null
    return cellCategory(generateBoard(activeSeed), modalCell)
  }, [modalCell, activeSeed])

  const recordFinish = useCallback(
    async (displayName: string) => {
      if (!supabaseGameId) return
      await fetch('/api/games/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: supabaseGameId,
          displayName,
          finalRank: 1,
        }),
      })
    },
    [supabaseGameId],
  )

  useEffect(() => {
    if (phase !== 'playing' || !activeSeed || bingoRecordedRef.current) return
    const set = new Set(solved.keys())
    set.add(FREE_INDEX)
    if (!hasBingo(set)) return
    bingoRecordedRef.current = true
    setLocalBingo(true)
    const displayName = nameDraft.trim() || 'Player'
    updatePresence({ bingoAt: Date.now() })
    setFinished()
    void recordFinish(displayName)
  }, [
    phase,
    activeSeed,
    solved,
    nameDraft,
    updatePresence,
    setFinished,
    recordFinish,
  ])

  const handleFreePick = useCallback(
    async (playerId: string) => {
      if (modalCell === null || !activeSeed)
        return { ok: false as const, error: 'Game not ready' }
      const res = await fetch('/api/game/validate-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: activeSeed,
          cellIndex: modalCell,
          playerId,
        }),
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
    [modalCell, activeSeed],
  )

  const handleDraftCell = useCallback(
    async (cellIndex: number) => {
      if (
        playMode !== 'draft' ||
        !drawn ||
        draftLoading ||
        localBingo ||
        Date.now() < cooldownUntil
      ) {
        return
      }
      setDraftError(null)
      const res = await fetch('/api/game/validate-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: activeSeed,
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
    [
      playMode,
      drawn,
      draftLoading,
      localBingo,
      cooldownUntil,
      activeSeed,
    ],
  )

  const handleStart = async () => {
    setStarting(true)
    try {
      const newSeed = crypto.randomUUID()
      const res = await fetch('/api/games/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: newSeed,
          liveblocksRoomId: roomId,
        }),
      })
      const j = (await res.json()) as {
        gameId?: string
        skipped?: boolean
        error?: string
      }
      if (j.error) return
      const gid = j.skipped ? null : j.gameId ?? null
      applyStart({ seed: newSeed, supabaseGameId: gid })
    } finally {
      setStarting(false)
    }
  }

  const saveName = () => {
    updatePresence({ displayName: nameDraft.trim() || 'Player', bingoAt: null })
  }

  if (phase === null || status === 'connecting' || status === 'reconnecting') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-chalk/60">
        Connecting to room…
      </div>
    )
  }

  if (roomError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-red-300">{roomError}</p>
        <Link href="/" className="mt-4 inline-block text-emerald-400 hover:underline">
          Home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-chalk">Race room</h1>
          <p className="mt-1 font-mono text-xs text-chalk/50">{roomId}</p>
          <p className="mt-2 text-sm text-chalk/60">
            Same board for everyone — first to complete a line wins. Mode is set
            before you start.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-white/20 px-3 py-2 text-sm text-chalk/80 hover:bg-white/10"
        >
          Home
        </Link>
      </div>

      {phase === 'lobby' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 space-y-4 rounded-xl border border-white/10 bg-white/5 p-6"
        >
          <div>
            <p className="text-sm font-medium text-chalk/90">Play mode</p>
            <p className="mt-1 text-xs text-chalk/50">
              Draft: random player each round, place on the board. Free mode:
              choose a square, then search for a player.
            </p>
            <div className="mt-2 flex rounded-lg border border-white/15 p-0.5">
              {(['draft', 'free'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRoomPlayMode(m)}
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
          </div>
          <label className="block text-sm text-chalk/80">
            Display name
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              className="mt-1 w-full max-w-sm rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-chalk"
              placeholder="Your name"
            />
          </label>
          <p className="text-sm text-chalk/50">
            {others.length + 1} player{others.length === 0 ? '' : 's'} in room
          </p>
          <button
            type="button"
            disabled={starting}
            onClick={() => {
              saveName()
              void handleStart()
            }}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {starting ? 'Starting…' : 'Start race'}
          </button>
        </motion.div>
      ) : null}

      {(phase === 'playing' || phase === 'finished') && activeSeed ? (
        <>
          <p className="mb-2 text-center text-xs text-chalk/45">
            Mode: {PLAY_MODE_LABEL[playMode]}
          </p>
          <AnimatePresence>
            {localBingo || phase === 'finished' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-center text-emerald-100"
              >
                {localBingo
                  ? 'Bingo! Result recorded if cloud save is enabled.'
                  : 'Round finished.'}
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
          <BingoBoard
            seed={activeSeed}
            solved={solved}
            onCellClick={(i) => {
              if (phase !== 'playing' || localBingo) return
              if (playMode === 'draft') void handleDraftCell(i)
              else setModalCell(i)
            }}
            lineHighlight={phase === 'playing' || localBingo}
          />
        </>
      ) : null}

      <AnimatePresence>
        {playMode === 'free' &&
        modalCell !== null &&
        modalLabel &&
        phase === 'playing' ? (
          <PlayerPickModal
            open
            title={`Pick a player: ${displayCategory(modalLabel)}`}
            onClose={() => setModalCell(null)}
            onPick={handleFreePick}
            cooldownMs={DRAFT_COOLDOWN_MS}
          />
        ) : null}
      </AnimatePresence>

      <div className="mt-8 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-chalk/70">
        <p className="font-medium text-chalk/90">Others</p>
        <ul className="mt-2 space-y-1">
          {others.map((o) => (
            <li key={o.connectionId}>
              {o.presence?.displayName || 'Guest'}
              {o.presence?.bingoAt != null ? ' — Bingo!' : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function RoomGame({ roomId }: { roomId: string }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('fb_anon_id')) {
      localStorage.setItem('fb_anon_id', crypto.randomUUID())
    }
    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-chalk/60">
        Preparing…
      </div>
    )
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ displayName: '', bingoAt: null }}
      initialStorage={{
        phase: 'lobby',
        seed: '',
        startedAt: null,
        supabaseGameId: null,
        playMode: 'draft',
      }}
    >
      <RoomInner roomId={roomId} />
    </RoomProvider>
  )
}
