import { getLineupById, selectLineups, lineupTarget } from '../../data/famous11s'
import { matchSlot } from '../famous11s/matching'
import {
  POINTS_PER_SLOT,
  CLEAR_BONUS,
  MISS_PENALTY,
  type Famous11sConfig,
} from '../famous11s/types'
import {
  bumpUsed,
  everyoneOutOfLives,
  isOutOfLives,
  nextTurnPlayer,
  parseUsedCounts,
  poolKey,
} from '../roomMode'
import {
  ElevenLastGuess,
  ElevenGameStorage,
  parseElevenConfig,
  parseElevenLineups,
  parseStringArray,
  parseLastGuess,
} from './elevenModel'
import type { ActionContext } from './types'

export const elevenActions = {
  claimHost: (
    { storage, myId }: ActionContext<ElevenGameStorage>,
    { displayName, config }: { displayName: string; config: Famous11sConfig },
  ) => {
    if (myId == null) return
    if (!storage.get('hostPlayerId')) {
      storage.set('hostPlayerId', myId)
      storage.set('configJson', JSON.stringify(config))
    }
    if (displayName) storage.get('playerNames').set(myId, displayName)
    if (!storage.get('playerScores').get(myId)) storage.get('playerScores').set(myId, '0')
  },

  setPlayerName: ({ storage, myId }: ActionContext<ElevenGameStorage>, displayName: string) => {
    if (myId != null) storage.get('playerNames').set(myId, displayName)
  },

  startGame: ({ storage, now, seed, online }: ActionContext<ElevenGameStorage>, ids: string[]) => {
    const cfg = parseElevenConfig(storage.get('configJson') ?? '{}')
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
    storage.set('startedAt', now)
    const ring = [...online].sort()
    storage.set('turnOrderJson', JSON.stringify(ring))
    storage.set('currentTurnPlayerId', ring[0] ?? null)
    const deadline = cfg.turnSeconds > 0 ? now + cfg.turnSeconds * 1000 : 0
    storage.set('turnDeadline', deadline)
    storage.set('phase', 'playing')
  },

  submitTurnGuess: (
    { storage, myId, now, online }: ActionContext<ElevenGameStorage>,
    { name, ids }: { name: string; ids: string[] },
  ) => {
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
        nextTurnPlayer(myId, online, (id) => !isOutOfLives(roomMode, lost, id, cfg.lives)),
      )
      const deadline = cfg.turnSeconds > 0 ? now + cfg.turnSeconds * 1000 : 0
      storage.set('turnDeadline', deadline)
    }
    return outcome
  },

  skipTurn: (
    { storage, now, online }: ActionContext<ElevenGameStorage>,
    { ids, deadline }: { ids: string[]; deadline: number },
  ) => {
    const current = storage.get('currentTurnPlayerId')
    if (current == null || storage.get('turnDeadline') !== deadline) return
    const found = parseStringArray(storage.get('foundSlotIdsJson') ?? '[]')
    const cfg = parseElevenConfig(storage.get('configJson') ?? '{}')
    const roomMode = cfg.playMode ?? 'versus'
    const lost = bumpUsed(parseUsedCounts(storage.get('livesLostJson')), poolKey(roomMode, current))
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
    const over = found.length >= target || everyoneOutOfLives(roomMode, lost, online, cfg.lives)
    storage.set('currentTurnPlayerId', over ? current : nextTurnPlayer(current, online, canPlay))
    storage.set('turnDeadline', cfg.turnSeconds > 0 ? now + cfg.turnSeconds * 1000 : 0)
  },

  passStuckTurn: ({ storage, now, online }: ActionContext<ElevenGameStorage>, ids: string[]) => {
    const cfg = parseElevenConfig(storage.get('configJson') ?? '{}')
    const lost = parseUsedCounts(storage.get('livesLostJson'))
    const canPlay = (id: string) => !isOutOfLives(cfg.playMode ?? 'versus', lost, id, cfg.lives)
    const current = storage.get('currentTurnPlayerId')
    if (current != null && online.includes(current) && canPlay(current)) return
    storage.set('currentTurnPlayerId', nextTurnPlayer(current, online, canPlay))
    storage.set('turnDeadline', cfg.turnSeconds > 0 ? now + cfg.turnSeconds * 1000 : 0)
  },

  advanceLineupRoom: ({ storage, now }: ActionContext<ElevenGameStorage>) => {
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
    const deadline = cfg.turnSeconds > 0 ? now + cfg.turnSeconds * 1000 : 0
    storage.set('turnDeadline', deadline)
  },

  dropPlayer: ({ storage }: ActionContext<ElevenGameStorage>, id: string) => {
    storage.get('playerNames').delete(id)
    storage.get('playerScores').delete(id)
  },
}
