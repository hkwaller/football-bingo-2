'use client'

import { useReducedMotion } from 'framer-motion'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import type { Famous11sLineup, LineupSlot, ManagerSlot } from '@/data/famous11s'

interface Props {
  lineup: Famous11sLineup
  foundSlotIds: string[]
  revealMissed?: boolean
  justFoundSlotId?: string | null
  includeManager: boolean
  /** Called when the user clicks an empty slot — passes slotId + positionLabel. */
  onSlotClick?: (slotId: string, positionLabel: string) => void
  /** slotId of the currently "active" slot (clicked, awaiting a guess). */
  activeSlotId?: string | null
}

// ── Pitch SVG background ──────────────────────────────────────────────────

function PitchSVG() {
  return (
    <svg
      viewBox="0 0 100 154"
      preserveAspectRatio="none"
      aria-hidden
      className="absolute inset-0 h-full w-full"
    >
      {/* Grass */}
      <rect x="0" y="0" width="100" height="154" fill="#1a6b3c" />
      {/* Alternating grass stripes */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="0"
          y={i * 19.25}
          width="100"
          height="9.625"
          fill={i % 2 === 0 ? '#1a6b3c' : '#1c7441'}
        />
      ))}
      {/* Outer pitch border */}
      <rect x="2" y="2" width="96" height="150" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      {/* Centre line */}
      <line x1="2" y1="77" x2="98" y2="77" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      {/* Centre circle */}
      <circle cx="50" cy="77" r="12" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      {/* Centre spot */}
      <circle cx="50" cy="77" r="0.9" fill="rgba(255,255,255,0.55)" />
      {/* Top penalty area (attacking end) */}
      <rect x="22" y="2" width="56" height="21" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      {/* Top 6-yard box */}
      <rect x="36" y="2" width="28" height="8" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      {/* Top penalty spot */}
      <circle cx="50" cy="16" r="0.9" fill="rgba(255,255,255,0.55)" />
      {/* Top penalty arc */}
      <path d="M 36.5 23 A 11 11 0 0 0 63.5 23" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      {/* Bottom penalty area (GK end) */}
      <rect x="22" y="131" width="56" height="21" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      {/* Bottom 6-yard box */}
      <rect x="36" y="144" width="28" height="8" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      {/* Bottom penalty spot */}
      <circle cx="50" cy="138" r="0.9" fill="rgba(255,255,255,0.55)" />
      {/* Bottom penalty arc */}
      <path d="M 36.5 131 A 11 11 0 0 1 63.5 131" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      {/* Corner arcs */}
      <path d="M 2 6 A 4 4 0 0 0 6 2" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      <path d="M 94 2 A 4 4 0 0 0 98 6" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      <path d="M 2 148 A 4 4 0 0 1 6 152" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
      <path d="M 98 148 A 4 4 0 0 0 94 152" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
    </svg>
  )
}

// ── Player slot ───────────────────────────────────────────────────────────

function PlayerSlotBox({
  slot,
  found,
  missed,
  highlight,
  active,
  reduceMotion,
  onSlotClick,
}: {
  slot: LineupSlot
  found: boolean
  missed: boolean
  highlight: boolean
  active: boolean
  reduceMotion: boolean
  onSlotClick?: () => void
}) {
  const state = found ? 'found' : missed ? 'missed' : 'empty'

  return (
    <div
      className="absolute"
      style={{ left: `${slot.x}%`, top: `${slot.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <AnimatePresence mode="wait">
        {state === 'empty' ? (
          <motion.button
            key="empty"
            type="button"
            onClick={onSlotClick}
            aria-label={`Fill ${slot.positionLabel} position`}
            className={`flex h-[56px] w-[56px] flex-col items-center justify-center rounded-[8px] border-2 border-dashed backdrop-blur-[1px] transition-colors ${
              active
                ? 'border-yellow bg-yellow/20 shadow-[0_0_0_3px_rgba(255,215,0,0.35)]'
                : 'border-white/40 bg-black/25 hover:border-white/70 hover:bg-white/10'
            }`}
            animate={active && !reduceMotion ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.25 }}
            initial={false}
          >
            <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${active ? 'text-yellow' : 'text-white/60'}`}>
              {slot.positionLabel}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="filled"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduceMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 22 }}
          >
            <div
              className={`relative flex h-[56px] w-[56px] flex-col items-center justify-center overflow-hidden rounded-[8px] border-2 shadow-[0_3px_0_#0a2417] ${
                found
                  ? highlight
                    ? 'border-yellow bg-yellow/10'
                    : 'border-surface bg-surface/10'
                  : 'border-red/50 bg-black/40'
              }`}
            >
              {/* Portrait */}
              {slot.image ? (
                <Image
                  src={slot.image}
                  alt=""
                  fill
                  sizes="56px"
                  className={`object-cover ${missed ? 'opacity-40 grayscale' : ''}`}
                  style={{ objectPosition: '50% 16%' }}
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 32 32" className="h-8 w-8 opacity-50" aria-hidden>
                    <circle cx="16" cy="11" r="6" fill={missed ? '#ff5b45' : 'white'} />
                    <path d="M3 32 C3 22 9 18 16 18 C23 18 29 22 29 32 Z" fill={missed ? '#ff5b45' : 'white'} />
                  </svg>
                </div>
              )}
              {/* Name bar */}
              <div className={`absolute bottom-0 left-0 right-0 px-[3px] py-[2px] text-center ${
                found ? 'bg-ink/80' : 'bg-red/60'
              }`}>
                <span className={`block truncate font-display text-[8.5px] font-black uppercase leading-none ${
                  found ? 'text-yellow' : 'text-white'
                }`}>
                  {slot.name.split(' ').at(-1)}
                </span>
              </div>
              {/* Position badge */}
              <div className="absolute left-0.5 top-0.5 rounded-[3px] bg-black/50 px-[3px] py-[1px]">
                <span className="font-mono text-[7px] font-bold uppercase text-white/80">
                  {slot.positionLabel}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Manager slot ──────────────────────────────────────────────────────────

function ManagerChip({
  manager,
  found,
  missed,
  highlight,
  reduceMotion,
}: {
  manager: ManagerSlot
  found: boolean
  missed: boolean
  highlight: boolean
  reduceMotion: boolean
}) {
  const state = found ? 'found' : missed ? 'missed' : 'empty'

  return (
    <div className="mt-3 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {state === 'empty' ? (
          <motion.div
            key="empty"
            className="flex items-center gap-2 rounded-full border-2 border-dashed border-white/30 bg-black/25 px-4 py-1.5"
          >
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/50">
              Manager
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="filled"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduceMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 340, damping: 22 }}
            className={`flex items-center gap-2 rounded-full border-2 px-4 py-1.5 ${
              found
                ? highlight ? 'border-yellow bg-yellow/15' : 'border-surface/60 bg-surface/10'
                : 'border-red/40 bg-black/25'
            }`}
          >
            {manager.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={manager.image}
                alt=""
                className={`h-6 w-6 rounded-full object-cover ${missed ? 'grayscale opacity-50' : ''}`}
                style={{ objectPosition: '50% 16%' }}
              />
            ) : (
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/50">
                Manager
              </span>
            )}
            <span className={`font-display text-[13px] font-black uppercase leading-none ${
              found ? (highlight ? 'text-yellow' : 'text-surface') : 'text-red'
            }`}>
              {manager.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function PitchBoard({ lineup, foundSlotIds, revealMissed = false, justFoundSlotId, includeManager, onSlotClick, activeSlotId }: Props) {
  const reduceMotion = useReducedMotion() ?? false

  return (
    <div className="flex flex-col items-center">
      {/* Pitch */}
      <div className="relative w-full max-w-[380px]" style={{ paddingTop: 'min(154%, 580px)' }}>
        <div className="absolute inset-0 overflow-hidden rounded-[12px] shadow-[0_8px_0_#0a2417]">
          <PitchSVG />
          {/* Player slots */}
          {lineup.slots.map((slot) => {
            const found = foundSlotIds.includes(slot.slotId)
            const missed = revealMissed && !found
            return (
              <PlayerSlotBox
                key={slot.slotId}
                slot={slot}
                found={found}
                missed={missed}
                highlight={justFoundSlotId === slot.slotId}
                active={!found && activeSlotId === slot.slotId}
                reduceMotion={reduceMotion}
                onSlotClick={!found && !missed && onSlotClick ? () => onSlotClick(slot.slotId, slot.positionLabel) : undefined}
              />
            )
          })}
        </div>
      </div>
      {/* Manager chip below pitch */}
      {includeManager && lineup.manager && (
        <ManagerChip
          manager={lineup.manager}
          found={foundSlotIds.includes('manager')}
          missed={revealMissed && !foundSlotIds.includes('manager')}
          highlight={justFoundSlotId === 'manager'}
          reduceMotion={reduceMotion}
        />
      )}
    </div>
  )
}
