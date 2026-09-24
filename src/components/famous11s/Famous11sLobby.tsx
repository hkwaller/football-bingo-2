'use client'

import Link from 'next/link'
import { useState } from 'react'
import { RoomInvite } from '@/components/RoomInvite'
import type { Famous11sConfig } from '@/lib/famous11s/types'

interface Player {
  connectionId: number
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

export function Famous11sLobby({ roomId, players, isHost, config, onStart, myName, onRename }: Props) {
  const [editName, setEditName] = useState(false)
  const [draft, setDraft] = useState(myName)

  function saveRename() {
    onRename(draft.trim() || myName)
    setEditName(false)
  }

  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-8 px-6 py-8 md:px-9">
      <div className="text-center">
        <span className="eyebrow eyebrow-yellow">Famous 11s · Lobby</span>
        <h1 className="mt-2 font-display text-[48px] font-black uppercase leading-none text-on-green">
          Waiting room
        </h1>
      </div>

      {/* Invite */}
      <RoomInvite roomId={roomId} />

      {/* Players */}
      <div className="flex flex-col gap-3">
        <p className="font-sans text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-on-green-dim">
          Players ({players.length})
        </p>
        {players.map((p) => (
          <div
            key={p.connectionId}
            className="panel flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${p.isHost ? 'bg-yellow' : 'bg-green-go'}`}
                title={p.isHost ? 'Host' : 'Player'}
              />
              <span className="font-display text-[17px] font-black uppercase leading-none text-card-ink">
                {p.displayName}
              </span>
              {p.isHost && (
                <span className="rounded-full bg-yellow/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-card-ink">
                  Host
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* My name */}
      <div className="panel px-4 py-4">
        {editName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveRename()
            }}
            className="flex gap-3"
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-[10px] border-2 border-card-tint bg-surface px-3 py-2 font-display text-[15px] font-black uppercase text-card-ink focus:border-sky focus:outline-none"
            />
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-card-muted-2">
                Your name
              </p>
              <p className="mt-0.5 font-display text-[17px] font-black uppercase text-card-ink">
                {myName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft(myName)
                setEditName(true)
              }}
              className="rounded-[10px] bg-card-tint px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-card-muted transition-all hover:bg-card-tint/70"
            >
              Rename
            </button>
          </div>
        )}
      </div>

      {/* Config summary */}
      <div className="panel px-4 py-4">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-card-muted-2">
          Match settings
        </p>
        <div className="grid grid-cols-2 gap-2 text-[12px] font-semibold text-card-muted">
          <span>Lineups: {config.lineupCount}</span>
          <span>Lives: {config.lives}</span>
          <span>Difficulty: {config.difficulty}</span>
          <span>Manager: {config.includeManager ? 'on' : 'off'}</span>
          {config.turnSeconds > 0 && <span>Timer: {config.turnSeconds}s</span>}
          {config.penaltyOnMiss && <span>Score penalty: on</span>}
        </div>
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
        <Link href="/famous-11s/setup?mode=multiplayer" className="btn btn-outline-light btn-lg w-full text-center">
          Change settings
        </Link>
      </div>
    </div>
  )
}
