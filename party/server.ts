import {
  routePartykitRequest,
  Server,
  type Connection,
  type ConnectionContext,
  type WSMessage,
} from 'partyserver'
import { verifyRoomTicket } from '../src/lib/roomTicket'
import { initialStorage, actionsFor } from '../src/lib/party/registry'
import { applyRoomAction, parseAction } from '../src/lib/party/reducer'
import { cleanConfig } from '../src/lib/party/config'
import {
  decodeStorage,
  encodeStorage,
  gameKind,
  type GameKind,
  type RoomMember,
  type RoomMessage,
} from '../src/lib/party/types'
import { buildPuzzle, connectionsBankNames } from '../src/data/connections/bank'
import { careerPlayers } from '../src/data/careers/bank'
import { normalize } from '../src/lib/tenable/normalize'

type Env = { Room: DurableObjectNamespace<Room>; PARTY_SECRET: string }
type Who = { id: string; name: string; joined?: boolean }
type Saved = {
  storage: string
  seats: Record<string, RoomMember>
  nextSeat: number
  banned: string[]
}
const IDLE_MS = 24 * 60 * 60 * 1000
const knownNames = new Set(connectionsBankNames.map(normalize))
const careersById = new Map(careerPlayers.map((p) => [p.id, p]))

function cleanPresence(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const input = value as Record<string, unknown>,
    result: Record<string, unknown> = {}
  if (typeof input.displayName === 'string') result.displayName = input.displayName.slice(0, 60)
  for (const key of [
    'bingoAt',
    'guesses',
    'solvedCount',
    'actedRound',
    'lastActionAt',
    'score',
    'streak',
  ]) {
    const v = input[key]
    if (v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e15))
      result[key] = v
  }
  if (typeof input.answeredCurrentQuestion === 'boolean')
    result.answeredCurrentQuestion = input.answeredCurrentQuestion
  if (input.lastAction === null || ['correct', 'wrong', 'skip'].includes(String(input.lastAction)))
    result.lastAction = input.lastAction
  if (
    Array.isArray(input.solvedCells) &&
    input.solvedCells.length <= 25 &&
    input.solvedCells.every((v) => Number.isInteger(v) && v >= 0 && v < 25)
  )
    result.solvedCells = input.solvedCells
  return result
}

/** One authoritative, hibernating Durable Object per game room. */
export class Room extends Server<Env> {
  static options = { hibernate: true }
  kind!: GameKind
  game: object = {}
  seats: Record<string, RoomMember> = {}
  nextSeat = 1
  banned: string[] = []

  async onStart() {
    this.kind = gameKind(this.name) ?? 'bingo'
    const saved = await this.ctx.storage.get<Saved>('room')
    this.game = saved ? decodeStorage(saved.storage) : initialStorage[this.kind]()
    this.seats = saved?.seats ?? {}
    this.nextSeat = saved?.nextSeat ?? 1
    this.banned = saved?.banned ?? []
  }

  // Persisted removals must be refused before upgrading, including after hibernation.
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const banned = await this.ctx.storage.get<string[]>('banned')
      if (banned?.length) {
        const url = new URL(request.url)
        const room = url.pathname.split('/').pop() ?? ''
        const who = await verifyRoomTicket(
          url.searchParams.get('ticket') ?? '',
          room,
          this.env.PARTY_SECRET,
        )
        if (!who || banned.includes(who.id)) return new Response('Unauthorized', { status: 401 })
      }
    }
    return super.fetch(request)
  }

  async onConnect(conn: Connection<Who>, ctx: ConnectionContext) {
    const ticket = new URL(ctx.request.url).searchParams.get('ticket') ?? ''
    const who = this.env.PARTY_SECRET
      ? await verifyRoomTicket(ticket, this.name, this.env.PARTY_SECRET)
      : null
    if (!who || this.banned.includes(who.id)) return conn.close(4001, 'Unauthorized')
    conn.setState(who)
  }

  async onMessage(conn: Connection<Who>, raw: WSMessage) {
    if (
      typeof raw !== 'string' ||
      raw.length > 500_000 ||
      !conn.state ||
      this.banned.includes(conn.state.id)
    )
      return
    let value: Record<string, unknown>
    try {
      value = JSON.parse(raw)
      if (!value || typeof value !== 'object' || Array.isArray(value)) return
    } catch {
      return
    }
    // No async work between reading and updating game state. Persist before acknowledging.
    const who = conn.state
    if (value.type === 'join') {
      if (!this.seats[who.id]) {
        this.seats[who.id] = {
          id: who.id,
          connectionId: this.nextSeat++,
          presence: { ...cleanPresence(value.presence), playerId: who.id },
          info: { name: who.name },
        }
        if (this.kind === 'bingo' && this.seats[who.id].connectionId === 1) {
          Object.assign(this.game, cleanConfig('bingo', value.config))
        }
      }
      conn.setState({ ...who, joined: true })
      await this.save()
      this.push()
      return
    }
    const self = this.seats[who.id]
    if (!who.joined || !self) return
    if (value.type === 'presence') {
      self.presence = { ...self.presence, ...cleanPresence(value.presence), playerId: who.id }
      await this.save()
      this.push()
      return
    }
    if (value.type === 'event') {
      const event = value.event as Record<string, unknown> | undefined
      if (!event || typeof event !== 'object') return
      const f = this.game as Record<string, unknown>
      const host =
        this.kind === 'bingo' || this.kind === 'trivia'
          ? self.connectionId === f.hostConnectionId
          : who.id === f.hostPlayerId
      if (event.type === 'kick' && host && typeof event.id === 'string') {
        const target = Object.values(this.seats).find(
          (s) => s.id === event.id || String(s.connectionId) === event.id,
        )
        if (!target || target.id === self.id) return
        this.banned.push(target.id)
        this.broadcast(JSON.stringify({ type: 'event', event: { type: 'kick', id: event.id } }))
        for (const c of this.getConnections<Who>())
          if (c.state?.id === target.id) c.close(4003, 'Removed by host')
        await this.save()
        this.push()
      }
      // Bingo's placement events are emitted below from accepted actions.
      return
    }
    const action = parseAction(value)
    if (!action) return
    const reject = () => this.push(undefined, { conn: conn.id, id: action.id })
    // Resolve dealt items from our own banks, never client-supplied answers or points.
    if (action.name === 'startGame' && (this.kind === 'connections' || this.kind === 'careers')) {
      const dealt = action.args[0]
      if (!Array.isArray(dealt) || !dealt.length || dealt.length > 20) return reject()
      if (this.kind === 'careers') {
        const canonical = dealt.map((p) => careersById.get(p?.id))
        if (canonical.some((p) => !p)) return reject()
        action.args[0] = canonical
      } else {
        const canonical = dealt.map((p) => {
          if (typeof p?.id !== 'string' || !/^\d+(?:\+\d+){1,2}$/.test(p.id)) return null
          const puzzle = buildPuzzle(
            p.id.split('+'),
            ['easy', 'medium', 'hard'].includes(p.difficulty) ? p.difficulty : 'medium',
          )
          return puzzle.answers.length ? puzzle : null
        })
        if (canonical.some((p) => !p)) return reject()
        action.args[0] = canonical
      }
    }
    if (this.kind === 'connections' && action.name === 'guessMutation') {
      ;(action.args[0] as Record<string, unknown>).known = knownNames
    }
    const next = applyRoomAction(
      this.kind,
      this.game,
      actionsFor(this.kind),
      action,
      self,
      this.online(),
      Date.now(),
      crypto.randomUUID(),
    )
    const changed = next.state !== this.game
    this.game = next.state
    if (changed) {
      if (this.kind === 'bingo' && action.name === 'applyStart') {
        for (const seat of Object.values(this.seats))
          seat.presence = {
            ...seat.presence,
            guesses: 0,
            solvedCount: 0,
            solvedCells: [],
            bingoAt: null,
            actedRound: null,
            lastAction: null,
            lastActionAt: null,
          }
      }
      await this.save()
    }
    // Ack rejected/no-op actions too, so optimistic state always reconciles.
    this.push(undefined, { conn: conn.id, id: action.id })
    if (changed && this.kind === 'bingo' && action.name === 'resolveDraftRound') {
      const p = action.args[0] as { skip: boolean; cellIndex?: number; pick?: unknown }
      const event = p.skip
        ? { type: 'draft_skip' }
        : { type: 'draft_place', cellIndex: p.cellIndex, pick: p.pick }
      this.broadcast(JSON.stringify({ type: 'event', event }), [conn.id])
    }
  }

  onClose(conn: Connection<Who>) {
    this.push(conn.id)
  }
  onError(conn: Connection<Who>) {
    this.push(conn.id)
  }

  online(closing?: string): RoomMember[] {
    const ids = new Set(
      [...this.getConnections<Who>()]
        .filter((c) => c.id !== closing && c.state?.joined && !this.banned.includes(c.state.id))
        .map((c) => c.state!.id),
    )
    return [...ids].map((id) => this.seats[id]).filter(Boolean)
  }
  push(closing?: string, ack?: { conn: string; id: number }) {
    const members = this.online(closing),
      storage = encodeStorage(this.game)
    for (const c of this.getConnections<Who>()) {
      if (c.id === closing || !c.state?.joined || !this.seats[c.state.id]) continue
      const msg: RoomMessage = {
        type: 'state',
        storage,
        members,
        me: this.seats[c.state.id].connectionId,
        ...(ack?.conn === c.id ? { ack: ack.id } : {}),
      }
      c.send(JSON.stringify(msg))
    }
  }
  async save() {
    const room: Saved = {
      storage: encodeStorage(this.game),
      seats: this.seats,
      nextSeat: this.nextSeat,
      banned: this.banned,
    }
    await this.ctx.storage.put({ room, banned: this.banned })
    await this.ctx.storage.setAlarm(Date.now() + IDLE_MS)
  }
  async onAlarm() {
    // A connected, idle room is still live. Wipe only after everyone has left.
    if (this.online().length) {
      await this.ctx.storage.setAlarm(Date.now() + IDLE_MS)
      return
    }
    await this.ctx.storage.deleteAll()
    this.game = initialStorage[this.kind]()
    this.seats = {}
    this.nextSeat = 1
    this.banned = []
  }
}

export default {
  async fetch(req, env) {
    return (
      (await routePartykitRequest(req, env, {
        onBeforeConnect: async (request, lobby) => {
          const ticket = new URL(request.url).searchParams.get('ticket') ?? ''
          if (
            !gameKind(lobby.name) ||
            !env.PARTY_SECRET ||
            !(await verifyRoomTicket(ticket, lobby.name, env.PARTY_SECRET))
          )
            return new Response('Unauthorized', { status: 401 })
        },
        onBeforeRequest: () => new Response('Not found', { status: 404 }),
      })) ?? new Response('Not found', { status: 404 })
    )
  },
} satisfies ExportedHandler<Env>
