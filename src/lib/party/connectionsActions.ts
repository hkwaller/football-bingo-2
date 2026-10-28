import {
  applyGiveUp,
  applyRaceGuess,
  everyoneDone,
  parseRoundStates,
  type RaceGuessOutcome,
} from '../connections/roomRound'
import { type KnownNames } from '../connections/sessionEngine'
import { type ConnectionsConfig, type ConnectionsPuzzle } from '../connections/types'
import {
  ConnectionsRoomResult,
  ConnectionsGameStorage,
  parseConnectionsConfig,
  parseConnectionsPuzzles,
  parseConnectionsResults,
} from './connectionsModel'
import type { ActionContext } from './types'

export const connectionsActions = {
  claimHost: (
    { storage, myId }: ActionContext<ConnectionsGameStorage>,
    { displayName, config }: { displayName: string; config: ConnectionsConfig },
  ) => {
    if (myId == null) return
    if (!storage.get('hostPlayerId')) {
      storage.set('hostPlayerId', myId)
      storage.set('configJson', JSON.stringify(config))
    }
    if (displayName) storage.get('playerNames').set(myId, displayName)
    if (!storage.get('playerScores').get(myId)) storage.get('playerScores').set(myId, '0')
  },

  setPlayerName: (
    { storage, myId }: ActionContext<ConnectionsGameStorage>,
    displayName: string,
  ) => {
    if (myId != null) storage.get('playerNames').set(myId, displayName)
  },

  startGame: (
    { storage, now }: ActionContext<ConnectionsGameStorage>,
    dealt: ConnectionsPuzzle[],
  ) => {
    if (storage.get('phase') !== 'lobby') return
    const cfg = parseConnectionsConfig(storage.get('configJson'))
    storage.set('puzzlesJson', JSON.stringify(dealt))
    storage.set('currentIndex', 0)
    storage.set('roundStatesJson', '{}')
    storage.set('roundClosed', false)
    storage.set('roundDeadline', cfg.roundSeconds > 0 ? now + cfg.roundSeconds * 1000 : 0)
    storage.set('resultsJson', '[]')
    storage.set('startedAt', now)
    const scores = storage.get('playerScores')
    for (const id of scores.keys()) scores.set(id, '0')
    storage.set('phase', 'playing')
  },

  guessMutation: (
    { storage, myId, now, online }: ActionContext<ConnectionsGameStorage>,
    { guess, ids, known }: { guess: string; ids: string[]; known: KnownNames },
  ): RaceGuessOutcome => {
    if (myId == null || storage.get('roundClosed')) return { kind: 'ignored' }
    const deadline = storage.get('roundDeadline')
    if (deadline > 0 && now >= deadline) return { kind: 'ignored' }
    const list = parseConnectionsPuzzles(storage.get('puzzlesJson'))
    const current = list[storage.get('currentIndex')]
    if (!current) return { kind: 'ignored' }
    const cfg = parseConnectionsConfig(storage.get('configJson'))
    const { states: next, outcome } = applyRaceGuess(
      parseRoundStates(storage.get('roundStatesJson')),
      myId,
      guess,
      current,
      known,
      cfg.guesses,
    )
    if (outcome.kind === 'ignored' || outcome.kind === 'unknown') return outcome
    storage.set('roundStatesJson', JSON.stringify(next))
    if (outcome.kind === 'correct') {
      const prev = Number(storage.get('playerScores').get(myId) ?? '0')
      storage.get('playerScores').set(myId, String(prev + outcome.points))
    }
    if (everyoneDone(next, online)) storage.set('roundClosed', true)
    return outcome
  },

  giveUpMutation: (
    { storage, myId, online }: ActionContext<ConnectionsGameStorage>,
    ids: string[],
  ) => {
    if (myId == null || storage.get('roundClosed')) return
    const next = applyGiveUp(parseRoundStates(storage.get('roundStatesJson')), myId)
    storage.set('roundStatesJson', JSON.stringify(next))
    if (everyoneDone(next, online)) storage.set('roundClosed', true)
  },

  closeRound: ({ storage }: ActionContext<ConnectionsGameStorage>, index: number) => {
    if (storage.get('currentIndex') === index) storage.set('roundClosed', true)
  },

  nextPuzzle: ({ storage, now }: ActionContext<ConnectionsGameStorage>, index: number) => {
    if (storage.get('currentIndex') !== index || storage.get('phase') !== 'playing') return
    const list = parseConnectionsPuzzles(storage.get('puzzlesJson'))
    const done = list[index]
    if (!done) return
    const roundStates = parseRoundStates(storage.get('roundStatesJson'))
    const results = parseConnectionsResults(storage.get('resultsJson'))
    results.push({
      puzzleId: done.id,
      clubs: done.clubs.map((c) => c.name),
      points: Object.fromEntries(Object.entries(roundStates).map(([id, r]) => [id, r.points])),
    } satisfies ConnectionsRoomResult)
    storage.set('resultsJson', JSON.stringify(results))
    if (index + 1 >= list.length) {
      storage.set('phase', 'finished')
      return
    }
    const cfg = parseConnectionsConfig(storage.get('configJson'))
    storage.set('currentIndex', index + 1)
    storage.set('roundStatesJson', '{}')
    storage.set('roundClosed', false)
    storage.set('roundDeadline', cfg.roundSeconds > 0 ? now + cfg.roundSeconds * 1000 : 0)
  },

  dropPlayer: ({ storage }: ActionContext<ConnectionsGameStorage>, id: string) => {
    storage.get('playerNames').delete(id)
    storage.get('playerScores').delete(id)
  },
}
