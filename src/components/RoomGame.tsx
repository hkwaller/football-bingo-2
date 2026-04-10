'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import {
  RoomProvider,
  useMutation,
  useMyPresence,
  useOthers,
  useSelf,
  useStatus,
  useStorage,
  useErrorListener,
  useBroadcastEvent,
  useEventListener,
  createInitialGameStorage,
  liveMapStringKeysClear,
  type DraftVote,
} from '@/lib/liveblocks/client'
import { BingoBoard } from '@/components/BingoBoard'
import { RoomInvite } from '@/components/RoomInvite'
import type { CellPick } from '@/lib/cellPick'
import { DrawnPlayerPanel, type DrawnPlayer } from '@/components/DrawnPlayerPanel'
import { PlayerPickModal } from '@/components/PlayerPickModal'
import {
  cellCategory,
  freeIndexForConfig,
  generateBoard,
  hasBingoForConfig,
} from '@/lib/board'
import {
  boardConfigFromStorageFields,
  boardConfigPayload,
  categoriesRequired,
  categoryPoolForConfig,
  isBoardConfigViable,
} from '@/lib/boardConfig'
import { displayCategory } from '@/lib/canonical'
import {
  DRAFT_POLICY_HELP,
  DRAFT_POLICY_LABEL,
  type DraftPolicy,
} from '@/lib/draftPolicy'
import { draftApiUrl } from '@/lib/draftQuery'
import type { PlayMode } from '@/lib/playMode'
import { PLAY_MODE_LABEL } from '@/lib/playMode'

const DRAFT_COOLDOWN_MS = 2500

function RoomInner({ roomId }: { roomId: string }) {
  const status = useStatus()
  const self = useSelf()
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
  const hostConnectionId = useStorage((s) => s.hostConnectionId)
  const boardSize = (useStorage((s) => s.boardSize) ?? 5) as 3 | 4 | 5
  const categoryNationalities =
    useStorage((s) => s.categoryNationalities) ?? true
  const categoryClubs = useStorage((s) => s.categoryClubs) ?? true
  const categoryAchievements =
    useStorage((s) => s.categoryAchievements) ?? true
  const boardLayout = useStorage((s) => s.boardLayout) ?? 'individual'
  const draftPolicyStorage: DraftPolicy =
    useStorage((s) => s.draftPolicy) === 'placeable' ? 'placeable' : 'open'
  const draftRound = useStorage((s) => s.draftRound) ?? 0
  const draftVotes = useStorage((s) => s.draftVotes)
  const sharedSolved = useStorage((s) => s.sharedSolved)

  const [presence, updatePresence] = useMyPresence()
  const others = useOthers()
  const broadcast = useBroadcastEvent()

  const boardConfig = useMemo(
    () =>
      boardConfigFromStorageFields({
        boardSize,
        categoryNationalities,
        categoryClubs,
        categoryAchievements,
      }),
    [boardSize, categoryNationalities, categoryClubs, categoryAchievements],
  )

  const configOk = isBoardConfigViable(boardConfig)
  const poolCount = categoryPoolForConfig(boardConfig).length
  const needCount = categoriesRequired(boardConfig)

  const effectiveDraftPolicy: DraftPolicy =
    boardLayout === 'individual' ? 'open' : draftPolicyStorage

  const isHost =
    self?.connectionId != null &&
    hostConnectionId != null &&
    self.connectionId === hostConnectionId

  const canEditLobby =
    hostConnectionId === null ||
    (self?.connectionId != null && self.connectionId === hostConnectionId)

  const claimHost = useMutation(({ storage }, id: number) => {
    if (storage.get('hostConnectionId') == null) {
      storage.set('hostConnectionId', id)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'lobby' || self?.connectionId == null) return
    claimHost(self.connectionId)
  }, [phase, self?.connectionId, claimHost])

  const setRoomPlayMode = useMutation(({ storage }, m: PlayMode) => {
    storage.set('playMode', m)
  }, [])

  const setBoardSize = useMutation(({ storage }, n: 3 | 4 | 5) => {
    storage.set('boardSize', n)
  }, [])

  const setCategory = useMutation(
    (
      { storage },
      key: 'categoryNationalities' | 'categoryClubs' | 'categoryAchievements',
      value: boolean,
    ) => {
      storage.set(key, value)
    },
    [],
  )

  const setBoardLayoutWithPolicy = useMutation(
    ({ storage }, layout: 'shared' | 'individual') => {
      storage.set('boardLayout', layout)
      if (layout === 'individual') storage.set('draftPolicy', 'open')
    },
    [],
  )

  const setDraftPolicyInStorage = useMutation(
    ({ storage }, policy: DraftPolicy) => {
      storage.set('draftPolicy', policy)
    },
    [],
  )

  const applyStart = useMutation(
    (
      { storage },
      payload: { seed: string; supabaseGameId: string | null },
    ) => {
      storage.set('phase', 'playing')
      storage.set('seed', payload.seed)
      storage.set('startedAt', Date.now())
      storage.set('supabaseGameId', payload.supabaseGameId)
      storage.set('draftRound', 0)
      liveMapStringKeysClear(storage.get('draftVotes'))
      liveMapStringKeysClear(storage.get('sharedSolved'))
    },
    [],
  )

  const setFinished = useMutation(({ storage }) => {
    storage.set('phase', 'finished')
  }, [])

  const castDraftVoteWithSelf = useMutation(
    ({ storage, self: s }, vote: DraftVote) => {
      if (!s) return
      storage.get('draftVotes').set(String(s.connectionId), vote)
    },
    [],
  )

  const clearDraftVotes = useMutation(({ storage }) => {
    liveMapStringKeysClear(storage.get('draftVotes'))
  }, [])

  const resolveDraftRound = useMutation(
    (
      { storage },
      payload: {
        skip: boolean
        cellIndex?: number
        pick?: CellPick
        layout: 'shared' | 'individual'
      },
    ) => {
      liveMapStringKeysClear(storage.get('draftVotes'))
      const r = storage.get('draftRound')
      storage.set('draftRound', r + 1)
      if (!payload.skip && payload.cellIndex !== undefined && payload.pick) {
        if (payload.layout === 'shared') {
          storage
            .get('sharedSolved')
            .set(String(payload.cellIndex), payload.pick)
        }
      }
    },
    [],
  )

  const applySharedPick = useMutation(
    ({ storage }, { cellIndex, pick }: { cellIndex: number; pick: CellPick }) => {
      storage.get('sharedSolved').set(String(cellIndex), pick)
    },
    [],
  )

  const [nameDraft, setNameDraft] = useState('')
  const [localSolved, setLocalSolved] = useState<Map<number, CellPick>>(new Map())
  const [modalCell, setModalCell] = useState<number | null>(null)
  const [starting, setStarting] = useState(false)
  const [localBingo, setLocalBingo] = useState(false)
  const bingoRecordedRef = useRef(false)
  const boardLayoutRef = useRef(boardLayout)
  boardLayoutRef.current = boardLayout

  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [nowTick, setNowTick] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const isResolvingRef = useRef(false)
  const [drawn, setDrawn] = useState<DrawnPlayer | null>(null)
  const [draftTargetCells, setDraftTargetCells] = useState<Set<number> | null>(null)
  const [draftRestrictCells, setDraftRestrictCells] = useState(false)
  const [draftFallbackNote, setDraftFallbackNote] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const fn = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  useEventListener(({ event }) => {
    if (!event || typeof event !== 'object' || !('type' in event)) return
    const e = event as { type: string; cellIndex?: number; pick?: CellPick }
    if (e.type === 'draft_place' && e.pick != null && typeof e.cellIndex === 'number') {
      if (boardLayoutRef.current === 'individual') {
        setLocalSolved((prev) => {
          const m = new Map(prev)
          m.set(e.cellIndex!, e.pick!)
          return m
        })
      }
    }
  })

  useEffect(() => {
    const n = presence?.displayName
    if (n) setNameDraft(n)
  }, [presence?.displayName])

  useEffect(() => {
    setLocalSolved(new Map())
    setLocalBingo(false)
    bingoRecordedRef.current = false
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

  const solvedForDisplay = useMemo(() => {
    if (boardLayout !== 'shared' || !sharedSolved) return localSolved
    const m = new Map<number, CellPick>()
    sharedSolved.forEach((pick, key) => {
      const i = Number(key)
      if (Number.isInteger(i)) m.set(i, pick)
    })
    return m
  }, [boardLayout, sharedSolved, localSolved])

  const occupiedForDraft = useMemo(
    () => [...solvedForDisplay.keys()],
    [solvedForDisplay],
  )

  useEffect(() => {
    if (playMode !== 'draft' || !activeSeed || phase !== 'playing') {
      setDrawn(null)
      setDraftLoading(false)
      setDraftTargetCells(null)
      setDraftRestrictCells(false)
      setDraftFallbackNote(null)
      return
    }
    let cancelled = false
    setDraftLoading(true)
    setDraftError(null)
    const url = draftApiUrl({
      seed: activeSeed,
      round: draftRound,
      policy: effectiveDraftPolicy,
      boardConfig,
      occupiedIndices: occupiedForDraft,
    })
    void fetch(url)
      .then(async (res) => {
        const j = (await res.json()) as {
          player?: DrawnPlayer
          error?: string
          validSquares?: number[]
          restrictToValidSquares?: boolean
          usedOpenFallback?: boolean
        }
        if (cancelled) return
        if (!res.ok) {
          setDrawn(null)
          setDraftError(j.error ?? 'Could not load draw')
          setDraftTargetCells(null)
          setDraftRestrictCells(false)
          setDraftFallbackNote(null)
          return
        }
        setDrawn(j.player ?? null)
        const vs = Array.isArray(j.validSquares) ? j.validSquares : []
        const restrict = Boolean(j.restrictToValidSquares) && vs.length > 0
        setDraftRestrictCells(restrict)
        setDraftTargetCells(restrict ? new Set(vs) : null)
        setDraftFallbackNote(
          j.usedOpenFallback
            ? 'No one matched an open square — random draw this round.'
            : null,
        )
      })
      .catch(() => {
        if (!cancelled) {
          setDrawn(null)
          setDraftError('Could not load draw')
          setDraftTargetCells(null)
          setDraftRestrictCells(false)
          setDraftFallbackNote(null)
        }
      })
      .finally(() => {
        if (!cancelled) setDraftLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [
    playMode,
    activeSeed,
    draftRound,
    phase,
    effectiveDraftPolicy,
    boardConfig,
    occupiedForDraft,
  ])

  const participantIds = useMemo(() => {
    const ids = [
      self?.connectionId,
      ...others.map((o) => o.connectionId),
    ].filter((x): x is number => x != null)
    return ids.sort((a, b) => a - b)
  }, [self?.connectionId, others])

  const allDraftVoted = useMemo(() => {
    if (phase !== 'playing' || playMode !== 'draft' || !draftVotes) return false
    if (participantIds.length === 0) return false
    for (const id of participantIds) {
      if (!draftVotes.has(String(id))) return false
    }
    return true
  }, [phase, playMode, draftVotes, participantIds])

  const myVote = useMemo((): DraftVote | null => {
    if (!draftVotes || self?.connectionId == null) return null
    return draftVotes.get(String(self.connectionId)) ?? null
  }, [draftVotes, self?.connectionId])

  const voteHighlightIndex =
    myVote?.type === 'square' ? myVote.cellIndex : null

  const isLeader =
    participantIds.length > 0 && self?.connectionId === participantIds[0]


  const modalLabel = useMemo(() => {
    if (modalCell === null || !activeSeed) return null
    return cellCategory(generateBoard(activeSeed, boardConfig), modalCell)
  }, [modalCell, activeSeed, boardConfig])

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
    const set = new Set(solvedForDisplay.keys())
    set.add(freeIndexForConfig(boardConfig))
    if (!hasBingoForConfig(set, boardConfig)) return
    bingoRecordedRef.current = true
    setLocalBingo(true)
    const displayName = nameDraft.trim() || 'Player'
    updatePresence({ bingoAt: Date.now() })
    setFinished()
    if (isLeader) void recordFinish(displayName)
  }, [
    phase,
    activeSeed,
    solvedForDisplay,
    boardConfig,
    nameDraft,
    updatePresence,
    setFinished,
    recordFinish,
    isLeader,
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
          boardConfig: boardConfigPayload(boardConfig),
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
      if (boardLayout === 'shared') {
        applySharedPick({ cellIndex: modalCell, pick })
      } else {
        setLocalSolved((prev) => {
          const m = new Map(prev)
          m.set(modalCell, pick)
          return m
        })
      }
      setModalCell(null)
      return { ok: true as const }
    },
    [modalCell, activeSeed, boardConfig, boardLayout, applySharedPick],
  )

  const submitDraftVote = useCallback(
    (vote: DraftVote) => {
      castDraftVoteWithSelf(vote)
    },
    [castDraftVoteWithSelf],
  )

  useEffect(() => {
    if (
      !isLeader ||
      !allDraftVoted ||
      phase !== 'playing' ||
      playMode !== 'draft' ||
      !draftVotes ||
      isResolvingRef.current
    ) {
      return
    }

    const votesList: DraftVote[] = participantIds.map(
      (id) => draftVotes.get(String(id))!,
    )
    const allSkip = votesList.every((v) => v.type === 'skip')
    const first = votesList[0]
    if (!allSkip && first?.type === 'square' && !drawn) return
    const allSameSquare =
      first?.type === 'square' &&
      votesList.every(
        (v) =>
          v.type === 'square' &&
          v.cellIndex === (first as { type: 'square'; cellIndex: number }).cellIndex,
      )

    if (!allSkip && !allSameSquare) return

    isResolvingRef.current = true

    const run = async () => {
      try {
        if (allSkip) {
          broadcast({ type: 'draft_skip' })
          resolveDraftRound({
            skip: true,
            layout: boardLayout,
          })
          return
        }
        if (first.type !== 'square') return
        const cellIndex = first.cellIndex
        if (!drawn) return
        const res = await fetch('/api/game/validate-cell', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seed: activeSeed,
            cellIndex,
            playerId: drawn.playerId,
            boardConfig: boardConfigPayload(boardConfig),
          }),
        })
        const j = (await res.json()) as {
          ok?: boolean
          reason?: string
          player?: { playerId: string; name: string; imageUrl?: string }
        }
        if (!j.ok || !j.player) {
          clearDraftVotes()
          setDraftError(j.reason ?? 'That square does not match.')
          return
        }
        const pick: CellPick = {
          playerId: j.player.playerId,
          name: j.player.name,
          imageUrl: j.player.imageUrl,
        }
        broadcast({ type: 'draft_place', cellIndex, pick })
        resolveDraftRound({
          skip: false,
          cellIndex,
          pick,
          layout: boardLayout,
        })
      } finally {
        isResolvingRef.current = false
      }
    }

    void run()
  }, [
    isLeader,
    allDraftVoted,
    phase,
    playMode,
    draftVotes,
    participantIds,
    broadcast,
    resolveDraftRound,
    clearDraftVotes,
    boardLayout,
    activeSeed,
    boardConfig,
    drawn,
  ])

  const handleDraftCellClick = useCallback(
    (cellIndex: number) => {
      if (
        playMode !== 'draft' ||
        !drawn ||
        draftLoading ||
        localBingo ||
        phase !== 'playing' ||
        Date.now() < cooldownUntil
      ) {
        return
      }
      submitDraftVote({ type: 'square', cellIndex })
    },
    [
      playMode,
      drawn,
      draftLoading,
      localBingo,
      phase,
      cooldownUntil,
      submitDraftVote,
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
        <Link href="/" className="mt-4 inline-block text-[var(--fb-accent-mint)] hover:underline">
          Home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-chalk md:text-5xl">
            Race room
          </h1>
          <p className="mt-1 font-mono text-xs text-chalk/50">{roomId}</p>
          <p className="mt-2 text-base text-chalk/65">
            Same clues for everyone — draft uses votes + skip. Host sets the board
            before start.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-white/25 px-3 py-2 text-sm font-semibold text-chalk/85 hover:bg-white/10"
        >
          Home
        </Link>
      </div>

      {phase === 'lobby' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fb-panel mb-8 space-y-6"
        >
          {/* Non-host: simple waiting lobby — just name + player list */}
          {!isHost ? (
            <div className="space-y-6 rounded-2xl border border-white/12 bg-white/[0.05] p-6">
              <div>
                <p className="text-lg font-bold text-chalk">You&apos;re in the room!</p>
                <p className="mt-1 text-sm text-chalk/55">
                  The host is setting things up. You&apos;ll start automatically when they&apos;re ready.
                </p>
              </div>
              <label className="block text-sm text-chalk/80">
                Your name
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={saveName}
                  className="mt-1 w-full max-w-sm rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-chalk"
                  placeholder="Enter your name"
                  autoFocus
                />
              </label>
              <p className="text-sm text-chalk/50">
                {others.length + 1} player{others.length === 0 ? '' : 's'} in room
              </p>
              <p className="text-sm text-chalk/40 animate-pulse">Waiting for host to start…</p>
            </div>
          ) : (
            /* Host: full settings panel */
            <>
          <RoomInvite roomId={roomId} />
          <div className="space-y-4 rounded-2xl border border-white/12 bg-white/[0.05] p-6">
          <div>
            <p className="text-sm font-bold text-chalk/90">Play mode</p>
            <div className="mt-2 flex rounded-xl border border-white/15 p-0.5">
              {(['draft', 'free'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRoomPlayMode(m)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    playMode === m
                      ? 'bg-[var(--fb-accent-lime)] text-black'
                      : 'text-chalk/70 hover:text-chalk'
                  }`}
                >
                  {PLAY_MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-chalk/90">Board</p>
            <p className="mt-1 text-xs text-chalk/50">
              One shared card everyone fills together, or each player keeps their own
              progress.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['shared', 'One board for everyone'],
                  ['individual', 'Each player has their own card'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBoardLayoutWithPolicy(v)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    boardLayout === v
                      ? 'border-[var(--fb-accent-magenta)] bg-[var(--fb-accent-magenta)]/25 text-chalk'
                      : 'border-white/20 bg-black/20 text-chalk/75 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-chalk/90">Draft draws</p>
            <p className="mt-1 text-xs text-chalk/50">
              Placeable drafts need one shared board so everyone uses the same open
              squares.
            </p>
            <div className="mt-2 space-y-2">
              {(['open', 'placeable'] as const).map((p) => (
                <label
                  key={p}
                  className={`flex gap-3 rounded-xl border border-white/15 bg-black/20 p-3 ${
                    boardLayout === 'individual' && p === 'placeable'
                      ? 'opacity-40'
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="roomDraftPolicy"
                    disabled={boardLayout === 'individual' && p === 'placeable'}
                    checked={draftPolicyStorage === p}
                    onChange={() => setDraftPolicyInStorage(p)}
                    className="mt-1 h-4 w-4 border-white/30"
                  />
                  <div>
                    <p className="text-sm font-bold text-chalk">
                      {DRAFT_POLICY_LABEL[p]}
                    </p>
                    <p className="text-xs text-chalk/55">{DRAFT_POLICY_HELP[p]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-chalk/90">Grid size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([3, 4, 5] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setBoardSize(n)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${
                    boardSize === n
                      ? 'bg-[var(--fb-accent-magenta)] text-white'
                      : 'border border-white/20 bg-black/20 text-chalk/80 hover:bg-white/10'
                  }`}
                >
                  {n}×{n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-chalk/90">Categories</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(
                [
                  ['categoryNationalities', 'Nationalities'],
                  ['categoryClubs', 'Clubs'],
                  ['categoryAchievements', 'Achievements'],
                ] as const
              ).map(([k, label]) => (
                <label
                  key={k}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(
                      k === 'categoryNationalities'
                        ? categoryNationalities
                        : k === 'categoryClubs'
                          ? categoryClubs
                          : categoryAchievements,
                    )}
                    onChange={() => {
                      const cur =
                        k === 'categoryNationalities'
                          ? categoryNationalities
                          : k === 'categoryClubs'
                            ? categoryClubs
                            : categoryAchievements
                      setCategory(k, !cur)
                    }}
                    className="h-4 w-4 rounded border-white/30"
                  />
                  <span className="text-sm font-medium text-chalk">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <p
            className={`text-sm ${configOk ? 'text-chalk/60' : 'text-red-300'}`}
          >
            {configOk
              ? `${poolCount} clues in pool — need ${needCount} for this grid.`
              : `Need at least ${needCount} clues — enable more categories.`}
          </p>
          <label className="block text-sm text-chalk/80">
            Display name
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              className="mt-1 w-full max-w-sm rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-chalk"
              placeholder="Your name"
            />
          </label>
          <p className="text-sm text-chalk/50">
            {others.length + 1} player{others.length === 0 ? '' : 's'} in room
          </p>
          <label className="block text-sm text-chalk/80">
            Display name
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              className="mt-1 w-full max-w-sm rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-chalk"
              placeholder="Your name"
            />
          </label>
          <p className="text-sm text-chalk/50">
            {others.length + 1} player{others.length === 0 ? '' : 's'} in room
          </p>
          <button
            type="button"
            disabled={starting || !configOk}
            onClick={() => {
              saveName()
              void handleStart()
            }}
            className="rounded-xl bg-[var(--fb-accent-lime)] px-5 py-2.5 text-sm font-bold text-black hover:opacity-95 disabled:opacity-50"
          >
            {starting ? 'Starting…' : 'Start race'}
          </button>
          </div>
            </>
          )}
        </motion.div>
      ) : null}

      {(phase === 'playing' || phase === 'finished') && activeSeed ? (
        <>
          <p className="mb-2 text-center text-xs text-chalk/45">
            Mode: {PLAY_MODE_LABEL[playMode]} ·{' '}
            {boardLayout === 'shared' ? 'Shared board' : 'Individual boards'}
            {playMode === 'draft'
              ? ` · Draft: ${DRAFT_POLICY_LABEL[effectiveDraftPolicy]}`
              : ''}
          </p>
          <AnimatePresence>
            {localBingo || phase === 'finished' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 rounded-xl border border-[var(--fb-accent-mint)]/45 bg-[var(--fb-accent-mint)]/15 px-4 py-3 text-center font-semibold text-[var(--fb-accent-mint)]"
              >
                {localBingo
                  ? 'Bingo! Result recorded if cloud save is enabled.'
                  : 'Round finished.'}
              </motion.div>
            ) : null}
          </AnimatePresence>
          <DrawnPlayerPanel
            mode={playMode}
            round={draftRound}
            loading={draftLoading}
            player={drawn}
            error={draftError}
            cooldownRemainingMs={cooldownRemainingMs}
            draftWarning={draftFallbackNote}
            extraActions={
              playMode === 'draft' && phase === 'playing' && !localBingo ? (
                <button
                  type="button"
                  disabled={draftLoading}
                  onClick={() => submitDraftVote({ type: 'skip' })}
                  className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-chalk hover:bg-white/15 disabled:opacity-40"
                >
                  Skip
                </button>
              ) : null
            }
          />
          <BingoBoard
            seed={activeSeed}
            boardConfig={boardConfig}
            solved={solvedForDisplay}
            voteHighlightIndex={voteHighlightIndex}
            draftTargetCells={
              null
            }
            reduceMotion={reduceMotion}
            onCellClick={(i) => {
              if (phase !== 'playing' || localBingo || !configOk) return
              if (playMode === 'draft') handleDraftCellClick(i)
              else setModalCell(i)
            }}
            lineHighlight={phase === 'playing' || localBingo}
          />
          {playMode === 'draft' && phase === 'playing' && !localBingo ? (
            <p className="mb-4 text-center text-xs text-chalk/50">
              Tap a square to vote · everyone must agree (or all skip) to advance
            </p>
          ) : null}
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

      <div className="mt-8 rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-chalk/70">
        <p className="font-bold text-chalk/90">Others</p>
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
      key={roomId}
      id={roomId}
      initialPresence={{ displayName: '', bingoAt: null }}
      initialStorage={createInitialGameStorage()}
    >
      <RoomInner roomId={roomId} />
    </RoomProvider>
  )
}
