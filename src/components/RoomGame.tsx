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
import { randomUUID } from '@/lib/randomUUID'

const ROUNDEL_COLORS = [
  'bg-green text-cream',
  'bg-nation text-cream',
  'bg-red text-white',
] as const

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
  const categoryTraits = useStorage((s) => s.categoryTraits) ?? true
  const categoryManagers = useStorage((s) => s.categoryManagers) ?? true
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
        categoryTraits,
        categoryManagers,
      }),
    [
      boardSize,
      categoryNationalities,
      categoryClubs,
      categoryAchievements,
      categoryTraits,
      categoryManagers,
    ],
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
      key:
        | 'categoryNationalities'
        | 'categoryClubs'
        | 'categoryAchievements'
        | 'categoryTraits'
        | 'categoryManagers',
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
  }, [seed])

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
        phase !== 'playing'
      ) {
        return
      }
      submitDraftVote({ type: 'square', cellIndex })
    },
    [playMode, drawn, draftLoading, localBingo, phase, submitDraftVote],
  )

  const handleStart = async () => {
    setStarting(true)
    try {
      const newSeed = randomUUID()
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
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm font-medium text-muted">
        <span className="inline-block size-2 animate-pulse rounded-full bg-red" />
        Connecting to room…
      </div>
    )
  }

  if (roomError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-sm font-semibold text-red">{roomError}</p>
        <Link href="/" className="mt-4 inline-block font-bold text-green underline">
          Home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-9">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[40px] uppercase leading-none text-green md:text-[44px]">
            {phase === 'lobby' ? 'Waiting for players' : 'Race room'}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted">
            {phase === 'lobby'
              ? "Share the room code. The host starts the match when everyone's in."
              : 'Same clues for everyone — draft uses votes + skip.'}
          </p>
        </div>
        <Link href="/" className="btn btn-outline btn-sm">
          Home
        </Link>
      </div>

      {phase === 'lobby' ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-8 space-y-6"
        >
          {/* Non-host: simple waiting lobby — just name + player list */}
          {!isHost ? (
            <div className="panel space-y-6 p-6">
              <div>
                <p className="eyebrow mb-2">In the room</p>
                <p className="font-display text-[28px] uppercase leading-none text-green">
                  You&apos;re in the room
                </p>
                <p className="mt-1.5 text-sm font-medium text-muted">
                  The host is setting things up. You&apos;ll start automatically when they&apos;re ready.
                </p>
              </div>
              <label className="block text-sm font-bold text-ink">
                Your name
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={saveName}
                  className="input mt-1.5 max-w-sm"
                  placeholder="Enter your name"
                  autoFocus
                />
              </label>
              <div className="flex items-center justify-between border-t border-line pt-4">
                <span className="chip">
                  {others.length + 1} player{others.length === 0 ? '' : 's'} in room
                </span>
                <span className="flex items-center gap-2 text-sm font-medium text-muted">
                  <span className="inline-block size-2 animate-pulse rounded-full bg-red" />
                  Waiting for host to start…
                </span>
              </div>
            </div>
          ) : (
            /* Host: full settings panel */
            <div className="grid gap-5 md:grid-cols-[1fr_1.2fr] md:items-start">
              {/* Left column */}
              <div className="flex flex-col gap-5">
                <RoomInvite roomId={roomId} />

                {/* In the room */}
                <div className="panel p-6">
                  <p className="eyebrow mb-4">In the room · {others.length + 1}</p>
                  <ul className="flex flex-col gap-3">
                    {[
                      {
                        id: self?.connectionId ?? -1,
                        name: (presence?.displayName || nameDraft).trim() || 'You',
                        host: isHost,
                      },
                      ...others.map((o) => ({
                        id: o.connectionId,
                        name: (o.presence?.displayName ?? '').trim() || 'Guest',
                        host: hostConnectionId === o.connectionId,
                      })),
                    ].map((p, i) => {
                      const ready = p.name !== 'Guest'
                      return (
                        <li key={p.id} className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-[15px] uppercase ${
                              ROUNDEL_COLORS[i % ROUNDEL_COLORS.length]
                            }`}
                          >
                            {p.name.charAt(0) || '?'}
                          </span>
                          <span className="text-sm font-bold text-ink">{p.name}</span>
                          {p.host ? (
                            <span className="ml-auto rounded-[3px] bg-foil px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-white">
                              Host
                            </span>
                          ) : (
                            <span
                              className={`ml-auto text-xs font-semibold ${
                                ready ? 'text-green' : 'text-muted'
                              }`}
                            >
                              {ready ? 'Ready' : 'Joining…'}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-5">
                <div className="panel flex flex-col gap-4 p-6">
                  <p className="eyebrow">
                    Match settings{' '}
                    <span className="font-semibold normal-case tracking-[0.06em] text-muted">
                      — host only
                    </span>
                  </p>

                  {/* Mode */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-[90px] shrink-0 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                      Mode
                    </span>
                    {(['draft', 'free'] as const).map((m) => {
                      const active = playMode === m
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setRoomPlayMode(m)}
                          className={`rounded-full px-4 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition-colors duration-200 ${
                            active
                              ? 'border-2 border-ink bg-panel-white text-ink'
                              : 'border-2 border-dashed border-line-strong text-muted hover:text-ink'
                          }`}
                        >
                          {PLAY_MODE_LABEL[m]}
                        </button>
                      )
                    })}
                  </div>

                  {/* Boards */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-[90px] shrink-0 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                      Boards
                    </span>
                    {(
                      [
                        ['individual', 'Individual'],
                        ['shared', 'Shared'],
                      ] as const
                    ).map(([v, label]) => {
                      const active = boardLayout === v
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setBoardLayoutWithPolicy(v)}
                          className={`rounded-full px-4 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition-colors duration-200 ${
                            active
                              ? 'border-2 border-ink bg-panel-white text-ink'
                              : 'border-2 border-dashed border-line-strong text-muted hover:text-ink'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Draft rule */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-[90px] shrink-0 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                      Draft
                    </span>
                    {(['open', 'placeable'] as const).map((p) => {
                      const active = draftPolicyStorage === p
                      const disabled =
                        boardLayout === 'individual' && p === 'placeable'
                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={disabled}
                          onClick={() => setDraftPolicyInStorage(p)}
                          className={`rounded-full px-4 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition-colors duration-200 disabled:opacity-40 ${
                            active
                              ? 'border-2 border-ink bg-panel-white text-ink'
                              : 'border-2 border-dashed border-line-strong text-muted hover:text-ink'
                          }`}
                        >
                          {DRAFT_POLICY_LABEL[p]}
                        </button>
                      )
                    })}
                  </div>
                  <p className="-mt-1 text-[12.5px] font-medium leading-relaxed text-muted">
                    {DRAFT_POLICY_HELP[effectiveDraftPolicy]}
                  </p>

                  {/* Grid */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-[90px] shrink-0 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                      Grid
                    </span>
                    {([3, 4, 5] as const).map((n) => {
                      const active = boardSize === n
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setBoardSize(n)}
                          className={`rounded-full px-4 py-1.5 font-display text-[14px] uppercase transition-colors duration-200 ${
                            active
                              ? 'border-2 border-ink bg-panel-white text-green'
                              : 'border-2 border-dashed border-line-strong text-muted hover:text-ink'
                          }`}
                        >
                          {n}×{n}
                        </button>
                      )
                    })}
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-[90px] shrink-0 text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
                      Categories
                    </span>
                    {(
                      [
                        ['categoryNationalities', 'Nations', 'bg-nation text-cream', categoryNationalities],
                        ['categoryClubs', 'Clubs', 'bg-green text-cream', categoryClubs],
                        ['categoryAchievements', 'Honours', 'bg-foil text-white', categoryAchievements],
                        ['categoryTraits', 'Traits', 'bg-ink text-cream', categoryTraits],
                        ['categoryManagers', 'Managers', 'bg-red text-cream', categoryManagers],
                      ] as const
                    ).map(([k, label, onClass, cur]) => {
                      const active = Boolean(cur)
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setCategory(k, !cur)}
                          className={`inline-flex items-center gap-1 rounded-full px-[14px] py-[5px] text-[11.5px] font-bold uppercase tracking-[0.04em] transition-all duration-200 ${
                            active
                              ? onClass
                              : 'border-2 border-dashed border-line-strong text-muted hover:text-ink'
                          }`}
                        >
                          {active ? '✓ ' : ''}
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  <p
                    className={`font-mono text-xs font-bold ${
                      configOk ? 'text-muted' : 'text-red'
                    }`}
                  >
                    {configOk
                      ? `${poolCount} in pool · ${needCount} needed ✓`
                      : `Need at least ${needCount} clues — enable more categories.`}
                  </p>

                  {/* Display name */}
                  <label className="block text-sm font-bold text-ink">
                    Display name
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onBlur={saveName}
                      className="input mt-1.5 max-w-sm"
                      placeholder="Your name"
                    />
                  </label>
                </div>

                {/* Footer strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border-2 border-dashed border-line-strong p-5">
                  <span className="text-[13.5px] font-medium text-muted">
                    {boardLayout === 'shared'
                      ? 'One shared board for the room. First full line wins the match.'
                      : 'Everyone gets their own board. First full line wins the match.'}
                  </span>
                  <button
                    type="button"
                    disabled={starting || !configOk}
                    onClick={() => {
                      saveName()
                      void handleStart()
                    }}
                    className="btn btn-primary"
                  >
                    {starting ? 'Starting…' : 'Start match'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ) : null}

      {(phase === 'playing' || phase === 'finished') && activeSeed ? (
        <>
          <div className="mb-3 flex justify-center">
            <span className="chip">
              {PLAY_MODE_LABEL[playMode]} ·{' '}
              {boardLayout === 'shared' ? 'Shared board' : 'Individual boards'}
              {playMode === 'draft'
                ? ` · ${DRAFT_POLICY_LABEL[effectiveDraftPolicy]}`
                : ''}
            </span>
          </div>
          <AnimatePresence>
            {localBingo || phase === 'finished' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-4 rounded-[14px] px-4 py-3 text-center font-display text-lg uppercase leading-none ${
                  localBingo
                    ? 'foil border-2 border-foil'
                    : 'border-2 border-ink bg-panel-white text-green'
                }`}
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
            draftWarning={draftFallbackNote}
            extraActions={
              playMode === 'draft' && phase === 'playing' && !localBingo ? (
                <button
                  type="button"
                  disabled={draftLoading}
                  onClick={() => submitDraftVote({ type: 'skip' })}
                  className="btn btn-outline btn-sm"
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
            <p className="mb-4 text-center text-xs font-medium text-muted">
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
          />
        ) : null}
      </AnimatePresence>

      <div className="panel mt-8 p-6">
        <p className="eyebrow mb-4">In the room · {others.length + 1}</p>
        <ul className="flex flex-col gap-3">
          {[
            {
              id: self?.connectionId ?? -1,
              name: (presence?.displayName || nameDraft).trim() || 'You',
              bingo: presence?.bingoAt != null,
            },
            ...others.map((o) => ({
              id: o.connectionId,
              name: (o.presence?.displayName ?? '').trim() || 'Guest',
              bingo: o.presence?.bingoAt != null,
            })),
          ].map((p, i) => (
            <li key={p.id} className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-[15px] uppercase ${
                  ROUNDEL_COLORS[i % ROUNDEL_COLORS.length]
                }`}
              >
                {p.name.charAt(0) || '?'}
              </span>
              <span className="text-sm font-bold text-ink">{p.name}</span>
              {p.bingo ? (
                <span className="foil ml-auto rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]">
                  Bingo
                </span>
              ) : null}
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
      localStorage.setItem('fb_anon_id', randomUUID())
    }
    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-3 text-sm font-medium text-muted">
        <span className="inline-block size-2 animate-pulse rounded-full bg-red" />
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
