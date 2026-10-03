'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Sticker } from '@/components/Sticker'
import { AdsterraBanner } from '@/components/AdsterraBanner'
import { BANNER_ENABLED } from '@/lib/ads'
import { HeroTrivia } from '@/components/HeroTrivia'
import { GameModeGrid } from '@/components/GameModeGrid'
import { ScanToJoin } from '@/components/ScanToJoin'
import { GAME_MODES, type GameModeId } from '@/lib/gameModes'
import { DECK } from '@/lib/stickerDeck'

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
}

/** deterministic tilt used across the marquee */
const tilt = (i: number) => (((i * 7) % 5) - 2) * 1.4
const VARIANTS = ['green', 'pink', 'yellow'] as const

const STEP_TONES = ['yellow', 'pink', 'sky'] as const
const STEP_ROTATIONS = [-1, 1, -0.6]

export default function HomePage() {
  const reduceMotion = useReducedMotion()
  const [howItPlays, setHowItPlays] = useState<GameModeId>('bingo')
  const activeHowItPlays = GAME_MODES.find((m) => m.id === howItPlays) ?? GAME_MODES[0]

  return (
    <div className="flex flex-col gap-16 pb-0 md:gap-24">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden">
        {/* decorative chalk center circle + halfway line */}
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[640px] w-[640px] -translate-x-1/2 rounded-full border-[3px] border-surface/[0.18]" />
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-surface/[0.08]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-10 pt-6 sm:px-6 md:gap-12 md:px-9 md:pb-12 md:pt-16 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left column */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, ease: 'easeOut' }}>
            <span className="eyebrow">The football knowledge game</span>
            <h1 className="mt-5 font-display text-[clamp(56px,9.5vw,108px)] font-black uppercase leading-[0.86] text-on-green">
              Know football?
              <br />
              <span className="mt-2 inline-block -rotate-[1.5deg] bg-yellow px-[18px] text-ink shadow-[0_8px_0_#0a2417]">
                Prove it.
              </span>
            </h1>
            <p className="mt-7 max-w-[460px] text-[17px] font-semibold leading-relaxed text-on-green-soft">
              A player is drawn, the room goes wild. Slap him on the right square - club, nation or
              honour - and race to a line. No luck, just football knowledge.
            </p>
            <ScanToJoin className="mt-7" />
            {/* <div className="mt-8 flex flex-wrap gap-3.5">
              <Link href="/play/setup" className="btn btn-primary btn-lg">
                Play Bingo
              </Link>
              <Link href="/trivia/setup?mode=solo" className="btn btn-outline-light btn-lg">
                Play Trivia
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {['🃏 950+ real players', '👥 Solo or full room', '🎉 Free to play'].map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-2 rounded-lg bg-black/20 px-4 py-2 text-[13px] font-bold text-on-green"
                >
                  {s}
                </span>
              ))}
            </div> */}
          </motion.div>

          {/* Right column - playable trivia taster */}
          <motion.div
            initial={{ opacity: 0, y: 18, rotate: 5 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-[420px]"
          >
            <HeroTrivia />
          </motion.div>
        </div>
        {/* ── Mode cards ───────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-5xl px-5 pb-8 sm:px-6 md:px-9 md:pb-20">
          <SectionHead eyebrow="Pick your game" tone="pink" title="Five ways to play" />
          <GameModeGrid />
        </section>
        {/* ── Full-bleed sticker marquee ─────────── */}
        <div className="relative mt-6 w-full overflow-hidden border-y-[3px] border-surface/35 bg-black/[0.14] py-[18px]">
          <motion.div
            className="flex w-max gap-[18px] px-[18px]"
            animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
            transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
          >
            {[...DECK, ...DECK].map((p, i) => (
              <Sticker
                key={i}
                name={p.name}
                imageUrl={p.imageUrl}
                width={118}
                nameSize={12}
                rotate={tilt(i)}
                variant={VARIANTS[i % 3]}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it plays ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-5 sm:px-6 md:px-9">
        <SectionHead eyebrow="How it plays" tone="sky" title={activeHowItPlays.tagline} />
        <ModeTabs active={howItPlays} onSelect={setHowItPlays} />
        <div className="mt-7 grid gap-5 sm:grid-cols-3">
          {activeHowItPlays.steps.map((s, i) => (
            <StepCard
              key={`${activeHowItPlays.id}-${i}`}
              step={String(i + 1)}
              rot={STEP_ROTATIONS[i]}
              tone={STEP_TONES[i]}
              title={s.title}
              body={s.body}
            />
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden border-t-[3px] border-surface/35 bg-black/[0.16] px-5 py-16 sm:px-6 md:px-9 md:py-20">
        <div className="pointer-events-none absolute bottom-[-320px] left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full border-[3px] border-surface/[0.16]" />
        <div className="relative mx-auto max-w-[640px] text-center">
          <h2 className="font-display text-[clamp(2.5rem,8vw,60px)] font-black uppercase leading-[0.9] text-on-green">
            Ready for
            <br />
            <span className="mt-1 inline-block -rotate-1 bg-yellow px-3.5 text-ink shadow-[0_6px_0_#0a2417]">
              kick-off?
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[420px] text-[15.5px] font-semibold leading-relaxed text-on-green-soft">
            No sign-up needed. Deal your first board and see how deep your football knowledge really
            runs.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3.5">
            <Link href="/games" className="btn btn-primary btn-lg">
              Start playing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Ad (guests only; hidden for ad-free) ─────────────── */}
      {BANNER_ENABLED && (
        <section className="w-full px-6 pb-10">
          <AdsterraBanner />
        </section>
      )}
    </div>
  )
}

function SectionHead({
  eyebrow,
  title,
  tone,
}: {
  eyebrow: string
  title: string
  tone: 'pink' | 'sky' | 'yellow'
}) {
  const cls =
    tone === 'sky'
      ? 'eyebrow eyebrow-sky'
      : tone === 'yellow'
        ? 'eyebrow eyebrow-yellow'
        : 'eyebrow'
  return (
    <motion.div
      {...fadeUp}
      viewport={{ once: true, margin: '-80px' }}
      whileInView="animate"
      initial="initial"
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="text-center"
    >
      <span className={cls}>{eyebrow}</span>
      <h2 className="mt-3 font-display text-[clamp(2rem,6vw,52px)] font-black uppercase leading-none text-on-green">
        {title}
      </h2>
    </motion.div>
  )
}

function ModeTabs({
  active,
  onSelect,
}: {
  active: GameModeId
  onSelect: (id: GameModeId) => void
}) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="mt-7 flex justify-center">
      <div
        role="tablist"
        aria-label="Game mode"
        className="flex flex-wrap justify-center gap-1 rounded-full border-[2.5px] border-surface/30 bg-black/20 p-1.5"
      >
        {GAME_MODES.map((m) => {
          const isActive = m.id === active
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(m.id)}
              className={`relative rounded-full px-4 py-2 font-display text-[15px] font-black uppercase leading-none tracking-wide transition-colors sm:px-5 ${
                isActive ? 'text-ink' : 'text-on-green-soft hover:text-on-green'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={reduceMotion ? undefined : 'how-it-plays-tab'}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-yellow"
                />
              )}
              <span className="relative">{m.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const ROUNDEL: Record<'yellow' | 'pink' | 'sky', string> = {
  yellow: 'bg-yellow text-ink',
  pink: 'bg-pink text-ink',
  sky: 'bg-sky text-ink',
}

function StepCard({
  step,
  title,
  body,
  rot,
  tone,
}: {
  step: string
  title: string
  body: string
  rot: number
  tone: 'yellow' | 'pink' | 'sky'
}) {
  return (
    <motion.div
      {...fadeUp}
      viewport={{ once: true, margin: '-60px' }}
      whileInView="animate"
      initial="initial"
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-[14px] bg-surface p-5 shadow-[0_10px_0_#0a2417] sm:p-[26px]"
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <span
        className={`flex h-[46px] w-[46px] items-center justify-center rounded-full font-display text-[24px] font-black leading-none shadow-[0_4px_0_#0a2417] ${ROUNDEL[tone]}`}
      >
        {step}
      </span>
      <p className="mt-3.5 font-display text-[26px] font-black uppercase leading-none text-card-ink">
        {title}
      </p>
      <p className="mt-2 text-[14px] font-semibold leading-relaxed text-card-muted">{body}</p>
    </motion.div>
  )
}
