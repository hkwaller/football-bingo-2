import { boardConfigFromStorageFields, isBoardConfigViable } from '../boardConfig'
import { cellCategory, freeIndexForConfig, generateBoard, hasBingoForConfig } from '../board'
import { validateCellAnswer } from '../validation'
import type { GameStorage } from './bingoModel'
import type { RoomAction, RoomMember } from './types'

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/** Bingo's bank-dependent validation stays out of the other games' client bundles. */
export function validateBingoAction(
  state: GameStorage,
  action: RoomAction,
  self: RoomMember,
  members: RoomMember[],
): boolean {
  const args = action.args
  const game = state
  const cfg = boardConfigFromStorageFields(game)
  if (action.name === 'applyStart' && !isBoardConfigViable(cfg)) return false
  if (
    action.name === 'advanceDraftRound' &&
    !members.every((m) => Number(m.presence.actedRound ?? -1) >= game.draftRound)
  )
    return false
  if (
    action.name === 'castDraftVoteWithSelf' &&
    (game.playMode !== 'draft' || game.boardLayout !== 'shared')
  )
    return false
  if (action.name === 'resolveDraftRound' && record(args[0])) {
    const p = args[0]
    if (p.layout !== game.boardLayout) return false
    if (
      !members.every((m) => {
        const vote = game.draftVotes.get(String(m.connectionId))
        return p.skip
          ? vote?.type === 'skip'
          : vote?.type === 'square' && vote.cellIndex === p.cellIndex
      })
    )
      return false
  }
  if (
    (action.name === 'applySharedPick' || action.name === 'resolveDraftRound') &&
    record(args[0]) &&
    !args[0].skip
  ) {
    const p = args[0]
    if (
      game.boardLayout !== 'shared' ||
      (action.name === 'applySharedPick' && game.playMode !== 'free')
    )
      return false
    const cellIndex = Number(p.cellIndex)
    if (game.sharedSolved.has(String(cellIndex))) return false
    const category = cellCategory(generateBoard(game.seed, cfg), cellIndex)
    if (!category || !record(p.pick)) return false
    const verdict = validateCellAnswer(category, p.pick.playerId as string)
    if (!verdict.ok) return false
    p.pick = {
      playerId: verdict.player.playerId,
      name: verdict.player.name,
      imageUrl: verdict.player.imageUrl,
    }
  }
  if (action.name === 'setFinished') {
    const solved =
      game.boardLayout === 'shared'
        ? [...game.sharedSolved.keys()].map(Number)
        : (self.presence.solvedCells as number[]) ?? []
    const cells = new Set(solved)
    cells.add(freeIndexForConfig(cfg))
    if (!hasBingoForConfig(cells, cfg)) return false
  }

  return true
}
