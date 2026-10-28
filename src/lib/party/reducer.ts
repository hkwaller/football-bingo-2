import {
  actionScope,
  decodeStorage,
  encodeStorage,
  type ActionContext,
  type GameKind,
  type RoomAction,
  type RoomMember,
  VALIDATE_ACTION,
} from './types'
import { cleanConfig } from './config'
import { everyoneOutOfLives, parseUsedCounts } from '../roomMode'
import { tenableTarget } from '../tenable/target'

type Fields = Record<string, unknown>
export type ActionTable<S> = Record<
  string,
  (context: ActionContext<S>, ...args: never[]) => unknown
> & {
  [VALIDATE_ACTION]?: (
    state: S,
    action: RoomAction,
    self: RoomMember,
    members: RoomMember[],
  ) => boolean
}
const hostActions = new Set([
  'startGame',
  'applyStart',
  'finishGame',
  'advanceQuestion',
  'advanceTurnAndQuestion',
  'advanceCategory',
  'advanceLineupRoom',
  'dropPlayer',
  'clearDraftVotes',
  'resolveDraftRound',
  'advanceDraftRound',
  'closeRound',
  'nextPuzzle',
  'nextCareer',
])
const lobbyActions = new Set(['claimHost', 'setPlayerName'])
const string = (v: unknown, max = 200) => typeof v === 'string' && v.length <= max
const record = (v: unknown): v is Fields => !!v && typeof v === 'object' && !Array.isArray(v)
const index = (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) < 100000
const pick = (v: unknown) =>
  record(v) &&
  string(v.playerId, 100) &&
  string(v.name) &&
  (v.imageUrl === undefined || string(v.imageUrl, 1000))

/** Socket input is an action name and bounded arguments, never storage patches. */
export function parseAction(value: unknown): RoomAction | null {
  if (
    !record(value) ||
    value.type !== 'action' ||
    !string(value.name, 40) ||
    !Array.isArray(value.args) ||
    value.args.length > 1 ||
    !index(value.id) ||
    !string(value.scope, 1000)
  )
    return null
  const a = value.args[0]
  let valid = false
  switch (value.name) {
    case 'claimHost':
      valid = index(a) || (record(a) && string(a.displayName, 60) && record(a.config))
      break
    case 'setPlayerName':
      valid = string(a, 60) || (record(a) && index(a.id) && string(a.displayName, 60))
      break
    case 'applyStart':
      valid =
        record(a) &&
        string(a.seed, 100) &&
        (a.supabaseGameId === null || string(a.supabaseGameId, 100))
      break
    case 'startGame':
      valid = a === undefined || (Array.isArray(a) && a.length <= 50)
      break
    case 'castDraftVoteWithSelf':
      valid =
        record(a) &&
        (a.type === 'skip' ||
          (a.type === 'square' && index(a.cellIndex) && (a.cellIndex as number) < 25))
      break
    case 'resolveDraftRound':
      valid =
        record(a) &&
        typeof a.skip === 'boolean' &&
        ['shared', 'individual'].includes(String(a.layout)) &&
        (a.skip || (index(a.cellIndex) && (a.cellIndex as number) < 25 && pick(a.pick)))
      break
    case 'applySharedPick':
      valid = record(a) && index(a.cellIndex) && (a.cellIndex as number) < 25 && pick(a.pick)
      break
    case 'buyHint':
      valid = string(a, 1000)
      break
    case 'guessMutation':
      valid = record(a) && string(a.guess)
      break
    case 'submitTurnGuess':
      valid = record(a) && string(a.name)
      break
    case 'submitAnswer':
      valid = record(a) && string(a.answerValue) && index(a.questionIndex)
      break
    case 'addHint':
      valid =
        record(a) &&
        string(a.questionId, 120) &&
        record(a.hint) &&
        index(a.hint.rank) &&
        Array.isArray(a.hint.clues) &&
        a.hint.clues.length <= 5 &&
        a.hint.clues.every((c) => string(c))
      break
    case 'giveUpMutation':
    case 'passStuckTurn':
      valid = Array.isArray(a) && a.length <= 50
      break
    case 'skipTurn':
      valid = record(a) && typeof a.deadline === 'number' && Number.isFinite(a.deadline)
      break
    case 'dropPlayer':
      valid = string(a, 200)
      break
    case 'nextCareer':
    case 'nextPuzzle':
    case 'closeRound':
      valid = index(a)
      break
    case 'advanceTurnAndQuestion':
      valid = a === null || index(a)
      break
    case 'advanceDraftRound':
    case 'setFinished':
    case 'clearDraftVotes':
    case 'advanceCategory':
    case 'advanceLineupRoom':
    case 'advanceQuestion':
    case 'finishGame':
      valid = value.args.length === 0
      break
  }
  return valid ? (value as RoomAction) : null
}

/** Shared execution for optimistic feedback and authoritative server application. */
export function applyRoomAction<S extends object>(
  kind: GameKind,
  state: S,
  table: ActionTable<S>,
  action: RoomAction,
  self: RoomMember,
  members: RoomMember[],
  now: number,
  seed: string,
): { state: S; result: unknown } {
  const unchanged = { state, result: undefined }
  if (!Object.hasOwn(table, action.name)) return unchanged
  const fields = state as Fields
  const mine = self.presence.playerId as string
  const numeric = kind === 'bingo' || kind === 'trivia'
  const online = members
    .map((m) => (numeric ? String(m.connectionId) : (m.presence.playerId as string)))
    .sort()
  const host = numeric ? fields.hostConnectionId : fields.hostPlayerId
  const actor = numeric ? self.connectionId : mine
  const hostOnline = members.some((m) => (numeric ? m.connectionId : m.presence.playerId) === host)
  const canDrive =
    actor === host ||
    (kind === 'bingo' && self.connectionId === Math.min(...members.map((m) => m.connectionId))) ||
    ((kind === 'careers' || kind === 'connections') && !hostOnline && online[0] === mine)
  if (hostActions.has(action.name) && !canDrive) return unchanged
  if (['dropPlayer', 'startGame', 'applyStart'].includes(action.name) && actor !== host)
    return unchanged
  if (!lobbyActions.has(action.name) && actionScope(state) !== action.scope) return unchanged
  if (
    !lobbyActions.has(action.name) &&
    action.name !== 'startGame' &&
    action.name !== 'applyStart' &&
    action.name !== 'dropPlayer' &&
    fields.phase !== 'playing'
  )
    return unchanged
  if (['startGame', 'applyStart'].includes(action.name) && fields.phase !== 'lobby')
    return unchanged
  const args = structuredClone(action.args)
  if (action.name === 'claimHost') {
    if (typeof args[0] === 'number') args[0] = self.connectionId
    else if (record(args[0])) {
      args[0].id = self.connectionId
      args[0].config = cleanConfig(kind, args[0].config)
      // Fill missing defaults while cleaning the patch field by field.
      if (typeof fields.configJson === 'string')
        args[0].config = { ...JSON.parse(fields.configJson), ...(args[0].config as Fields) }
    }
  }
  if (action.name === 'setPlayerName' && record(args[0])) args[0].id = self.connectionId
  if (action.name === 'nextPuzzle' || action.name === 'nextCareer') {
    const rounds = JSON.parse(fields.roundStatesJson as string) as Record<
      string,
      { solved: boolean; out: boolean }
    >
    const done = online.length > 0 && online.every((id) => rounds[id]?.solved || rounds[id]?.out)
    if (
      !fields.roundClosed &&
      !(Number(fields.roundDeadline) > 0 && now >= Number(fields.roundDeadline)) &&
      !done
    )
      return unchanged
  }
  if (action.name === 'advanceCategory' || action.name === 'advanceLineupRoom') {
    const cfg = JSON.parse(fields.configJson as string)
    const found = JSON.parse(
      (fields.foundRanksJson ?? fields.foundSlotIdsJson) as string,
    ) as unknown[]
    const items = JSON.parse((fields.questionsJson ?? fields.lineupsJson) as string)
    const item = items[Number(fields.currentQuestionIndex ?? fields.currentLineupIndex)]
    if (!item) return unchanged
    const target =
      kind === 'tenable'
        ? tenableTarget(item)
        : item.slots.length + (cfg.includeManager && item.manager ? 1 : 0)
    if (
      found.length < target &&
      !everyoneOutOfLives(
        cfg.playMode ?? 'versus',
        parseUsedCounts(fields.livesLostJson as string),
        online,
        cfg.lives,
      )
    )
      return unchanged
  }
  if (
    action.name === 'skipTurn' &&
    record(args[0]) &&
    (!(Number(fields.turnDeadline) > 0) || now < Number(fields.turnDeadline))
  )
    return unchanged
  if (
    action.name === 'submitTurnGuess' &&
    Number(fields.turnDeadline) > 0 &&
    now >= Number(fields.turnDeadline)
  )
    return unchanged
  if (action.name === 'submitAnswer' && record(args[0])) {
    if (args[0].questionIndex !== fields.currentQuestionIndex) return unchanged
    if (
      JSON.parse(fields.configJson as string).multiplayerMechanic === 'turn-based' &&
      fields.currentTurnConnectionId !== self.connectionId
    )
      return unchanged
    const answers = (fields.playerAnswers as Map<string, string>).get(String(self.connectionId))
    const prev = JSON.parse(answers ?? '[]') as { questionIndex: number; correct: boolean }[]
    if (prev.some((a) => a.questionIndex === (args[0] as Fields).questionIndex)) return unchanged
    const q = JSON.parse(fields.questionsJson as string)[Number(fields.currentQuestionIndex)]
    if (!q) return unchanged
    const value = args[0].answerValue as string
    args[0].correct =
      q.type === 'true-false'
        ? value === String(q.correct)
        : q.type === 'stat-comparison'
        ? value === q.correctPlayerId
        : q.type === 'open-text'
        ? value.toLowerCase().trim() === q.correctPlayerName.toLowerCase().trim()
        : value === q.correctAnswer
    args[0].questionStartedAt = fields.questionStartedAt
    let streak = 0
    for (let i = prev.length - 1; i >= 0 && prev[i].correct; i--) streak++
    args[0].myStreak = streak
  }
  if (action.name === 'advanceTurnAndQuestion') {
    const ids = members.map((m) => m.connectionId).sort((a, b) => a - b)
    const i = ids.indexOf(fields.currentTurnConnectionId as number)
    args[0] = ids[(i + 1) % ids.length] ?? null
  }
  if (table[VALIDATE_ACTION]?.(state, { ...action, args }, self, members) === false)
    return unchanged
  const next = decodeStorage<S>(encodeStorage(state))
  const context: ActionContext<S> = {
    storage: {
      get: (key) => next[key],
      set: (key, value) => {
        next[key] = value
      },
    },
    self,
    myId: mine,
    online,
    now,
    seed,
  }
  try {
    const result = table[action.name](context, ...(args as never[]))
    return { state: encodeStorage(next) === encodeStorage(state) ? state : next, result }
  } catch {
    return unchanged
  }
}
