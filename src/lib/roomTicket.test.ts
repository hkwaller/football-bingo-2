import { test } from 'node:test'
import assert from 'node:assert/strict'
import { signRoomTicket, verifyRoomTicket, roomPlayerIdentity } from './roomTicket'

test('room tickets authenticate the room, signature, expiry, and exact token framing', async () => {
  const secret = 'test-secret-which-is-not-used-in-production'
  const token = await signRoomTicket(
    { room: 'room-a', id: 'guest:tab', name: 'Guest' },
    secret,
    60,
    1000,
  )
  assert.deepEqual(await verifyRoomTicket(token, 'room-a', secret, 2000), {
    id: 'guest:tab',
    name: 'Guest',
  })
  assert.equal(await verifyRoomTicket(token, 'room-b', secret, 2000), null)
  assert.equal(await verifyRoomTicket(token, 'room-a', 'other-secret', 2000), null)
  assert.equal(await verifyRoomTicket(token, 'room-a', secret, 62000), null)
  assert.equal(await verifyRoomTicket(token + '.extra', 'room-a', secret, 2000), null)
  assert.equal(await verifyRoomTicket('forged.ticket', 'room-a', secret), null)
})

test('room player IDs are stable, private, and separate for each tab and identity', async () => {
  const id = await roomPlayerIdentity('anon:private-guest-id', 'tab-a', 'test-secret')
  assert.equal(id, await roomPlayerIdentity('anon:private-guest-id', 'tab-a', 'test-secret'))
  assert.notEqual(id, await roomPlayerIdentity('anon:private-guest-id', 'tab-b', 'test-secret'))
  assert.notEqual(id, await roomPlayerIdentity('another-user', 'tab-a', 'test-secret'))
  assert.equal(id.includes('private-guest-id'), false)
  assert.notEqual(id, await roomPlayerIdentity(id, 'tab-a', 'test-secret'))
})
