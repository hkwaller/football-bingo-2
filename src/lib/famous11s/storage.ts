import { DEFAULT_FAMOUS11S_CONFIG, type Famous11sConfig, type Famous11sSessionState } from './types'

const CONFIG_KEY = 'football-famous11s-config-v1'
const SESSION_KEY = 'football-famous11s-session-v1'

export function loadFamous11sConfig(): Famous11sConfig {
  if (typeof window === 'undefined') return DEFAULT_FAMOUS11S_CONFIG
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return DEFAULT_FAMOUS11S_CONFIG
    return { ...DEFAULT_FAMOUS11S_CONFIG, ...(JSON.parse(raw) as Partial<Famous11sConfig>) }
  } catch {
    return DEFAULT_FAMOUS11S_CONFIG
  }
}

export function saveFamous11sConfig(config: Famous11sConfig) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function loadFamous11sSession(): Famous11sSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Famous11sSessionState
    if (!s.sessionId || !s.config || !Array.isArray(s.lineups)) return null
    if (s.phase === 'finished') return null
    return s
  } catch {
    return null
  }
}

export function saveFamous11sSession(state: Famous11sSessionState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(state))
}

export function clearFamous11sSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}
