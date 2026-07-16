import { getClubCanonicalNames } from './clubs'
import { enrichedFootballPlayers } from './players'

export const nationalities = [
  "United States",
  "Argentina",
  "Belgium",
  "Brazil",
  "Canada",
  "Colombia",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Netherlands",
  "Egypt",
  "England",
  "France",
  "Germany",
  "Ghana",
  "Italy",
  "Cote d'Ivoire",
  "Japan",
  "Mexico",
  "Nigeria",
  "Poland",
  "Portugal",
  "Senegal",
  "Serbia",
  "South Korea",
  "Spain",
  "Sweden",
  "Uruguay",
  "Wales",
];

export const clubs = getClubCanonicalNames()

export const achievements = [
  "Premier League winner",
  "La Liga winner",
  "Bundesliga winner",
  "Serie A winner",
  "Ligue 1 winner",
  "Eredivisie winner",
  "Premier League top scorer",
  "La Liga top scorer",
  "Bundesliga top scorer",
  "Serie A top scorer",
  "Ligue 1 top scorer",
  "Champions League winner",
  "World Cup winner",
  "Ballon d'Or winner",
  "3+ domestic league titles",
  "FIFA World Player of the Year",
  "European Golden Boot winner",
  "Copa America champion",
  "African Cup of Nations winner",
  "African Footballer of the Year",
  "Euro champion",
  "Club World Cup winner",
  "100+ Champions League appearances",
  "500+ career goals",
  "UEFA Cup/Europa League winner",
  "Conference League winner",
  "Champions League winner with different clubs",
  "FA Cup winner",
  "Copa del Rey winner",
  "DFB-Pokal winner",
  "Coppa Italia winner",
  "Copa Libertadores winner",
  "League title in multiple countries",
  "Champions League top scorer",
  // ── Added 2026-07 ──
  "Domestic double",
  "Treble winner",
  "200+ career goals",
  "200+ career assists",
  "Nations League winner",
  "Confederations Cup winner",
  "Olympic medalist",
  "UEFA Best Player in Europe",
  "Puskás Award winner",
];

/**
 * The "traits" and "managers" bingo axes are data-driven: we surface only the
 * labels that at least MIN_PER_CATEGORY players actually have, so no square is
 * unwinnable. They repopulate automatically whenever players.ts is regenerated.
 */
const MIN_PER_CATEGORY = 8

function labelsWithMinCount(
  selector: (p: (typeof enrichedFootballPlayers)[number]) => string[] | undefined,
  min: number,
): string[] {
  const counts = new Map<string, number>()
  for (const p of enrichedFootballPlayers) {
    for (const label of selector(p) ?? []) {
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= min)
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label)
}

export const traits = labelsWithMinCount((p) => (p as { tags?: string[] }).tags, MIN_PER_CATEGORY)
export const managers = labelsWithMinCount((p) => (p as { managers?: string[] }).managers, MIN_PER_CATEGORY)

export const categories = [
  ...nationalities,
  ...clubs,
  ...achievements,
  ...traits,
  ...managers,
];
