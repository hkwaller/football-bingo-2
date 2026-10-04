'use client'

import { RoomInvite } from '@/components/RoomInvite'
import { LobbyNameField } from '@/components/LobbyNameField'
import { LobbySettingRow, LobbySquad } from '@/components/LobbySquad'
import { LobbyLayout } from '@/components/LobbyLayout'
import { LobbyBar } from '@/components/setup/LobbyBar'
import type { CareersConfig } from '@/lib/careers/types'

interface Player {
  id: string
  displayName: string
  isHost: boolean
  isSelf?: boolean
  ready?: boolean
}

interface Props {
  roomId: string
  players: Player[]
  /** Host only: remove a player from the room. */
  onRemovePlayer?: (id: string | number) => void
  isHost: boolean
  config: CareersConfig
  onStart: () => void
  /** The host's deal request is in flight. */
  starting?: boolean
  myName: string
  onRename: (name: string) => void
}

export function CareersLobby({
  roomId,
  players,
  onRemovePlayer,
  isHost,
  config,
  onStart,
  starting,
  myName,
  onRename,
}: Props) {
  const careersLabel = `${config.playerCount} careers`
  const clockLabel = config.roundSeconds > 0 ? `${config.roundSeconds}s each` : 'Off'

  return (
    <LobbyLayout
      isHost={isHost}
      eyebrow="Careers · Lobby"
      eyebrowTone="sky"
      title="Waiting room"
      invite={<RoomInvite roomId={roomId} joinPath={`/careers/room/${roomId}`} />}
      squad={<LobbySquad players={players} onRemove={onRemovePlayer} />}
      settings={
        <dl>
          <LobbySettingRow label="Careers" value={String(config.playerCount)} />
          <LobbySettingRow label="Difficulty" value={config.difficulty} />
          <LobbySettingRow label="Guesses" value={`${config.guesses} each`} />
          <LobbySettingRow label="Clock" value={clockLabel} />
        </dl>
      }
      changeSettingsHref="/careers/setup?mode=multiplayer"
      nameField={<LobbyNameField value={myName} onSave={onRename} autoFocus={!isHost && !myName} />}
      bar={
        <LobbyBar
          isHost={isHost}
          playerCount={players.length}
          fields={[
            { label: 'Careers', value: careersLabel },
            { label: 'Guesses', value: `${config.guesses} each` },
            { label: 'Clock', value: clockLabel },
          ]}
          mobileDetail={`${careersLabel} · ${config.guesses} guesses · ${config.difficulty}`}
          hint="Everyone guesses at once - first to name him gets a bonus"
          startLabel={starting ? 'Dealing…' : players.length < 2 ? 'Start (solo test)' : 'Kick off'}
          onStart={onStart}
          disabled={players.length < 1 || starting}
        />
      }
    />
  )
}
