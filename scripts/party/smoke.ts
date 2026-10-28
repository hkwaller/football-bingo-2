/** Local protocol integration check. Start `npm run party:dev` first. */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { signRoomTicket } from '../../src/lib/roomTicket'
import {
  actionScope,
  decodeStorage,
  type GameKind,
  type RoomMessage,
} from '../../src/lib/party/types'
import { boardConfigFromStorageFields } from '../../src/lib/boardConfig'
import { cellCategory, generateBoard } from '../../src/lib/board'
import { enrichedFootballPlayers } from '../../src/data/players'
import { playerMatchesCategory } from '../../src/lib/validation'
import { dealConnections } from '../../src/data/connections/bank'
import { dealCareers } from '../../src/data/careers/bank'

type State = Record<string, unknown>
async function main() {
  const host = process.env.PARTY_SMOKE_HOST ?? 'localhost:2001'
  const secret =
    process.env.PARTY_SECRET ??
    /^PARTY_SECRET=(.+)$/m.exec(
      await readFile(new URL('../../party/.dev.vars', import.meta.url), 'utf8'),
    )?.[1]
  assert.ok(secret, 'Set PARTY_SECRET or create party/.dev.vars')
  let serial = 0
  async function connect(room: string, id: string, config?: unknown) {
    const ticket = await signRoomTicket({ room, id, name: id }, secret!)
    const ws = new WebSocket(`ws://${host}/parties/room/${room}?ticket=${ticket}`)
    let latest: Extract<RoomMessage, { type: 'state' }> | null = null
    const listeners = new Set<() => void>()
    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(String(e.data))
      if (msg.type === 'state') latest = msg
      listeners.forEach((fn) => fn())
    })
    function wait(test: () => boolean) {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          listeners.delete(check)
          reject(new Error(`Timed out in ${room}`))
        }, 10000)
        const check = () => {
          if (test()) {
            clearTimeout(timeout)
            listeners.delete(check)
            resolve()
          }
        }
        listeners.add(check)
        check()
      })
    }
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve()
      ws.onerror = () => reject(new Error('Socket failed'))
    })
    ws.send(
      JSON.stringify({
        type: 'join',
        presence: { displayName: id, solvedCount: 0, solvedCells: [] },
        config,
      }),
    )
    await wait(() => latest !== null)
    return {
      ws,
      snapshot: () => latest!,
      state: () => decodeStorage<State>(latest!.storage),
      wait,
      async action(name: string, ...args: unknown[]) {
        const id = ++serial
        ws.send(
          JSON.stringify({ type: 'action', id, name, args, scope: actionScope(this.state()) }),
        )
        await wait(() => latest?.ack === id)
        return this.state()
      },
      async close() {
        if (ws.readyState === WebSocket.CLOSED) return
        await new Promise<void>((resolve) => {
          ws.onclose = () => resolve()
          ws.close(1000, 'Test complete')
        })
      },
    }
  }
  async function refused(room: string, ticket: string) {
    const ws = new WebSocket(`ws://${host}/parties/room/${room}?ticket=${ticket}`)
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Unauthorized handshake timed out')), 10000)
      ws.onopen = () => {
        clearTimeout(timer)
        ws.close(1000, 'Test complete')
        reject(new Error('Unauthorized socket accepted'))
      }
      ws.onerror = () => {
        clearTimeout(timer)
        resolve()
      }
    })
  }
  const roomId = () => crypto.randomUUID()
  const base = roomId()
  await refused(base, 'forged.ticket')
  await refused(base, await signRoomTicket({ room: roomId(), id: 'host', name: 'Host' }, secret))
  console.log('PASS: forged and wrong-room handshakes refused')

  for (const kind of (process.env.PARTY_SMOKE_GAMES?.split(',') ?? [
    'bingo',
    'trivia',
    'tenable',
    'eleven',
    'connections',
    'careers',
  ]) as GameKind[]) {
    const room = kind === 'bingo' ? roomId() : `${kind}-${roomId()}`
    const a = await connect(room, 'host', { boardLayout: 'shared', playMode: 'free', boardSize: 3 })
    const b = await connect(room, 'guest', { boardSize: 5, boardLayout: 'individual' })
    try {
      await a.wait(() => a.snapshot().members.length === 2)
      if (kind === 'bingo') {
        assert.equal(a.state().boardSize, 3, 'Only the first seat initializes Bingo settings')
        await a.action('claimHost', 999)
      } else
        await a.action('claimHost', {
          id: 999,
          displayName: 'Host',
          config: { questionCount: 1, lineupCount: 1, lives: 1, includeManager: false },
        })
      const before = a.state()
      await b.action(
        kind === 'bingo' ? 'applyStart' : 'startGame',
        ...(kind === 'bingo' ? [{ seed: 'unauthorized', supabaseGameId: null }] : []),
      )
      assert.equal(b.state().phase, 'lobby', `${kind}: guest cannot start`)
      if (kind === 'bingo') {
        await a.action('applyStart', { seed: 'smoke-game', supabaseGameId: null })
        const cfg = boardConfigFromStorageFields(
          a.state() as unknown as Parameters<typeof boardConfigFromStorageFields>[0],
        )
        const board = generateBoard('smoke-game', cfg)
        for (const cellIndex of [0, 1, 2]) {
          const category = cellCategory(board, cellIndex)!
          const player = enrichedFootballPlayers.find((p) => playerMatchesCategory(p, category))!
          assert.ok(player)
          await a.action('applySharedPick', {
            cellIndex,
            pick: { playerId: player.playerId, name: 'forged label' },
          })
        }
        await a.action('setFinished')
      } else if (kind === 'trivia') {
        await a.action('startGame')
        const q = JSON.parse(a.state().questionsJson as string)[0]
        const answerValue =
          q.type === 'true-false'
            ? String(q.correct)
            : q.type === 'stat-comparison'
            ? q.correctPlayerId
            : q.type === 'open-text'
            ? q.correctPlayerName
            : q.correctAnswer
        await b.wait(() => b.state().phase === 'playing')
        await b.action('submitAnswer', {
          answerValue,
          questionIndex: 0,
          correct: false,
          myStreak: 999,
        })
        assert.equal(
          JSON.parse(
            (b.state().playerAnswers as Map<string, string>).get(String(b.snapshot().me))!,
          )[0].correct,
          true,
        )
        await a.action('advanceQuestion')
      } else if (kind === 'tenable' || kind === 'eleven') {
        await a.action('startGame', ['forged-player'])
        await b.wait(() => b.state().phase === 'playing')
        for (let i = 0; i < 2; i++) {
          const current = a.state().currentTurnPlayerId
          const player = current === 'host' ? a : b
          await player.action('submitTurnGuess', {
            name: 'This is definitely not a footballer',
            ids: [],
          })
          await a.wait(() => a.state().currentTurnPlayerId !== current || i === 1)
        }
        await a.action(kind === 'tenable' ? 'advanceCategory' : 'advanceLineupRoom')
      } else {
        const dealt =
          kind === 'connections' ? dealConnections('easy', 2, 1) : dealCareers('easy', 1)
        await a.action('startGame', dealt)
        await b.wait(() => b.state().phase === 'playing')
        await a.action('giveUpMutation', ['forged-player'])
        const item = dealt[0]
        const guess = 'answers' in item ? item.answers[0].name : item.name
        await b.action('guessMutation', { guess, ids: [], known: {} })
        await a.wait(() => a.state().roundClosed === true)
        await a.action(kind === 'connections' ? 'nextPuzzle' : 'nextCareer', 0)
      }
      assert.equal(a.state().phase, 'finished', `${kind}: full game completes`)
      const seat = a.snapshot().me
      const finished = a.snapshot().storage
      await a.close()
      const rejoined = await connect(room, 'host')
      assert.equal(rejoined.snapshot().me, seat, `${kind}: reload retains seat`)
      assert.equal(rejoined.snapshot().storage, finished, `${kind}: reload retains state`)
      assert.equal(
        kind === 'bingo' || kind === 'trivia' ? before.hostConnectionId : before.hostPlayerId,
        kind === 'bingo' || kind === 'trivia' ? seat : 'host',
      )
      if (kind === 'careers') {
        const kicked = new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Kick event missing')), 5000)
          b.ws.addEventListener('message', (event) => {
            const msg = JSON.parse(String(event.data))
            if (msg.type === 'event' && msg.event?.type === 'kick' && msg.event.id === 'guest') {
              clearTimeout(timer)
              resolve()
            }
          })
        })
        rejoined.ws.send(JSON.stringify({ type: 'event', event: { type: 'kick', id: 'guest' } }))
        await kicked
        await b.close()
        const ticket = await signRoomTicket({ room, id: 'guest', name: 'Guest' }, secret!)
        await refused(room, ticket)
        console.log('PASS: host kick event and banned-seat reconnect rejection')
      }
      await rejoined.close()
      console.log(
        `PASS: ${kind} full game, guest permission, persisted state and stable reconnect seat`,
      )
    } finally {
      await a.close()
      await b.close()
    }
  }
}
void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
