import { DEFAULT_CAREERS_CONFIG, type CareersConfig, type CareersSessionState } from './types'

const CONFIG_KEY = 'football-careers-config-v1'
const SESSION_KEY = 'football-careers-session-v1'
const RECENT_KEY = 'football-careers-recent-v1'
const MAX_RECENT = 200

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function loadCareersConfig(): CareersConfig {
  return { ...DEFAULT_CAREERS_CONFIG, ...(read<Partial<CareersConfig>>(CONFIG_KEY) ?? {}) }
}

export function saveCareersConfig(config: CareersConfig) {
  write(CONFIG_KEY, config)
}

export function loadCareersSession(): CareersSessionState | null {
  const s = read<CareersSessionState>(SESSION_KEY)
  if (!s?.sessionId || !Array.isArray(s.players) || s.phase !== 'playing') return null
  return s
}

export function saveCareersSession(state: CareersSessionState) {
  write(SESSION_KEY, state)
}

export function clearCareersSession() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {}
}

/** Player ids from recent runs, sent to the deal API so runs don't repeat. */
export function loadRecentCareers(): string[] {
  return read<string[]>(RECENT_KEY) ?? []
}

export function rememberCareers(ids: readonly string[]) {
  const merged = [...loadRecentCareers().filter((id) => !ids.includes(id)), ...ids]
  write(RECENT_KEY, merged.slice(-MAX_RECENT))
}
