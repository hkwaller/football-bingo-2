import type { CellPick } from '../cellPick'
import { bingoHintCount, bingoPoints, canBuyBingoHint } from '../bingoHints'
import { DraftVote, GameStorage, mapKeysClear } from './bingoModel'
import { VALIDATE_ACTION, type ActionContext } from './types'
import { validateBingoAction } from './bingoRules'

export const bingoActions = {
  [VALIDATE_ACTION]: validateBingoAction,
  claimHost: ({ storage }: ActionContext<GameStorage>, id: number) => {
    if (storage.get('hostConnectionId') == null) {
      storage.set('hostConnectionId', id)
    }
  },

  advanceDraftRound: ({ storage }: ActionContext<GameStorage>) => {
    storage.set('draftRound', storage.get('draftRound') + 1)
  },

  applyStart: (
    { storage, now }: ActionContext<GameStorage>,
    payload: { seed: string; supabaseGameId: string | null },
  ) => {
    storage.set('phase', 'playing')
    storage.set('seed', payload.seed)
    storage.set('startedAt', now)
    storage.set('supabaseGameId', payload.supabaseGameId)
    storage.set('draftRound', 0)
    mapKeysClear(storage.get('draftVotes'))
    mapKeysClear(storage.get('sharedSolved'))
    const purchases = storage.get('hintPurchases')
    if (purchases) mapKeysClear(purchases)
  },

  setFinished: ({ storage }: ActionContext<GameStorage>) => {
    storage.set('phase', 'finished')
  },

  castDraftVoteWithSelf: ({ storage, self: s }: ActionContext<GameStorage>, vote: DraftVote) => {
    if (!s) return
    storage.get('draftVotes').set(String(s.connectionId), vote)
  },

  clearDraftVotes: ({ storage }: ActionContext<GameStorage>) => {
    mapKeysClear(storage.get('draftVotes'))
  },

  resolveDraftRound: (
    { storage }: ActionContext<GameStorage>,
    payload: {
      skip: boolean
      cellIndex?: number
      pick?: CellPick
      layout: 'shared' | 'individual'
    },
  ) => {
    mapKeysClear(storage.get('draftVotes'))
    const r = storage.get('draftRound')
    storage.set('draftRound', r + 1)
    if (!payload.skip && payload.cellIndex !== undefined && payload.pick) {
      if (payload.layout === 'shared') {
        storage.get('sharedSolved').set(String(payload.cellIndex), payload.pick)
      }
    }
  },

  applySharedPick: (
    { storage }: ActionContext<GameStorage>,
    { cellIndex, pick }: { cellIndex: number; pick: CellPick },
  ) => {
    storage.get('sharedSolved').set(String(cellIndex), pick)
  },

  buyHint: ({ storage, self }: ActionContext<GameStorage>, key: string) => {
    const activeSeed = storage.get('seed')
    const isIndividual = storage.get('boardLayout') === 'individual'
    const myBoardSeed = isIndividual ? activeSeed + '::' + self.connectionId : activeSeed
    const myActedThisRound =
      isIndividual &&
      storage.get('drawSource') === 'shared' &&
      Number(self.presence.actedRound ?? -1) >= storage.get('draftRound')
    const localBingo = self.presence.bingoAt != null
    const localSolved = { size: (self.presence.solvedCount as number) ?? 0 }

    if (
      storage.get('phase') !== 'playing' ||
      storage.get('seed') !== activeSeed ||
      myActedThisRound ||
      localBingo
    )
      return false
    let purchases = storage.get('hintPurchases')
    if (!purchases) {
      purchases = new Map<string, boolean>()
      storage.set('hintPurchases', purchases)
    }
    let wallet: unknown, round: unknown, player: unknown
    try {
      ;[wallet, round, player] = JSON.parse(key)
    } catch {
      return false
    }
    if (wallet !== myBoardSeed || !Number.isInteger(round) || typeof player !== 'string' || !player)
      return false
    if (
      (storage.get('boardLayout') === 'shared' || storage.get('drawSource') === 'shared') &&
      round !== storage.get('draftRound')
    )
      return false
    if (purchases.has(key)) return true
    const placed = isIndividual ? localSolved.size : storage.get('sharedSolved').size
    const balance = bingoPoints(placed, bingoHintCount(purchases.keys(), myBoardSeed))
    if (!canBuyBingoHint(balance, false)) return false
    purchases.set(key, true)
    return true
  },
}
