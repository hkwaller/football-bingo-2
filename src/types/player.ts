export interface CareerStats {
  appearances: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  minutesPlayed: number
  championsLeagueGames: number
  championsLeagueGoals: number
}

export interface HighestValue {
  age: number
  date: string
  clubId: string
  clubName: string
  marketValue: number
}

export interface JerseyNumber {
  season: string
  club: string
  jerseyNumber: number
}

export interface PhotoAttribution {
  author: string
  license: string
  licenseUrl: string
  /** Commons file description page */
  source: string
}

export interface Player {
  playerId: string
  name: string
  nationality: string
  citizenship: string[]
  clubs: string[]
  youthClubs: string[]
  achievements: string[]
  randomAchievements: string[]
  /** Bingo "traits" axis: position / decade / shirt-number / trait / academy labels */
  tags: string[]
  /** "Played under <manager>" labels */
  managers: string[]
  jerseyNumbers: JerseyNumber[]
  position: { main: string; other: string[] }
  imageUrl: string
  /** Photo credit when the image is from Wikimedia Commons; null for others */
  imageAttribution: PhotoAttribution | null
  height: number
  dateOfBirth: string
  leftFooted: boolean
  era: string
  careerStats: CareerStats
  highestValue: HighestValue | null
  fameScore: number
}
