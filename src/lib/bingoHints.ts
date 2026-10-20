export const BINGO_PLACEMENT_POINTS = 100
export const BINGO_HINT_COST = 50

export function bingoPoints(placements: number, purchases: number): number {
  return Math.max(0, placements * BINGO_PLACEMENT_POINTS - purchases * BINGO_HINT_COST)
}

/** The player is part of the key because a resumed draw may be resolved again. */
export function bingoHintKey(seed: string, round: number, playerId: string): string {
  return JSON.stringify([seed, round, playerId])
}

export function canBuyBingoHint(points: number, alreadyPurchased: boolean): boolean {
  return alreadyPurchased || points >= BINGO_HINT_COST
}

export function bingoHintCount(keys: Iterable<string>, seed: string): number {
  const prefix = JSON.stringify([seed]).slice(0, -1) + ','
  let count = 0
  for (const key of keys) if (key.startsWith(prefix)) count++
  return count
}
