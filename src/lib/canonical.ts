import {
  toBackendClubName,
  toFrontendClubName,
} from '@/data/clubMapping'
import { achievements, clubs, nationalities } from '@/data/categories'

const nationalitySet = new Set(nationalities)
const achievementSet = new Set(achievements)
const clubSet = new Set(clubs)

export type CategoryKind = 'nationality' | 'club' | 'achievement'

export function getCategoryKind(label: string): CategoryKind | null {
  if (nationalitySet.has(label)) return 'nationality'
  if (clubSet.has(label)) return 'club'
  if (achievementSet.has(label)) return 'achievement'
  return null
}

/** Backend/canonical form for matching against player rows */
export function canonicalizeCategory(label: string): string {
  const kind = getCategoryKind(label)
  if (kind === 'club') return toBackendClubName(label)
  return label
}

/** Short display label (e.g. frontend club nicknames) */
export function displayCategory(label: string): string {
  const kind = getCategoryKind(label)
  if (kind === 'club') return toFrontendClubName(label)
  return label
}
