import {
  applyGiveUp,
  applyRaceGuess,
  everyoneDone,
  parseRoundStates,
  type RaceGuessOutcome,
} from '../careers/roomRound'
import type { CareerPlayer, CareersConfig } from '../careers/types'
import {
  CareersRoomResult,
  CareersGameStorage,
  parseCareersConfig,
  parseCareerPlayers,
  parseCareersResults,
} from './careersModel'
import type { ActionContext } from './types'

export const careersActions = {
  claimHost: (
    { storage, myId }: ActionContext<CareersGameStorage>,
    { displayName, config }: { displayName: string; config: CareersConfig },
  ) => {
    if (myId == null) return
    if (!storage.get('hostPlayerId')) {
      storage.set('hostPlayerId', myId)
      storage.set('configJson', JSON.stringify(config))
    }
    if (displayName) storage.get('playerNames').set(myId, displayName)
    if (!storage.get('playerScores').get(myId)) storage.get('playerScores').set(myId, '0')
  },

  setPlayerName: ({ storage, myId }: ActionContext<CareersGameStorage>, displayName: string) => {
    if (myId != null) storage.get('playerNames').set(myId, displayName)
  },

  startGame: ({ storage, now }: ActionContext<CareersGameStorage>, dealt: CareerPlayer[]) => {
    if (storage.get('phase') !== 'lobby') return
    const cfg = parseCareersConfig(storage.get('configJson'))
    storage.set('playersJson', JSON.stringify(dealt))
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
    { storage, myId, now, online }: ActionContext<CareersGameStorage>,
    { guess, ids }: { guess: string; ids: string[] },
  ): RaceGuessOutcome => {
    if (myId == null || storage.get('roundClosed')) return { kind: 'ignored' }
    const deadline = storage.get('roundDeadline')
    if (deadline > 0 && now >= deadline) return { kind: 'ignored' }
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
    if (everyoneDone(next, online)) storage.set('roundClosed', true)
    return outcome
  },

  giveUpMutation: ({ storage, myId, online }: ActionContext<CareersGameStorage>, ids: string[]) => {
    if (myId == null || storage.get('roundClosed')) return
    const next = applyGiveUp(parseRoundStates(storage.get('roundStatesJson')), myId)
    storage.set('roundStatesJson', JSON.stringify(next))
    if (everyoneDone(next, online)) storage.set('roundClosed', true)
  },

  closeRound: ({ storage }: ActionContext<CareersGameStorage>, index: number) => {
    if (storage.get('currentIndex') === index) storage.set('roundClosed', true)
  },

  nextCareer: ({ storage, now }: ActionContext<CareersGameStorage>, index: number) => {
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
    storage.set('roundDeadline', cfg.roundSeconds > 0 ? now + cfg.roundSeconds * 1000 : 0)
  },

  dropPlayer: ({ storage }: ActionContext<CareersGameStorage>, id: string) => {
    storage.get('playerNames').delete(id)
    storage.get('playerScores').delete(id)
  },
}
