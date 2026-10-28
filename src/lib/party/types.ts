export type GameKind = 'bingo' | 'trivia' | 'tenable' | 'eleven' | 'connections' | 'careers'
export type KickEvent = { type: 'kick'; id: string }
export type RoomMember<P = Record<string, unknown>> = {
  id: string
  connectionId: number
  presence: P
  info: { name: string }
}
export type StorageAccess<S> = {
  get<K extends keyof S>(key: K): S[K]
  set<K extends keyof S>(key: K, value: S[K]): void
}
export type ActionContext<S> = {
  storage: StorageAccess<S>
  myId: string
  self: RoomMember
  online: string[]
  now: number
  seed: string
}
export type RoomAction = {
  type: 'action'
  name: string
  args: unknown[]
  id: number
  scope: string
}
export type RoomMessage =
  | { type: 'state'; storage: string; members: RoomMember[]; me: number; ack?: number }
  | { type: 'event'; event: unknown }
  | { type: 'error'; message: string }

// Maps are exposed to existing selectors, but all durable and wire data is JSON.
export function encodeStorage(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (v instanceof Map ? { __roomMap: [...v] } : v))
}
export function decodeStorage<S>(value: string): S {
  return JSON.parse(value, (_key, v) =>
    v && typeof v === 'object' && Array.isArray(v.__roomMap) ? new Map(v.__roomMap) : v,
  ) as S
}
export function actionScope(storage: unknown): string {
  const s = storage as Record<string, unknown>
  return JSON.stringify([
    s.phase,
    s.seed,
    s.sessionId,
    s.currentIndex,
    s.currentQuestionIndex,
    s.currentLineupIndex,
    s.draftRound,
    s.turnDeadline,
  ])
}
export function gameKind(room: string): GameKind | null {
  const match =
    /^(?:(trivia|tenable|eleven|connections|careers)-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.exec(
      room,
    )
  return match ? ((match[1]?.toLowerCase() ?? 'bingo') as GameKind) : null
}

/** Optional game-specific validation used by both server and optimistic reducers. */
export const VALIDATE_ACTION = Symbol('validate-room-action')
