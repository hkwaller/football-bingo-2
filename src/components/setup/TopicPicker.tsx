'use client'

import type { ReactNode } from 'react'
import { CircleHelp, Layers } from 'lucide-react'
import { Popover } from '@base-ui/react/popover'
import { AllNone, ControlLabel } from './primitives'

export type TopicItem = {
  id: string
  label: string
  /** Live count for this topic, e.g. "184 questions" / "22 lists" / "52 clues". */
  count: string
}

/** Optional second group, rendered under the main grid. Not touched by All | None. */
export type TopicSpecialGroup = {
  label: string
  /** One-line hint under the section label. */
  hint: string
  items: TopicItem[]
  /** Body of the info popover next to the section label. */
  info: ReactNode
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
  special,
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
  /** Extra topics kept out of the main grid and out of All | None. */
  special?: TopicSpecialGroup
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <ControlLabel>{label}</ControlLabel>
        <AllNone onAll={onAll} onNone={onNone} />
      </div>
      <p className="mt-2 text-[12.5px] font-semibold leading-snug text-card-muted">{helper}</p>

      <div className="mt-3 grid grid-cols-1 gap-[9px] sm:grid-cols-2">
        {items.map((item) => (
          <TopicTile
            key={item.id}
            item={item}
            active={selected.has(item.id)}
            onToggle={onToggle}
          />
        ))}
      </div>

      {special && (
        <div className="mt-5 border-t-2 border-dotted border-card-ink/[0.18] pt-4">
          <div className="flex items-center justify-between gap-3">
            <ControlLabel>{special.label}</ControlLabel>
            <TopicInfoPopover label="What traits and honours are">{special.info}</TopicInfoPopover>
          </div>
          <p className="mt-2 text-[12.5px] font-semibold leading-snug text-card-muted">
            {special.hint}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-[9px] sm:grid-cols-2">
            {special.items.map((item) => (
              <TopicTile
                key={item.id}
                item={item}
                active={selected.has(item.id)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      )}

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

function TopicTile({
  item,
  active,
  onToggle,
}: {
  item: TopicItem
  active: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
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
          active ? 'bg-black/20 text-on-green' : 'border-2 border-card-ink/[0.28] text-transparent'
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
}

function TopicInfoPopover({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={label}
        className="flex items-center gap-1 rounded-full px-1.5 py-1 text-card-muted-2 transition-colors hover:bg-card-tint hover:text-card-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-white data-[popup-open]:bg-card-tint data-[popup-open]:text-card-ink"
      >
        <CircleHelp size={15} strokeWidth={2.4} />
        <span className="font-mono text-[11px] font-bold">What's this?</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="z-50"
        >
          <Popover.Popup className="max-h-[var(--available-height)] w-[min(22rem,calc(100vw-2rem))] origin-[var(--transform-origin)] overflow-y-auto rounded-[14px] bg-card-ink px-4 py-3.5 text-on-green shadow-[0_8px_0_#0a2417] outline-none">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
