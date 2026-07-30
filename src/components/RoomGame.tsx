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
  type InitialGameConfig,
} from '@/lib/liveblocks/client'
import { bingoRoomConfigToStorage, loadBingoRoomConfig } from '@/lib/bingoRoomConfig'
import { BingoBoard } from '@/components/BingoBoard'
import { RoomInvite } from '@/components/RoomInvite'
import type { CellPick } from '@/lib/cellPick'
import { DrawnPlayerPanel, type DrawnPlayer } from '@/components/DrawnPlayerPanel'
import { PlayerPickModal } from '@/components/PlayerPickModal'
import { cellCategory, freeIndexForConfig, generateBoard, hasBingoForConfig } from '@/lib/board'
import { enrichedFootballPlayers } from '@/data/players'
import {
  boardConfigFromStorageFields,
  boardConfigPayload,
  categoriesRequired,
  categoryPoolForConfig,
  cellCountForConfig,
  isBoardConfigViable,
} from '@/lib/boardConfig'
import { displayCategory } from '@/lib/canonical'
import { DRAFT_POLICY_LABEL, type DraftPolicy } from '@/lib/draftPolicy'
import { draftApiUrl } from '@/lib/draftQuery'
import type { PlayMode } from '@/lib/playMode'
import { PLAY_MODE_LABEL } from '@/lib/playMode'
import { randomUUID } from '@/lib/randomUUID'
import { useDrawnPlayerHistory } from '@/lib/useDrawnPlayerHistory'

const ROUNDEL_COLORS = [
  'bg-green-go text-white',
  'bg-sky text-pitch-deep',
  'bg-pink text-white',
] as const

/** A label/value row in the host's read-only match-settings summary. */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">{label}</dt>
      <dd className="font-display text-[15px] uppercase leading-none text-card-ink">{value}</dd>
    </div>
  )
}

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
  const categoryNationalities = useStorage((s) => s.categoryNationalities) ?? true
  const categoryClubs = useStorage((s) => s.categoryClubs) ?? true
  const categoryAchievements = useStorage((s) => s.categoryAchievements) ?? true
  const categoryTraits = useStorage((s) => s.categoryTraits) ?? true
  const categoryManagers = useStorage((s) => s.categoryManagers) ?? true
  const minFameScore = useStorage((s) => s.minFameScore) ?? 0
  const boardLayout = useStorage((s) => s.boardLayout) ?? 'individual'
  const drawSource = useStorage((s) => s.drawSource) === 'independent' ? 'independent' : 'shared'
  const singleGuess = useStorage((s) => s.singleGuess) ?? false
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
        minFameScore,
      }),
    [
      boardSize,
      categoryNationalities,
      categoryClubs,
      categoryAchievements,
      categoryTraits,
      categoryManagers,
      minFameScore,
    ],
  )

  const configOk = isBoardConfigViable(boardConfig)
  const poolCount = categoryPoolForConfig(boardConfig).length
  const needCount = categoriesRequired(boardConfig)

  const eligiblePlayerCount = useMemo(
    () =>
      minFameScore <= 0
        ? enrichedFootballPlayers.length
        : enrichedFootballPlayers.filter((p) => (p.fameScore ?? 0) >= minFameScore).length,
    [minFameScore],
  )

  const activeCategoryCount = [
    categoryNationalities,
    categoryClubs,
    categoryAchievements,
    categoryTraits,
    categoryManagers,
  ].filter(Boolean).length
  const categorySummary = activeCategoryCount === 5 ? 'All 5 kinds' : `${activeCategoryCount} of 5`

  const effectiveDraftPolicy: DraftPolicy =
    boardLayout === 'individual' ? 'open' : draftPolicyStorage

  // Individual boards play like singleplayer, in parallel. Shared boards keep the
  // consensus-voting flow. `drawSource` only matters for individual boards.
  const isIndividual = boardLayout === 'individual'
  const drawShared = drawSource === 'shared'

  const isHost =
    self?.connectionId != null && hostConnectionId != null && self.connectionId === hostConnectionId

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

  const advanceDraftRound = useMutation(({ storage }) => {
    storage.set('draftRound', storage.get('draftRound') + 1)
  }, [])

  const applyStart = useMutation(
    ({ storage }, payload: { seed: string; supabaseGameId: string | null }) => {
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

  const castDraftVoteWithSelf = useMutation(({ storage, self: s }, vote: DraftVote) => {
    if (!s) return
    storage.get('draftVotes').set(String(s.connectionId), vote)
  }, [])

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
          storage.get('sharedSolved').set(String(payload.cellIndex), payload.pick)
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
  // Independent-draw individual boards advance their own draw locally.
  const [indyRound, setIndyRound] = useState(0)
  // Ticks once a second while playing so transient "skipped" chips can clear.
  const [nowTick, setNowTick] = useState(0)
  const [localSolved, setLocalSolved] = useState<Map<number, CellPick>>(new Map())
  const [modalCell, setModalCell] = useState<number | null>(null)
  const [starting, setStarting] = useState(false)
  const [localBingo, setLocalBingo] = useState(false)
  const bingoRecordedRef = useRef(false)
  const boardLayoutRef = useRef(boardLayout)
  boardLayoutRef.current = boardLayout

  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [wrongCell, setWrongCell] = useState<{ cell: number; nonce: number } | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  const isResolvingRef = useRef(false)
  const [drawn, setDrawn] = useState<DrawnPlayer | null>(null)
  const [draftTargetCells, setDraftTargetCells] = useState<Set<number> | null>(null)
  const [draftRestrictCells, setDraftRestrictCells] = useState(false)
  const [draftFallbackNote, setDraftFallbackNote] = useState<string | null>(null)

  useEffect(() => {
    if (!wrongCell) return
    const t = window.setTimeout(() => setWrongCell(null), 700)
    return () => window.clearTimeout(t)
  }, [wrongCell])

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
    setIndyRound(0)
    updatePresence({
      guesses: 0,
      solvedCount: 0,
      actedRound: null,
      lastAction: null,
      lastActionAt: null,
      bingoAt: null,
    })
  }, [seed, updatePresence])

  // Drive the transient "skipped" chip so it can expire.
  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [phase])

  const activeSeed = phase === 'playing' && seed ? seed : ''

  // Individual boards derive a per-player seed so every player gets a different
  // grid. Shared boards use the one room seed.
  const myBoardSeed =
    isIndividual && activeSeed && self?.connectionId != null
      ? `${activeSeed}::${self.connectionId}`
      : activeSeed
  // Independent draw advances a local round; shared draw / shared board use the room round.
  const myRound = isIndividual && !drawShared ? indyRound : draftRound
  const { drawnPlayerIds, noteDrawnPlayer } = useDrawnPlayerHistory(myRound, activeSeed)
  // Shared-draw: once I've placed or skipped this round I wait for the others.
  const myActedThisRound = isIndividual && drawShared && (presence?.actedRound ?? -1) >= draftRound

  const solvedForDisplay = useMemo(() => {
    if (boardLayout !== 'shared' || !sharedSolved) return localSolved
    const m = new Map<number, CellPick>()
    sharedSolved.forEach((pick, key) => {
      const i = Number(key)
      if (Number.isInteger(i)) m.set(i, pick)
    })
    return m
  }, [boardLayout, sharedSolved, localSolved])

  const occupiedForDraft = useMemo(() => [...solvedForDisplay.keys()], [solvedForDisplay])
  const placedPlayerIdsForDraft = useMemo(
    () => [...solvedForDisplay.values()].map((p) => p.playerId),
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
    // Shared-draw individual boards must draw the SAME player for everyone, so the
    // draw is keyed only on the room seed + room round with no per-board occupancy.
    const url =
      isIndividual && drawShared
        ? draftApiUrl({
            seed: activeSeed,
            round: draftRound,
            policy: 'open',
            boardConfig,
            occupiedIndices: [],
            placedPlayerIds: [],
            drawnPlayerIds,
          })
        : isIndividual
          ? draftApiUrl({
              seed: myBoardSeed,
              round: indyRound,
              policy: 'open',
              boardConfig,
              occupiedIndices: occupiedForDraft,
              placedPlayerIds: placedPlayerIdsForDraft,
              drawnPlayerIds,
            })
          : draftApiUrl({
              seed: activeSeed,
              round: draftRound,
              policy: effectiveDraftPolicy,
              boardConfig,
              occupiedIndices: occupiedForDraft,
              placedPlayerIds: placedPlayerIdsForDraft,
              drawnPlayerIds,
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
        noteDrawnPlayer(j.player?.playerId)
        const vs = Array.isArray(j.validSquares) ? j.validSquares : []
        const restrict = Boolean(j.restrictToValidSquares) && vs.length > 0
        setDraftRestrictCells(restrict)
        setDraftTargetCells(restrict ? new Set(vs) : null)
        setDraftFallbackNote(
          j.usedOpenFallback ? 'No one matched an open square - random draw this round.' : null,
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
    placedPlayerIdsForDraft,
    drawnPlayerIds,
    isIndividual,
    drawShared,
    myBoardSeed,
    indyRound,
  ])

  const participantIds = useMemo(() => {
    const ids = [self?.connectionId, ...others.map((o) => o.connectionId)].filter(
      (x): x is number => x != null,
    )
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

  const voteHighlightIndex = myVote?.type === 'square' ? myVote.cellIndex : null

  const isLeader = participantIds.length > 0 && self?.connectionId === participantIds[0]

  const modalLabel = useMemo(() => {
    if (modalCell === null || !myBoardSeed) return null
    return cellCategory(generateBoard(myBoardSeed, boardConfig), modalCell)
  }, [modalCell, myBoardSeed, boardConfig])

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
      if (modalCell === null || !myBoardSeed) return { ok: false as const, error: 'Game not ready' }
      const res = await fetch('/api/game/validate-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: myBoardSeed,
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
        updatePresence({ solvedCount: localSolved.size + 1 })
      }
      setModalCell(null)
      return { ok: true as const }
    },
    [
      modalCell,
      myBoardSeed,
      boardConfig,
      boardLayout,
      applySharedPick,
      localSolved,
      updatePresence,
    ],
  )

  const submitDraftVote = useCallback(
    (vote: DraftVote) => {
      castDraftVoteWithSelf(vote)
    },
    [castDraftVoteWithSelf],
  )

  // Individual boards: place the drawn player on my own board, exactly like
  // singleplayer. Wrong guesses vibrate; correct ones stick.
  const handleIndividualPlace = useCallback(
    async (cellIndex: number) => {
      if (
        !isIndividual ||
        playMode !== 'draft' ||
        !drawn ||
        draftLoading ||
        localBingo ||
        phase !== 'playing' ||
        myActedThisRound
      ) {
        return
      }
      const res = await fetch('/api/game/validate-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: myBoardSeed,
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
      const guessCount = (presence?.guesses ?? 0) + 1
      const now = Date.now()
      if (!j.ok || !j.player) {
        setWrongCell((w) => ({ cell: cellIndex, nonce: (w?.nonce ?? 0) + 1 }))
        // A single-guess turn is consumed even on a miss: advance past this player.
        if (singleGuess) {
          if (drawShared) {
            updatePresence({
              guesses: guessCount,
              actedRound: draftRound,
              lastAction: 'wrong',
              lastActionAt: now,
            })
          } else {
            updatePresence({ guesses: guessCount, lastAction: 'wrong', lastActionAt: now })
            setIndyRound((r) => r + 1)
          }
        } else {
          updatePresence({ guesses: guessCount, lastAction: 'wrong', lastActionAt: now })
        }
        return
      }
      const pick: CellPick = {
        playerId: j.player.playerId,
        name: j.player.name,
        imageUrl: j.player.imageUrl,
      }
      setLocalSolved((prev) => {
        const m = new Map(prev)
        m.set(cellIndex, pick)
        return m
      })
      if (drawShared) {
        updatePresence({
          guesses: guessCount,
          solvedCount: localSolved.size + 1,
          actedRound: draftRound,
          lastAction: 'correct',
          lastActionAt: now,
        })
      } else {
        updatePresence({
          guesses: guessCount,
          solvedCount: localSolved.size + 1,
          lastAction: 'correct',
          lastActionAt: now,
        })
        setIndyRound((r) => r + 1)
      }
    },
    [
      isIndividual,
      playMode,
      drawn,
      draftLoading,
      localBingo,
      phase,
      myActedThisRound,
      myBoardSeed,
      boardConfig,
      presence?.guesses,
      singleGuess,
      drawShared,
      draftRound,
      localSolved,
      updatePresence,
    ],
  )

  const handleIndividualSkip = useCallback(() => {
    if (
      !isIndividual ||
      playMode !== 'draft' ||
      draftLoading ||
      localBingo ||
      phase !== 'playing'
    ) {
      return
    }
    if (myActedThisRound) return
    const now = Date.now()
    if (drawShared) {
      updatePresence({ actedRound: draftRound, lastAction: 'skip', lastActionAt: now })
    } else {
      updatePresence({ lastAction: 'skip', lastActionAt: now })
      setIndyRound((r) => r + 1)
    }
  }, [
    isIndividual,
    playMode,
    draftLoading,
    localBingo,
    phase,
    myActedThisRound,
    drawShared,
    draftRound,
    updatePresence,
  ])

  // Shared-draw individual boards: the leader bumps the room round once every
  // participant has placed or skipped, so the next player is drawn for everyone.
  useEffect(() => {
    if (!isIndividual || !drawShared || playMode !== 'draft' || phase !== 'playing' || !isLeader) {
      return
    }
    if (participantIds.length === 0) return
    const actedBy = new Map<number, number>()
    if (self?.connectionId != null) actedBy.set(self.connectionId, presence?.actedRound ?? -1)
    for (const o of others) actedBy.set(o.connectionId, o.presence?.actedRound ?? -1)
    const everyoneActed = participantIds.every((id) => (actedBy.get(id) ?? -1) >= draftRound)
    if (everyoneActed) advanceDraftRound()
  }, [
    isIndividual,
    drawShared,
    playMode,
    phase,
    isLeader,
    participantIds,
    others,
    self?.connectionId,
    presence?.actedRound,
    draftRound,
    advanceDraftRound,
  ])

  useEffect(() => {
    if (
      boardLayout !== 'shared' ||
      !isLeader ||
      !allDraftVoted ||
      phase !== 'playing' ||
      playMode !== 'draft' ||
      !draftVotes ||
      isResolvingRef.current
    ) {
      return
    }

    const votesList: DraftVote[] = participantIds.map((id) => draftVotes.get(String(id))!)
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
          setWrongCell((w) => ({ cell: cellIndex, nonce: (w?.nonce ?? 0) + 1 }))
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
      if (playMode !== 'draft' || !drawn || draftLoading || localBingo || phase !== 'playing') {
        return
      }
      if (isIndividual) {
        void handleIndividualPlace(cellIndex)
      } else {
        submitDraftVote({ type: 'square', cellIndex })
      }
    },
    [
      playMode,
      drawn,
      draftLoading,
      localBingo,
      phase,
      isIndividual,
      handleIndividualPlace,
      submitDraftVote,
    ],
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
      const gid = j.skipped ? null : (j.gameId ?? null)
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
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm font-semibold text-on-green-dim">
        <span className="inline-block size-2 animate-pulse rounded-full bg-yellow" />
        Connecting to room…
      </div>
    )
  }

  if (roomError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-sm font-bold text-yellow">{roomError}</p>
        <Link href="/" className="mt-4 inline-block font-bold text-white underline">
          Home
        </Link>
      </div>
    )
  }

  return (
    <div className={`mx-auto max-w-5xl px-2 md:px-6 py-8${playMode === 'draft' ? 'pb-16' : ''}`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          {phase === 'lobby' ? <span className="eyebrow mb-3">Pre-match · tunnel</span> : null}
          {/* <h1 className="font-display text-[48px] font-black uppercase leading-[0.9] text-white md:text-[56px]">
            {phase === 'lobby' ? 'The squad gathers' : 'Race room'}
          </h1> */}
          <p className="mt-2 text-[14.5px] font-semibold text-on-green-soft">
            {phase === 'lobby'
              ? "Share the room code. The gaffer kicks off when everyone's in the tunnel."
              : 'Same clues for everyone - draft uses votes + skip.'}
          </p>
        </div>
        <Link href="/" className="btn btn-outline-light btn-sm">
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
          {/* Non-host: simple waiting lobby - just name + player list */}
          {!isHost ? (
            <div className="panel space-y-6 p-6">
              <div>
                <p className="eyebrow mb-2">In the room</p>
                <p className="font-display text-[28px] uppercase leading-none text-green">
                  You&apos;re in the room
                </p>
                <p className="mt-1.5 text-sm font-medium text-muted">
                  The host is setting things up. You&apos;ll start automatically when they&apos;re
                  ready.
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
                <span className="flex items-center gap-2 text-sm font-semibold text-card-muted">
                  <span className="inline-block size-2 animate-pulse rounded-full bg-pink" />
                  In the tunnel…
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
                  <p className="eyebrow eyebrow-sky mb-4">Starting XI · {others.length + 1}</p>
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
                          <span className="text-sm font-bold text-card-ink">{p.name}</span>
                          {p.host ? (
                            <span className="ml-auto -rotate-2 rounded-md bg-yellow px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-pitch-deep shadow-[0_2px_0_rgba(0,0,0,0.2)]">
                              Gaffer
                            </span>
                          ) : (
                            <span
                              className={`ml-auto text-xs font-bold ${
                                ready ? 'text-green-go' : 'text-card-muted'
                              }`}
                            >
                              {ready ? '✓ Ready' : 'In the tunnel…'}
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
                  <p className="eyebrow eyebrow-sky">Match settings</p>
                  <dl className="flex flex-col divide-y divide-card-tint/70">
                    <SummaryRow label="Mode" value={PLAY_MODE_LABEL[playMode]} />
                    <SummaryRow
                      label="Boards"
                      value={boardLayout === 'shared' ? 'Shared board' : 'Individual boards'}
                    />
                    {playMode === 'draft' && isIndividual ? (
                      <>
                        <SummaryRow label="Draw" value={drawShared ? 'Same player' : 'Own draws'} />
                        <SummaryRow label="Guesses" value={singleGuess ? 'One per turn' : 'Unlimited'} />
                      </>
                    ) : null}
                    {playMode === 'draft' && !isIndividual ? (
                      <SummaryRow label="Draft" value={DRAFT_POLICY_LABEL[effectiveDraftPolicy]} />
                    ) : null}
                    <SummaryRow label="Grid" value={`${boardSize}×${boardSize}`} />
                    <SummaryRow label="Categories" value={categorySummary} />
                    <SummaryRow
                      label="Star quality"
                      value={minFameScore === 0 ? 'Anyone' : `≥ ${minFameScore} · ${eligiblePlayerCount} in`}
                    />
                  </dl>
                  <p
                    className={`font-mono text-xs font-bold ${configOk ? 'text-card-muted' : 'text-pink'}`}
                  >
                    {configOk
                      ? `${poolCount} in pool · ${needCount} needed ✓`
                      : `Need at least ${needCount} clues — reopen setup to add categories.`}
                  </p>
                  <Link
                    href="/play/setup?mode=multiplayer"
                    className="text-[12.5px] font-bold text-green-go underline underline-offset-2 hover:opacity-70"
                  >
                    Change settings (opens a fresh room)
                  </Link>

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
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border-[3px] border-dashed border-white/40 p-5">
                  <span className="text-[13.5px] font-semibold text-on-green-soft">
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
                    {starting ? 'Starting…' : '🏁 Kick off the match'}
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
                ? isIndividual
                  ? ` · ${drawShared ? 'Same player' : 'Own draws'}${singleGuess ? ' · 1 try' : ''}`
                  : ` · ${DRAFT_POLICY_LABEL[effectiveDraftPolicy]}`
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
            round={myRound}
            loading={draftLoading}
            player={drawn}
            error={draftError}
            reduceMotion={reduceMotion}
            wrongNonce={wrongCell?.nonce ?? null}
            draftWarning={
              myActedThisRound && !localBingo ? 'Waiting for the other players…' : draftFallbackNote
            }
            // Individual boards use the singleplayer-style Skip; shared boards vote to skip.
            onSkip={
              isIndividual && playMode === 'draft' && phase === 'playing' && !localBingo
                ? handleIndividualSkip
                : undefined
            }
            skipDisabled={draftLoading || myActedThisRound}
            extraActions={
              !isIndividual && playMode === 'draft' && phase === 'playing' && !localBingo ? (
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
            seed={myBoardSeed}
            boardConfig={boardConfig}
            solved={solvedForDisplay}
            voteHighlightIndex={isIndividual ? null : voteHighlightIndex}
            draftTargetCells={null}
            wrongCell={wrongCell}
            reduceMotion={reduceMotion}
            onCellClick={(i) => {
              if (phase !== 'playing' || localBingo || !configOk || myActedThisRound) return
              if (playMode === 'draft') handleDraftCellClick(i)
              else setModalCell(i)
            }}
            lineHighlight={phase === 'playing' || localBingo}
          />
          {playMode === 'draft' && phase === 'playing' && !localBingo ? (
            <p className="mb-4 text-center text-xs font-medium text-muted">
              {isIndividual
                ? drawShared
                  ? 'Same player for everyone — place them on your own board, or skip. Next player when all have acted.'
                  : 'Place the drawn player on a matching square, or skip for a new one.'
                : 'Tap a square to vote · everyone must agree (or all skip) to advance'}
            </p>
          ) : null}
        </>
      ) : null}

      <AnimatePresence>
        {playMode === 'free' && modalCell !== null && modalLabel && phase === 'playing' ? (
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
              guesses: presence?.guesses ?? 0,
              solvedCount: presence?.solvedCount ?? 0,
              actedRound: presence?.actedRound ?? null,
              lastAction: presence?.lastAction ?? null,
              lastActionAt: presence?.lastActionAt ?? null,
            },
            ...others.map((o) => ({
              id: o.connectionId,
              name: (o.presence?.displayName ?? '').trim() || 'Guest',
              bingo: o.presence?.bingoAt != null,
              guesses: o.presence?.guesses ?? 0,
              solvedCount: o.presence?.solvedCount ?? 0,
              actedRound: o.presence?.actedRound ?? null,
              lastAction: o.presence?.lastAction ?? null,
              lastActionAt: o.presence?.lastActionAt ?? null,
            })),
          ].map((p, i) => {
            const fillTarget = cellCountForConfig(boardConfig) - 1
            // A locked-in action in shared-draw persists until the round advances;
            // in the other modes the chip fades a few seconds after the action.
            const lockedThisRound =
              isIndividual && drawShared && phase === 'playing' && p.actedRound === draftRound
            const recentAction =
              p.lastActionAt != null && nowTick > 0 && nowTick - p.lastActionAt < 3500
            let status: { label: string; tone: string } | null = null
            if (phase === 'playing' && !p.bingo && (lockedThisRound || recentAction)) {
              if (p.lastAction === 'correct') {
                status = { label: '✓ Correct', tone: 'bg-green-go/15 text-green-go' }
              } else if (p.lastAction === 'wrong') {
                status = { label: '✗ Incorrect', tone: 'bg-live-red/15 text-live-red' }
              } else if (p.lastAction === 'skip') {
                status = { label: '⏭ Skipped', tone: 'bg-card-tint text-card-muted' }
              }
            }
            return (
              <li key={p.id} className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[15px] uppercase ${
                    ROUNDEL_COLORS[i % ROUNDEL_COLORS.length]
                  }`}
                >
                  {p.name.charAt(0) || '?'}
                </span>
                <span className="min-w-0 truncate text-sm font-bold text-ink">{p.name}</span>
                {phase === 'playing' ? (
                  <span className="ml-1 shrink-0 font-mono text-[11px] font-bold text-on-green-dim">
                    {p.solvedCount}/{fillTarget}
                    {!singleGuess && p.guesses > 0
                      ? ` · ${p.guesses} ${p.guesses === 1 ? 'try' : 'tries'}`
                      : ''}
                  </span>
                ) : null}
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  {status ? (
                    <motion.span
                      key={`${p.id}-${p.lastActionAt ?? 0}`}
                      initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                      className={`rounded-full px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.05em] ${status.tone}`}
                    >
                      {status.label}
                    </motion.span>
                  ) : null}
                  {p.bingo ? (
                    <span className="foil rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]">
                      Bingo
                    </span>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export function RoomGame({ roomId }: { roomId: string }) {
  const [ready, setReady] = useState(false)
  // Seed the room from the config the host picked on the setup screen. This is
  // only used when the room is first created (fresh id from /room/new).
  const [initialConfig, setInitialConfig] = useState<InitialGameConfig | undefined>(undefined)

  useEffect(() => {
    if (!localStorage.getItem('fb_anon_id')) {
      localStorage.setItem('fb_anon_id', randomUUID())
    }
    setInitialConfig(bingoRoomConfigToStorage(loadBingoRoomConfig()))
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
      initialPresence={{
        displayName: '',
        bingoAt: null,
        guesses: 0,
        solvedCount: 0,
        actedRound: null,
        lastAction: null,
        lastActionAt: null,
      }}
      initialStorage={createInitialGameStorage(initialConfig)}
    >
      <RoomInner roomId={roomId} />
    </RoomProvider>
  )
}
