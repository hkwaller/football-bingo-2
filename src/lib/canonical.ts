import { getCanonicalName, getClubLogo, getDisplayName } from '@/data/clubs'
import { getCountryLogo } from '@/data/countries'
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
  if (kind === 'club') return getCanonicalName(label)
  return label
}

/** Club crest or national-team logo for a category label, if it has one */
export function categoryLogo(label: string): string | null {
  const kind = getCategoryKind(label)
  if (kind === 'club') return getClubLogo(label)
  if (kind === 'nationality') return getCountryLogo(label)
  return null
}

/** Short display label (e.g. frontend club nicknames) */
export function displayCategory(label: string): string {
  const kind = getCategoryKind(label)
  if (kind === 'club') return getDisplayName(label)
  return label
}
