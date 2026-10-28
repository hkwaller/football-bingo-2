import { selectTenableQuestions, tenableTarget } from '../../data/tenable'
import { matchAnswer } from '../tenable/matching'
import { CLEAR_BONUS, pointsFor, type TenableConfig, type TenableHint } from '../tenable/types'
import {
  bumpUsed,
  isOutOfLives,
  leftFor,
  nextTurnPlayer,
  parseUsedCounts,
  poolKey,
} from '../roomMode'
import {
  TenableGameStorage,
  parseTenableConfig,
  parseTenableQuestions,
  parseNumberArray,
  parseLastGuess,
  parseHints,
} from './tenableModel'
import type { ActionContext } from './types'

export const tenableActions = {
  claimHost: (
    { storage, myId }: ActionContext<TenableGameStorage>,
    { displayName, config }: { displayName: string; config: TenableConfig },
  ) => {
    if (myId == null) return
    if (storage.get('hostPlayerId') == null) {
      storage.set('hostPlayerId', myId)
      storage.set('configJson', JSON.stringify(config))
    }
    if (displayName) storage.get('playerNames').set(myId, displayName)
    if (!storage.get('playerScores').get(myId)) storage.get('playerScores').set(myId, '0')
  },

  setPlayerName: ({ storage, myId }: ActionContext<TenableGameStorage>, displayName: string) => {
    if (myId != null) storage.get('playerNames').set(myId, displayName)
  },

  startGame: ({ storage, now, seed, online }: ActionContext<TenableGameStorage>, ids: string[]) => {
    const cfg = parseTenableConfig(storage.get('configJson') ?? '{}')
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
    storage.set('startedAt', now)
    const ring = [...online].sort()
    storage.set('turnOrderJson', JSON.stringify(ring))
    storage.set('currentTurnPlayerId', ring[0] ?? null)
    storage.set('phase', 'playing')
  },

  submitTurnGuess: (
    { storage, myId, online }: ActionContext<TenableGameStorage>,
    { name, ids }: { name: string; ids: string[] },
  ) => {
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
      storage.get('playerScores').set(myId, String(prev + points + (clearedNow ? CLEAR_BONUS : 0)))
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
        nextTurnPlayer(myId, online, (id) => !isOutOfLives(roomMode, lost, id, cfg.lives)),
      )
    }
    return outcome
  },

  addHint: (
    { storage, myId }: ActionContext<TenableGameStorage>,
    { questionId, hint }: { questionId: string; hint: TenableHint },
  ) => {
    if (myId == null || storage.get('currentTurnPlayerId') !== myId) return
    const qs = parseTenableQuestions(storage.get('questionsJson') ?? '[]')
    const q = qs[storage.get('currentQuestionIndex') ?? 0]
    if (!q || q.id !== questionId || !q.answers.some((a) => a.rank === hint.rank)) return
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

  passStuckTurn: ({ storage, online }: ActionContext<TenableGameStorage>, ids: string[]) => {
    const cfg = parseTenableConfig(storage.get('configJson') ?? '{}')
    const lost = parseUsedCounts(storage.get('livesLostJson'))
    const canPlay = (id: string) => !isOutOfLives(cfg.playMode ?? 'versus', lost, id, cfg.lives)
    const current = storage.get('currentTurnPlayerId')
    if (current != null && online.includes(current) && canPlay(current)) return
    storage.set('currentTurnPlayerId', nextTurnPlayer(current, online, canPlay))
  },

  advanceCategory: ({ storage }: ActionContext<TenableGameStorage>) => {
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
  },

  dropPlayer: ({ storage }: ActionContext<TenableGameStorage>, id: string) => {
    storage.get('playerNames').delete(id)
    storage.get('playerScores').delete(id)
  },
}
