'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { PLAYER_COLORS } from './RoomPanels'

export interface LobbySquadPlayer {
  id: string | number
  displayName: string
  isHost: boolean
  isSelf?: boolean
  /** False while a player hasn't picked a name yet (shows "In the tunnel…"). */
  ready?: boolean
}

/** Empty rows keep the team sheet looking like a sheet until the room fills. */
const MIN_ROWS = 4

/** One label/value line in a lobby "Match settings" panel. Wrap rows in a <dl>. */
export function LobbySettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b-[1.5px] border-dashed border-card-ink/15 py-3 last:border-b-0">
      <dt className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-card-muted">
        {label}
      </dt>
      <dd className="min-w-0 text-right font-display text-[18px] font-black uppercase leading-none text-card-ink">
        {value}
      </dd>
    </div>
  )
}

/** Host-only "⋯" popover on a team-sheet row. */
function PlayerMenu({ name, onRemove }: { name: string; onRemove: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Options for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex size-8 items-center justify-center rounded-full font-display text-[18px] font-black leading-none text-card-ink hover:bg-card-ink/10"
      >
        ⋯
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-[10px] border-2 border-card-ink bg-surface-hi shadow-[0_3px_0_#0a2417]"
        >
          <button
            type="button"
            role="menuitem"
            autoFocus
            onClick={() => {
              setOpen(false)
              onRemove()
            }}
            className="block w-full px-4 py-3 text-left text-[13.5px] font-bold text-coral-ink hover:bg-card-ink/10"
          >
            Remove from room
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * The "Starting XI" team sheet: everyone in the room, then open spots. Pass
 * `onRemove` (host only) to give other players' rows a remove menu.
 */
export function LobbySquad({
  players,
  onRemove,
}: {
  players: LobbySquadPlayer[]
  onRemove?: (id: LobbySquadPlayer['id']) => void
}) {
  const openSpots = Math.max(0, MIN_ROWS - players.length)

  return (
    <div className="panel p-6">
      <p className="eyebrow eyebrow-sky mb-3">Starting XI · {players.length}</p>
      <ul className="flex flex-col">
        {players.map((p, i) => (
          <li
            key={p.id}
            className="flex h-14 items-center gap-3.5 border-b-[1.5px] border-dashed border-card-ink/20 last:border-b-0"
          >
            <span className="w-6 shrink-0 font-mono text-[13px] font-semibold text-card-muted">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-card-ink font-display text-[16px] font-black uppercase text-ink ${
                PLAYER_COLORS[i % PLAYER_COLORS.length]
              }`}
            >
              {p.displayName.charAt(0) || '?'}
            </span>
            <span className="min-w-0 truncate font-display text-[22px] font-black uppercase leading-none text-card-ink">
              {p.displayName}
              {p.isSelf && p.displayName !== 'You' && (
                <span className="text-card-muted"> (you)</span>
              )}
            </span>
            <span className="ml-auto shrink-0">
              {p.isHost ? (
                <span className="inline-block -rotate-2 rounded bg-yellow px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink shadow-[0_2px_0_#0a2417]">
                  Gaffer
                </span>
              ) : p.ready === false ? (
                <span className="text-xs font-bold text-card-muted">In the tunnel…</span>
              ) : (
                <span className="text-xs font-bold text-card-ink">✓ Ready</span>
              )}
            </span>
            {onRemove && !p.isSelf && !p.isHost && (
              <span className="-mr-2 shrink-0">
                <PlayerMenu name={p.displayName} onRemove={() => onRemove(p.id)} />
              </span>
            )}
          </li>
        ))}
        {Array.from({ length: openSpots }, (_, i) => (
          <li
            key={`open-${i}`}
            aria-hidden
            className="flex h-14 items-center gap-3.5 border-b-[1.5px] border-dashed border-card-ink/20 last:border-b-0"
          >
            <span className="w-6 shrink-0 font-mono text-[13px] font-semibold text-card-muted">
              {String(players.length + i + 1).padStart(2, '0')}
            </span>
            <span className="h-9 w-9 shrink-0 rounded-full border-2 border-dashed border-card-ink/30" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-card-muted">
              Open spot
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Callout for a hand-picked list/lineup at the top of the match settings. */
export function LobbyPickedCard({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-2 mt-3 rounded-[10px] border-2 border-card-ink bg-surface-hi px-4 py-3">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-card-muted">
        {label}
      </p>
      <p className="mt-1 text-balance font-display text-[24px] font-black uppercase leading-[0.95] text-card-ink">
        {title}
      </p>
    </div>
  )
}
