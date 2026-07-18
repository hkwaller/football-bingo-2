import {
  achievements,
  clubs,
  managers,
  nationalities,
  traits,
} from '@/data/categories'

export type BoardCategoryKinds = {
  nationalities: boolean
  clubs: boolean
  achievements: boolean
  traits: boolean
  managers: boolean
}

export type BoardConfig = {
  size: 3 | 4 | 5
  categoryKinds: BoardCategoryKinds
  /** Only players with fameScore >= this are eligible to be drawn. 0 = no filter. */
  minFameScore: number
}

/** Fame scores in the dataset run ~0.7–90. */
export const MAX_FAME_SCORE = 90

export const DEFAULT_BOARD_CONFIG: BoardConfig = {
  size: 5,
  categoryKinds: {
    nationalities: true,
    clubs: true,
    achievements: true,
    traits: true,
    managers: true,
  },
  minFameScore: 0,
}

function clampFameScore(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0
  if (raw < 0) return 0
  if (raw > MAX_FAME_SCORE) return MAX_FAME_SCORE
  return raw
}

export type StorageBoardFields = {
  boardSize: 3 | 4 | 5
  categoryNationalities: boolean
  categoryClubs: boolean
  categoryAchievements: boolean
  categoryTraits: boolean
  categoryManagers: boolean
  minFameScore?: number
}

export function boardConfigFromStorageFields(f: StorageBoardFields): BoardConfig {
  return {
    size: f.boardSize,
    categoryKinds: {
      nationalities: f.categoryNationalities,
      clubs: f.categoryClubs,
      achievements: f.categoryAchievements,
      traits: f.categoryTraits,
      managers: f.categoryManagers,
    },
    minFameScore: clampFameScore(f.minFameScore),
  }
}

export function boardConfigKey(c: BoardConfig): string {
  return JSON.stringify({
    size: c.size,
    categoryKinds: {
      achievements: c.categoryKinds.achievements,
      clubs: c.categoryKinds.clubs,
      managers: c.categoryKinds.managers,
      nationalities: c.categoryKinds.nationalities,
      traits: c.categoryKinds.traits,
    },
  })
}

export function categoryPoolForConfig(config: BoardConfig): string[] {
  const out: string[] = []
  if (config.categoryKinds.nationalities) out.push(...nationalities)
  if (config.categoryKinds.clubs) out.push(...clubs)
  if (config.categoryKinds.achievements) out.push(...achievements)
  if (config.categoryKinds.traits) out.push(...traits)
  if (config.categoryKinds.managers) out.push(...managers)
  return out
}

export function cellCountForConfig(config: BoardConfig): number {
  return config.size * config.size
}

export function categoriesRequired(config: BoardConfig): number {
  return cellCountForConfig(config) - 1
}

export function isBoardConfigViable(config: BoardConfig): boolean {
  return categoryPoolForConfig(config).length >= categoriesRequired(config)
}

function isSize(n: unknown): n is 3 | 4 | 5 {
  return n === 3 || n === 4 || n === 5
}

export function parseBoardConfig(raw: unknown): BoardConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!isSize(o.size)) return null
  const k = o.categoryKinds
  if (!k || typeof k !== 'object') return null
  const ko = k as Record<string, unknown>
  const nationalities = ko.nationalities === true
  const clubs = ko.clubs === true
  const achievements = ko.achievements === true
  const traits = ko.traits === true
  const managers = ko.managers === true
  if (!nationalities && !clubs && !achievements && !traits && !managers) return null
  return {
    size: o.size,
    categoryKinds: { nationalities, clubs, achievements, traits, managers },
    minFameScore: clampFameScore(o.minFameScore),
  }
}

export function boardConfigPayload(c: BoardConfig) {
  return {
    size: c.size,
    categoryKinds: { ...c.categoryKinds },
    minFameScore: c.minFameScore,
  }
}
