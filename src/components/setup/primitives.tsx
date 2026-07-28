'use client'

/**
 * Shared low-level primitives for the "Marquee" setup screens (Trivia / Tenable /
 * Bingo). Everything here uses the Prime Time Green tokens from tailwind.config /
 * globals.css — no raw hex. See DESIGN.md and the setup redesign handoff.
 */

import type { ReactNode } from 'react'

/** Small uppercase section label used above every control group. */
export function ControlLabel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={`font-sans text-[11.5px] font-extrabold uppercase leading-none tracking-[0.14em] text-card-muted-2 ${className}`}
    >
      {children}
    </p>
  )
}

/** The "All | None" quick actions that sit opposite a label. */
export function AllNone({ onAll, onNone }: { onAll: () => void; onNone: () => void }) {
  return (
    <span className="flex items-center gap-2 font-mono text-[11.5px] font-bold">
      <button
        type="button"
        onClick={onAll}
        className="text-pink transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        All
      </button>
      <span className="text-card-ink/25">|</span>
      <button
        type="button"
        onClick={onNone}
        className="text-pink transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        None
      </button>
    </span>
  )
}

/**
 * A selectable row for difficulty / mechanic / answer-order lists. Left side is
 * a Passion One name over an optional explainer; the right side carries an
 * optional count (players / lists eligible). Selected state is the mint fill with
 * an inset deep-green ring, matching the mocks.
 */
export function SelectRow({
  active,
  onClick,
  name,
  explainer,
  count,
  role = 'radio',
}: {
  active: boolean
  onClick: () => void
  name: string
  explainer?: string
  count?: string
  role?: 'radio' | 'checkbox'
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={active}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-[12px] px-[13px] py-[11px] text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        active
          ? 'bg-card-tint shadow-[inset_0_0_0_3px_var(--card-ink)]'
          : 'bg-card-tint/50 hover:-translate-y-px hover:bg-card-tint'
      }`}
    >
      <span className="min-w-0">
        <span
          className={`block font-display text-[17px] font-black uppercase leading-none ${active ? 'text-card-ink' : 'text-card-muted'}`}
        >
          {name}
        </span>
        {explainer && (
          <span className="mt-1 block text-[11.5px] font-semibold leading-snug text-card-muted">
            {explainer}
          </span>
        )}
      </span>
      {count && (
        <span className="shrink-0 font-mono text-[11px] font-bold text-card-muted-2">{count}</span>
      )}
    </button>
  )
}

/**
 * A quiet read-only tile on the mint surface: label on the left, emphasised value
 * on the right. Used for "Room size", "Free square", "Est. length" and the like.
 */
export function ReadoutTile({
  label,
  value,
  tone = 'mint',
}: {
  label: string
  value: ReactNode
  /** mint = card-tint surface; ink = deep-green surface (e.g. best-run tile) */
  tone?: 'mint' | 'ink'
}) {
  const ink = tone === 'ink'
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[12px] px-[14px] py-[11px] ${
        ink ? 'bg-card-ink' : 'bg-card-tint'
      }`}
    >
      <span
        className={`font-sans text-[11.5px] font-extrabold uppercase tracking-[0.12em] ${
          ink ? 'text-on-green-dim' : 'text-card-muted-2'
        }`}
      >
        {label}
      </span>
      <span
        className={`font-display text-[18px] font-black uppercase leading-none ${
          ink ? 'text-yellow' : 'text-card-ink'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
