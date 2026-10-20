import assert from 'node:assert/strict'
import test from 'node:test'
import { createSpaceToSkipHandler } from './spaceToSkip'

function press({ board = false, interactive = false, modal = false, repeat = false, composing = false, editable = false, prevented = false, ctrl = false } = {}) {
  let skips = 0
  let consumed = false
  const control = { matches: (selector: string) => board && selector === '.bingo-cell' }
  const event = {
    key: ' ', code: 'Space', repeat, isComposing: composing, defaultPrevented: prevented,
    altKey: false, ctrlKey: ctrl, metaKey: false, shiftKey: false,
    target: { isContentEditable: editable, closest: () => interactive ? control : null },
    preventDefault: () => { consumed = true },
  } as unknown as KeyboardEvent
  const root = { querySelector: () => modal ? {} : null } as unknown as Pick<Document, 'querySelector'>
  createSpaceToSkipHandler(() => { skips += 1 }, root)(event)
  return { skips, consumed }
}

test('Space skips when a clicked bingo square or its contents retains focus', () => {
  assert.deepEqual(press({ board: true, interactive: true }), { skips: 1, consumed: true })
})

test('Space skips from the game background', () => {
  assert.deepEqual(press(), { skips: 1, consumed: true })
})

test('other buttons and fields retain native Space activation', () => {
  assert.deepEqual(press({ interactive: true }), { skips: 0, consumed: false })
})

test('dialogs, typing, held keys, composition and modified shortcuts never skip', () => {
  for (const options of [{ modal: true }, { repeat: true }, { composing: true }, { editable: true }, { prevented: true }, { ctrl: true }]) {
    assert.deepEqual(press({ board: true, interactive: true, ...options }), { skips: 0, consumed: false })
  }
})
