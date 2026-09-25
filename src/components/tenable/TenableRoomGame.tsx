'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
import { selectTenableQuestions, tenableTarget } from '@/data/tenable'
import { foundAnswerNames, matchAnswer } from '@/lib/tenable/matching'
import { CLEAR_BONUS, pointsFor, type TenableHint } from '@/lib/tenable/types'
import { randomUUID } from '@/lib/randomUUID'
import { TenableLobby } from './TenableLobby'
import { TenableBoard } from './TenableBoard'
import { NameAutocomplete } from './NameAutocomplete'
import { TenableHints, fetchTenableHint } from './TenableHints'
import { LivesRow } from '@/components/LivesRow'

/** Next connection id in the sorted ring of currently-present players. */
function nextTurn(current: number | null, presentIds: number[]): number | null {
  if (!presentIds.length) return null
  const ring = [...presentIds].sort((a, b) => a - b)
  if (current === null) return ring[0]
  const i = ring.indexOf(current)
  if (i === -1) return ring[0]
  return ring[(i + 1) % ring.length]
}

/** Shared feedback line for the most recent guess - visible to every player. */
function GuessFeedback({
  guess,
  nameFor,
  selfId,
}: {
  guess: TenableLastGuess | null
  nameFor: (connId: number) => string
  selfId: number | null
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
  const hostConnectionId = useTenableStorage((s) => s.hostConnectionId)
  const configJson = useTenableStorage((s) => s.configJson)
  const questionsJson = useTenableStorage((s) => s.questionsJson)
  const currentQuestionIndex = useTenableStorage((s) => s.currentQuestionIndex)
  const foundRanksJson = useTenableStorage((s) => s.foundRanksJson)
  const lastGuessJson = useTenableStorage((s) => s.lastGuessJson)
  const livesLeft = useTenableStorage((s) => s.livesLeft)
  const hintsLeft = useTenableStorage((s) => s.hintsLeft)
  const hintsJson = useTenableStorage((s) => s.hintsJson)
  const currentTurnConnectionId = useTenableStorage((s) => s.currentTurnConnectionId)
  const playerNames = useTenableStorage((s) => s.playerNames)
  const playerScores = useTenableStorage((s) => s.playerScores)

  const isHost = self?.connectionId === hostConnectionId
  const config = useMemo(() => parseTenableConfig(configJson ?? '{}'), [configJson])
  const questions = useMemo(() => parseTenableQuestions(questionsJson ?? '[]'), [questionsJson])
  const foundRanks = useMemo(() => parseNumberArray(foundRanksJson ?? '[]'), [foundRanksJson])
  const lastGuess = useMemo(() => parseLastGuess(lastGuessJson ?? ''), [lastGuessJson])
  const hints = useMemo(() => parseHints(hintsJson ?? '[]'), [hintsJson])
  const currentQuestion = questions[currentQuestionIndex ?? 0] ?? null
  const foundNames = useMemo(
    () => foundAnswerNames(currentQuestion, foundRanks),
    [currentQuestion, foundRanks],
  )

  const presentIds = useMemo(() => {
    const ids = others.map((o) => o.connectionId)
    if (self?.connectionId != null) ids.push(self.connectionId)
    return ids
  }, [others, self?.connectionId])

  const isMyTurn = self?.connectionId != null && self.connectionId === currentTurnConnectionId
  const questionOver =
    !!currentQuestion &&
    (foundRanks.length >= tenableTarget(currentQuestion) || (livesLeft ?? 0) <= 0)
  const cleared = !!currentQuestion && foundRanks.length >= tenableTarget(currentQuestion)

  // ── Mutations ───────────────────────────────────────────────────────────────

  const claimHost = useTenableM(
    ({ storage }, displayName: string) => {
      if (!storage.get('hostConnectionId') && self?.connectionId != null) {
        storage.set('hostConnectionId', self.connectionId)
      }
      if (self?.connectionId != null) {
        storage.get('playerNames').set(String(self.connectionId), displayName)
        if (!storage.get('playerScores').get(String(self.connectionId))) {
          storage.get('playerScores').set(String(self.connectionId), '0')
        }
      }
    },
    [self?.connectionId],
  )

  const setPlayerName = useTenableM(
    ({ storage }, displayName: string) => {
      if (self?.connectionId != null) {
        storage.get('playerNames').set(String(self.connectionId), displayName)
      }
    },
    [self?.connectionId],
  )

  const startGame = useTenableM(({ storage }, ids: number[]) => {
    const cfg = loadTenableConfig()
    const seed = randomUUID()
    const qs = selectTenableQuestions(seed, cfg.questionCount, {
      groups: cfg.groups === 'all' ? undefined : cfg.groups,
      difficulty: cfg.difficulty,
      selectedId: cfg.selectedQuestionId,
    })
    storage.set('configJson', JSON.stringify(cfg))
    storage.set('seed', seed)
    storage.set('questionsJson', JSON.stringify(qs))
    storage.set('currentQuestionIndex', 0)
    storage.set('foundRanksJson', '[]')
    storage.set('livesLeft', cfg.lives)
    storage.set('hintsLeft', cfg.hints)
    storage.set('hintsJson', '[]')
    storage.set('resultsJson', '[]')
    storage.set('lastGuessJson', '')
    storage.set('startedAt', Date.now())
    const ring = [...ids].sort((a, b) => a - b)
    storage.set('turnOrderJson', JSON.stringify(ring))
    storage.set('currentTurnConnectionId', ring[0] ?? null)
    storage.set('phase', 'playing')
  }, [])

  const submitTurnGuess = useTenableM(
    ({ storage }, { name, ids }: { name: string; ids: number[] }) => {
      if (
        self?.connectionId == null ||
        storage.get('currentTurnConnectionId') !== self.connectionId
      )
        return
      const qs = parseTenableQuestions(storage.get('questionsJson') ?? '[]')
      const idx = storage.get('currentQuestionIndex') ?? 0
      const q = qs[idx]
      if (!q) return
      const found = parseNumberArray(storage.get('foundRanksJson') ?? '[]')
      if (found.length >= tenableTarget(q) || (storage.get('livesLeft') ?? 0) <= 0) return

      const outcome = matchAnswer(name, q, found)
      const connId = String(self.connectionId)

      if (outcome.kind === 'correct') {
        const nextFound = [...found, outcome.rank]
        storage.set('foundRanksJson', JSON.stringify(nextFound))
        const clearedNow = nextFound.length >= tenableTarget(q)
        const prev = Number(storage.get('playerScores').get(connId) ?? '0')
        const points = pointsFor(outcome.rank, parseHints(storage.get('hintsJson') ?? '[]'))
        storage
          .get('playerScores')
          .set(connId, String(prev + points + (clearedNow ? CLEAR_BONUS : 0)))
      } else if (outcome.kind === 'wrong') {
        storage.set('livesLeft', Math.max(0, (storage.get('livesLeft') ?? 0) - 1))
      }

      // Broadcast the outcome so every player sees what was guessed - especially
      // wrong guesses, which otherwise leave no trace beyond a lost life.
      const prevSeq = parseLastGuess(storage.get('lastGuessJson') ?? '')?.seq ?? 0
      storage.set(
        'lastGuessJson',
        JSON.stringify({
          seq: prevSeq + 1,
          by: self.connectionId,
          name,
          kind: outcome.kind,
          answer: outcome.kind !== 'wrong' ? outcome.name : undefined,
        }),
      )

      // Pass the turn on every real guess (correct or wrong); duplicates don't advance.
      if (outcome.kind !== 'already-found') {
        storage.set('currentTurnConnectionId', nextTurn(self.connectionId, ids))
      }
    },
    [self?.connectionId],
  )

  // Hints come from the server, so the mutation only records one already drawn.
  // Using a hint doesn't pass the turn.
  const addHint = useTenableM(
    ({ storage }, { questionId, hint }: { questionId: string; hint: TenableHint }) => {
      if (
        self?.connectionId == null ||
        storage.get('currentTurnConnectionId') !== self.connectionId
      )
        return
      const qs = parseTenableQuestions(storage.get('questionsJson') ?? '[]')
      const q = qs[storage.get('currentQuestionIndex') ?? 0]
      if (!q || q.id !== questionId) return
      const left = storage.get('hintsLeft') ?? 0
      const found = parseNumberArray(storage.get('foundRanksJson') ?? '[]')
      const taken = parseHints(storage.get('hintsJson') ?? '[]')
      if (left <= 0 || found.includes(hint.rank) || taken.some((h) => h.rank === hint.rank)) return
      storage.set('hintsLeft', left - 1)
      storage.set('hintsJson', JSON.stringify([...taken, { ...hint, by: self.connectionId }]))
    },
    [self?.connectionId],
  )

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
      livesUsed:
        parseTenableConfig(storage.get('configJson') ?? '{}').lives -
        (storage.get('livesLeft') ?? 0),
      cleared: found.length >= tenableTarget(q),
      hintsUsed: parseHints(storage.get('hintsJson') ?? '[]').length,
    })
    storage.set('resultsJson', JSON.stringify(results))

    const nextIdx = idx + 1
    if (nextIdx >= qs.length) {
      storage.set('phase', 'finished')
      return
    }
    const cfg = parseTenableConfig(storage.get('configJson') ?? '{}')
    storage.set('currentQuestionIndex', nextIdx)
    storage.set('foundRanksJson', '[]')
    storage.set('livesLeft', cfg.lives)
    storage.set('hintsJson', '[]')
    storage.set('lastGuessJson', '')
  }, [])

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase == null || phase !== 'lobby') return
    let displayName =
      typeof window !== 'undefined' ? window.localStorage.getItem('fb_display_name') : null
    if (!displayName) {
      displayName = `Player ${Math.floor(Math.random() * 1000)}`
      // Persist the fallback so a reconnect (new connection id) keeps the same name.
      if (typeof window !== 'undefined') window.localStorage.setItem('fb_display_name', displayName)
    }
    claimHost(displayName)
    updatePresence({ displayName })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleRename = useCallback(
    (name: string) => {
      const trimmed = name.trim() || 'Player'
      setPlayerName(trimmed)
      updatePresence({ displayName: trimmed })
      if (typeof window !== 'undefined') window.localStorage.setItem('fb_display_name', trimmed)
    },
    [setPlayerName, updatePresence],
  )

  useEffect(() => {
    setFocusKey((k) => k + 1)
  }, [currentTurnConnectionId, currentQuestionIndex])

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

  const players = [
    ...(self ? [{ connectionId: self.connectionId, name: self.presence.displayName }] : []),
    ...others.map((o) => ({ connectionId: o.connectionId, name: o.presence.displayName })),
  ].filter((p) => p.name)

  if (phase === 'lobby') {
    return (
      <TenableLobby
        roomId={roomId}
        players={players.map((p) => ({
          connectionId: p.connectionId,
          displayName: p.name,
          isHost: p.connectionId === hostConnectionId,
        }))}
        isHost={isHost}
        config={config}
        onStart={() => startGame(presentIds)}
        myName={self?.presence.displayName ?? ''}
        onRename={handleRename}
      />
    )
  }

  const nameFor = (connId: number) => playerNames?.get(String(connId)) ?? `Player ${connId}`
  const scoreFor = (connId: number) => Number(playerScores?.get(String(connId)) ?? '0')

  if (phase === 'finished') {
    const leaderboard = players
      .map((p) => ({
        name: nameFor(p.connectionId),
        score: scoreFor(p.connectionId),
        isMe: p.connectionId === self?.connectionId,
      }))
      .sort((a, b) => b.score - a.score)
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-6 py-8 md:px-9">
        <div className="text-center">
          <span className="eyebrow">Full time</span>
          <h1 className="mt-2 font-display text-[56px] font-black uppercase leading-none text-on-green">
            Results
          </h1>
        </div>
        <div className="flex flex-col gap-3">
          {leaderboard.map((e, i) => (
            <div
              key={e.name + i}
              className={`panel flex items-center gap-4 px-4 py-3 ${i === 0 ? 'border-2 border-foil' : e.isMe ? 'border-2 border-green' : ''}`}
            >
              <span
                className={`w-8 font-display text-2xl uppercase leading-none tabular-nums ${i === 0 ? 'text-gold' : 'text-muted'}`}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-bold text-ink">
                {i === 0 && <span className="mr-1.5">🏆</span>}
                {e.name}
                {e.isMe && ' (you)'}
              </span>
              <span
                className={`font-display text-xl uppercase leading-none tabular-nums ${i === 0 ? 'text-gold' : 'text-ink'}`}
              >
                {e.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/tenable/setup?mode=multiplayer" className="btn btn-outline-light btn-lg">
            New room
          </Link>
          <Link href="/" className="btn btn-ghost btn-lg">
            Home
          </Link>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted animate-pulse-soft">
        Loading category…
      </div>
    )
  }

  const turnName = currentTurnConnectionId != null ? nameFor(currentTurnConnectionId) : '-'
  const maxLives = config.lives

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
          <div className="shrink-0">
            <LivesRow livesLeft={livesLeft ?? 0} maxLives={maxLives} />
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
      </div>

      <div className="mb-4 min-h-[92px]">
        {questionOver ? (
          <div className="flex flex-col items-center gap-3 rounded-[12px] bg-black/20 px-4 py-4 text-center">
            <p className="font-display text-2xl font-black uppercase leading-none text-on-green">
              {cleared ? '🎉 All ten!' : '💔 Out of lives'}
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
            <GuessFeedback
              guess={lastGuess}
              nameFor={nameFor}
              selfId={self?.connectionId ?? null}
            />
          </>
        ) : (
          <>
            <p className="py-4 text-center text-sm font-semibold text-on-green-soft animate-pulse-soft">
              {turnName} is naming one…
            </p>
            <GuessFeedback
              guess={lastGuess}
              nameFor={nameFor}
              selfId={self?.connectionId ?? null}
            />
          </>
        )}
      </div>

      {!questionOver && (
        <TenableHints
          key={currentQuestion.id}
          hints={hints}
          foundRanks={foundRanks}
          hintsLeft={hintsLeft ?? 0}
          onRequest={handleHint}
          canRequest={isMyTurn}
          byLabel={(id) => (id === self?.connectionId ? 'you' : nameFor(id))}
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
      initialPresence={{ displayName: '' }}
      initialStorage={createInitialTenableStorage}
    >
      <TenableRoomInner roomId={roomId} />
    </TenableRoomProvider>
  )
}
