'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
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
import { LobbyBar } from '@/components/setup/LobbyBar'
import { LobbyLayout } from '@/components/LobbyLayout'
import { LobbySettingRow, LobbySquad } from '@/components/LobbySquad'
import type { CellPick } from '@/lib/cellPick'
import { DrawnPlayerPanel, type DrawnPlayer } from '@/components/DrawnPlayerPanel'
import { PlayerPickModal } from '@/components/PlayerPickModal'
import {
  AvatarStrip,
  FullTimeBanner,
  joinNames,
  PLAYER_COLORS,
  type RoomMode,
  type RoomPlayer,
  RoomRail,
} from '@/components/RoomPanels'
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
import { useSpaceToSkip } from '@/lib/useSpaceToSkip'
import { LobbyNameField } from '@/components/LobbyNameField'
import { RoomConnecting } from '@/components/RoomConnecting'

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
      solvedCells: [],
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

  // Kept through 'finished' so the final board stays on screen under the full-time banner.
  const activeSeed = (phase === 'playing' || phase === 'finished') && seed ? seed : ''

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

  const boardWon = useMemo(() => {
    const set = new Set(solvedForDisplay.keys())
    set.add(freeIndexForConfig(boardConfig))
    return hasBingoForConfig(set, boardConfig)
  }, [solvedForDisplay, boardConfig])
  // Once the game is over, keep the last drawn player instead of drawing another.
  const drawFrozen = boardWon || phase === 'finished'

  // The draw is keyed on the exact request, so state that doesn't feed it (e.g. my
  // own placements under shared draw) can't refetch and re-animate the same player.
  const draftUrl = useMemo(() => {
    if (playMode !== 'draft' || !activeSeed || phase !== 'playing' || boardWon) return null
    // Shared-draw individual boards must draw the SAME player for everyone, so the
    // draw is keyed only on the room seed + room round with no per-board occupancy.
    return isIndividual && drawShared
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
    boardWon,
  ])

  useEffect(() => {
    if (drawFrozen) {
      setDraftLoading(false)
      return
    }
    if (!draftUrl) {
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
    void fetch(draftUrl)
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
  }, [draftUrl, drawFrozen])

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

  // ── Room scoreboard model (styling only; derived from presence + storage) ──
  const roomMode: RoomMode =
    playMode === 'free' ? 'free' : !isIndividual ? 'shared' : drawShared ? 'same' : 'own'
  const sharedCells = useMemo(
    () => (!isIndividual && activeSeed ? generateBoard(activeSeed, boardConfig) : []),
    [isIndividual, activeSeed, boardConfig],
  )
  const roomPlayers = useMemo<RoomPlayer[]>(() => {
    const raw = [
      {
        id: self?.connectionId ?? -1,
        isSelf: true,
        pr: presence,
        name: (presence?.displayName || nameDraft).trim() || 'You',
      },
      ...others.map((o) => ({
        id: o.connectionId,
        isSelf: false,
        pr: o.presence,
        name: (o.presence?.displayName ?? '').trim() || 'Guest',
      })),
    ]
    const allActed = raw.every((r) => r.pr?.bingoAt != null || r.pr?.actedRound === draftRound)
    return raw.map((r, i) => {
      const pr = r.pr
      const acted = phase === 'playing' && pr?.actedRound === draftRound
      const recent = pr?.lastActionAt != null && nowTick > 0 && nowTick - pr.lastActionAt < 3500
      const fromAction = (a: typeof pr.lastAction | undefined): RoomPlayer['status'] =>
        a === 'correct'
          ? { kind: 'placed' }
          : a === 'wrong'
            ? { kind: 'missed' }
            : a === 'skip'
              ? { kind: 'skipped' }
              : null
      let status: RoomPlayer['status'] = null
      if (phase === 'playing') {
        if (roomMode === 'same') status = acted ? fromAction(pr?.lastAction) : { kind: 'playing' }
        else if (roomMode === 'shared') {
          const v = draftVotes?.get(String(r.id))
          status = !v
            ? { kind: 'novote' }
            : v.type === 'skip'
              ? { kind: 'vote', label: 'Skip' }
              : {
                  kind: 'vote',
                  label: displayCategory(cellCategory(sharedCells, v.cellIndex) ?? ''),
                }
        } else if (recent) status = fromAction(pr?.lastAction)
      }
      return {
        id: r.id,
        name: r.name,
        isSelf: r.isSelf,
        colorIndex: i,
        bingo: pr?.bingoAt != null,
        bingoAt: pr?.bingoAt ?? null,
        guesses: pr?.guesses ?? 0,
        solvedCount: pr?.solvedCount ?? 0,
        solvedCells: pr?.solvedCells ?? [],
        status,
        hideLastPick:
          roomMode === 'same' && !r.isSelf && acted && pr?.lastAction === 'correct' && !allActed,
      }
    })
  }, [
    self?.connectionId,
    presence,
    nameDraft,
    others,
    draftRound,
    phase,
    nowTick,
    roomMode,
    draftVotes,
    sharedCells,
  ])
  const waitingOn = useMemo(
    () =>
      roomMode === 'same' && phase === 'playing'
        ? roomPlayers
            .filter((p) => !p.isSelf && !p.bingo && p.status?.kind === 'playing')
            .map((p) => p.name)
        : [],
    [roomMode, phase, roomPlayers],
  )
  const cellVoters = useMemo(() => {
    if (roomMode !== 'shared' || !draftVotes) return undefined
    const m = new Map<number, { key: string; initial: string; color: string }[]>()
    for (const p of roomPlayers) {
      const v = draftVotes.get(String(p.id))
      if (v?.type !== 'square') continue
      const list = m.get(v.cellIndex) ?? []
      list.push({
        key: String(p.id),
        initial: p.name.charAt(0) || '?',
        color: PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length],
      })
      m.set(v.cellIndex, list)
    }
    return m
  }, [roomMode, draftVotes, roomPlayers])
  const votedCount = roomPlayers.filter((p) => p.status?.kind === 'vote').length

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
        updatePresence({
          solvedCount: localSolved.size + 1,
          solvedCells: [...localSolved.keys(), modalCell],
        })
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
          solvedCells: [...localSolved.keys(), cellIndex],
          actedRound: draftRound,
          lastAction: 'correct',
          lastActionAt: now,
        })
      } else {
        updatePresence({
          guesses: guessCount,
          solvedCount: localSolved.size + 1,
          solvedCells: [...localSolved.keys(), cellIndex],
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

  const skipViaKey = useCallback(() => {
    if (isIndividual) handleIndividualSkip()
    else if (!draftLoading) submitDraftVote({ type: 'skip' })
  }, [isIndividual, handleIndividualSkip, draftLoading, submitDraftVote])

  useSpaceToSkip(playMode === 'draft' && phase === 'playing' && !localBingo, skipViaKey)

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

  const roomModeLabel = `${PLAY_MODE_LABEL[playMode]} · ${boardLayout === 'shared' ? 'Shared board' : 'Own boards'}${
    playMode === 'draft'
      ? isIndividual
        ? ` · ${drawShared ? 'Same player' : 'Own draws'}${singleGuess ? ' · 1 try' : ''}`
        : ` · ${DRAFT_POLICY_LABEL[effectiveDraftPolicy]}`
      : ''
  }`

  const saveName = (name = nameDraft) => {
    const displayName = name.trim() || 'Player'
    setNameDraft(displayName)
    updatePresence({ displayName, bingoAt: null })
  }

  if (phase === null || status === 'connecting' || status === 'reconnecting') {
    return (
      <RoomConnecting
        mode="bingo"
        state={status === 'reconnecting' ? 'reconnecting' : 'connecting'}
      />
    )
  }

  if (roomError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-sm font-bold text-yellow">{roomError}</p>
        <Link href="/" className="mt-4 inline-block font-bold text-on-green underline">
          Home
        </Link>
      </div>
    )
  }

  if (phase === 'lobby') {
    const lobbyName = presence?.displayName || nameDraft
    return (
      <LobbyLayout
        isHost={isHost}
        eyebrow="Pre-match · in the tunnel"
        eyebrowTone="yellow"
        title={
          <>
            Get your mates <span className="text-yellow">in.</span>
          </>
        }
        subtitle="Share the room code. The gaffer kicks off when everyone's in the tunnel."
        headerAction={
          <Link href="/" className="btn btn-outline-light btn-sm">
            Home
          </Link>
        }
        invite={<RoomInvite roomId={roomId} />}
        squad={
          <LobbySquad
            players={roomPlayers.map((p) => ({
              id: p.id,
              displayName: p.name,
              isHost: hostConnectionId === p.id,
              isSelf: p.isSelf,
              ready: p.name !== 'Guest',
            }))}
          />
        }
        settings={
          <>
            <dl>
              <LobbySettingRow label="Mode" value={PLAY_MODE_LABEL[playMode]} />
              <LobbySettingRow
                label="Boards"
                value={boardLayout === 'shared' ? 'Shared board' : 'Individual boards'}
              />
              {playMode === 'draft' && isIndividual ? (
                <>
                  <LobbySettingRow label="Draw" value={drawShared ? 'Same player' : 'Own draws'} />
                  <LobbySettingRow
                    label="Guesses"
                    value={singleGuess ? 'One per turn' : 'Unlimited'}
                  />
                </>
              ) : null}
              {playMode === 'draft' && !isIndividual ? (
                <LobbySettingRow label="Draft" value={DRAFT_POLICY_LABEL[effectiveDraftPolicy]} />
              ) : null}
              <LobbySettingRow label="Grid" value={`${boardSize}×${boardSize}`} />
              <LobbySettingRow label="Categories" value={categorySummary} />
              <LobbySettingRow
                label="Star quality"
                value={
                  minFameScore === 0 ? 'Anyone' : `≥ ${minFameScore} · ${eligiblePlayerCount} in`
                }
              />
            </dl>
            {isHost ? (
              <p
                className={`mt-2 font-mono text-xs font-bold ${configOk ? 'text-card-muted' : 'text-pink'}`}
              >
                {configOk
                  ? `${poolCount} in pool · ${needCount} needed ✓`
                  : `Need at least ${needCount} clues - reopen setup to add categories.`}
              </p>
            ) : null}
          </>
        }
        changeSettingsHref="/play/setup?mode=multiplayer"
        nameField={
          <LobbyNameField value={lobbyName} onSave={saveName} autoFocus={!isHost && !lobbyName} />
        }
        bar={
          <LobbyBar
            isHost={isHost}
            playerCount={others.length + 1}
            fields={[
              { label: 'Mode', value: PLAY_MODE_LABEL[playMode] },
              { label: 'Grid', value: `${boardSize}×${boardSize}` },
              { label: 'Boards', value: boardLayout === 'shared' ? 'Shared' : 'Individual' },
            ]}
            mobileDetail={`${PLAY_MODE_LABEL[playMode]} · ${boardSize}×${boardSize} · ${
              boardLayout === 'shared' ? 'shared board' : 'own boards'
            }`}
            hint="First full line wins the match"
            startLabel={starting ? 'Starting…' : 'Kick off'}
            onStart={() => {
              saveName()
              void handleStart()
            }}
            disabled={starting || !configOk}
          />
        }
      />
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-2.5 pb-36 pt-1 sm:px-6 lg:px-16 lg:pb-16">
      {(phase === 'playing' || phase === 'finished') && activeSeed ? (
        <>
          {phase === 'finished' ? (
            <FullTimeBanner
              players={roomPlayers}
              total={cellCountForConfig(boardConfig) - 1}
              isHost={isHost}
              starting={starting}
              onRematch={() => void handleStart()}
              modeLabel={roomModeLabel}
            />
          ) : null}
          <div
            className={`lg:grid lg:items-start lg:gap-9 ${
              playMode === 'draft'
                ? 'lg:grid-cols-[300px_minmax(0,1fr)_300px]'
                : 'lg:grid-cols-[minmax(0,1fr)_300px]'
            }`}
          >
            {playMode === 'draft' ? (
              <aside className="flex flex-col gap-5">
                <DrawnPlayerPanel
                  mode={playMode}
                  round={myRound}
                  loading={draftLoading}
                  player={drawn}
                  error={draftError}
                  reduceMotion={reduceMotion}
                  wrongNonce={wrongCell?.nonce ?? null}
                  draftWarning={
                    myActedThisRound && !localBingo
                      ? waitingOn.length
                        ? `You're in. Waiting on ${joinNames(waitingOn)}`
                        : 'Waiting for the other players…'
                      : draftFallbackNote
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
              </aside>
            ) : null}

            <section aria-label={isIndividual ? 'Your board' : 'Room board'} className="min-w-0">
              <div className="mb-3 flex items-end justify-between gap-3 lg:mb-4">
                <div className="min-w-0">
                  <p className="truncate font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-yellow">
                    Room · {roomModeLabel}
                  </p>
                  <h1 className="mt-1 hidden whitespace-nowrap font-display text-[44px] font-black uppercase leading-[0.9] text-on-green lg:block xl:text-[56px]">
                    {isIndividual ? 'Your board' : 'Room board'}
                  </h1>
                </div>
                <Link href="/" className="btn btn-outline-light btn-sm">
                  Leave
                </Link>
              </div>
              <AvatarStrip
                players={roomPlayers}
                total={cellCountForConfig(boardConfig) - 1}
                className="mb-3 lg:hidden"
              />
              <BingoBoard
                seed={myBoardSeed}
                boardConfig={boardConfig}
                solved={solvedForDisplay}
                voteHighlightIndex={isIndividual ? null : voteHighlightIndex}
                draftTargetCells={null}
                wrongCell={wrongCell}
                cellVoters={cellVoters}
                reduceMotion={reduceMotion}
                onCellClick={(i) => {
                  if (phase !== 'playing' || localBingo || !configOk || myActedThisRound) return
                  if (playMode === 'draft') handleDraftCellClick(i)
                  else setModalCell(i)
                }}
                lineHighlight={phase === 'playing' || localBingo}
              />
              {playMode === 'draft' && phase === 'playing' && !localBingo ? (
                <p className="mt-4 text-center text-[13px] font-medium text-on-green-dim">
                  {isIndividual
                    ? drawShared
                      ? 'Same player for everyone - place them on your own board, or skip. Next player when all have acted.'
                      : 'Place the drawn player on a matching square, or skip for a new one.'
                    : 'Tap a square to vote · everyone must agree (or all skip) to advance'}
                </p>
              ) : null}
            </section>

            <aside className="hidden lg:block">
              <RoomRail
                mode={roomMode}
                players={roomPlayers}
                total={cellCountForConfig(boardConfig) - 1}
                boardSize={boardConfig.size}
                freeIndex={freeIndexForConfig(boardConfig)}
                showMiniBoards
                round={draftRound}
                drawnName={drawn?.name ?? null}
                waitingOn={waitingOn}
                votedCount={votedCount}
              />
            </aside>
          </div>
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
    return <RoomConnecting mode="bingo" />
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
        solvedCells: [],
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
