import { getClubCanonicalNames } from './clubs'
import { traits, managers } from './categoryLabels.generated'

export const nationalities = [
  'United States',
  'Argentina',
  'Belgium',
  'Brazil',
  'Canada',
  'Colombia',
  'Croatia',
  'Czech Republic',
  'Denmark',
  'Netherlands',
  'Egypt',
  'England',
  'France',
  'Germany',
  'Ghana',
  'Italy',
  "Cote d'Ivoire",
  'Japan',
  'Mexico',
  'Nigeria',
  'Poland',
  'Portugal',
  'Senegal',
  'Serbia',
  'South Korea',
  'Spain',
  'Sweden',
  'Uruguay',
  'Wales',
]

export const clubs = getClubCanonicalNames()

export const achievements = [
  'Premier League winner',
  'La Liga winner',
  'Bundesliga winner',
  'Serie A winner',
  'Ligue 1 winner',
  'Eredivisie winner',
  'Premier League top scorer',
  'La Liga top scorer',
  'Bundesliga top scorer',
  'Serie A top scorer',
  'Ligue 1 top scorer',
  'CL winner',
  'World Cup winner',
  "Ballon d'Or winner",
  '3+ domestic league titles',
  'FIFA World Player of the Year',
  'European Golden Boot winner',
  'Copa America champion',
  'African Cup of Nations winner',
  'African Footballer of the Year',
  'Euro champion',
  'Club World Cup winner',
  '100+ CL appearances',
  '500+ career goals',
  'UEFA Cup/Europa League winner',
  'Conference League winner',
  'CL winner with different clubs',
  'FA Cup winner',
  'Copa del Rey winner',
  'DFB-Pokal winner',
  'Coppa Italia winner',
  'Copa Libertadores winner',
  'League title in multiple countries',
  'CL top scorer',
  // ── Added 2026-07 ──
  'Domestic double',
  'Treble winner',
  '200+ career goals',
  '200+ career assists',
  'Nations League winner',
  // "Confederations Cup winner",
  'Olympic medalist',
  'UEFA Best Player in Europe',
  'Puskás Award winner',
]

/**
 * The "traits" and "managers" bingo axes are data-driven: only labels that at
 * least 8 players actually have, so no square is unwinnable. Precomputed by
 * scripts/writeDerivedPlayerData.ts (run as part of "npm run write-players") so
 * this module doesn't pull players.ts into client bundles.
 */
export { traits, managers }

export const categories = [...nationalities, ...clubs, ...achievements, ...traits, ...managers]
