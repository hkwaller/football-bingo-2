import type { Famous11sLineup } from '../../src/data/famous11s/types'
import { normalize } from '../../src/lib/tenable/normalize'
import type { CandidateQuestion, Match, MatchSide, ReviewedMatch } from './types'

export const teamKey = (name: string) => normalize(name)
  .replace(/^(fc |ac )| fc$| afc$/g, '')
  .replace(/^(west germany|western germany)$/, 'germany')
  .replace(/^czechia$/, 'czech republic')
  .replace(/^inter milan$/, 'inter')
  .replace(/^bayern munich$/, 'bayern munchen')
  .replace(/^manchester utd$/, 'manchester united')
  .replace(/^(atletico|atletico de madrid)$/, 'atletico madrid')

export function yearMatches(lineup: Famous11sLineup, date: string | null): boolean {
  if (!date) return false
  // EURO 2020 was played in 2021. Fixture identity also checks the actual prompt date.
  const explicit = lineup.prompt.match(/\b(19\d{2}|20\d{2})\b/)
  return Number(date.slice(0, 4)) === Number(explicit?.[1] ?? lineup.year)
}

export interface AuditResult {
  lineupId: string
  matchId?: string
  status: 'matched' | 'membership-disagreement' | 'identity-unresolved' | 'incomplete-source' | 'fixture-mismatch' | 'season-xi-excluded'
  details: string[]
  formationDifference?: { curated: string; imported: string }
  managerDifference?: { curated: string; imported: string | null }
}

export function auditLineup(lineup: Famous11sLineup, match?: Match, teamId?: string): AuditResult {
  const result: AuditResult = { lineupId: lineup.id, matchId: match?.id, status: 'matched', details: [] }
  if (!lineup.opponent) return { ...result, status: 'season-xi-excluded' }
  if (!match || !teamId) return { ...result, status: 'identity-unresolved', details: ['No unique sourced match/team reference'] }
  const side = [match.home, match.away].find((s) => s.id === teamId)
  const opponent = side === match.home ? match.away : match.home
  if (!side || !side.name || !opponent.name || teamKey(side.name) !== teamKey(lineup.side) ||
      teamKey(opponent.name) !== teamKey(lineup.opponent) || !yearMatches(lineup, match.date)) {
    return { ...result, status: 'fixture-mismatch', details: ['Team, opponent or year differs'] }
  }
  const explicitDate = lineup.prompt.match(/\b\d{1,2} [A-Z][a-z]+ \d{4}\b/)
  if (explicitDate && new Date(explicitDate[0] + ' UTC').toISOString().slice(0, 10) !== match.date?.slice(0, 10)) {
    return { ...result, status: 'fixture-mismatch', details: ['Match date differs from curated prompt'] }
  }
  const competitions: Record<string, string[]> = {
    'World Cup': ['FIWC', 'WM', 'WC'], 'European Championship': ['EURO', 'EM'],
    'Champions League': ['CL'], 'FA Cup': ['FAC'], 'La Liga': ['ES1'], 'Premier League': ['GB1'],
  }
  if (!competitions[lineup.competition]?.includes(match.competition.id)) {
    return { ...result, status: 'fixture-mismatch', details: ['Competition differs'] }
  }
  if (side.startingLineup.length !== 11 || new Set(side.startingLineup.map((p) => p.id)).size !== 11 || side.startingLineup.some((p) => !p.name)) {
    return { ...result, status: 'incomplete-source', details: ['Source must have eleven unique named starters'] }
  }
  const used = new Set<string>()
  let unresolvedName = false
  for (const slot of lineup.slots) {
    const hit = slot.playerId
      ? side.startingLineup.find((p) => p.id === slot.playerId)
      : side.startingLineup.find((p) => [slot.name, ...(slot.aliases ?? [])].some((name) => normalize(name) === normalize(p.name!)))
    if (!hit || used.has(hit.id)) {
      result.details.push(`Curated starter not resolved in source: ${slot.name}${slot.playerId ? ` (${slot.playerId})` : ''}`)
      if (!slot.playerId || side.startingLineup.some((p) => [slot.name, ...(slot.aliases ?? [])].some((name) => normalize(name) === normalize(p.name!)))) unresolvedName = true
    }
    else used.add(hit.id)
  }
  for (const p of side.startingLineup) if (!used.has(p.id)) result.details.push(`Source starter unmatched: ${p.name} (${p.id})`)
  if (result.details.length || lineup.slots.length !== 11) result.status = 'membership-disagreement'
  if (unresolvedName) result.status = 'identity-unresolved'
  if (side.formation && side.formation !== lineup.formation) result.formationDifference = { curated: lineup.formation, imported: side.formation }
  if (lineup.manager) {
    if (!side.coach?.name) {
      result.details.push('Manager unavailable in source')
      if (result.status === 'matched') result.status = 'incomplete-source'
    } else if (![lineup.manager.name, ...(lineup.manager.aliases ?? [])].some((n) => normalize(n) === normalize(side.coach!.name!))) {
      result.managerDifference = { curated: lineup.manager.name, imported: side.coach.name }
      result.details.push('Manager identity requires review')
      if (result.status === 'matched') result.status = 'identity-unresolved'
    }
  }
  return result
}

/** Full scoring sequence must reconcile; headline penalty scores cannot count as goals. */
export function goalCoverage(match: Match, review?: ReviewedMatch): { complete: boolean; reason?: string } {
  if (review && review.matchId !== match.id) return { complete: false, reason: 'Review belongs to another match' }
  if (review && !review.goalsComplete) return { complete: false, reason: 'Reviewed source marks goal events incomplete' }
  const expected = review?.matchScore ?? { home: match.home.score, away: match.away.score }
  if (expected.home === null || expected.away === null) return { complete: false, reason: 'Match score unavailable' }
  let previous = { home: 0, away: 0 }
  for (const event of match.events.filter((e) => e.type === 'goal')) {
    if (!event.score || !event.player?.name || event.minute === null || ![match.home.id, match.away.id].includes(event.clubId ?? '')) {
      return { complete: false, reason: 'Goal identity, minute, team or running score unavailable' }
    }
    const dh = event.score.home - previous.home, da = event.score.away - previous.away
    if (!((dh === 1 && da === 0 && event.clubId === match.home.id) || (dh === 0 && da === 1 && event.clubId === match.away.id))) {
      return { complete: false, reason: 'Scoring sequence does not reconcile' }
    }
    previous = event.score
  }
  return previous.home === expected.home && previous.away === expected.away
    ? { complete: true }
    : { complete: false, reason: 'Goals do not reconcile with match score (shootout or incomplete events)' }
}

export function questionsForMatch(match: Match, review: ReviewedMatch | undefined, aliases: Map<string, string[]>): CandidateQuestion[] {
  const questions: CandidateQuestion[] = []
  if (!match.date || !match.home.name || !match.away.name) return questions
  const title = `${match.home.name} vs ${match.away.name} on ${match.date.slice(0, 10)}`
  const sources = [...new Set([match.url, ...(review?.sourceUrls ?? [])].filter((s): s is string => !!s))]
  const add = (kind: CandidateQuestion['kind'], suffix: string, prompt: string, players: { id: string; name: string | null }[], explanation: string) => {
    const unique = [...new Map(players.filter((p) => p.name).map((p) => [p.id, p])).values()]
    if (!unique.length) return
    questions.push({ id: `${match.id}-${suffix}`, matchId: match.id, kind, prompt, answerMode: 'any-one',
      answers: unique.map((p) => ({ playerId: p.id, name: p.name!, aliases: aliases.get(p.id) ?? [] })),
      explanation, sourceUrls: sources, status: 'needs-editorial-review' })
  }
  if (goalCoverage(match, review).complete) {
    const goals = match.events.filter((e) => e.type === 'goal')
    // Own goals cannot be identified reliably in this schema: suppress a whole answer set if any scorer is on the other side.
    const safe = goals.every((e) => {
      const team = [match.home, match.away].find((s) => s.id === e.clubId)!
      return [...team.startingLineup, ...team.substitutes].some((p) => p.id === e.player?.id)
    })
    if (safe) {
      add('scorer', 'scorer', `Name a player who scored in ${title} (excluding the shootout).`, goals.map((e) => e.player!),
        `Match scorers: ${[...new Set(goals.map((e) => e.player!.name))].join(', ')}. Shootout kicks are excluded.`)
      for (const side of [match.home, match.away]) {
        const scored = goals.filter((e) => e.clubId === side.id)
        add('scorer', `${side.id}-scorer`, `Name a ${side.name} player who scored against ${side === match.home ? match.away.name : match.home.name} on ${match.date.slice(0, 10)} (excluding the shootout).`, scored.map((e) => e.player!),
          `${side.name} scorers: ${[...new Set(scored.map((e) => e.player!.name))].join(', ')}.`)
      }
      const substitutes = goals.filter((g) => match.events.some((e) => e.type === 'substitution' && e.relatedPlayer?.id === g.player?.id && e.clubId === g.clubId && e.minute !== null &&
        (e.minute * 100 + (e.addedTime ?? 0)) <= (g.minute! * 100 + (g.addedTime ?? 0))) &&
        [match.home, match.away].some((s) => s.substitutes.some((p) => p.id === g.player?.id) && !s.startingLineup.some((p) => p.id === g.player?.id)))
      // An unrecorded substitution could hide another valid answer. Require every bench scorer to have a matching substitution.
      const benchScorers = goals.filter((g) => [match.home, match.away].some((s) => s.substitutes.some((p) => p.id === g.player?.id)))
      if (benchScorers.length === substitutes.length) add('scoring-substitute', 'substitute', `Name a substitute who came on and scored in ${title}.`, substitutes.map((e) => e.player!),
        `These players have both an entry substitution and a subsequent goal recorded: ${[...new Set(substitutes.map((e) => e.player!.name))].join(', ')}.`)
    }
  }
  if (review?.shootout?.complete && validShootout(match, review)) {
    const misses = review.shootout.kicks.filter((k) => k.outcome !== 'scored')
    add('shootout-miss', 'shootout-miss', `Name a player who failed to convert in the shootout in ${title}.`, misses.map((k) => k.player),
      `Failed kicks: ${misses.map((k) => `${k.player.name} (${k.outcome})`).join(', ')}.`)
  }
  return questions
}

export function validShootout(match: Match, review: ReviewedMatch): boolean {
  if (review.matchId !== match.id || !review.sourceUrls.length || !review.shootout?.complete) return false
  const shootout = review.shootout
  const scores = { home: 0, away: 0 }
  for (const [index, kick] of shootout.kicks.entries()) {
    const side = [match.home, match.away].find((s) => s.id === kick.teamId)
    if (!side || !kick.player.name || ![...side.startingLineup, ...side.substitutes].some((p) => p.id === kick.player.id)) return false
    if (index && kick.teamId === shootout.kicks[index - 1].teamId) return false
    if (kick.outcome === 'scored') scores[side === match.home ? 'home' : 'away']++
  }
  return scores.home === shootout.score.home && scores.away === shootout.score.away && scores.home !== scores.away
}

export function poolCoverage(side: MatchSide, pool: Set<string>) {
  const known = side.startingLineup.filter((p) => pool.has(p.id))
  return { total: side.startingLineup.length, inPlayerPool: known.length, missing: side.startingLineup.filter((p) => !pool.has(p.id)) }
}
