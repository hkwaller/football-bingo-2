import type { CellPick } from '@/lib/cellPick'
import type { PlayMode } from '@/lib/playMode'

const KEY = 'football-bingo-solo-v1'

export type SoloPersisted = {
  seed: string
  solved: Record<string, CellPick>
  playMode?: PlayMode
  round?: number
}

export function loadSolo(): SoloPersisted | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as SoloPersisted
    if (typeof p.seed !== 'string' || typeof p.solved !== 'object' || !p.solved) {
      return null
    }
    return p
  } catch {
    return null
  }
}

export function saveSolo(state: SoloPersisted) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function clearSolo() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

export function soloToMap(solved: Record<string, CellPick>): Map<number, CellPick> {
  const m = new Map<number, CellPick>()
  for (const [k, v] of Object.entries(solved)) {
    const i = Number(k)
    if (Number.isInteger(i)) m.set(i, v)
  }
  return m
}

export function mapToSolo(solved: Map<number, CellPick>): Record<string, CellPick> {
  const o: Record<string, CellPick> = {}
  for (const [k, v] of solved) o[String(k)] = v
  return o
}
