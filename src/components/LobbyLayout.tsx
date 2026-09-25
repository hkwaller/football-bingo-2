'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { LOBBY_BAR_CLEARANCE } from '@/components/setup/LobbyBar'

type EyebrowTone = 'coral' | 'sky' | 'yellow'

/**
 * Shared multiplayer lobby frame. Left column: invite + team sheet. Right
 * column: match settings with "your name" underneath. Stacks on phones, with
 * the name panel first for guests (they arrive needing to set it) and the
 * invite first for the host (they arrive needing to share it).
 */
export function LobbyLayout({
  isHost,
  eyebrow,
  eyebrowTone = 'coral',
  title,
  subtitle,
  headerAction,
  invite,
  squad,
  settings,
  changeSettingsHref,
  nameField,
  bar,
}: {
  isHost: boolean
  eyebrow: string
  eyebrowTone?: EyebrowTone
  title: ReactNode
  subtitle?: string
  /** Optional control on the right of the header (e.g. Home). */
  headerAction?: ReactNode
  invite: ReactNode
  squad: ReactNode
  /** Contents of the "Match settings" panel (rows, notes). */
  settings: ReactNode
  /** Host-only link back to setup. */
  changeSettingsHref?: string
  nameField: ReactNode
  /** The fixed LobbyBar. */
  bar: ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const toneClass =
    eyebrowTone === 'sky' ? 'eyebrow-sky' : eyebrowTone === 'yellow' ? 'eyebrow-yellow' : ''

  return (
    <>
      <div
        className={`mx-auto w-full max-w-[1120px] px-5 pt-4 md:px-10 md:pt-8 ${LOBBY_BAR_CLEARANCE}`}
      >
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-9">
          <div className="min-w-0">
            <span className={`eyebrow ${toneClass}`}>{eyebrow}</span>
            <h1 className="mt-3 text-balance font-display text-[48px] font-black uppercase leading-[0.88] text-on-green md:text-[72px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-[56ch] text-[14.5px] font-semibold text-on-green-soft">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction}
        </header>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6"
        >
          <div
            className={`flex min-w-0 flex-col gap-5 lg:gap-6 ${isHost ? '' : 'order-last lg:order-none'}`}
          >
            {invite}
            {squad}
          </div>

          <div className="panel min-w-0 p-6">
            {!isHost && (
              <div className="-mx-6 -mt-6 mb-5 flex items-center gap-3 rounded-t-[11px] border-b-[2.5px] border-card-ink bg-yellow px-6 py-3.5">
                <span className="inline-block size-2.5 shrink-0 animate-pulse rounded-full bg-card-ink" />
                <p className="text-[13.5px] font-bold text-ink">
                  You&apos;re in. You&apos;ll start automatically when the gaffer kicks off.
                </p>
              </div>
            )}
            {isHost ? (
              <>
                <p className="eyebrow eyebrow-sky mb-2">Match settings</p>
                {settings}
                {changeSettingsHref && (
                  <Link
                    href={changeSettingsHref}
                    className="mt-3 inline-block text-[12.5px] font-bold text-card-ink underline underline-offset-2 hover:opacity-70"
                  >
                    Change settings (opens a fresh room)
                  </Link>
                )}
                <div className="mt-5 border-t-2 border-dashed border-card-tint pt-5">
                  {nameField}
                </div>
              </>
            ) : (
              <>
                {nameField}
                <div className="mt-5 border-t-2 border-dashed border-card-tint pt-5">
                  <p className="eyebrow eyebrow-sky mb-2">Match settings</p>
                  {settings}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {bar}
    </>
  )
}
