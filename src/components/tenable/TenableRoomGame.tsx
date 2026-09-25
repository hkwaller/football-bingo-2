'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  TenableRoomProvider,
  useTenableStorage,
  useTenableM,
  useTenableOthers,
  useTenableMyPresence,
  useTenableStatus,
  useTenableErrorListener,
  useTenableSelf,
  createInitialTenableStorage,
  parseTenableConfig,
  parseTenableQuestions,
  parseNumberArray,
  parseLastGuess,
  parseHints,
  type TenableLastGuess,
} from '@/lib/tenable/liveblocksTenable'
import { loadTenableConfig } from '@/lib/tenable/tenableStorage'
import {
  getTabDisplayName,
  getTabPlayerId,
  roomPlayerIdOf as playerIdOf,
  saveTabDisplayName,
} from '@/lib/roomPlayer'
import { selectTenableQuestions, tenableTarget } from '@/data/tenable'
import { foundAnswerNames, matchAnswer } from '@/lib/tenable/matching'
import { CLEAR_BONUS, pointsFor, type TenableConfig, type TenableHint } from '@/lib/tenable/types'
import { randomUUID } from '@/lib/randomUUID'
import { TenableLobby } from './TenableLobby'
import { TenableBoard } from './TenableBoard'
import { NameAutocomplete } from './NameAutocomplete'
import { TenableHints, fetchTenableHint } from './TenableHints'
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

/** How long a missing turn-holder gets to reconnect before the turn moves on. */
const ABSENT_TURN_GRACE_MS = 8000

/** Shared feedback line for the most recent guess - visible to every player. */
function GuessFeedback({
  guess,
  nameFor,
  selfId,
}: {
  guess: TenableLastGuess | null
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
              if (guess.kind === 'correct') return `✓ ${who}: ${guess.answer ?? guess.name}`
              if (guess.kind === 'already-found')
                return `${who}: ${guess.answer ?? guess.name} was already found`
              return `✗ ${who}: "${guess.name}" - not on the list, lost a life`
            })()}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function TenableRoomInner({ roomId }: { roomId: string }) {
  const status = useTenableStatus()
  const self = useTenableSelf()
  const others = useTenableOthers()
  const [, updatePresence] = useTenableMyPresence()
  const [roomError, setRoomError] = useState<string | null>(null)
  const [focusKey, setFocusKey] = useState(0)

  useTenableErrorListener((err) => {
    setRoomError((err as { message?: string })?.message ?? 'Connection error')
  })

  const phase = useTenableStorage((s) => s.phase)
  const hostPlayerId = useTenableStorage((s) => s.hostPlayerId ?? null)
  const configJson = useTenableStorage((s) => s.configJson)
  const questionsJson = useTenableStorage((s) => s.questionsJson)
  const currentQuestionIndex = useTenableStorage((s) => s.currentQuestionIndex)
  const foundRanksJson = useTenableStorage((s) => s.foundRanksJson)
  const lastGuessJson = useTenableStorage((s) => s.lastGuessJson)
  const livesLostJson = useTenableStorage((s) => s.livesLostJson)
  const hintsUsedJson = useTenableStorage((s) => s.hintsUsedJson)
  const hintsJson = useTenableStorage((s) => s.hintsJson)
  const currentTurnPlayerId = useTenableStorage((s) => s.currentTurnPlayerId ?? null)
  const playerNames = useTenableStorage((s) => s.playerNames)
  const playerScores = useTenableStorage((s) => s.playerScores)

  // Stable across reconnects, unlike connectionId.
  const myId = self ? playerIdOf(self) : null
  const isHost = myId != null && myId === hostPlayerId
  const config = useMemo(() => parseTenableConfig(configJson ?? '{}'), [configJson])
  const questions = useMemo(() => parseTenableQuestions(questionsJson ?? '[]'), [questionsJson])
  const foundRanks = useMemo(() => parseNumberArray(foundRanksJson ?? '[]'), [foundRanksJson])
  const lastGuess = useMemo(() => parseLastGuess(lastGuessJson ?? ''), [lastGuessJson])
  const hints = useMemo(() => parseHints(hintsJson ?? '[]'), [hintsJson])
  const mode = config.playMode ?? 'versus'
  const livesLost = useMemo(() => parseUsedCounts(livesLostJson), [livesLostJson])
  const hintsUsed = useMemo(() => parseUsedCounts(hintsUsedJson), [hintsUsedJson])
  const currentQuestion = questions[currentQuestionIndex ?? 0] ?? null
  const foundNames = useMemo(
    () => foundAnswerNames(currentQuestion, foundRanks),
    [currentQuestion, foundRanks],
  )

  const presentIds = useMemo(() => {
    const ids = new Set(others.map(playerIdOf))
    if (myId != null) ids.add(myId)
    return [...ids]
  }, [others, myId])

  const isMyTurn = myId != null && myId === currentTurnPlayerId
  const cleared = !!currentQuestion && foundRanks.length >= tenableTarget(currentQuestion)
  const questionOver =
    !!currentQuestion && (cleared || everyoneOutOfLives(mode, livesLost, presentIds, config.lives))
  const livesLeftOf = (id: string) => leftFor(livesLost, poolKey(mode, id), config.lives)
  const myLivesLeft = myId != null ? livesLeftOf(myId) : 0
  const myHintsLeft = myId != null ? leftFor(hintsUsed, poolKey(mode, myId), config.hints) : 0
  const iAmOut = mode === 'versus' && myId != null && myLivesLeft <= 0

  // ── Mutations ───────────────────────────────────────────────────────────────

  // The first player in the room becomes host and seeds the room with the
  // settings they picked on the setup screen. Everyone else only registers a name.
  const claimHost = useTenableM(
    ({ storage }, { displayName, config }: { displayName: string; config: TenableConfig }) => {
      if (myId == null) return
      if (storage.get('hostPlayerId') == null) {
        storage.set('hostPlayerId', myId)
        storage.set('configJson', JSON.stringify(config))
      }
      storage.get('playerNames').set(myId, displayName)
      if (!storage.get('playerScores').get(myId)) storage.get('playerScores').set(myId, '0')
    },
    [myId],
  )

  const setPlayerName = useTenableM(
    ({ storage }, displayName: string) => {
      if (myId != null) storage.get('playerNames').set(myId, displayName)
    },
    [myId],
  )

  // Plays the config stored in the room (the host's), never the clicker's local one.
  const startGame = useTenableM(({ storage }, ids: string[]) => {
    const cfg = parseTenableConfig(storage.get('configJson') ?? '{}')
    const seed = randomUUID()
    const qs = selectTenableQuestions(seed, cfg.questionCount, {
      groups: cfg.groups === 'all' ? undefined : cfg.groups,
      difficulty: cfg.difficulty,
      selectedId: cfg.selectedQuestionId,
    })
    storage.set('seed', seed)
    storage.set('questionsJson', JSON.stringify(qs))
    storage.set('currentQuestionIndex', 0)
    storage.set('foundRanksJson', '[]')
    storage.set('livesLostJson', '{}')
    storage.set('hintsUsedJson', '{}')
    storage.set('hintsJson', '[]')
    storage.set('resultsJson', '[]')
    storage.set('lastGuessJson', '')
    storage.set('startedAt', Date.now())
    const ring = [...ids].sort()
    storage.set('turnOrderJson', JSON.stringify(ring))
    storage.set('currentTurnPlayerId', ring[0] ?? null)
    storage.set('phase', 'playing')
  }, [])

  const submitTurnGuess = useTenableM(
    ({ storage }, { name, ids }: { name: string; ids: string[] }) => {
      if (myId == null || storage.get('currentTurnPlayerId') !== myId) return
      const qs = parseTenableQuestions(storage.get('questionsJson') ?? '[]')
      const idx = storage.get('currentQuestionIndex') ?? 0
      const q = qs[idx]
      if (!q) return
      const found = parseNumberArray(storage.get('foundRanksJson') ?? '[]')
      const cfg = parseTenableConfig(storage.get('configJson') ?? '{}')
      const roomMode = cfg.playMode ?? 'versus'
      let lost = parseUsedCounts(storage.get('livesLostJson'))
      if (found.length >= tenableTarget(q) || isOutOfLives(roomMode, lost, myId, cfg.lives)) return

      const outcome = matchAnswer(name, q, found)

      if (outcome.kind === 'correct') {
        const nextFound = [...found, outcome.rank]
        storage.set('foundRanksJson', JSON.stringify(nextFound))
        const clearedNow = nextFound.length >= tenableTarget(q)
        const prev = Number(storage.get('playerScores').get(myId) ?? '0')
        const points = pointsFor(outcome.rank, parseHints(storage.get('hintsJson') ?? '[]'))
        storage
          .get('playerScores')
          .set(myId, String(prev + points + (clearedNow ? CLEAR_BONUS : 0)))
      } else if (outcome.kind === 'wrong') {
        lost = bumpUsed(lost, poolKey(roomMode, myId))
        storage.set('livesLostJson', JSON.stringify(lost))
      }

      // Broadcast the outcome so every player sees what was guessed - especially
      // wrong guesses, which otherwise leave no trace beyond a lost life.
      const prevSeq = parseLastGuess(storage.get('lastGuessJson') ?? '')?.seq ?? 0
      storage.set(
        'lastGuessJson',
        JSON.stringify({
          seq: prevSeq + 1,
          by: myId,
          name,
          kind: outcome.kind,
          answer: outcome.kind !== 'wrong' ? outcome.name : undefined,
        }),
      )

      // Pass the turn on every real guess (correct or wrong); duplicates don't advance.
      // Players out of lives (versus) are skipped.
      if (outcome.kind !== 'already-found') {
        storage.set(
          'currentTurnPlayerId',
          nextTurnPlayer(myId, ids, (id) => !isOutOfLives(roomMode, lost, id, cfg.lives)),
        )
      }
    },
    [myId],
  )

  // Hints come from the server, so the mutation only records one already drawn.
  // Using a hint doesn't pass the turn.
  const addHint = useTenableM(
    ({ storage }, { questionId, hint }: { questionId: string; hint: TenableHint }) => {
      if (myId == null || storage.get('currentTurnPlayerId') !== myId) return
      const qs = parseTenableQuestions(storage.get('questionsJson') ?? '[]')
      const q = qs[storage.get('currentQuestionIndex') ?? 0]
      if (!q || q.id !== questionId) return
      const cfg = parseTenableConfig(storage.get('configJson') ?? '{}')
      const key = poolKey(cfg.playMode ?? 'versus', myId)
      const used = parseUsedCounts(storage.get('hintsUsedJson'))
      const found = parseNumberArray(storage.get('foundRanksJson') ?? '[]')
      const taken = parseHints(storage.get('hintsJson') ?? '[]')
      if (
        leftFor(used, key, cfg.hints) <= 0 ||
        found.includes(hint.rank) ||
        taken.some((h) => h.rank === hint.rank)
      )
        return
      storage.set('hintsUsedJson', JSON.stringify(bumpUsed(used, key)))
      storage.set('hintsJson', JSON.stringify([...taken, { ...hint, by: myId }]))
    },
    [myId],
  )

  // Only passes the turn if its holder is still missing (or out of lives) when this runs.
  const passStuckTurn = useTenableM(({ storage }, ids: string[]) => {
    const cfg = parseTenableConfig(storage.get('configJson') ?? '{}')
    const lost = parseUsedCounts(storage.get('livesLostJson'))
    const canPlay = (id: string) => !isOutOfLives(cfg.playMode ?? 'versus', lost, id, cfg.lives)
    const current = storage.get('currentTurnPlayerId')
    if (current != null && ids.includes(current) && canPlay(current)) return
    storage.set('currentTurnPlayerId', nextTurnPlayer(current, ids, canPlay))
  }, [])

  const advanceCategory = useTenableM(({ storage }) => {
    const qs = parseTenableQuestions(storage.get('questionsJson') ?? '[]')
    const idx = storage.get('currentQuestionIndex') ?? 0
    const q = qs[idx]
    if (!q) return
    const found = parseNumberArray(storage.get('foundRanksJson') ?? '[]')
    const results = (() => {
      try {
        return JSON.parse(storage.get('resultsJson') ?? '[]') as unknown[]
      } catch {
        return []
      }
    })()
    results.push({
      questionId: q.id,
      category: q.category,
      foundRanks: found,
      livesUsed: Object.values(parseUsedCounts(storage.get('livesLostJson'))).reduce(
        (a, b) => a + b,
        0,
      ),
      cleared: found.length >= tenableTarget(q),
      hintsUsed: parseHints(storage.get('hintsJson') ?? '[]').length,
    })
    storage.set('resultsJson', JSON.stringify(results))

    const nextIdx = idx + 1
    if (nextIdx >= qs.length) {
      storage.set('phase', 'finished')
      return
    }
    // Lives reset every category; hints last the whole game.
    storage.set('currentQuestionIndex', nextIdx)
    storage.set('foundRanksJson', '[]')
    storage.set('livesLostJson', '{}')
    storage.set('hintsJson', '[]')
    storage.set('lastGuessJson', '')
  }, [])

  // ── Stuck turn: holder left, or is out of lives ─────────────────────────
  // Only the lowest present id acts, so clients don't race each other. A missing
  // holder gets a grace period to reconnect; one out of lives is skipped at once.

  const turnHolderAbsent =
    phase === 'playing' &&
    !questionOver &&
    presentIds.length > 0 &&
    (currentTurnPlayerId == null || !presentIds.includes(currentTurnPlayerId))
  const turnHolderOut =
    phase === 'playing' &&
    !questionOver &&
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
  // Gated on storage (phase) and self (myId) both being ready, so the first
  // player in the room reliably claims host.
  useEffect(() => {
    if (phase == null || myId == null) return
    // Keep the name already shown in the room; the stored one can be stale when
    // another tab in this browser renamed itself.
    const displayName = self?.presence.displayName || getTabDisplayName()
    if (phase === 'lobby') claimHost({ displayName, config: loadTenableConfig() })
    else setPlayerName(displayName)
    updatePresence({ displayName })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'lobby', phase == null, myId])

  const handleRename = useCallback(
    (name: string) => {
      const trimmed = name.trim() || 'Player'
      setPlayerName(trimmed)
      updatePresence({ displayName: trimmed })
      saveTabDisplayName(trimmed)
    },
    [setPlayerName, updatePresence],
  )

  useEffect(() => {
    setFocusKey((k) => k + 1)
  }, [currentTurnPlayerId, currentQuestionIndex])

  const handleGuess = useCallback(
    (name: string) => {
      if (!isMyTurn || questionOver) return
      submitTurnGuess({ name, ids: presentIds })
    },
    [isMyTurn, questionOver, submitTurnGuess, presentIds],
  )

  const handleHint = useCallback(async () => {
    if (!isMyTurn || questionOver || !currentQuestion) return 'failed' as const
    const exclude = [...foundRanks, ...hints.map((h) => h.rank)]
    const hint = await fetchTenableHint(currentQuestion.id, exclude)
    if (typeof hint === 'string') return hint
    addHint({ questionId: currentQuestion.id, hint })
    setFocusKey((k) => k + 1)
    return 'ok' as const
  }, [isMyTurn, questionOver, currentQuestion, foundRanks, hints, addHint])

  // ── Render ──────────────────────────────────────────────────────────────────

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
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted animate-pulse-soft">
        Connecting…
      </div>
    )
  }

  // One entry per player id (the same player may briefly hold several connections).
  const players = [
    ...(self ? [{ id: playerIdOf(self), name: self.presence.displayName }] : []),
    ...others.map((o) => ({ id: playerIdOf(o), name: o.presence.displayName })),
  ]
    .filter((p) => p.name)
    .filter((p, i, arr) => arr.findIndex((q) => q.id === p.id) === i)

  if (phase === 'lobby') {
    return (
      <TenableLobby
        roomId={roomId}
        players={players.map((p) => ({
          id: p.id,
          displayName: p.name,
          isHost: p.id === hostPlayerId,
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
        newRoomHref="/tenable/setup?mode=multiplayer"
      />
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted animate-pulse-soft">
        Loading category…
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

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col px-6 py-8 md:px-9">
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow eyebrow-sky">
              Category {(currentQuestionIndex ?? 0) + 1} of {questions.length}
            </span>
            <h1 className="mt-2 font-display text-[32px] font-black uppercase leading-[0.92] text-on-green md:text-[40px]">
              {currentQuestion.category}
            </h1>
            <p className="mt-1.5 text-sm font-semibold text-on-green-soft">
              {currentQuestion.prompt}
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
          <span className="font-display text-lg font-black uppercase leading-none text-on-green tabular-nums">
            {foundRanks.length}/{tenableTarget(currentQuestion)}
          </span>
        </div>
        <RoomPlayersStrip
          mode={mode}
          players={stripPlayers}
          teamTotal={teamScore(stripPlayers.map((p) => p.score))}
        />
      </div>

      <div className="mb-4 min-h-[92px]">
        {questionOver ? (
          <div className="flex flex-col items-center gap-3 rounded-[12px] bg-black/20 px-4 py-4 text-center">
            <p className="font-display text-2xl font-black uppercase leading-none text-on-green">
              {cleared ? '🎉 All ten!' : mode === 'coop' ? '💔 Out of lives' : "💔 Everyone's out"}
            </p>
            {isHost ? (
              <button onClick={() => advanceCategory()} className="btn btn-primary btn-lg">
                {(currentQuestionIndex ?? 0) + 1 >= questions.length
                  ? 'See results'
                  : 'Next category'}
              </button>
            ) : (
              <p className="text-sm font-semibold text-on-green-soft animate-pulse-soft">
                Waiting for the gaffer…
              </p>
            )}
          </div>
        ) : isMyTurn ? (
          <>
            <NameAutocomplete
              onGuess={handleGuess}
              focusKey={focusKey}
              placeholder="Name one…"
              exclude={foundNames}
              resetKey={currentQuestionIndex ?? 0}
            />
            <GuessFeedback guess={lastGuess} nameFor={nameFor} selfId={myId} />
          </>
        ) : (
          <>
            <p className="py-4 text-center text-sm font-semibold text-on-green-soft animate-pulse-soft">
              {iAmOut
                ? `You're out of lives this category - ${turnName} is naming one…`
                : `${turnName} is naming one…`}
            </p>
            <GuessFeedback guess={lastGuess} nameFor={nameFor} selfId={myId} />
          </>
        )}
      </div>

      {!questionOver && (
        <TenableHints
          key={currentQuestion.id}
          hints={hints}
          foundRanks={foundRanks}
          hintsLeft={myHintsLeft}
          onRequest={handleHint}
          canRequest={isMyTurn}
          byLabel={(id) => (id === myId ? 'you' : nameFor(id))}
        />
      )}

      <TenableBoard
        question={currentQuestion}
        foundRanks={foundRanks}
        revealMissed={questionOver}
      />
    </div>
  )
}

export function TenableRoomGame({ roomId }: { roomId: string }) {
  return (
    <TenableRoomProvider
      id={roomId}
      initialPresence={() => ({ displayName: '', playerId: getTabPlayerId() })}
      initialStorage={createInitialTenableStorage}
    >
      <TenableRoomInner roomId={roomId} />
    </TenableRoomProvider>
  )
}
