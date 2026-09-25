'use client'

import Link from 'next/link'
import { RoomInvite } from '@/components/RoomInvite'
import { LobbySettingRow, LobbySquad } from '@/components/LobbySquad'
import { ROOM_PLAY_MODE_LABEL } from '@/lib/roomMode'
import { getLineupById } from '@/data/famous11s'
import type { Famous11sConfig } from '@/lib/famous11s/types'

interface Player {
  id: string
  displayName: string
  isHost: boolean
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

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-7 px-6 py-8 md:px-9 md:py-10">
      <div className="text-center">
        <span className="eyebrow eyebrow-yellow">Famous 11s · Lobby</span>
        <h1 className="mt-2 font-display text-[48px] font-black uppercase leading-none text-on-green">
          Waiting room
        </h1>
      </div>

      {/* Invite */}
      <RoomInvite roomId={roomId} joinPath={`/famous-11s/room/${roomId}`} />

      <LobbySquad players={players} myName={myName} onRename={onRename} />

      {/* Config summary */}
      <div className="panel p-6">
        <p className="eyebrow mb-4">Match settings</p>
        {picked && (
          <div className="mb-3 rounded-[10px] bg-card-tint px-4 py-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-card-muted-2">
              The lineup
            </p>
            <p className="mt-1 font-display text-[20px] font-black uppercase leading-tight text-card-ink">
              {picked.title}
            </p>
          </div>
        )}
        <dl>
          <LobbySettingRow label="Mode" value={ROOM_PLAY_MODE_LABEL[config.playMode ?? 'versus']} />
          {!picked && <LobbySettingRow label="Lineups" value={String(config.lineupCount)} />}
          {!picked && <LobbySettingRow label="Difficulty" value={config.difficulty} capitalize />}
          {!picked && (
            <LobbySettingRow
              label="Era"
              value={config.era === 'big-nights' ? 'Big Nights' : config.era}
              capitalize
            />
          )}
          <LobbySettingRow
            label="Lives"
            value={`${config.lives} ${config.playMode === 'coop' ? 'shared' : 'each'}`}
          />
          <LobbySettingRow label="Manager" value={config.includeManager ? 'On' : 'Off'} />
          {config.turnSeconds > 0 && (
            <LobbySettingRow label="Turn timer" value={`${config.turnSeconds}s`} />
          )}
          {config.penaltyOnMiss && <LobbySettingRow label="Score penalty" value="On" />}
        </dl>
      </div>

      <div className="flex flex-col gap-3">
        {isHost ? (
          <button
            onClick={onStart}
            disabled={players.length < 1}
            className="btn btn-primary btn-lg w-full"
          >
            {players.length < 2 ? 'Start (solo test)' : 'Kick off'}
          </button>
        ) : (
          <p className="py-4 text-center text-sm font-semibold text-on-green-soft animate-pulse-soft">
            Waiting for the host to start…
          </p>
        )}
        <Link
          href="/famous-11s/setup?mode=multiplayer"
          className="btn btn-outline-light btn-lg w-full text-center"
        >
          Change settings
        </Link>
      </div>
    </div>
  )
}
