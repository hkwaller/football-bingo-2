import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { famousLineups } from '../../src/data/famous11s/index'
import { enrichedFootballPlayers } from '../../src/data/players'
import { MatchClient } from './client'
import { auditLineup, goalCoverage, poolCoverage, questionsForMatch, teamKey } from './analysis'
import type { AuditResult } from './analysis'
import type { Discovery, Evidence, Match, ReviewedMatch } from './types'

const root = resolve(__dirname, '../..')
const out = resolve(root, 'docs/historical')
const data = resolve(root, 'scripts/historical/data')
const args = new Set(process.argv.slice(2))
const read = <T>(path: string, fallback: T): T => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) as T : fallback
const write = (name: string, value: unknown) => writeFileSync(resolve(out, name), JSON.stringify(value, null, 2) + '\n')
const sampleIds = ['987136', '936193', '928100', '909764', '983044', '2208062', '1029603', '1000818', '4095236', '3975879', '4359342', '4547655']
const compIds: Record<string, string> = { 'World Cup': 'FIWC', 'European Championship': 'EURO', 'Champions League': 'CL', 'FA Cup': 'FAC', 'La Liga': 'ES1' }

function likelyYear(context: string, year: number): boolean {
  if (new RegExp(`\\b${year}\\b`).test(context)) return true
  return context.includes(`${String(year - 1).slice(-2)}/${String(year).slice(-2)}`)
}

async function main() {
  mkdirSync(out, { recursive: true })
  const discoveries = read<Discovery[]>(resolve(out, 'discovered-matches.json'), [])
  if (!discoveries.length) throw new Error('Run historical:discover first')
  const reviews = read<ReviewedMatch[]>(resolve(data, 'reviews.json'), [])
  const identityReviews = read<Record<string, { reviewedAt: string; conclusion: string; sourceUrls: string[] }>>(resolve(data, 'identity-reviews.json'), {})
  const byReview = new Map(reviews.map((r) => [r.matchId, r]))
  const client = new MatchClient({ baseUrl: process.env.HISTORICAL_MATCH_API_URL ?? 'https://transfermarkt-api.fly.dev',
    cacheDir: resolve(root, 'scripts/output/historical/games'), online: args.has('--online'), refresh: args.has('--refresh') })
  await client.checkCapability()
  const fetched = new Map<string, Evidence<Match>>()
  const failures: { id: string; reason: string }[] = []
  const fetchOne = async (id: string) => {
    if (fetched.has(id) || failures.some((f) => f.id === id)) return
    try { fetched.set(id, await client.game(id)) }
    catch (e) { failures.push({ id, reason: String(e) }) }
    console.log(`${id}: ${fetched.has(id) ? 'cached/fetched' : 'unavailable'}`)
  }
  for (const id of sampleIds) await fetchOne(id)
  write('sample-report.json', sampleIds.map((id) => {
    const m = fetched.get(id)
    return m ? { matchId: id, sourceUrl: m.url, providerVersion: m.providerVersion, fetchedAt: m.fetchedAt,
      title: `${m.payload.home.name} — ${m.payload.away.name}`, date: m.payload.date,
      starters: [m.payload.home.startingLineup.length, m.payload.away.startingLineup.length],
      goals: goalCoverage(m.payload, byReview.get(id)), unknownCardColours: m.payload.events.filter((e) => e.type === 'card' && !e.card).length,
      shootout: byReview.get(id)?.shootout?.complete ? 'reviewed supplement' : 'not exposed by API; unknown unless reviewed' }
      : { matchId: id, status: 'unavailable', reason: failures.find((f) => f.id === id)?.reason }
  }))
  if (sampleIds.some((id) => !fetched.has(id))) {
    write('fetch-failures.json', failures)
    throw new Error('12-match sample incomplete; inspect sample-report.json and retry before expanding')
  }

  const references: Record<string, { matchId: string; teamId: string }> = {}
  const ambiguous: Record<string, string[]> = {}
  for (const lineup of famousLineups.filter((l) => l.opponent)) {
    const actualYear = Number(lineup.prompt.match(/\b(19\d{2}|20\d{2})\b/)?.[1] ?? lineup.year)
    const possible = discoveries.filter((d) => d.competitionId === compIds[lineup.competition] &&
      d.teams.some((t) => teamKey(t.name ?? '') === teamKey(lineup.side)) &&
      d.teams.some((t) => teamKey(t.name ?? '') === teamKey(lineup.opponent!)) &&
      d.sources.some((s) => likelyYear(s.context, actualYear)))
    // Include shootout table records whose context has no year but whose actual match can disambiguate.
    const fallback = possible.length ? possible : discoveries.filter((d) => d.competitionId === compIds[lineup.competition] &&
      d.teams.some((t) => teamKey(t.name ?? '') === teamKey(lineup.side)) &&
      d.teams.some((t) => teamKey(t.name ?? '') === teamKey(lineup.opponent!)))
    const accepted: { matchId: string; teamId: string }[] = []
    for (const d of fallback) {
      await fetchOne(d.id)
      const match = fetched.get(d.id)?.payload
      if (!match) continue
      const side = [match.home, match.away].find((s) => teamKey(s.name ?? '') === teamKey(lineup.side))
      if (!side) continue
      const result = auditLineup(lineup, match, side.id)
      if (result.status !== 'fixture-mismatch') accepted.push({ matchId: d.id, teamId: side.id })
    }
    if (accepted.length === 1) references[lineup.id] = accepted[0]
    else ambiguous[lineup.id] = accepted.map((r) => r.matchId)
  }
  const audit: AuditResult[] = famousLineups.map((l) => {
    const ref = references[l.id]
    return auditLineup(l, ref ? fetched.get(ref.matchId)?.payload : undefined, ref?.teamId)
  })
  write('lineup-audit.json', audit.map((a) => ({ ...a, reviewedDispute: identityReviews[a.lineupId] ?? (a.matchId ? byReview.get(a.matchId)?.membershipReview?.find((r) => r.lineupId === a.lineupId) : undefined) })))
  write('unresolved-references.json', ambiguous)
  // References are evidence metadata only; no names, managers, formations or coordinates are changed.
  writeFileSync(resolve(root, 'src/data/famous11s/matchReferences.json'), JSON.stringify(references, null, 2) + '\n')

  const represented = new Set(Object.values(references).map((r) => r.matchId))
  const shortlist = read<{ id: string; reason: string }[]>(resolve(data, 'shortlist.json'), [])
  const candidates = []
  const pool = new Set(enrichedFootballPlayers.map((p) => p.playerId))
  const used = new Set<string>()
  for (const seed of shortlist) {
    if (represented.has(seed.id) || used.has(seed.id)) continue
    used.add(seed.id)
    await fetchOne(seed.id)
    const evidence = fetched.get(seed.id)
    if (!evidence) continue
    const m = evidence.payload
    if (!m.date || new Date(m.date) > new Date() || [m.home, m.away].some((s) => s.startingLineup.length !== 11 || new Set(s.startingLineup.map((p) => p.id)).size !== 11 || s.startingLineup.some((p) => !p.name))) continue
    candidates.push({ matchId: m.id, title: `${m.home.name} vs ${m.away.name}`, date: m.date, competition: m.competition,
      reason: seed.reason, sourceUrls: [m.url, ...(discoveries.find((d) => d.id === m.id)?.sources.map((s) => s.url) ?? [])],
      teams: [m.home, m.away].map((s) => ({ teamId: s.id, name: s.name, manager: s.coach, formation: s.formation, starters: s.startingLineup, playerPoolCoverage: poolCoverage(s, pool) })),
      status: 'needs-editorial-review' })
    if (candidates.length === 20) break
  }
  write('famous11s-candidates.json', candidates)
  const aliases = new Map<string, string[]>()
  for (const p of enrichedFootballPlayers) aliases.set(p.playerId, [p.name])
  for (const l of famousLineups) for (const slot of l.slots) if (slot.playerId) {
    aliases.set(slot.playerId, [...new Set([...(aliases.get(slot.playerId) ?? []), slot.name, ...(slot.aliases ?? [])])])
  }
  const allQuestions = [...fetched.values()].flatMap((e) => questionsForMatch(e.payload, byReview.get(e.payload.id), aliases))
  // Prioritize special events, then distribute scorer questions across matches before taking second variants.
  const special = allQuestions.filter((q) => q.kind !== 'scorer')
  const scorers = allQuestions.filter((q) => q.kind === 'scorer' && q.id.endsWith('-scorer') && q.id === `${q.matchId}-scorer`)
  const selected = [...special, ...scorers, ...allQuestions].filter((q, i, arr) => arr.findIndex((x) => x.id === q.id) === i).slice(0, 30)
  write('famous-moments-candidates.json', selected)
  write('fetch-failures.json', failures)
  const inventory = read<{ id: string; name: string; status: string; tables: { status: string }[] }[]>(resolve(out, 'source-inventory.json'), [])
  const coverage = {
    generatedAt: new Date().toISOString(), providerUrl: process.env.HISTORICAL_MATCH_API_URL ?? 'https://transfermarkt-api.fly.dev',
    competitions: inventory.map((c) => ({ id: c.id, name: c.name, status: c.status, tables: c.tables.length, available: c.tables.filter((t) => t.status === 'available').length })),
    discoveredMatches: discoveries.length, fetchedMatches: fetched.size, failures,
    audit: Object.fromEntries([...new Set(audit.map((a) => a.status))].map((s) => [s, audit.filter((a) => a.status === s).length])),
    formationDifferences: audit.filter((a) => a.formationDifference).length,
    reviewedIdentityDisputes: Object.keys(identityReviews).filter((id) => audit.some((a) => a.lineupId === id && a.status === 'identity-unresolved')).length,
    candidateCounts: { famous11s: candidates.length, famousMoments: selected.length },
    limits: ['Discovery covers first pages; pagination and date filters are recorded, not exhausted.', 'API omits shootout kicks and goal technique/own-goal flags.', 'Manager and formation differences need editorial review.', 'Unresolved references are not confirmations.'] }
  write('coverage-report.json', coverage)
  writeFileSync(resolve(out, 'REPORT.md'), `# Historical match investigation\n\nGenerated ${coverage.generatedAt}.\n\n${discoveries.length} unique matches discovered; ${fetched.size} fetched.\n\n## Famous 11s audit\n\n${Object.entries(coverage.audit).map(([s, n]) => `- ${s}: ${n}`).join('\n')}\n- Formation differences: ${coverage.formationDifferences}\n- Identity disputes with sourced review notes: ${coverage.reviewedIdentityDisputes}\n\nEvery match-based entry has an audit result; unresolved identity flags remain visible even when editorial notes explain the discrepancy. Fixture references do not approve formations or repair player enrichment. See the reviewed Emerson Palmieri ID conflict and name variants in lineup-audit.json.\n\n## Review material\n\n- ${candidates.length} new match candidates, with both starting XIs and player-pool coverage.\n- ${selected.length} Famous Moments questions with complete accepted-answer sets where evidence reconciles.\n\n## Recommendation\n\nUse a separate compatible match API service, pin its version, and retain raw snapshots. Keep the installed player service unchanged. Supplement shootouts from match reports. Review lineup disagreements against the existing Famous 11s README sources and official reports; preserve curated layouts until reviewed. Expand paginated history tables after reviewing this shortlist. Do not generate own-goal, goal-technique or card-colour questions from unavailable fields.\n\n${coverage.limits.map((s) => `- ${s}`).join('\n')}\n\nSee source-inventory.json, sample-report.json, lineup-audit.json and the candidate JSON banks for evidence.\n`)
  if (candidates.length !== 20 || selected.length !== 30) throw new Error(`Deliverables incomplete: ${candidates.length}/20 lineups, ${selected.length}/30 questions; extend shortlist/retry failures`)
  console.log(JSON.stringify(coverage, null, 2))
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
