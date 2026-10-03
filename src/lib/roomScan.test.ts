import assert from 'node:assert/strict'
import { test } from 'node:test'

import { roomPathFromScan } from './roomScan'

const id = '3f2c1a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f'

test('accepts every room invite', () => {
  assert.equal(roomPathFromScan(`https://bingo.playam.app/room/${id}`), `/room/${id}`)
  assert.equal(
    roomPathFromScan(`https://www.footballbingo.cc/trivia/room/${id}`),
    `/trivia/room/${id}`,
  )
  assert.equal(
    roomPathFromScan(`https://bingo.playam.app/tenable/room/${id}/`),
    `/tenable/room/${id}`,
  )
  assert.equal(
    roomPathFromScan(`http://localhost:3000/famous-11s/room/${id}`),
    `/famous-11s/room/${id}`,
  )
  assert.equal(
    roomPathFromScan(`  https://bingo.playam.app/room/${id.toUpperCase()}  `),
    `/room/${id}`,
  )
})

test('drops query and hash', () => {
  assert.equal(roomPathFromScan(`https://bingo.playam.app/room/${id}?x=1#y`), `/room/${id}`)
})

test('rejects anything else', () => {
  assert.equal(roomPathFromScan(id), null)
  assert.equal(roomPathFromScan(''), null)
  assert.equal(roomPathFromScan('https://bingo.playam.app/'), null)
  assert.equal(roomPathFromScan('https://bingo.playam.app/room/new'), null)
  assert.equal(roomPathFromScan(`https://bingo.playam.app/room/${id}/extra`), null)
  assert.equal(roomPathFromScan(`https://bingo.playam.app/darts/room/${id}`), null)
  assert.equal(roomPathFromScan(`javascript:alert(1)//room/${id}`), null)
  assert.equal(roomPathFromScan('WIFI:S:home;T:WPA;P:secret;;'), null)
})

test('accepts prefixed room ids (trivia, tenable, famous 11s, careers)', () => {
  for (const path of [
    `/trivia/room/trivia-${id}`,
    `/tenable/room/tenable-${id}`,
    `/famous-11s/room/eleven-${id}`,
    `/careers/room/careers-${id}`,
  ]) {
    assert.equal(roomPathFromScan(`https://footballbingo.cc${path}`), path)
  }
})
