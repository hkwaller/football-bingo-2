'use client'

import type { ReactNode } from 'react'

/**
 * Outer page frame: full-width, capped at the 1440 design width, with bottom
 * padding that clears the fixed kick-off bar so nothing hides behind it.
 */
export function SetupPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-[136px] pt-2 md:px-10">{children}</div>
  )
}

type BadgeTone = 'pink' | 'sky' | 'yellow'

/**
 * Title block + shortcuts row. The badge pill sits above a big Passion One
 * headline; the shortcuts group sits to the right and drops below the title on
 * narrow screens.
 */
export function SetupHeader({
  badge,
  badgeTone = 'pink',
  title,
  children,
}: {
  badge: string
  badgeTone?: BadgeTone
  title: string
  /** The shortcuts row (PresetPills). */
  children?: ReactNode
}) {
  const toneClass =
    badgeTone === 'sky' ? 'eyebrow-sky' : badgeTone === 'yellow' ? 'eyebrow-yellow' : ''
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
      <div>
        <span className={`eyebrow ${toneClass}`}>{badge}</span>
        <h1 className="mt-2.5 font-display text-[44px] font-black uppercase leading-[0.88] text-on-green md:text-[64px]">
          {title}
        </h1>
      </div>
      {children && <div className="min-w-0 lg:pb-1.5">{children}</div>}
    </div>
  )
}

/**
 * The white "tactics board": three columns on wide screens (numbers · rules ·
 * topics) with a dotted divider before the topics column. Collapses to two
 * columns on tablets and a single column on phones. `tall` gives Tenable its
 * taller board (it carries everything, with no marquee above it).
 */
export function TacticsBoard({
  col1,
  col2,
  topics,
  tall = false,
}: {
  col1: ReactNode
  col2: ReactNode
  topics: ReactNode
  tall?: boolean
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-7 rounded-[14px] bg-surface shadow-[0_8px_0_#0a2417] md:grid-cols-2 xl:grid-cols-[1fr_1fr_512px] ${
        tall ? 'p-[30px] xl:min-h-[498px]' : 'px-6 py-[22px]'
      }`}
    >
      <div className="flex flex-col gap-5">{col1}</div>
      <div className="flex flex-col gap-5">{col2}</div>
      <div className="border-card-ink/[0.18] pt-1 md:col-span-2 md:border-t-2 md:border-dotted md:pt-6 xl:col-span-1 xl:border-l-2 xl:border-t-0 xl:pl-[26px] xl:pt-0">
        {topics}
      </div>
    </div>
  )
}
