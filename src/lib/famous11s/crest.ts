import { getCanonicalName, getClubLogo } from '@/data/clubs'
import { getCountryLogo } from '@/data/countries'

/** Historic names that resolve to a current flag file. */
const COUNTRY_ALIASES: Record<string, string> = {
  'West Germany': 'Germany',
}

/**
 * Crest or flag for a Famous 11s side/opponent name.
 * Tries national-team flags first, then club logos (canonical + aliases).
 */
export function lineupCrest(name: string): string | null {
  const countryName = COUNTRY_ALIASES[name] ?? name
  const flag = getCountryLogo(countryName)
  if (flag) return flag

  const direct = getClubLogo(name)
  if (direct) return direct

  const canonical = getCanonicalName(name)
  if (canonical !== name) return getClubLogo(canonical)
  return null
}
