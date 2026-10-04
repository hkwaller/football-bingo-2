'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CareersRoomProvider,
  createInitialCareersStorage,
  deadlineFor,
  parseCareerPlayers,
  parseCareersConfig,
  parseCareersResults,
  useCareersErrorListener,
  useCareersMutation,
  useCareersMyPresence,
  useCareersOthers,
  useCareersSelf,
  useCareersBroadcast,
  useCareersEventListener,
  useCareersStatus,
  useCareersStorage,
  type CareersRoomResult,
} from '@/lib/careers/liveblocksCareers'
import {
  applyGiveUp,
  applyRaceGuess,
  everyoneDone,
  freshRacer,
  isDone,
  parseRoundStates,
  type RaceGuessOutcome,
} from '@/lib/careers/roomRound'
import { pointsAfter, revealedClues } from '@/lib/careers/sessionEngine'
import { loadCareersConfig, loadRecentCareers, rememberCareers } from '@/lib/careers/storage'
import type { CareerPlayer, CareersConfig } from '@/lib/careers/types'
import { haptic } from '@/lib/native'
import {
  getTabDisplayName,
  getTabPlayerId,
  roomPlayerIdOf as playerIdOf,
  saveTabDisplayName,
} from '@/lib/roomPlayer'
import { LivesRow } from '@/components/LivesRow'
import { RoomConnecting } from '@/components/RoomConnecting'
import { RoomKickGate, isKickFor, useLeaveAsRemoved } from '@/components/RoomKickGate'
import { RoomResults } from '@/components/RoomResults'
import { NameAutocomplete } from '@/components/tenable/NameAutocomplete'
import { CareerCard } from './CareerCard'
import { CareersLobby } from './CareersLobby'

/** How long the host may be gone before the next player in line drives the room. */
const ABSENT_HOST_GRACE_MS = 8000

type Feedback = { outcome: RaceGuessOutcome; guess: string; id: number; index: number }

async function dealPlayers(config: CareersConfig): Promise<CareerPlayer[]> {
  const res = await fetch('/api/careers/deal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      difficulty: config.difficulty,
      count: config.playerCount,
      recent: loadRecentCareers(),
    }),
  })
  if (!res.ok) throw new Error(`deal failed: ${res.status}`)
  const { players } = (await res.json()) as { players: CareerPlayer[] }
  rememberCareers(players.map((p) => p.id))
  return players
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(t)
  }, [active])
  return now
}

function CareersRoomInner({ roomId }: { roomId: string }) {
  const status = useCareersStatus()
  const self = useCareersSelf()
  const others = useCareersOthers()
  const [, updatePresence] = useCareersMyPresence()
  const [roomError, setRoomError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [focusKey, setFocusKey] = useState(0)

  useCareersErrorListener((err) => {
    setRoomError((err as { message?: string })?.message ?? 'Connection error')
  })

  const phase = useCareersStorage((s) => s.phase)
  const hostPlayerId = useCareersStorage((s) => s.hostPlayerId ?? null)
  const configJson = useCareersStorage((s) => s.configJson)
  const playersJson = useCareersStorage((s) => s.playersJson)
  const currentIndex = useCareersStorage((s) => s.currentIndex) ?? 0
  const roundStatesJson = useCareersStorage((s) => s.roundStatesJson)
  const roundClosed = useCareersStorage((s) => s.roundClosed)
  const roundDeadline = useCareersStorage((s) => s.roundDeadline) ?? 0
  const playerNames = useCareersStorage((s) => s.playerNames)
  const playerScores = useCareersStorage((s) => s.playerScores)

  const myId = self ? playerIdOf(self) : null
  const config = useMemo(() => parseCareersConfig(configJson), [configJson])
  const careers = useMemo(() => parseCareerPlayers(playersJson), [playersJson])
  const states = useMemo(() => parseRoundStates(roundStatesJson), [roundStatesJson])
  const career = careers[currentIndex] ?? null

  const presentIds = useMemo(() => {
    const ids = new Set(others.map(playerIdOf))
    if (myId != null) ids.add(myId)
    return [...ids].sort()
  }, [others, myId])

  // The host drives the room; if they drop out, the first player in line takes over.
  const hostAbsent = hostPlayerId != null && !presentIds.includes(hostPlayerId)
  const isHost = myId != null && myId === hostPlayerId
  // Which host id has been gone past the grace period; stale once they're back.
  const [goneHostId, setGoneHostId] = useState<string | null>(null)
  useEffect(() => {
    if (!hostAbsent) return
    const t = window.setTimeout(() => setGoneHostId(hostPlayerId), ABSENT_HOST_GRACE_MS)
    return () => window.clearTimeout(t)
  }, [hostAbsent, hostPlayerId])
  const canDrive = isHost || (hostAbsent && goneHostId === hostPlayerId && presentIds[0] === myId)

  const now = useNow(phase === 'playing' && roundDeadline > 0 && !roundClosed)
  const timeUp = roundDeadline > 0 && now >= roundDeadline
  const allDone = everyoneDone(states, presentIds)
  const roundOver = !!roundClosed || allDone || timeUp

  const me = (myId != null && states[myId]) || freshRacer()
  const myDone = isDone(me)

  // ── Mutations ──────────────────────────────────────────────────────────────

  // The first player in the room becomes host and seeds it with their setup.
  const claimHost = useCareersMutation(
    ({ storage }, { displayName, config }: { displayName: string; config: CareersConfig }) => {
      if (myId == null) return
      if (!storage.get('hostPlayerId')) {
        storage.set('hostPlayerId', myId)
        storage.set('configJson', JSON.stringify(config))
      }
      if (displayName) storage.get('playerNames').set(myId, displayName)
      if (!storage.get('playerScores').get(myId)) storage.get('playerScores').set(myId, '0')
    },
    [myId],
  )

  const setPlayerName = useCareersMutation(
    ({ storage }, displayName: string) => {
      if (myId != null) storage.get('playerNames').set(myId, displayName)
    },
    [myId],
  )

  const startGame = useCareersMutation(({ storage }, dealt: CareerPlayer[]) => {
    if (storage.get('phase') !== 'lobby') return
    const cfg = parseCareersConfig(storage.get('configJson'))
    storage.set('playersJson', JSON.stringify(dealt))
    storage.set('currentIndex', 0)
    storage.set('roundStatesJson', '{}')
    storage.set('roundClosed', false)
    storage.set('roundDeadline', deadlineFor(cfg))
    storage.set('resultsJson', '[]')
    storage.set('startedAt', Date.now())
    const scores = storage.get('playerScores')
    for (const id of scores.keys()) scores.set(id, '0')
    storage.set('phase', 'playing')
  }, [])

  const guessMutation = useCareersMutation(
    ({ storage }, { guess, ids }: { guess: string; ids: string[] }): RaceGuessOutcome => {
      if (myId == null || storage.get('roundClosed')) return { kind: 'ignored' }
      const deadline = storage.get('roundDeadline')
      if (deadline > 0 && Date.now() >= deadline) return { kind: 'ignored' }
      const list = parseCareerPlayers(storage.get('playersJson'))
      const player = list[storage.get('currentIndex')]
      if (!player) return { kind: 'ignored' }
      const cfg = parseCareersConfig(storage.get('configJson'))
      const { states: next, outcome } = applyRaceGuess(
        parseRoundStates(storage.get('roundStatesJson')),
        myId,
        guess,
        player,
        cfg.guesses,
      )
      if (outcome.kind === 'ignored') return outcome
      storage.set('roundStatesJson', JSON.stringify(next))
      if (outcome.kind === 'correct') {
        const prev = Number(storage.get('playerScores').get(myId) ?? '0')
        storage.get('playerScores').set(myId, String(prev + outcome.points))
      }
      if (everyoneDone(next, ids)) storage.set('roundClosed', true)
      return outcome
    },
    [myId],
  )

  const giveUpMutation = useCareersMutation(
    ({ storage }, ids: string[]) => {
      if (myId == null || storage.get('roundClosed')) return
      const next = applyGiveUp(parseRoundStates(storage.get('roundStatesJson')), myId)
      storage.set('roundStatesJson', JSON.stringify(next))
      if (everyoneDone(next, ids)) storage.set('roundClosed', true)
    },
    [myId],
  )

  // Idempotent: only closes the career it was called for.
  const closeRound = useCareersMutation(({ storage }, index: number) => {
    if (storage.get('currentIndex') === index) storage.set('roundClosed', true)
  }, [])

  const nextCareer = useCareersMutation(({ storage }, index: number) => {
    if (storage.get('currentIndex') !== index || storage.get('phase') !== 'playing') return
    const list = parseCareerPlayers(storage.get('playersJson'))
    const player = list[index]
    if (!player) return
    const roundStates = parseRoundStates(storage.get('roundStatesJson'))
    const results = parseCareersResults(storage.get('resultsJson'))
    results.push({
      playerId: player.id,
      name: player.name,
      points: Object.fromEntries(Object.entries(roundStates).map(([id, r]) => [id, r.points])),
    } satisfies CareersRoomResult)
    storage.set('resultsJson', JSON.stringify(results))
    if (index + 1 >= list.length) {
      storage.set('phase', 'finished')
      return
    }
    const cfg = parseCareersConfig(storage.get('configJson'))
    storage.set('currentIndex', index + 1)
    storage.set('roundStatesJson', '{}')
    storage.set('roundClosed', false)
    storage.set('roundDeadline', deadlineFor(cfg))
  }, [])

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase == null || myId == null) return
    // Keep the name already shown in the room; the stored one can be stale when
    // another tab in this browser renamed itself. Lobby guests type their own
    // name - only players still unnamed at kick-off (or joining mid-game) get one.
    const displayName = self?.presence.displayName || (phase === 'lobby' ? '' : getTabDisplayName())
    if (phase === 'lobby') claimHost({ displayName, config: loadCareersConfig() })
    else setPlayerName(displayName)
    updatePresence({ displayName })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'lobby', phase == null, myId])

  // Close the career for good when the clock runs out or the last player still
  // guessing left. Only the driver writes, so clients don't race.
  useEffect(() => {
    if (phase !== 'playing' || roundClosed || !canDrive) return
    if (timeUp || allDone) closeRound(currentIndex)
  }, [phase, roundClosed, canDrive, timeUp, allDone, closeRound, currentIndex])

  const leaveAsRemoved = useLeaveAsRemoved()
  const broadcast = useCareersBroadcast()
  useCareersEventListener(({ event }) => {
    if (isKickFor(event, myId)) leaveAsRemoved()
  })
  const dropPlayer = useCareersMutation(({ storage }, id: string) => {
    storage.get('playerNames').delete(id)
    storage.get('playerScores').delete(id)
  }, [])
  const handleRemovePlayer = useCallback(
    (id: string | number) => {
      dropPlayer(String(id))
      broadcast({ type: 'kick', id: String(id) })
    },
    [dropPlayer, broadcast],
  )

  const handleRename = useCallback(
    (name: string) => {
      const trimmed = name.trim() || 'Player'
      setPlayerName(trimmed)
      updatePresence({ displayName: trimmed })
      saveTabDisplayName(trimmed)
    },
    [setPlayerName, updatePresence],
  )

  const handleStart = useCallback(async () => {
    setStarting(true)
    try {
      startGame(await dealPlayers(config))
    } catch {
      setRoomError("Couldn't deal the careers - try again.")
    } finally {
      setStarting(false)
    }
  }, [config, startGame])

  const handleGuess = useCallback(
    (guess: string) => {
      if (roundOver || myDone) return
      const outcome = guessMutation({ guess, ids: presentIds })
      if (outcome.kind === 'ignored') return
      haptic(outcome.kind === 'correct' ? 'right' : 'wrong')
      setFeedback((f) => ({ outcome, guess, id: (f?.id ?? 0) + 1, index: currentIndex }))
      setFocusKey((k) => k + 1)
    },
    [roundOver, myDone, guessMutation, presentIds, currentIndex],
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
        mode="careers"
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
    // Unnamed players still show, as "in the tunnel", so the host sees everyone.
    const lobbyPlayers = [
      ...(self ? [{ id: playerIdOf(self), name: self.presence.displayName }] : []),
      ...others.map((o) => ({ id: playerIdOf(o), name: o.presence.displayName })),
    ].filter((p, i, arr) => arr.findIndex((q) => q.id === p.id) === i)
    return (
      <CareersLobby
        roomId={roomId}
        players={lobbyPlayers.map((p) => ({
          id: p.id,
          displayName: p.name || (p.id === myId ? 'You' : 'Guest'),
          isHost: p.id === hostPlayerId,
          isSelf: p.id === myId,
          ready: !!p.name,
        }))}
        onRemovePlayer={isHost ? handleRemovePlayer : undefined}
        isHost={isHost}
        config={config}
        onStart={handleStart}
        starting={starting}
        myName={self?.presence.displayName ?? ''}
        onRename={handleRename}
      />
    )
  }

  const nameFor = (id: string) => playerNames?.get(id) ?? 'Player'
  const scoreFor = (id: string) => Number(playerScores?.get(id) ?? '0')

  if (phase === 'finished') {
    // Everyone who played, including anyone who left before full time.
    const ids = new Set([...players.map((p) => p.id), ...(playerNames?.keys() ?? [])])
    return (
      <RoomResults
        mode="versus"
        entries={[...ids].map((id) => ({
          id,
          name: nameFor(id),
          score: scoreFor(id),
          isMe: id === myId,
        }))}
        newRoomHref="/careers/setup?mode=multiplayer"
        eyebrowClass="eyebrow-sky"
      />
    )
  }

  if (!career) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted animate-pulse-soft">
        Loading career…
      </div>
    )
  }

  const misses = me.wrong.length
  const clues = revealedClues(career, misses, roundOver)
  const secondsLeft =
    roundDeadline > 0 && !roundOver ? Math.max(0, Math.ceil((roundDeadline - now) / 1000)) : null
  const isLast = currentIndex + 1 >= careers.length
  const firstSolverId = Object.entries(states).find(([, r]) => r.first)?.[0]

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col px-4 py-6 md:px-8">
      {/* HUD */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow eyebrow-sky">
              Career {currentIndex + 1} of {careers.length}
            </span>
            <h1 className="mt-2 font-display text-[30px] font-black uppercase leading-[0.92] text-on-green md:text-[38px]">
              Whose career?
            </h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="inline-flex items-center rounded-lg bg-black/25 px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-yellow">
              {myId ? scoreFor(myId).toLocaleString() : 0} pts
            </span>
            {secondsLeft != null && (
              <span
                className={`font-mono text-[13px] font-bold tabular-nums ${
                  secondsLeft <= 10 ? 'animate-pulse text-pink' : 'text-on-green-dim'
                }`}
              >
                {secondsLeft}s
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <LivesRow livesLeft={config.guesses - misses} maxLives={config.guesses} />
          {!roundOver && !myDone && (
            <span className="font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-on-green-dim">
              Worth {pointsAfter(misses)}
              {!firstSolverId && ' +25 first'}
            </span>
          )}
        </div>

        {/* Who's where */}
        <div className="flex flex-wrap items-center gap-2">
          {players.map((p) => {
            const r = states[p.id]
            const label = r?.solved
              ? roundOver || p.id === myId
                ? `✓ +${r.points}`
                : '✓'
              : r?.out
                ? 'out'
                : `♥${config.guesses - (r?.wrong.length ?? 0)}`
            return (
              <span
                key={p.id}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold ${
                  r?.solved
                    ? 'bg-surface text-card-ink shadow-[inset_0_0_0_2px_var(--yellow)]'
                    : 'bg-black/25 text-on-green-soft'
                } ${r?.out ? 'opacity-50' : ''}`}
              >
                <span className="max-w-[9rem] truncate">
                  {nameFor(p.id)}
                  {p.id === myId && ' (you)'}
                </span>
                <span className="font-mono tabular-nums">{scoreFor(p.id).toLocaleString()}</span>
                <span className="font-mono text-[11px]">{label}</span>
              </span>
            )
          })}
        </div>
      </div>

      {/* Input / waiting / reveal */}
      <div className="mb-4 min-h-[92px]">
        {roundOver ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 rounded-[12px] bg-black/20 px-4 py-4 text-center"
          >
            <div className="flex items-center gap-3">
              {career.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={career.imageUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full border-2 border-surface object-cover"
                  style={{ objectPosition: '50% 20%' }}
                />
              )}
              <div className="text-left">
                <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-on-green-soft">
                  {firstSolverId
                    ? `${firstSolverId === myId ? 'You' : nameFor(firstSolverId)} named him first`
                    : timeUp && !allDone
                      ? "Time's up - it was"
                      : 'Nobody got him - it was'}
                </p>
                <p className="font-display text-[28px] font-black uppercase leading-none text-on-green">
                  {career.name}
                </p>
              </div>
            </div>
            {canDrive ? (
              <button onClick={() => nextCareer(currentIndex)} className="btn btn-primary btn-lg">
                {isLast ? 'See results' : 'Next career'}
              </button>
            ) : (
              <p className="text-sm font-semibold text-on-green-soft animate-pulse-soft">
                Waiting for the gaffer…
              </p>
            )}
          </motion.div>
        ) : myDone ? (
          <div className="flex flex-col items-center gap-3 rounded-[12px] bg-black/20 px-4 py-4 text-center">
            <p className="font-display text-2xl font-black uppercase leading-none text-on-green">
              {me.solved ? `✓ +${me.points} - you got him` : "You're out on this one"}
            </p>
            <p className="text-sm font-semibold text-on-green-soft animate-pulse-soft">
              Waiting for the others…
            </p>
            {canDrive && (
              <button
                type="button"
                onClick={() => closeRound(currentIndex)}
                className="text-[13px] font-bold text-on-green-dim underline hover:text-on-green"
              >
                Reveal now
              </button>
            )}
          </div>
        ) : (
          <>
            <NameAutocomplete
              onGuess={handleGuess}
              focusKey={focusKey + currentIndex}
              resetKey={currentIndex}
              placeholder="Who is it?"
            />
            <div className="mt-2 flex h-6 items-center justify-between gap-3">
              <AnimatePresence mode="wait">
                {feedback?.index === currentIndex && feedback.outcome.kind === 'wrong' && (
                  <motion.p
                    key={feedback.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="truncate text-sm font-bold text-pink"
                  >
                    ✗ Not {feedback.guess} - new clue below
                  </motion.p>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={() => giveUpMutation(presentIds)}
                className="ml-auto shrink-0 text-[13px] font-bold text-on-green-dim underline hover:text-on-green"
              >
                Give up
              </button>
            </div>
          </>
        )}
      </div>

      {/* Clues - your own, so nobody else's misses help you */}
      {clues.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {clues.map((c) => (
            <motion.span
              key={c.kind}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-baseline gap-1.5 rounded-full bg-black/25 px-3 py-1.5"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-on-green-dim">
                {c.label}
              </span>
              <span className="text-[13px] font-bold text-on-green">{c.value}</span>
            </motion.span>
          ))}
        </div>
      )}

      <CareerCard key={career.id} career={career.career} />
    </div>
  )
}

export function CareersRoomGame({ roomId }: { roomId: string }) {
  return (
    <RoomKickGate roomId={roomId} mode="careers">
      <CareersRoomProvider
        id={roomId}
        initialPresence={() => ({ displayName: '', playerId: getTabPlayerId() })}
        initialStorage={createInitialCareersStorage}
      >
        <CareersRoomInner roomId={roomId} />
      </CareersRoomProvider>
    </RoomKickGate>
  )
}
