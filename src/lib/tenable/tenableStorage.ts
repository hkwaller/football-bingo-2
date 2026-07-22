import { DEFAULT_TENABLE_CONFIG, type TenableConfig, type TenableSessionState } from './types'

const CONFIG_KEY = 'football-tenable-config-v1'
const SESSION_KEY = 'football-tenable-session-v1'

export function loadTenableConfig(): TenableConfig {
  if (typeof window === 'undefined') return DEFAULT_TENABLE_CONFIG
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return DEFAULT_TENABLE_CONFIG
    return { ...DEFAULT_TENABLE_CONFIG, ...(JSON.parse(raw) as Partial<TenableConfig>) }
  } catch {
    return DEFAULT_TENABLE_CONFIG
  }
}

export function saveTenableConfig(config: TenableConfig) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function loadTenableSession(): TenableSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as TenableSessionState
    if (!s.sessionId || !s.config || !Array.isArray(s.questions)) return null
    if (s.phase === 'finished') return null
    return s
  } catch {
    return null
  }
}

export function saveTenableSession(state: TenableSessionState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(state))
}

export function clearTenableSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}
