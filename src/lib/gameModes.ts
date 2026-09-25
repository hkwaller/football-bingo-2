/**
 * Every game on the site: copy, entry points and the three-step "how it plays"
 * story. Shared by the home page (mode cards + walkthrough) and /games.
 */

export type GameModeId = 'bingo' | 'trivia' | 'tenable' | 'famous11s'

export interface GameMode {
  id: GameModeId
  title: string
  /** One-line hook, also the "how it plays" heading. */
  tagline: string
  blurb: string
  soloHref: string
  multiHref: string
  /** Short facts shown as chips on /games. */
  tags: string[]
  steps: { title: string; body: string }[]
  isNew?: boolean
}

export const GAME_MODES: GameMode[] = [
  {
    id: 'bingo',
    title: 'Bingo',
    tagline: 'Three squares from glory',
    blurb: 'Fill your board with the players drawn and be first to a full line. The signature mode.',
    soloHref: '/play/setup',
    multiHref: '/play/setup?mode=multiplayer',
    tags: ['Solo or room', 'Draft or free pick', 'Custom boards'],
    steps: [
      {
        title: 'Build your board',
        body: "Fill a grid with clubs, countries and honours. Every square is a football fact you're betting on.",
      },
      {
        title: 'Stickers get drawn',
        body: 'Real players, one by one. Slap each sticker on a square he genuinely fits - miss and it stays empty.',
      },
      {
        title: 'Race to a line',
        body: 'Row, column or diagonal - first to fill one shouts BINGO and takes the roar of the room.',
      },
    ],
  },
  {
    id: 'trivia',
    title: 'Trivia',
    tagline: 'Ten questions, one winner',
    blurb: 'Quick-fire football questions where the fastest correct answer wins the round.',
    soloHref: '/trivia/setup?mode=solo',
    multiHref: '/trivia/setup?mode=multiplayer',
    tags: ['Solo or room', 'Survival, timed or fixed', 'Speed bonus'],
    steps: [
      {
        title: 'Pick your round',
        body: 'Choose difficulty, topics and length - a quick five or a full twenty, or play against the clock.',
      },
      {
        title: 'Answer fast',
        body: 'Multiple choice, stat duels and mystery players. Everyone answers at once, so hesitation costs you.',
      },
      {
        title: 'Top the table',
        body: 'Points stack up round by round. The final leaderboard settles who actually knows their football.',
      },
    ],
  },
  {
    id: 'tenable',
    title: 'Tenable',
    tagline: 'Name the ten',
    blurb:
      'Name the ten. Top scorers, most caps, biggest transfers - fill the list before your lives run out.',
    soloHref: '/tenable/setup?mode=solo',
    multiHref: '/tenable/setup?mode=multiplayer',
    tags: ['Solo or room', 'Versus or co-op', 'Hints'],
    steps: [
      {
        title: 'A list appears',
        body: 'Top scorers, most caps, biggest transfers - ten answers hidden behind ten slots, and you know some of them.',
      },
      {
        title: 'Name them, lose lives',
        body: 'Every correct name flips a slot. Three wrong guesses and the category closes with the rest still hidden.',
      },
      {
        title: 'Clear the board',
        body: 'Each answer scores, and finding all ten lands the clear bonus. In a room you take turns, so one miss hands it over.',
      },
    ],
  },
  {
    id: 'famous11s',
    title: 'Famous 11s',
    tagline: 'Name all eleven',
    blurb:
      'Name all eleven from iconic XIs - World Cup finals, Champions League classics and legendary club sides.',
    soloHref: '/famous-11s/setup?mode=solo',
    multiHref: '/famous-11s/setup?mode=multiplayer',
    tags: ['Solo or room', 'Versus or co-op', 'Nicknames count'],
    isNew: true,
    steps: [
      {
        title: 'An iconic XI loads',
        body: 'World Cup finals, Champions League classics and legendary club sides - laid out as an empty team sheet.',
      },
      {
        title: 'Fill the pitch',
        body: 'Type any name you remember and it drops into the right position. Surnames and nicknames count.',
      },
      {
        title: 'Beat the lineup',
        body: 'Wrong guesses cost a life, so dig deep before you swing. Complete the eleven for the full clear bonus.',
      },
    ],
  },
]
