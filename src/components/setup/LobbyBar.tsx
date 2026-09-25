'use client'

import type { ReactNode } from 'react'
import { KickoffBar, type ReadoutField } from './KickoffBar'

/**
 * Kick-off bar for multiplayer lobbies. Only the host gets the start CTA;
 * everyone else sees the same readout with a passive "waiting" pill, so a
 * guest can never trigger the start mutation from here.
 */
export function LobbyBar({
  isHost,
  playerCount,
  fields,
  mobileDetail,
  hint,
  startLabel = 'Kick off',
  onStart,
  disabled = false,
}: {
  isHost: boolean
  playerCount: number
  /** Settings readout; the player count is prepended automatically. */
  fields: ReadoutField[]
  mobileDetail: string
  hint?: ReactNode
  startLabel?: string
  onStart: () => void
  disabled?: boolean
}) {
  return (
    <KickoffBar
      fields={[{ label: 'In the room', value: String(playerCount) }, ...fields]}
      mobilePrimary={`${playerCount} in the room`}
      mobileDetail={mobileDetail}
      hint={isHost ? hint : undefined}
      ctaLabel={isHost ? startLabel : 'Waiting for the gaffer'}
      onCta={isHost ? onStart : undefined}
      disabled={isHost && disabled}
    />
  )
}

/** Bottom padding for a lobby page so content clears the fixed LobbyBar. */
export const LOBBY_BAR_CLEARANCE = 'pb-[136px]'
