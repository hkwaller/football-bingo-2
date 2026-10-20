export interface Entity { id: string; name: string | null }
export interface MatchPlayer extends Entity { position?: string | null; isCaptain?: boolean }
export interface MatchSide extends Entity {
  score: number | null
  formation: string | null
  coach: Entity | null
  startingLineup: MatchPlayer[]
  substitutes: MatchPlayer[]
}
export interface MatchEvent {
  type: 'goal' | 'card' | 'substitution'
  minute: number | null
  addedTime?: number | null
  clubId: string | null
  player: Entity | null
  relatedPlayer: Entity | null
  card: 'yellow' | 'secondYellow' | 'red' | null
  score: { home: number; away: number } | null
}
export interface Match {
  id: string
  url: string | null
  competition: Entity
  date: string | null
  home: MatchSide
  away: MatchSide
  events: MatchEvent[]
}
export interface Evidence<T> {
  url: string
  fetchedAt: string
  providerVersion: string
  payload: T
}
export interface Discovery {
  id: string
  competitionId: string
  teams: Entity[]
  context: string
  sources: { url: string; label: string; context: string }[]
}
export interface ReviewedMatch {
  matchId: string
  sourceUrls: string[]
  reviewedAt: string
  note: string
  matchScore: { home: number; away: number }
  goalsComplete: boolean
  shootout?: { score: { home: number; away: number }; complete: boolean; kicks: { player: Entity; teamId: string; outcome: 'scored' | 'saved' | 'missed' }[] }
  membershipReview?: { lineupId: string; conclusion: string; sourceUrls: string[] }[]
}
export interface CandidateQuestion {
  id: string
  matchId: string
  kind: 'scorer' | 'scoring-substitute' | 'shootout-miss'
  prompt: string
  answerMode: 'any-one'
  answers: { playerId: string; name: string; aliases: string[] }[]
  explanation: string
  sourceUrls: string[]
  status: 'needs-editorial-review'
}
