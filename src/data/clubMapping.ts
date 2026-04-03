// This maps from your frontend club names to the backend's more specific names
export const frontendToBackendClubMap: Record<string, string> = {
  'Manchester United': 'Manchester United',
  Liverpool: 'Liverpool FC',
  'Real Madrid': 'Real Madrid',
  Barcelona: 'FC Barcelona',
  'Bayern Munich': 'Bayern Munich',
  PSG: 'Paris Saint-Germain',
  'Manchester City': 'Manchester City',
  Chelsea: 'Chelsea FC',
  Juventus: 'Juventus FC',
  Arsenal: 'Arsenal FC',
  'AC Milan': 'AC Milan',
  'Inter Milan': 'Inter Milan',
  'Borussia Dortmund': 'Borussia Dortmund',
  'Atletico Madrid': 'Atlético de Madrid',
  Ajax: 'Ajax Amsterdam',
  Porto: 'FC Porto',
  Benfica: 'SL Benfica',
  Celtic: 'Celtic FC',
  Rangers: 'Rangers FC',
  Napoli: 'SSC Napoli',
  Tottenham: 'Tottenham Hotspur',
  'Boca Juniors': 'CA Boca Juniors',
  'River Plate': 'CA River Plate',
  Marseille: 'Olympique Marseille',
  Lyon: 'Olympique Lyon',
  'AS Roma': 'AS Roma',
  Everton: 'Everton FC',
  'Aston Villa': 'Aston Villa',
  Monaco: 'AS Monaco',
  'West Ham': 'West Ham United',
  'Bayer Leverkusen': 'Bayer 04 Leverkusen',
  Sevilla: 'Sevilla FC',
  Feyenoord: 'Feyenoord Rotterdam',
  'LA Galaxy': 'Los Angeles Galaxy',
  Parma: 'Parma Calcio 1913',
  Villarreal: 'Villarreal CF',
  Southampton: 'Southampton FC',
  'Leicester City': 'Leicester City',
  PSV: 'PSV Eindhoven',
  Fenerbahçe: 'Fenerbahce',
  'Newcastle United': 'Newcastle United',
  'Blackburn Rovers': 'Blackburn Rovers',
}

// This maps from the backend's specific names to your frontend club names
export const backendToFrontendClubMap: Record<string, string> = {}

// Populate the reverse mapping
Object.entries(frontendToBackendClubMap).forEach(([frontend, backend]) => {
  backendToFrontendClubMap[backend] = frontend
})

/**
 * Converts a frontend club name to its backend equivalent
 * @param frontendClubName The club name as used in the frontend
 * @returns The corresponding backend club name, or the original if no mapping exists
 */
export function toBackendClubName(frontendClubName: string): string {
  return frontendToBackendClubMap[frontendClubName] || frontendClubName
}

/**
 * Converts a backend club name to its frontend equivalent
 * @param backendClubName The club name as used in the backend
 * @returns The corresponding frontend club name, or the original if no mapping exists
 */
export function toFrontendClubName(backendClubName: string): string {
  return backendToFrontendClubMap[backendClubName] || backendClubName
}
