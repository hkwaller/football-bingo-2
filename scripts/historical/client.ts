import { mkdirSync, readFileSync, existsSync, writeFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import type { Evidence, Match } from './types'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export interface ClientOptions { baseUrl: string; cacheDir: string; online?: boolean; refresh?: boolean; delayMs?: number }

export function validateMatch(value: unknown, expectedId: string): Match {
  if (!value || typeof value !== 'object') throw new Error('Invalid match response')
  const m = value as Match
  if (m.id !== expectedId || !m.competition?.id || !Array.isArray(m.events)) throw new Error('Invalid match identity/events')
  for (const side of [m.home, m.away]) {
    if (!side?.id || !Array.isArray(side.startingLineup) || !Array.isArray(side.substitutes)) throw new Error('Invalid match sides')
    if (side.startingLineup.some((p) => !p.id)) throw new Error('Starter without ID')
  }
  if (m.events.some((e) => !['goal', 'card', 'substitution'].includes(e.type))) throw new Error('Unsupported event type')
  return m
}

/** No network unless explicitly enabled. Cache keys include provider URL, not just match ID. */
export class MatchClient {
  private version = 'unknown'
  constructor(private options: ClientOptions) {}

  private async read<T>(path: string): Promise<Evidence<T>> {
    const url = `${this.options.baseUrl.replace(/\/$/, '')}${path}`
    const file = join(this.options.cacheDir, `${createHash('sha256').update(url).digest('hex')}.json`)
    if (existsSync(file) && !this.options.refresh) {
      const cached = JSON.parse(readFileSync(file, 'utf8')) as Evidence<T>
      if (cached.url !== url) throw new Error('Cache URL mismatch')
      return cached
    }
    if (!this.options.online) throw new Error(`Not cached: ${url}; use --online to collect`)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await sleep(this.options.delayMs ?? 1800)
        const response = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { Accept: 'application/json' } })
        if (!response.ok) {
          if (![429, 500, 502, 503, 504].includes(response.status)) throw new PermanentError(`HTTP ${response.status}: ${url}`)
          throw new Error(`HTTP ${response.status}: ${url}`)
        }
        const payload = await response.json() as T
        const evidence = { url, fetchedAt: new Date().toISOString(), providerVersion: this.version, payload }
        mkdirSync(this.options.cacheDir, { recursive: true })
        writeFileSync(`${file}.tmp`, JSON.stringify(evidence, null, 2) + '\n')
        renameSync(`${file}.tmp`, file)
        return evidence
      } catch (error) {
        if (error instanceof PermanentError || attempt === 2) throw error
        await sleep(1000 * 2 ** attempt)
      }
    }
    throw new Error('Retries exhausted')
  }

  async checkCapability(): Promise<void> {
    const schema = await this.read<{ info: { version: string }; paths: Record<string, unknown> }>('/openapi.json')
    this.version = schema.payload.info.version
    if (!Object.keys(schema.payload.paths).some((p) => /^\/games\/\{[^}]+\}$/.test(p))) {
      throw new Error(`Provider ${this.version} lacks /games/{id}; configure HISTORICAL_MATCH_API_URL with a compatible service`)
    }
  }

  async game(id: string): Promise<Evidence<Match>> {
    if (!/^\d+$/.test(id)) throw new Error('Match ID must be numeric')
    const evidence = await this.read<unknown>(`/games/${id}`)
    return { ...evidence, payload: validateMatch(evidence.payload, id) }
  }
}
class PermanentError extends Error {}
