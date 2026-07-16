'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Sticker } from '@/components/Sticker'

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
}

/**
 * Curated deck of real portraits — the album's headline stickers.
 * Images are Wikimedia Commons (free-licensed); credited on /credits along
 * with every other player photo.
 */
const DECK: { name: string; imageUrl: string }[] = [
  { name: 'Messi', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg/500px-Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg' },
  { name: 'Ronaldo', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg/500px-Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg' },
  { name: 'Mbappé', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Kylian_Mbappe_-_France_v_Senegal_-_16_June_2026.jpg/500px-Kylian_Mbappe_-_France_v_Senegal_-_16_June_2026.jpg' },
  { name: 'Haaland', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg/500px-Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg' },
  { name: 'Salah', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Mohamed_Salah_Argentina_v_Egypt_7_July_2026-163_%28cropped%29.jpg/500px-Mohamed_Salah_Argentina_v_Egypt_7_July_2026-163_%28cropped%29.jpg' },
  { name: 'De Bruyne', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg/500px-Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg' },
  { name: 'Vinícius', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Vin%C3%ADcius_J%C3%BAnior_Brazil_V_Morocco_13_June_2026-207_%28cropped%29.jpg/500px-Vin%C3%ADcius_J%C3%BAnior_Brazil_V_Morocco_13_June_2026-207_%28cropped%29.jpg' },
  { name: 'Bellingham', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Jude_Bellingham_England_v_Ghana_23_June_2026-061_%28cropped%29.jpg/500px-Jude_Bellingham_England_v_Ghana_23_June_2026-061_%28cropped%29.jpg' },
  { name: 'Lewandowski', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Robert_Lewandowski_2018%2C_JAP-POL_%28cropped%29.jpg/500px-Robert_Lewandowski_2018%2C_JAP-POL_%28cropped%29.jpg' },
  { name: 'Modrić', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Luka_Modric_Croatia_v_Portugal_2_July_2026-055.jpg/500px-Luka_Modric_Croatia_v_Portugal_2_July_2026-055.jpg' },
  { name: 'Van Dijk', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/20160604_AUT_NED_8876_%28cropped%29.jpg/500px-20160604_AUT_NED_8876_%28cropped%29.jpg' },
  { name: 'Saka', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Bukayo_Saka_England_v_Ghana_23_June_2026-057_%28cropped%29.jpg/500px-Bukayo_Saka_England_v_Ghana_23_June_2026-057_%28cropped%29.jpg' },
  { name: 'Wirtz', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Florian_Wirtz_Ecuador_v_Germany_25_June_2026-007.jpg/500px-Florian_Wirtz_Ecuador_v_Germany_25_June_2026-007.jpg' },
  { name: 'Pedri', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Pedri.jpg/500px-Pedri.jpg' },
  { name: 'Ronaldinho', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/2019_-_Press_conferences_-_Day_1_ENX_6950_%2849019873887%29_%28cropped%29.jpg/500px-2019_-_Press_conferences_-_Day_1_ENX_6950_%2849019873887%29_%28cropped%29.jpg' },
  { name: 'Zidane', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg' },
]

/** deterministic tilt used across the album */
const tilt = (i: number) => ((i * 7) % 5 - 2) * 0.9

export default function HomePage() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex flex-col items-center gap-16 pb-24 md:gap-24">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-16 text-center md:px-9 md:pt-20">
          {/* Fanned stickers flanking the title on desktop */}
          <motion.div
            initial={{ opacity: 0, rotate: -16, y: 12 }}
            animate={{ opacity: 1, rotate: -8, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="pointer-events-none absolute left-2 top-24 hidden md:block lg:left-16 xl:left-28"
          >
            <Sticker name="Messi" imageUrl={DECK[0].imageUrl} width={112} nameSize={11} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: 14, y: 12 }}
            animate={{ opacity: 1, rotate: 7, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease: 'easeOut' }}
            className="pointer-events-none absolute right-2 top-16 hidden md:block lg:right-16 xl:right-28"
          >
            <Sticker name="Haaland" imageUrl={DECK[3].imageUrl} width={112} nameSize={11} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: 10, y: 12 }}
            animate={{ opacity: 1, rotate: 5, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            className="pointer-events-none absolute right-24 top-56 hidden lg:block xl:right-44"
          >
            <Sticker name="Mbappé" imageUrl={DECK[2].imageUrl} width={92} nameSize={9.5} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: -12, y: 12 }}
            animate={{ opacity: 1, rotate: -6, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34, ease: 'easeOut' }}
            className="pointer-events-none absolute left-24 top-60 hidden lg:block xl:left-44"
          >
            <Sticker name="Zidane" imageUrl={DECK[15].imageUrl} width={92} nameSize={9.5} />
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.5, ease: 'easeOut' }} className="relative z-10">
            <p className="eyebrow mb-3">The football knowledge game</p>
            <h1 className="font-display text-[clamp(3.5rem,14vw,108px)] uppercase leading-[0.9] text-green">
              Football
              <br />
              <span className="text-red">Bingo</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[500px] text-[16px] font-medium leading-relaxed text-muted">
              A player is drawn. Does he fit one of your squares — right club, nation or honour? Fill a
              line before anyone else. No luck, just football knowledge.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/play/setup" className="btn btn-primary btn-lg">
                Play Bingo
              </Link>
              <Link href="/trivia/setup?mode=solo" className="btn btn-outline btn-lg">
                Play Trivia
              </Link>
            </div>
            <p className="mt-4 text-[12.5px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              641 players · Solo or with friends · Free to play
            </p>
          </motion.div>
        </div>

        {/* ── Full-bleed sticker marquee — "the album" ─────────── */}
        <div className="relative mt-12 w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper to-transparent md:w-28" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent md:w-28" />
          <motion.div
            className="flex w-max gap-4 px-4"
            animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
            transition={{ duration: 44, ease: 'linear', repeat: Infinity }}
          >
            {[...DECK, ...DECK].map((p, i) => (
              <Sticker
                key={i}
                name={p.name}
                imageUrl={p.imageUrl}
                width={124}
                nameSize={11}
                rotate={tilt(i)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it plays ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-6 md:px-9">
        <SectionHead eyebrow="How it plays" title="Three squares from a win" />
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <StepCard
            step="1"
            title="Build your board"
            body="Fill a grid with categories — a club, a country, an achievement. Every square is a football fact you're betting on."
          />
          <StepCard
            step="2"
            title="Players get drawn"
            body="One by one, real players are dealt. Slot each one onto a square he genuinely fits. Guess wrong and the square stays empty."
          />
          <StepCard
            step="3"
            title="Race to a line"
            body="First to complete a full row, column or diagonal shouts bingo. Sharp recall beats slow scrolling every time."
          />
        </div>
      </section>

      {/* ── Selling points ───────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-6 md:px-9">
        <SectionHead eyebrow="Why you'll like it" title="Made for football brains" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon="🧠"
            title="Knowledge, not luck"
            body="Every square rewards what you actually know — squads, transfers, trophies and eras."
          />
          <FeatureCard
            icon="👥"
            title="Solo or a full room"
            body="Practise on your own, or start a live room and share a code with friends."
          />
          <FeatureCard
            icon="🃏"
            title="641 real players"
            body="From all-time greats to today's stars, each with their real portrait, club and honours."
          />
          <FeatureCard
            icon="⚡"
            title="Trivia mode too"
            body="Prefer quick-fire? Switch to rapid questions — first to the whistle takes it."
          />
        </div>
      </section>

      {/* ── Mode cards ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-6 md:px-9">
        <SectionHead eyebrow="Pick your game" title="Two ways to play" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <ModeCard
            title="Bingo"
            blurb="Fill your board with the players drawn and be first to a full line. The signature mode."
            soloHref="/play/setup"
            multiHref="/room/new"
          />
          <ModeCard
            title="Trivia"
            blurb="Quick-fire football questions where the fastest correct answer wins the round."
            soloHref="/trivia/setup?mode=solo"
            multiHref="/trivia/setup?mode=multiplayer"
          />
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-6 md:px-9">
        <div className="panel relative overflow-hidden px-8 py-12 text-center md:py-14">
          <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-2">
            {DECK.slice(4, 10).map((p, i) => (
              <Sticker
                key={p.name}
                name={p.name}
                imageUrl={p.imageUrl}
                width={64}
                nameSize={7.5}
                rotate={tilt(i)}
              />
            ))}
          </div>
          <h2 className="mt-7 font-display text-[clamp(2rem,6vw,44px)] uppercase leading-none text-green">
            Ready to fill a line?
          </h2>
          <p className="mx-auto mt-3 max-w-[420px] text-[15px] font-medium text-muted">
            No sign-up needed to start. Deal your first board and see how deep your football knowledge
            really runs.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/play/setup" className="btn btn-primary btn-lg">
              Start playing
            </Link>
            <Link href="/room/new" className="btn btn-outline btn-lg">
              Start a room
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div
      {...fadeUp}
      viewport={{ once: true, margin: '-80px' }}
      whileInView="animate"
      initial="initial"
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="text-center"
    >
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h2 className="font-display text-[clamp(1.8rem,5vw,40px)] uppercase leading-none text-green">
        {title}
      </h2>
    </motion.div>
  )
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="panel flex flex-col gap-2 p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red font-display text-[20px] leading-none text-white">
        {step}
      </span>
      <p className="mt-1 font-display text-[22px] uppercase leading-none text-green">{title}</p>
      <p className="text-[13.5px] font-medium leading-relaxed text-muted">{body}</p>
    </div>
  )
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="panel flex flex-col gap-2 p-6">
      <span className="text-[26px] leading-none" aria-hidden>
        {icon}
      </span>
      <p className="mt-1 font-display text-[19px] uppercase leading-none text-green">{title}</p>
      <p className="text-[13px] font-medium leading-relaxed text-muted">{body}</p>
    </div>
  )
}

function ModeCard({
  title,
  blurb,
  soloHref,
  multiHref,
}: {
  title: string
  blurb: string
  soloHref: string
  multiHref: string
}) {
  return (
    <div className="panel flex flex-col gap-1.5 p-6">
      <p className="font-display text-[28px] uppercase leading-none text-green">{title}</p>
      <p className="text-[13.5px] font-medium leading-relaxed text-muted">{blurb}</p>
      <div className="mt-4 flex gap-2.5">
        <Link href={soloHref} className="btn btn-primary flex-1">
          Solo
        </Link>
        <Link href={multiHref} className="btn btn-outline flex-1">
          Multiplayer
        </Link>
      </div>
    </div>
  )
}
