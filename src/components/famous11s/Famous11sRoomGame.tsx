'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ElevenRoomProvider,
  useElevenStorage,
  useElevenM,
  useElevenOthers,
  useElevenMyPresence,
  useElevenStatus,
  useElevenErrorListener,
  useElevenSelf,
  createInitialElevenStorage,
  parseElevenConfig,
  parseElevenLineups,
  parseStringArray,
  parseNumberArray,
  parseLastGuess,
  type ElevenLastGuess,
} from '@/lib/famous11s/liveblocksEleven'
import { loadFamous11sConfig } from '@/lib/famous11s/storage'
import { getLineupById, selectLineups, lineupTarget } from '@/data/famous11s'
import { matchSlot } from '@/lib/famous11s/matching'
import {
  POINTS_PER_SLOT,
  CLEAR_BONUS,
  MISS_PENALTY,
  type Famous11sConfig,
} from '@/lib/famous11s/types'
import { randomUUID } from '@/lib/randomUUID'
import {
  getTabDisplayName,
  getTabPlayerId,
  roomPlayerIdOf as playerIdOf,
  saveTabDisplayName,
} from '@/lib/roomPlayer'
import { Famous11sLobby } from './Famous11sLobby'
import { PitchBoard } from './PitchBoard'
import { Famous11sAutocomplete } from './Famous11sAutocomplete'
import { LivesRow } from '@/components/LivesRow'
import { RoomResults } from '@/components/RoomResults'
import { RoomPlayersStrip } from '@/components/RoomPlayersStrip'
import {
  bumpUsed,
  everyoneOutOfLives,
  isOutOfLives,
  leftFor,
  nextTurnPlayer,
  parseUsedCounts,
  poolKey,
  teamScore,
} from '@/lib/roomMode'
import { RoomConnecting } from '@/components/RoomConnecting'

const ABSENT_TURN_GRACE_MS = 8000

function GuessFeedback({
  guess,
  nameFor,
  selfId,
}: {
  guess: ElevenLastGuess | null
  nameFor: (id: string) => string
  selfId: string | null
}) {
  return (
    <div className="mt-2 h-6">
      <AnimatePresence mode="wait">
        {guess && (
          <motion.p
            key={guess.seq}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={`text-center text-sm font-bold ${
              guess.kind === 'correct'
                ? 'text-yellow'
                : guess.kind === 'already-found'
                  ? 'text-on-green-soft'
                  : 'text-pink'
            }`}
          >
            {(() => {
              const who = guess.by === selfId ? 'You' : nameFor(guess.by)
              if (guess.kind === 'correct') return `✓ ${who}: ${guess.displayName ?? guess.name}`
              if (guess.kind === 'already-found')
                return `${who}: ${guess.displayName ?? guess.name} already found`
              return `✗ ${who}: "${guess.name}" - not in this lineup, lost a life`
            })()}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Famous11sRoomInner({ roomId }: { roomId: string }) {
  const status = useElevenStatus()
  const self = useElevenSelf()
  const others = useElevenOthers()
  const [, updatePresence] = useElevenMyPresence()
  const [roomError, setRoomError] = useState<string | null>(null)
  const [focusKey, setFocusKey] = useState(0)
  const [justFoundSlotId, setJustFoundSlotId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useElevenErrorListener((err) => {
    setRoomError((err as { message?: string })?.message ?? 'Connection error')
  })

  const phase = useElevenStorage((s) => s.phase)
  const hostPlayerId = useElevenStorage((s) => s.hostPlayerId ?? null)
  const configJson = useElevenStorage((s) => s.configJson)
  const lineupsJson = useElevenStorage((s) => s.lineupsJson)
  const currentLineupIndex = useElevenStorage((s) => s.currentLineupIndex)
  const foundSlotIdsJson = useElevenStorage((s) => s.foundSlotIdsJson)
  const lastGuessJson = useElevenStorage((s) => s.lastGuessJson)
  const livesLostJson = useElevenStorage((s) => s.livesLostJson)
  const currentTurnPlayerId = useElevenStorage((s) => s.currentTurnPlayerId ?? null)
  const playerNames = useElevenStorage((s) => s.playerNames)
  const playerScores = useElevenStorage((s) => s.playerScores)
  const turnDeadline = useElevenStorage((s) => s.turnDeadline)

  // Stable across reconnects, unlike connectionId.
  const myId = self ? playerIdOf(self) : null
  const isHost = myId != null && myId === hostPlayerId
  const config = useMemo(() => parseElevenConfig(configJson ?? '{}'), [configJson])
  const lineups = useMemo(() => parseElevenLineups(lineupsJson ?? '[]'), [lineupsJson])
  const foundSlotIds = useMemo(() => parseStringArray(foundSlotIdsJson ?? '[]'), [foundSlotIdsJson])
  const lastGuess = useMemo(() => parseLastGuess(lastGuessJson ?? ''), [lastGuessJson])
  const currentLineup = lineups[currentLineupIndex ?? 0] ?? null

  const presentIds = useMemo(() => {
    const ids = new Set(others.map(playerIdOf))
    if (myId != null) ids.add(myId)
    return [...ids]
  }, [others, myId])

  const isMyTurn = myId != null && myId === currentTurnPlayerId
  const totalSlots = currentLineup ? lineupTarget(currentLineup, config.includeManager) : 0
  const mode = config.playMode ?? 'versus'
  const livesLost = useMemo(() => parseUsedCounts(livesLostJson), [livesLostJson])
  const cleared = !!currentLineup && foundSlotIds.length >= totalSlots
  const lineupOver =
    !!currentLineup && (cleared || everyoneOutOfLives(mode, livesLost, presentIds, config.lives))
  const livesLeftOf = (id: string) => leftFor(livesLost, poolKey(mode, id), config.lives)
  const myLivesLeft = myId != null ? livesLeftOf(myId) : 0
  const iAmOut = mode === 'versus' && myId != null && myLivesLeft <= 0

  // ── Mutations ──────────────────────────────────────────────────────────────

  // The first player in the room becomes host and seeds the room with the
  // settings they picked on the setup screen, so the lobby shows what will be played.
  const claimHost = useElevenM(
    ({ storage }, { displayName, config }: { displayName: string; config: Famous11sConfig }) => {
      if (myId == null) return
      if (!storage.get('hostPlayerId')) {
        storage.set('hostPlayerId', myId)
        storage.set('configJson', JSON.stringify(config))
      }
      storage.get('playerNames').set(myId, displayName)
      if (!storage.get('playerScores').get(myId)) storage.get('playerScores').set(myId, '0')
    },
    [myId],
  )

  const setPlayerName = useElevenM(
    ({ storage }, displayName: string) => {
      if (myId != null) storage.get('playerNames').set(myId, displayName)
    },
    [myId],
  )

  // Plays the config stored in the room (the host's), never the clicker's local one.
  const startGame = useElevenM(({ storage }, ids: string[]) => {
    const cfg = parseElevenConfig(storage.get('configJson') ?? '{}')
    const seed = randomUUID()
    const picked = cfg.selectedLineupId
      ? (() => {
          const l = getLineupById(cfg.selectedLineupId!)
          return l ? [l] : []
        })()
      : selectLineups(seed, cfg.lineupCount, {
          kind: cfg.kind,
          era: cfg.era,
          difficulty: cfg.difficulty,
        })
    storage.set('seed', seed)
    storage.set('lineupsJson', JSON.stringify(picked))
    storage.set('currentLineupIndex', 0)
    storage.set('foundSlotIdsJson', '[]')
    storage.set('livesLostJson', '{}')
    storage.set('resultsJson', '[]')
    storage.set('lastGuessJson', '')
    storage.set('startedAt', Date.now())
    const ring = [...ids].sort()
    storage.set('turnOrderJson', JSON.stringify(ring))
    storage.set('currentTurnPlayerId', ring[0] ?? null)
    const deadline = cfg.turnSeconds > 0 ? Date.now() + cfg.turnSeconds * 1000 : 0
    storage.set('turnDeadline', deadline)
    storage.set('phase', 'playing')
  }, [])

  const submitTurnGuess = useElevenM(
    ({ storage }, { name, ids }: { name: string; ids: string[] }) => {
      if (myId == null || storage.get('currentTurnPlayerId') !== myId) return

      const lns = parseElevenLineups(storage.get('lineupsJson') ?? '[]')
      const idx = storage.get('currentLineupIndex') ?? 0
      const lineup = lns[idx]
      if (!lineup) return
      const found = parseStringArray(storage.get('foundSlotIdsJson') ?? '[]')
      const cfg = parseElevenConfig(storage.get('configJson') ?? '{}')
      const target = lineupTarget(lineup, cfg.includeManager)
      const roomMode = cfg.playMode ?? 'versus'
      let lost = parseUsedCounts(storage.get('livesLostJson'))
      if (found.length >= target || isOutOfLives(roomMode, lost, myId, cfg.lives)) return

      const outcome = matchSlot(name, lineup, found, cfg.includeManager)
      const connId = myId

      if (outcome.kind === 'correct') {
        const nextFound = [...found, outcome.slotId]
        storage.set('foundSlotIdsJson', JSON.stringify(nextFound))
        const clearedNow = nextFound.length >= target
        const prev = Number(storage.get('playerScores').get(connId) ?? '0')
        storage
          .get('playerScores')
          .set(connId, String(prev + POINTS_PER_SLOT + (clearedNow ? CLEAR_BONUS : 0)))
      } else if (outcome.kind === 'wrong') {
        lost = bumpUsed(lost, poolKey(roomMode, myId))
        storage.set('livesLostJson', JSON.stringify(lost))
        // Versus floors a player's score at 0. In co-op the penalty lands on the
        // guesser's contribution uncapped, so it always comes off the team total.
        if (cfg.penaltyOnMiss) {
          const prev = Number(storage.get('playerScores').get(connId) ?? '0')
          const next = prev - MISS_PENALTY
          storage
            .get('playerScores')
            .set(connId, String(roomMode === 'coop' ? next : Math.max(0, next)))
        }
      }

      const prevSeq = parseLastGuess(storage.get('lastGuessJson') ?? '')?.seq ?? 0
      storage.set(
        'lastGuessJson',
        JSON.stringify({
          seq: prevSeq + 1,
          by: myId,
          name,
          kind: outcome.kind,
          slotId: outcome.kind !== 'wrong' ? outcome.slotId : undefined,
          displayName: outcome.kind !== 'wrong' ? outcome.name : undefined,
        } satisfies ElevenLastGuess),
      )

      // Players out of lives (versus) are skipped.
      if (outcome.kind !== 'already-found') {
        storage.set(
          'currentTurnPlayerId',
          nextTurnPlayer(myId, ids, (id) => !isOutOfLives(roomMode, lost, id, cfg.lives)),
        )
        const deadline = cfg.turnSeconds > 0 ? Date.now() + cfg.turnSeconds * 1000 : 0
        storage.set('turnDeadline', deadline)
      }
    },
    [myId],
  )

  // Every client watches the timer, so only act on the deadline that actually
  // expired - otherwise one timeout could cost several lives.
  const skipTurn = useElevenM(
    ({ storage }, { ids, deadline }: { ids: string[]; deadline: number }) => {
      const current = storage.get('currentTurnPlayerId')
      if (current == null || storage.get('turnDeadline') !== deadline) return
      const found = parseStringArray(storage.get('foundSlotIdsJson') ?? '[]')
      const cfg = parseElevenConfig(storage.get('configJson') ?? '{}')
      const roomMode = cfg.playMode ?? 'versus'
      const lost = bumpUsed(
        parseUsedCounts(storage.get('livesLostJson')),
        poolKey(roomMode, current),
      )
      storage.set('livesLostJson', JSON.stringify(lost))
      const prevSeq = parseLastGuess(storage.get('lastGuessJson') ?? '')?.seq ?? 0
      const name = storage.get('playerNames').get(current) ?? 'Player'
      storage.set(
        'lastGuessJson',
        JSON.stringify({
          seq: prevSeq + 1,
          by: current,
          name: `[${name} timed out]`,
          kind: 'wrong',
        } satisfies ElevenLastGuess),
      )
      // Check if lineup is now over
      const lns = parseElevenLineups(storage.get('lineupsJson') ?? '[]')
      const idx = storage.get('currentLineupIndex') ?? 0
      const lineup = lns[idx]
      if (!lineup) return
      const target = lineupTarget(lineup, cfg.includeManager)
      const canPlay = (id: string) => !isOutOfLives(roomMode, lost, id, cfg.lives)
      const over = found.length >= target || everyoneOutOfLives(roomMode, lost, ids, cfg.lives)
      storage.set('currentTurnPlayerId', over ? current : nextTurnPlayer(current, ids, canPlay))
      storage.set('turnDeadline', cfg.turnSeconds > 0 ? Date.now() + cfg.turnSeconds * 1000 : 0)
    },
    [],
  )

  // Only passes the turn if its holder is still missing (or out of lives) when this runs.
  const passStuckTurn = useElevenM(({ storage }, ids: string[]) => {
    const cfg = parseElevenConfig(storage.get('configJson') ?? '{}')
    const lost = parseUsedCounts(storage.get('livesLostJson'))
    const canPlay = (id: string) => !isOutOfLives(cfg.playMode ?? 'versus', lost, id, cfg.lives)
    const current = storage.get('currentTurnPlayerId')
    if (current != null && ids.includes(current) && canPlay(current)) return
    storage.set('currentTurnPlayerId', nextTurnPlayer(current, ids, canPlay))
    storage.set('turnDeadline', cfg.turnSeconds > 0 ? Date.now() + cfg.turnSeconds * 1000 : 0)
  }, [])

  const advanceLineupRoom = useElevenM(({ storage }) => {
    const lns = parseElevenLineups(storage.get('lineupsJson') ?? '[]')
    const idx = storage.get('currentLineupIndex') ?? 0
    const lineup = lns[idx]
    if (!lineup) return
    const cfg = parseElevenConfig(storage.get('configJson') ?? '{}')
    const found = parseStringArray(storage.get('foundSlotIdsJson') ?? '[]')
    const target = lineupTarget(lineup, cfg.includeManager)

    const results = (() => {
      try {
        return JSON.parse(storage.get('resultsJson') ?? '[]') as unknown[]
      } catch {
        return []
      }
    })()
    results.push({
      lineupId: lineup.id,
      title: lineup.title,
      foundSlotIds: found,
      slotsTotal: target,
      managerFound: found.includes('manager'),
      livesUsed: Object.values(parseUsedCounts(storage.get('livesLostJson'))).reduce(
        (a, b) => a + b,
        0,
      ),
      cleared: found.length >= target,
    })
    storage.set('resultsJson', JSON.stringify(results))

    const nextIdx = idx + 1
    if (nextIdx >= lns.length) {
      storage.set('phase', 'finished')
      return
    }
    storage.set('currentLineupIndex', nextIdx)
    storage.set('foundSlotIdsJson', '[]')
    storage.set('livesLostJson', '{}')
    storage.set('lastGuessJson', '')
    const deadline = cfg.turnSeconds > 0 ? Date.now() + cfg.turnSeconds * 1000 : 0
    storage.set('turnDeadline', deadline)
  }, [])

  // ── Turn timer watch (any client) ─────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' || !turnDeadline || turnDeadline === 0) return
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      if (Date.now() > turnDeadline && !lineupOver) {
        skipTurn({ ids: presentIds, deadline: turnDeadline })
      }
    }, 500)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnDeadline, phase, lineupOver])

  // ── Absent turn-holder: pass the turn after a grace period ──────────────
  // Only the lowest present id acts, so clients don't race each other.

  const turnHolderAbsent =
    phase === 'playing' &&
    !lineupOver &&
    presentIds.length > 0 &&
    (currentTurnPlayerId == null || !presentIds.includes(currentTurnPlayerId))
  // Holder out of lives (versus) - skipped straight away rather than after the grace period.
  const turnHolderOut =
    phase === 'playing' &&
    !lineupOver &&
    currentTurnPlayerId != null &&
    isOutOfLives(mode, livesLost, currentTurnPlayerId, config.lives)
  const iAmTurnJanitor = myId != null && [...presentIds].sort()[0] === myId

  useEffect(() => {
    if ((!turnHolderAbsent && !turnHolderOut) || !iAmTurnJanitor) return
    const t = window.setTimeout(
      () => passStuckTurn(presentIds),
      turnHolderOut ? 0 : ABSENT_TURN_GRACE_MS,
    )
    return () => window.clearTimeout(t)
  }, [turnHolderAbsent, turnHolderOut, iAmTurnJanitor, presentIds, passStuckTurn])

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase == null || myId == null) return
    // Keep the name already shown in the room; the stored one can be stale when
    // another tab in this browser renamed itself.
    const displayName = self?.presence.displayName || getTabDisplayName()
    if (phase === 'lobby') claimHost({ displayName, config: loadFamous11sConfig() })
    else setPlayerName(displayName)
    updatePresence({ displayName })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'lobby', phase == null, myId])

  useEffect(() => {
    setFocusKey((k) => k + 1)
  }, [currentTurnPlayerId, currentLineupIndex])

  const handleRename = useCallback(
    (name: string) => {
      const trimmed = name.trim() || 'Player'
      setPlayerName(trimmed)
      updatePresence({ displayName: trimmed })
      saveTabDisplayName(trimmed)
    },
    [setPlayerName, updatePresence],
  )

  const handleGuess = useCallback(
    (name: string) => {
      if (!isMyTurn || lineupOver) return
      submitTurnGuess({ name, ids: presentIds })
      if (lastGuess?.kind === 'correct') {
        setJustFoundSlotId(lastGuess.slotId ?? null)
        window.setTimeout(() => setJustFoundSlotId(null), 900)
      }
    },
    [isMyTurn, lineupOver, submitTurnGuess, presentIds, lastGuess],
  )

  // ── Render ────────────────────────────────────────────────────────────────

  if (roomError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="panel max-w-lg border-2 border-red/40 p-6 text-sm font-semibold text-red">
          {roomError}
        </div>
      </div>
    )
  }

  if (status === 'connecting' || status === 'reconnecting' || phase == null) {
    return (
      <RoomConnecting
        mode="famous11s"
        state={status === 'reconnecting' ? 'reconnecting' : 'connecting'}
      />
    )
  }

  // One entry per player id (the same user may have several tabs/connections).
  const players = [
    ...(self ? [{ id: playerIdOf(self), name: self.presence.displayName }] : []),
    ...others.map((o) => ({ id: playerIdOf(o), name: o.presence.displayName })),
  ]
    .filter((p) => p.name)
    .filter((p, i, arr) => arr.findIndex((q) => q.id === p.id) === i)

  if (phase === 'lobby') {
    return (
      <Famous11sLobby
        roomId={roomId}
        players={players.map((p) => ({
          id: p.id,
          displayName: p.name,
          isHost: p.id === hostPlayerId,
          isSelf: p.id === myId,
        }))}
        isHost={isHost}
        config={config}
        onStart={() => startGame(presentIds)}
        myName={self?.presence.displayName ?? ''}
        onRename={handleRename}
      />
    )
  }

  const nameFor = (id: string) => playerNames?.get(id) ?? 'Player'
  const scoreFor = (id: string) => Number(playerScores?.get(id) ?? '0')

  if (phase === 'finished') {
    return (
      <RoomResults
        mode={mode}
        entries={players.map((p) => ({
          id: p.id,
          name: nameFor(p.id),
          score: scoreFor(p.id),
          isMe: p.id === myId,
        }))}
        newRoomHref="/famous-11s/setup?mode=multiplayer"
        eyebrowClass="eyebrow-yellow"
      />
    )
  }

  if (!currentLineup) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted animate-pulse-soft">
        Loading lineup…
      </div>
    )
  }

  const turnName = currentTurnPlayerId != null ? nameFor(currentTurnPlayerId) : '-'
  const stripPlayers = players.map((p) => ({
    id: p.id,
    name: nameFor(p.id),
    score: scoreFor(p.id),
    livesLeft: livesLeftOf(p.id),
    isMe: p.id === myId,
    isTurn: p.id === currentTurnPlayerId,
  }))
  const timerSeconds =
    config.turnSeconds > 0 && turnDeadline && turnDeadline > 0
      ? Math.max(0, Math.round((turnDeadline - Date.now()) / 1000))
      : undefined

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col px-4 py-6 md:px-8">
      {/* HUD */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow eyebrow-yellow">
              Lineup {(currentLineupIndex ?? 0) + 1} of {lineups.length} · {currentLineup.formation}
            </span>
            <h1 className="mt-2 font-display text-[26px] font-black uppercase leading-[0.92] text-on-green md:text-[32px]">
              {currentLineup.title}
            </h1>
            <p className="mt-1 text-[12px] font-semibold text-on-green-soft">
              {currentLineup.prompt}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <LivesRow livesLeft={myLivesLeft} maxLives={config.lives} />
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-on-green-dim">
              {mode === 'coop' ? 'Team lives' : 'Your lives'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span
            className={`inline-flex items-center rounded-full px-4 py-2 text-[13px] font-extrabold uppercase tracking-[0.06em] ${
              isMyTurn ? 'bg-yellow text-ink' : 'bg-black/25 text-on-green-soft'
            }`}
          >
            {isMyTurn ? 'Your turn' : `${turnName}'s turn`}
          </span>
          <div className="flex items-center gap-3">
            {timerSeconds !== undefined && (
              <span
                className={`font-mono text-[13px] font-bold tabular-nums ${timerSeconds <= 5 ? 'animate-pulse text-pink' : 'text-on-green-dim'}`}
              >
                {timerSeconds}s
              </span>
            )}
            <span className="font-display text-lg font-black uppercase leading-none text-on-green tabular-nums">
              {foundSlotIds.length}/{totalSlots}
            </span>
          </div>
        </div>
        <RoomPlayersStrip
          mode={mode}
          players={stripPlayers}
          teamTotal={teamScore(stripPlayers.map((p) => p.score))}
        />
      </div>

      {/* Input */}
      <div className="mb-4 min-h-[88px]">
        {lineupOver ? (
          <div className="flex flex-col items-center gap-3 rounded-[12px] bg-black/20 px-4 py-4 text-center">
            <p className="font-display text-2xl font-black uppercase leading-none text-on-green">
              {cleared ? '🎉 Full XI!' : mode === 'coop' ? '💔 Out of lives' : "💔 Everyone's out"}
            </p>
            {isHost ? (
              <button onClick={() => advanceLineupRoom()} className="btn btn-primary btn-lg">
                {(currentLineupIndex ?? 0) + 1 >= lineups.length ? 'See results' : 'Next lineup'}
              </button>
            ) : (
              <p className="text-sm font-semibold text-on-green-soft animate-pulse-soft">
                Waiting for the gaffer…
              </p>
            )}
          </div>
        ) : isMyTurn ? (
          <>
            <Famous11sAutocomplete
              onGuess={handleGuess}
              focusKey={focusKey}
              placeholder="Name a player…"
            />
            <GuessFeedback guess={lastGuess} nameFor={nameFor} selfId={myId} />
          </>
        ) : (
          <>
            <p className="py-4 text-center text-sm font-semibold text-on-green-soft animate-pulse-soft">
              {iAmOut
                ? `You're out of lives this lineup - ${turnName} is naming one…`
                : `${turnName} is naming one…`}
            </p>
            <GuessFeedback guess={lastGuess} nameFor={nameFor} selfId={myId} />
          </>
        )}
      </div>

      <PitchBoard
        lineup={currentLineup}
        foundSlotIds={foundSlotIds}
        revealMissed={lineupOver}
        justFoundSlotId={justFoundSlotId}
        includeManager={config.includeManager}
      />
    </div>
  )
}

export function Famous11sRoomGame({ roomId }: { roomId: string }) {
  return (
    <ElevenRoomProvider
      id={roomId}
      initialPresence={() => ({ displayName: '', playerId: getTabPlayerId() })}
      initialStorage={createInitialElevenStorage}
    >
      <Famous11sRoomInner roomId={roomId} />
    </ElevenRoomProvider>
  )
}
