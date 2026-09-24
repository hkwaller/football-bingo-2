'use client'

import { Layers } from 'lucide-react'
import { AllNone, ControlLabel } from './primitives'

export type TopicItem = {
  id: string
  label: string
  /** Live count for this topic, e.g. "184 questions" / "22 lists" / "52 clues". */
  count: string
}

/**
 * The topics panel that occupies the whole right column of every setup board.
 * Header + All|None, a helper line, a 2-up tile grid, and a summary strip pinned
 * to the bottom that recomputes with the selection. When nothing is selected the
 * summary turns into a yellow warning and the caller should disable the CTA.
 */
export function TopicPicker({
  label,
  helper,
  items,
  selected,
  onToggle,
  onAll,
  onNone,
  summary,
  invalid = false,
}: {
  label: string
  helper: string
  items: TopicItem[]
  selected: Set<string>
  onToggle: (id: string) => void
  onAll: () => void
  onNone: () => void
  /** Precomputed summary sentence (caller derives it from the selection). */
  summary: string
  /** True when zero topics are selected - flips the summary to a warning. */
  invalid?: boolean
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <ControlLabel>{label}</ControlLabel>
        <AllNone onAll={onAll} onNone={onNone} />
      </div>
      <p className="mt-2 text-[12.5px] font-semibold leading-snug text-card-muted">{helper}</p>

      <div className="mt-3 grid grid-cols-1 gap-[9px] sm:grid-cols-2">
        {items.map((item) => {
          const active = selected.has(item.id)
          return (
            <button
              key={item.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => onToggle(item.id)}
              className={`flex items-center gap-[11px] rounded-[14px] px-[13px] py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                active
                  ? 'bg-green-go text-ink shadow-[0_4px_0_#0a2417]'
                  : 'bg-card-tint/60 text-card-muted hover:-translate-y-px hover:bg-card-tint'
              }`}
            >
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] text-[13px] font-black leading-none ${
                  active
                    ? 'bg-black/20 text-on-green'
                    : 'border-2 border-card-ink/[0.28] text-transparent'
                }`}
              >
                ✓
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-[19px] font-black uppercase leading-none">
                  {item.label}
                </span>
                <span
                  className={`mt-1 block font-mono text-[11px] ${active ? 'text-on-green/80' : 'text-card-muted-2'}`}
                >
                  {item.count}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Summary strip, pinned to the bottom of the column. */}
      <div className="mt-4 flex items-center gap-2.5 rounded-[12px] bg-card-ink px-[14px] py-[11px] pt-3.5">
        <Layers size={16} strokeWidth={2.6} className="shrink-0 text-yellow" />
        <span
          className={`text-[12.5px] font-bold leading-snug ${invalid ? 'text-yellow' : 'text-on-green'}`}
        >
          {summary}
        </span>
      </div>
    </div>
  )
}
