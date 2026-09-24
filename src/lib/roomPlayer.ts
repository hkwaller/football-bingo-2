'use client'

import { randomUUID } from '@/lib/randomUUID'

/**
 * Per-tab identity for turn-based rooms.
 *
 * Liveblocks connectionIds change on every reconnect, and localStorage is shared
 * by every tab in a browser (split-screen tabs would collapse into one player).
 * sessionStorage is per tab and survives reloads and back/forward navigation.
 */
const PLAYER_ID_KEY = 'fb_room_player_id'
const NAME_KEY = 'fb_display_name'

export function getTabPlayerId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = window.sessionStorage.getItem(PLAYER_ID_KEY)
    if (!id) {
      id = randomUUID()
      window.sessionStorage.setItem(PLAYER_ID_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

/** Stable id for a room member; falls back to the connection if presence has no id yet. */
export function roomPlayerIdOf(user: {
  connectionId: number
  presence: { playerId?: string }
}): string {
  return user.presence.playerId || `conn:${user.connectionId}`
}

/**
 * This tab's display name. A random fallback is kept per tab only, so two tabs
 * in one browser don't end up with the same generated name.
 */
export function getTabDisplayName(): string {
  if (typeof window === 'undefined') return 'Player'
  try {
    const name =
      window.sessionStorage.getItem(NAME_KEY) ?? window.localStorage.getItem(NAME_KEY)
    if (name) return name
    const fallback = `Player ${Math.floor(Math.random() * 1000)}`
    window.sessionStorage.setItem(NAME_KEY, fallback)
    return fallback
  } catch {
    return 'Player'
  }
}

export function saveTabDisplayName(name: string) {
  try {
    window.sessionStorage.setItem(NAME_KEY, name)
    window.localStorage.setItem(NAME_KEY, name)
  } catch {}
}
