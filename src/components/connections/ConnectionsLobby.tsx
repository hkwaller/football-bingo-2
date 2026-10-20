'use client'

import { RoomInvite } from '@/components/RoomInvite'
import { LobbyNameField } from '@/components/LobbyNameField'
import { LobbySettingRow, LobbySquad } from '@/components/LobbySquad'
import { LobbyLayout } from '@/components/LobbyLayout'
import { LobbyBar } from '@/components/setup/LobbyBar'
import type { ConnectionsConfig } from '@/lib/connections/types'

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
  config: ConnectionsConfig
  onStart: () => void
  /** The host's deal request is in flight. */
  starting?: boolean
  myName: string
  onRename: (name: string) => void
}

export function ConnectionsLobby({
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
  const puzzlesLabel = `${config.puzzleCount} puzzles`
  const clockLabel = config.roundSeconds > 0 ? `${config.roundSeconds}s each` : 'Off'

  return (
    <LobbyLayout
      isHost={isHost}
      eyebrow="Connections · Lobby"
      eyebrowTone="yellow"
      title="Waiting room"
      invite={<RoomInvite roomId={roomId} joinPath={`/connections/room/${roomId}`} />}
      squad={<LobbySquad players={players} onRemove={onRemovePlayer} />}
      settings={
        <dl>
          <LobbySettingRow label="Puzzles" value={String(config.puzzleCount)} />
          <LobbySettingRow label="Clubs" value={`${config.clubCount} each`} />
          <LobbySettingRow label="Difficulty" value={config.difficulty} />
          <LobbySettingRow label="Guesses" value={`${config.guesses} each`} />
          <LobbySettingRow label="Clock" value={clockLabel} />
        </dl>
      }
      changeSettingsHref="/connections/setup?mode=multiplayer"
      nameField={<LobbyNameField value={myName} onSave={onRename} autoFocus={!isHost && !myName} />}
      bar={
        <LobbyBar
          isHost={isHost}
          playerCount={players.length}
          fields={[
            { label: 'Puzzles', value: puzzlesLabel },
            { label: 'Clubs', value: `${config.clubCount} each` },
            { label: 'Clock', value: clockLabel },
          ]}
          mobileDetail={`${puzzlesLabel} · ${config.clubCount} clubs · ${config.difficulty}`}
          hint="Everyone guesses at once - first to connect them gets a bonus"
          startLabel={starting ? 'Dealing…' : players.length < 2 ? 'Start (solo test)' : 'Kick off'}
          onStart={onStart}
          disabled={players.length < 1 || starting}
        />
      }
    />
  )
}
