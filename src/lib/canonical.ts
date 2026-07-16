import { getCanonicalName, getClubLogo, getDisplayName } from '@/data/clubs'
import { getCountryLogo } from '@/data/countries'
import { achievements, clubs, managers, nationalities, traits } from '@/data/categories'

const nationalitySet = new Set(nationalities)
const achievementSet = new Set(achievements)
const clubSet = new Set(clubs)
const traitSet = new Set(traits)
const managerSet = new Set(managers)

export type CategoryKind = 'nationality' | 'club' | 'achievement' | 'trait' | 'manager'

export function getCategoryKind(label: string): CategoryKind | null {
  if (nationalitySet.has(label)) return 'nationality'
  if (clubSet.has(label)) return 'club'
  if (achievementSet.has(label)) return 'achievement'
  if (traitSet.has(label)) return 'trait'
  if (managerSet.has(label)) return 'manager'
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
