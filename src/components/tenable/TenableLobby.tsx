'use client'

import { motion } from 'framer-motion'
import { getTenableQuestionById } from '@/data/tenable'
import type { TenableConfig } from '@/lib/tenable/types'
import { RoomInvite } from '@/components/RoomInvite'
import { LobbySettingRow, LobbySquad } from '@/components/LobbySquad'
import { ROOM_PLAY_MODE_LABEL } from '@/lib/roomMode'

interface Player {
  id: string
  displayName: string
  isHost: boolean
}

interface Props {
  roomId: string
  players: Player[]
  isHost: boolean
  config: TenableConfig
  onStart: () => void
  myName?: string
  onRename?: (name: string) => void
}

export function TenableLobby({
  roomId,
  players,
  isHost,
  config,
  onStart,
  myName = '',
  onRename,
}: Props) {
  const picked = config.selectedQuestionId
    ? getTenableQuestionById(config.selectedQuestionId)
    : undefined
  const topicLabel = config.groups === 'all' ? 'All topics' : config.groups.join(', ')

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-7 px-6 py-8 md:px-9 md:py-10">
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <span className="eyebrow">Tenable · turn-based</span>
        <h1 className="mt-3 font-display text-[48px] font-black uppercase leading-[0.9] text-on-green md:text-[56px]">
          The squad gathers
        </h1>
        <p className="mt-3 text-[14.5px] font-semibold text-on-green-soft">
          {config.playMode === 'coop'
            ? 'Take turns naming the ten. Shared lives, one team score.'
            : 'Take turns naming the ten. Own lives, own points - top scorer wins.'}
        </p>
      </motion.div>

      <div className="panel p-6">
        <p className="eyebrow mb-4">Match settings</p>
        {picked && (
          <div className="mb-3 rounded-[10px] bg-card-tint px-4 py-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-card-muted-2">
              The list
            </p>
            <p className="mt-1 font-display text-[20px] font-black uppercase leading-tight text-card-ink">
              {picked.category}
            </p>
          </div>
        )}
        <dl>
          <LobbySettingRow label="Mode" value={ROOM_PLAY_MODE_LABEL[config.playMode ?? 'versus']} />
          {!picked && <LobbySettingRow label="Categories" value={String(config.questionCount)} />}
          {!picked && <LobbySettingRow label="Topic" value={topicLabel} capitalize />}
          <LobbySettingRow
            label="Difficulty"
            value={picked ? picked.difficulty : config.difficulty}
            capitalize
          />
          <LobbySettingRow
            label="Lives"
            value={`${config.lives} ${config.playMode === 'coop' ? 'shared' : 'each'}`}
          />
          <LobbySettingRow
            label="Hints"
            value={
              config.hints === 0
                ? 'Off'
                : `${config.hints} ${config.playMode === 'coop' ? 'shared' : 'each'}`
            }
          />
        </dl>
        {isHost && (
          <a
            href="/tenable/setup?mode=multiplayer"
            className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.06em] text-red hover:underline"
          >
            Change settings (opens a fresh room) →
          </a>
        )}
      </div>

      <RoomInvite roomId={roomId} joinPath={`/tenable/room/${roomId}`} />

      <LobbySquad players={players} myName={myName} onRename={(n) => onRename?.(n)} />

      {isHost ? (
        <button
          onClick={onStart}
          disabled={players.length < 1}
          className="btn btn-primary btn-lg disabled:cursor-not-allowed"
        >
          Start match
        </button>
      ) : (
        <p className="text-center text-sm font-semibold text-on-green-soft animate-pulse-soft">
          In the tunnel - waiting for the gaffer to start…
        </p>
      )}
    </div>
  )
}
