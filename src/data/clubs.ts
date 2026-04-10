export interface Club {
  id: string
  canonicalName: string
  displayName: string
  /** Extra name variants found in raw player data that should resolve to this club */
  aliases?: string[]
}

export const clubs: Club[] = [
  {
    "id": "985",
    "canonicalName": "Manchester United",
    "displayName": "Manchester United"
  },
  {
    "id": "31",
    "canonicalName": "Liverpool FC",
    "displayName": "Liverpool"
  },
  {
    "id": "418",
    "canonicalName": "Real Madrid",
    "displayName": "Real Madrid"
  },
  {
    "id": "131",
    "canonicalName": "FC Barcelona",
    "displayName": "Barcelona"
  },
  {
    "id": "27",
    "canonicalName": "Bayern Munich",
    "displayName": "Bayern Munich"
  },
  {
    "id": "583",
    "canonicalName": "Paris Saint-Germain",
    "displayName": "PSG"
  },
  {
    "id": "281",
    "canonicalName": "Manchester City",
    "displayName": "Manchester City"
  },
  {
    "id": "631",
    "canonicalName": "Chelsea FC",
    "displayName": "Chelsea"
  },
  {
    "id": "506",
    "canonicalName": "Juventus FC",
    "displayName": "Juventus"
  },
  {
    "id": "11",
    "canonicalName": "Arsenal FC",
    "displayName": "Arsenal"
  },
  {
    "id": "5",
    "canonicalName": "AC Milan",
    "displayName": "AC Milan"
  },
  {
    "id": "46",
    "canonicalName": "Inter Milan",
    "displayName": "Inter Milan"
  },
  {
    "id": "16",
    "canonicalName": "Borussia Dortmund",
    "displayName": "Borussia Dortmund"
  },
  {
    "id": "13",
    "canonicalName": "Atlético de Madrid",
    "displayName": "Atletico Madrid"
  },
  {
    "id": "610",
    "canonicalName": "Ajax Amsterdam",
    "displayName": "Ajax"
  },
  {
    "id": "720",
    "canonicalName": "FC Porto",
    "displayName": "Porto"
  },
  {
    "id": "294",
    "canonicalName": "SL Benfica",
    "displayName": "Benfica"
  },
  {
    "id": "371",
    "canonicalName": "Celtic FC",
    "displayName": "Celtic"
  },
  {
    "id": "124",
    "canonicalName": "Rangers FC",
    "displayName": "Rangers"
  },
  {
    "id": "6195",
    "canonicalName": "SSC Napoli",
    "displayName": "Napoli"
  },
  {
    "id": "148",
    "canonicalName": "Tottenham Hotspur",
    "displayName": "Tottenham"
  },
  {
    "id": "189",
    "canonicalName": "CA Boca Juniors",
    "displayName": "Boca Juniors"
  },
  {
    "id": "209",
    "canonicalName": "CA River Plate",
    "displayName": "River Plate"
  },
  {
    "id": "244",
    "canonicalName": "Olympique Marseille",
    "displayName": "Marseille"
  },
  {
    "id": "1041",
    "canonicalName": "Olympique Lyon",
    "displayName": "Lyon"
  },
  {
    "id": "12",
    "canonicalName": "AS Roma",
    "displayName": "AS Roma"
  },
  {
    "id": "29",
    "canonicalName": "Everton FC",
    "displayName": "Everton"
  },
  {
    "id": "405",
    "canonicalName": "Aston Villa",
    "displayName": "Aston Villa"
  },
  {
    "id": "162",
    "canonicalName": "AS Monaco",
    "displayName": "Monaco"
  },
  {
    "id": "379",
    "canonicalName": "West Ham United",
    "displayName": "West Ham"
  },
  {
    "id": "15",
    "canonicalName": "Bayer 04 Leverkusen",
    "displayName": "Bayer Leverkusen",
    "aliases": ["Leverkusen", "Bayer Leverkusen", "B. Leverkusen"]
  },
  {
    "id": "368",
    "canonicalName": "Sevilla FC",
    "displayName": "Sevilla"
  },
  {
    "id": "234",
    "canonicalName": "Feyenoord Rotterdam",
    "displayName": "Feyenoord"
  },
  {
    "id": "1061",
    "canonicalName": "Los Angeles Galaxy",
    "displayName": "LA Galaxy"
  },
  {
    "id": "130",
    "canonicalName": "Parma Calcio 1913",
    "displayName": "Parma"
  },
  {
    "id": "1050",
    "canonicalName": "Villarreal CF",
    "displayName": "Villarreal"
  },
  {
    "id": "180",
    "canonicalName": "Southampton FC",
    "displayName": "Southampton"
  },
  {
    "id": "1003",
    "canonicalName": "Leicester City",
    "displayName": "Leicester City"
  },
  {
    "id": "383",
    "canonicalName": "PSV Eindhoven",
    "displayName": "PSV"
  },
  {
    "id": "36",
    "canonicalName": "Fenerbahce",
    "displayName": "Fenerbahçe"
  },
  {
    "id": "762",
    "canonicalName": "Newcastle United",
    "displayName": "Newcastle United"
  },
  {
    "id": "164",
    "canonicalName": "Blackburn Rovers",
    "displayName": "Blackburn Rovers"
  }
]

const canonicalToDisplay = new Map(clubs.map((c) => [c.canonicalName, c.displayName]))

// Build display→canonical map, including aliases
const displayToCanonical = new Map<string, string>()
for (const c of clubs) {
  displayToCanonical.set(c.displayName, c.canonicalName)
  for (const alias of c.aliases ?? []) {
    displayToCanonical.set(alias, c.canonicalName)
  }
}

const canonicalSet = new Set(clubs.map((c) => c.canonicalName))

export function getDisplayName(canonicalName: string): string {
  return canonicalToDisplay.get(canonicalName) ?? canonicalName
}

export function getCanonicalName(displayName: string): string {
  return displayToCanonical.get(displayName) ?? displayName
}

export function isKnownClub(name: string): boolean {
  return canonicalSet.has(name) || displayToCanonical.has(name)
}

export function getClubCanonicalNames(): string[] {
  return clubs.map((c) => c.canonicalName)
}

export function getClubDisplayNames(): string[] {
  return clubs.map((c) => c.displayName)
}
