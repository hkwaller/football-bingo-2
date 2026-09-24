/**
 * Match a typed name against the slots + optional manager of a lineup.
 * Uses the same normalize() as Tenable so special characters are handled
 * without typing - "subasic" matches "Subašić".
 */
import type { Famous11sLineup } from '@/data/famous11s'
import { normalize } from '@/lib/tenable/normalize'
import type { GuessOutcome } from './types'

export { normalize }

export function matchSlot(
  input: string,
  lineup: Famous11sLineup,
  foundSlotIds: readonly string[],
  includeManager: boolean,
): GuessOutcome {
  const key = normalize(input)
  if (!key) return { kind: 'wrong' }

  // Check player slots first.
  for (const slot of lineup.slots) {
    const candidates = [slot.name, ...(slot.aliases ?? [])].map(normalize)
    if (candidates.includes(key)) {
      if (foundSlotIds.includes(slot.slotId)) {
        return { kind: 'already-found', slotId: slot.slotId, name: slot.name }
      }
      return { kind: 'correct', slotId: slot.slotId, name: slot.name }
    }
  }

  // Check manager if enabled.
  if (includeManager && lineup.manager) {
    const m = lineup.manager
    const candidates = [m.name, ...(m.aliases ?? [])].map(normalize)
    if (candidates.includes(key)) {
      if (foundSlotIds.includes('manager')) {
        return { kind: 'already-found', slotId: 'manager', name: m.name }
      }
      return { kind: 'correct', slotId: 'manager', name: m.name }
    }
  }

  return { kind: 'wrong' }
}
