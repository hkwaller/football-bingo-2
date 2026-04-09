import type { TriviaConfig, TriviaSessionState } from './types'
import { DEFAULT_TRIVIA_CONFIG } from './types'

const CONFIG_KEY = 'football-trivia-config-v1'
const SESSION_KEY = 'football-trivia-session-v1'

// ── Config persistence ────────────────────────────────────────────────────────

export function loadTriviaConfig(): TriviaConfig {
  if (typeof window === 'undefined') return DEFAULT_TRIVIA_CONFIG
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return DEFAULT_TRIVIA_CONFIG
    return { ...DEFAULT_TRIVIA_CONFIG, ...(JSON.parse(raw) as Partial<TriviaConfig>) }
  } catch {
    return DEFAULT_TRIVIA_CONFIG
  }
}

export function saveTriviaConfig(config: TriviaConfig) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

// ── Session persistence ───────────────────────────────────────────────────────

export function loadTriviaSession(): TriviaSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as TriviaSessionState
    if (!s.sessionId || !s.config || !Array.isArray(s.questions)) return null
    // Don't restore finished sessions
    if (s.phase === 'finished') return null
    return s
  } catch {
    return null
  }
}

export function saveTriviaSession(state: TriviaSessionState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(state))
}

export function clearTriviaSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}
