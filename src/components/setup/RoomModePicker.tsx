'use client'

import { ROOM_PLAY_MODES, type RoomPlayMode } from '@/lib/roomMode'

/**
 * Versus / Co-op switch for multiplayer setup. Sits above the "mix / pick" tabs
 * because picking a single list or XI creates the room straight away.
 */
export function RoomModePicker({
  value,
  onChange,
}: {
  value: RoomPlayMode
  onChange: (mode: RoomPlayMode) => void
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 font-sans text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-on-green-dim">
        Room mode
      </p>
      <div
        role="radiogroup"
        aria-label="Room mode"
        className="grid grid-cols-2 gap-2 rounded-[16px] border-[2.5px] border-surface/30 bg-black/20 p-1.5"
      >
        {ROOM_PLAY_MODES.map((m) => {
          const active = value === m.value
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(m.value)}
              className={`rounded-[12px] px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky ${
                active
                  ? 'bg-yellow text-ink shadow-[0_3px_0_#0a2417]'
                  : 'text-on-green-soft hover:bg-black/15 hover:text-on-green'
              }`}
            >
              <span className="block font-display text-[18px] font-black uppercase leading-none tracking-wide">
                {m.label}
              </span>
              <span
                className={`mt-1 block text-[12px] font-semibold leading-snug ${active ? 'text-ink/75' : 'text-on-green-dim'}`}
              >
                {m.explainer}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
