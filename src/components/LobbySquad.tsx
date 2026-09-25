'use client'

import { LobbyNameField } from './LobbyNameField'

export interface LobbySquadPlayer {
  id: string | number
  displayName: string
  isHost: boolean
}

/** One label/value line in a lobby "Match settings" panel. Wrap rows in a <dl>. */
export function LobbySettingRow({
  label,
  value,
  capitalize,
}: {
  label: string
  value: string
  capitalize?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-card-tint py-2.5 last:border-b-0">
      <dt className="text-sm font-medium text-card-muted">{label}</dt>
      <dd
        className={`text-right text-sm font-bold text-card-ink ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}

/** Lobby panel: edit your own name, then everyone currently in the room. */
export function LobbySquad({
  players,
  myName,
  onRename,
}: {
  players: LobbySquadPlayer[]
  myName: string
  onRename: (name: string) => void
}) {
  return (
    <div className="panel p-6">
      <LobbyNameField value={myName} onSave={onRename} />

      <div className="mt-6 border-t-2 border-dashed border-card-tint pt-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-card-muted-2">
          In the room · {players.length}
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-[10px] bg-card-tint/60 px-3 py-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-go font-display text-lg font-black uppercase leading-none text-ink">
                {p.displayName.charAt(0) || '?'}
              </span>
              <span className="flex-1 truncate text-sm font-bold text-card-ink">
                {p.displayName}
              </span>
              {p.isHost && (
                <span className="-rotate-2 rounded-md bg-yellow px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-ink shadow-[0_2px_0_#0a2417]">
                  Gaffer
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
