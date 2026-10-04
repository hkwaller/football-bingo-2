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
const FALLBACK_NAME_KEY = 'fb_fallback_name'

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

/** The name this tab (or, failing that, this browser) last chose, or '' if none. */
export function getSavedDisplayName(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.sessionStorage.getItem(NAME_KEY) ?? window.localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

/**
 * Name for a player who never picked one (joined mid-game, or kick-off came
 * before they typed). Never shown in the lobby field - guests type their own.
 * The random fallback is kept per tab, so two tabs don't share a generated name.
 */
export function getTabDisplayName(): string {
  if (typeof window === 'undefined') return 'Player'
  const saved = getSavedDisplayName()
  if (saved) return saved
  try {
    let fallback = window.sessionStorage.getItem(FALLBACK_NAME_KEY)
    if (!fallback) {
      fallback = `Player ${Math.floor(Math.random() * 1000)}`
      window.sessionStorage.setItem(FALLBACK_NAME_KEY, fallback)
    }
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
