'use client'

import { RoomInvite } from '@/components/RoomInvite'
import { LobbyNameField } from '@/components/LobbyNameField'
import { LobbyPickedCard, LobbySettingRow, LobbySquad } from '@/components/LobbySquad'
import { LobbyLayout } from '@/components/LobbyLayout'
import { LobbyBar } from '@/components/setup/LobbyBar'
import { ROOM_PLAY_MODE_LABEL } from '@/lib/roomMode'
import { getLineupById } from '@/data/famous11s'
import type { Famous11sConfig } from '@/lib/famous11s/types'

interface Player {
  id: string
  displayName: string
  isHost: boolean
  isSelf?: boolean
}

interface Props {
  roomId: string
  players: Player[]
  isHost: boolean
  config: Famous11sConfig
  onStart: () => void
  myName: string
  onRename: (name: string) => void
}

export function Famous11sLobby({
  roomId,
  players,
  isHost,
  config,
  onStart,
  myName,
  onRename,
}: Props) {
  const picked = config.selectedLineupId ? getLineupById(config.selectedLineupId) : undefined
  const modeLabel = ROOM_PLAY_MODE_LABEL[config.playMode ?? 'versus']
  const lineupLabel = picked
    ? picked.title
    : `${config.lineupCount} lineup${config.lineupCount === 1 ? '' : 's'}`
  const livesLabel = `${config.lives} ${config.playMode === 'coop' ? 'shared' : 'each'}`

  return (
    <LobbyLayout
      isHost={isHost}
      eyebrow="Famous 11s · Lobby"
      eyebrowTone="yellow"
      title="Waiting room"
      invite={<RoomInvite roomId={roomId} joinPath={`/famous-11s/room/${roomId}`} />}
      squad={<LobbySquad players={players} />}
      settings={
        <>
          {picked && <LobbyPickedCard label="The lineup" title={picked.title} />}
          <dl>
            <LobbySettingRow label="Mode" value={modeLabel} />
            {!picked && <LobbySettingRow label="Lineups" value={String(config.lineupCount)} />}
            {!picked && <LobbySettingRow label="Difficulty" value={config.difficulty} />}
            {!picked && (
              <LobbySettingRow
                label="Era"
                value={config.era === 'big-nights' ? 'Big Nights' : config.era}
              />
            )}
            <LobbySettingRow label="Lives" value={livesLabel} />
            <LobbySettingRow label="Manager" value={config.includeManager ? 'On' : 'Off'} />
            {config.turnSeconds > 0 && (
              <LobbySettingRow label="Turn timer" value={`${config.turnSeconds}s`} />
            )}
            {config.penaltyOnMiss && <LobbySettingRow label="Score penalty" value="On" />}
          </dl>
        </>
      }
      changeSettingsHref="/famous-11s/setup?mode=multiplayer"
      nameField={<LobbyNameField value={myName} onSave={onRename} autoFocus={!isHost && !myName} />}
      bar={
        <LobbyBar
          isHost={isHost}
          playerCount={players.length}
          fields={[
            { label: 'Mode', value: modeLabel },
            { label: picked ? 'The lineup' : 'Lineups', value: lineupLabel },
            { label: 'Lives', value: livesLabel },
          ]}
          mobileDetail={`${modeLabel} · ${lineupLabel} · ${config.lives} lives ${config.playMode === 'coop' ? 'shared' : 'each'}`}
          hint="Name the famous XI"
          startLabel={players.length < 2 ? 'Start (solo test)' : 'Kick off'}
          onStart={onStart}
          disabled={players.length < 1}
        />
      }
    />
  )
}
