import type { BoardCell } from '@/lib/board'
import { type CategoryKind, categoryLogo, displayCategory, getCategoryKind } from '@/lib/canonical'

/**
 * Everything a board square needs to draw itself, resolved up front. Keeps
 * BingoBoardView free of the category data (which pulls in the player file).
 */
export type BingoCellView =
  | { kind: 'free' }
  | { kind: 'category'; label: string; display: string; logo: string | null; catKind: CategoryKind | null }

export function toBingoCellView(cell: BoardCell): BingoCellView {
  if (cell.kind === 'free') return cell
  return {
    kind: 'category',
    label: cell.label,
    display: displayCategory(cell.label),
    logo: categoryLogo(cell.label),
    catKind: getCategoryKind(cell.label),
  }
}
