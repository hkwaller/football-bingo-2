import {
  DEFAULT_CONNECTIONS_CONFIG,
  type ConnectionsConfig,
  type ConnectionsSessionState,
} from './types'

const CONFIG_KEY = 'football-connections-config-v1'
const SESSION_KEY = 'football-connections-session-v1'
const RECENT_KEY = 'football-connections-recent-v1'
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

export function loadConnectionsConfig(): ConnectionsConfig {
  return { ...DEFAULT_CONNECTIONS_CONFIG, ...(read<Partial<ConnectionsConfig>>(CONFIG_KEY) ?? {}) }
}

export function saveConnectionsConfig(config: ConnectionsConfig) {
  write(CONFIG_KEY, config)
}

export function loadConnectionsSession(): ConnectionsSessionState | null {
  const s = read<ConnectionsSessionState>(SESSION_KEY)
  if (!s?.sessionId || !Array.isArray(s.puzzles) || s.phase !== 'playing') return null
  return s
}

export function saveConnectionsSession(state: ConnectionsSessionState) {
  write(SESSION_KEY, state)
}

export function clearConnectionsSession() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {}
}

/** Puzzle ids from recent runs, sent to the deal API so runs don't repeat. */
export function loadRecentConnections(): string[] {
  return read<string[]>(RECENT_KEY) ?? []
}

export function rememberConnections(ids: readonly string[]) {
  const merged = [...loadRecentConnections().filter((id) => !ids.includes(id)), ...ids]
  write(RECENT_KEY, merged.slice(-MAX_RECENT))
}
