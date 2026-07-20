'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Sticker } from '@/components/Sticker'

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
}

/**
 * Curated deck of real portraits - the album's headline stickers.
 * Images are Wikimedia Commons (free-licensed); credited on /credits along
 * with every other player photo.
 */
const DECK: { name: string; imageUrl: string }[] = [
  {
    name: 'Messi',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg/500px-Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg',
  },
  {
    name: 'Ronaldo',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg/500px-Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg',
  },
  {
    name: 'Mbappé',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Kylian_Mbappe_-_France_v_Senegal_-_16_June_2026.jpg/500px-Kylian_Mbappe_-_France_v_Senegal_-_16_June_2026.jpg',
  },
  {
    name: 'Haaland',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg/500px-Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg',
  },
  {
    name: 'Salah',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Mohamed_Salah_Argentina_v_Egypt_7_July_2026-163_%28cropped%29.jpg/500px-Mohamed_Salah_Argentina_v_Egypt_7_July_2026-163_%28cropped%29.jpg',
  },
  {
    name: 'De Bruyne',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg/500px-Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_%28cropped%29.jpg',
  },
  {
    name: 'Vinícius',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Vin%C3%ADcius_J%C3%BAnior_Brazil_V_Morocco_13_June_2026-207_%28cropped%29.jpg/500px-Vin%C3%ADcius_J%C3%BAnior_Brazil_V_Morocco_13_June_2026-207_%28cropped%29.jpg',
  },
  {
    name: 'Bellingham',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Jude_Bellingham_England_v_Ghana_23_June_2026-061_%28cropped%29.jpg/500px-Jude_Bellingham_England_v_Ghana_23_June_2026-061_%28cropped%29.jpg',
  },
  {
    name: 'Lewandowski',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Robert_Lewandowski_2018%2C_JAP-POL_%28cropped%29.jpg/500px-Robert_Lewandowski_2018%2C_JAP-POL_%28cropped%29.jpg',
  },
  {
    name: 'Modrić',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Luka_Modric_Croatia_v_Portugal_2_July_2026-055.jpg/500px-Luka_Modric_Croatia_v_Portugal_2_July_2026-055.jpg',
  },
  {
    name: 'Van Dijk',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/20160604_AUT_NED_8876_%28cropped%29.jpg/500px-20160604_AUT_NED_8876_%28cropped%29.jpg',
  },
  {
    name: 'Saka',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Bukayo_Saka_England_v_Ghana_23_June_2026-057_%28cropped%29.jpg/500px-Bukayo_Saka_England_v_Ghana_23_June_2026-057_%28cropped%29.jpg',
  },
  {
    name: 'Wirtz',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Florian_Wirtz_Ecuador_v_Germany_25_June_2026-007.jpg/500px-Florian_Wirtz_Ecuador_v_Germany_25_June_2026-007.jpg',
  },
  {
    name: 'Pedri',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Pedri.jpg/500px-Pedri.jpg',
  },
  {
    name: 'Ronaldinho',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/2019_-_Press_conferences_-_Day_1_ENX_6950_%2849019873887%29_%28cropped%29.jpg/500px-2019_-_Press_conferences_-_Day_1_ENX_6950_%2849019873887%29_%28cropped%29.jpg',
  },
  {
    name: 'Zidane',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg',
  },
]

/** deterministic tilt used across the marquee */
const tilt = (i: number) => (((i * 7) % 5) - 2) * 1.4
const VARIANTS = ['green', 'pink', 'yellow'] as const

export default function HomePage() {
  const reduceMotion = useReducedMotion()
  const bob = (dur: number) =>
    reduceMotion
      ? {}
      : {
          animate: { y: [0, -9, 0] },
          transition: { duration: dur, ease: 'easeInOut' as const, repeat: Infinity },
        }

  return (
    <div className="flex flex-col gap-24 pb-0">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden">
        {/* decorative chalk center circle + halfway line */}
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[640px] w-[640px] -translate-x-1/2 rounded-full border-[3px] border-white/[0.18]" />
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white/[0.08]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-12 pt-16 md:px-9 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left column */}
          <motion.div {...fadeUp} transition={{ duration: 0.5, ease: 'easeOut' }}>
            <span className="eyebrow">The football knowledge game</span>
            <h1 className="mt-5 font-display text-[clamp(56px,9.5vw,108px)] font-black uppercase leading-[0.86] text-white">
              Know ball?
              <br />
              <span className="mt-2 inline-block -rotate-[1.5deg] bg-yellow px-[18px] text-pitch-deep shadow-[0_8px_0_rgba(0,0,0,0.3)]">
                Prove it.
              </span>
            </h1>
            <p className="mt-7 max-w-[460px] text-[17px] font-semibold leading-relaxed text-on-green-soft">
              A player is drawn, the room goes wild. Slap him on the right square - club, nation or
              honour - and race to a line. No luck, just football knowledge.
            </p>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link href="/play/setup" className="btn btn-primary btn-lg">
                Play Bingo
              </Link>
              <Link href="/trivia/setup?mode=solo" className="btn btn-outline-light btn-lg">
                Play Trivia
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {['🃏 641 real players', '👥 Solo or full room', '🎉 Free to play'].map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-[13px] font-bold text-on-green"
                >
                  {s}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right column - vote card */}
          <motion.div
            initial={{ opacity: 0, y: 18, rotate: 5 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-[420px]"
          >
            <div className="relative rounded-[24px] bg-white p-[26px] shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-4">
                <motion.div {...bob(4.6)} className="w-[96px] shrink-0">
                  <Sticker
                    name="Salah"
                    imageUrl={DECK[4].imageUrl}
                    rotate={-4}
                    nameSize={12}
                    drawn
                  />
                </motion.div>
                <div>
                  <p className="text-[12px] font-extrabold uppercase leading-none tracking-[0.14em] text-pink">
                    Round 7 · fresh from the pack
                  </p>
                  <p className="mt-1.5 font-display text-[32px] font-black uppercase leading-none text-card-ink">
                    Where does he fit?
                  </p>
                </div>
              </div>
              <div className="mt-[18px] flex flex-col gap-2.5">
                <div className="flex items-center justify-between rounded-xl bg-green-go px-4 py-3 text-[15px] font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,0.2)]">
                  <span>⚽ Liverpool</span>
                  <span>✓ 71%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-card-tint px-4 py-3 text-[15px] font-extrabold text-card-muted">
                  <span>🌍 Egypt</span>
                  <span>22%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-card-tint px-4 py-3 text-[15px] font-extrabold text-card-muted">
                  <span>🏆 Ballon d&apos;Or</span>
                  <span>7%</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="-rotate-2 rounded-lg bg-yellow px-2.5 py-1.5 text-[12px] font-extrabold text-pitch-deep">
                  +250 pts
                </span>
                <span className="text-[12.5px] font-bold text-card-muted-2">
                  Jonas: &quot;no way he misses this&quot; 💬
                </span>
              </div>
            </div>
            <motion.div
              {...bob(3.4)}
              className="absolute -right-3.5 -top-6 rotate-[8deg] rounded-full bg-pink px-[18px] py-3 font-display text-[22px] font-black uppercase text-white shadow-[0_6px_0_rgba(0,0,0,0.3)]"
            >
              Bingo!
            </motion.div>
          </motion.div>
        </div>

        {/* ── Full-bleed sticker marquee ─────────── */}
        <div className="relative mt-6 w-full overflow-hidden border-y-[3px] border-white/35 bg-black/[0.14] py-[18px]">
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
      <section className="mx-auto w-full max-w-5xl px-6 md:px-9">
        <SectionHead eyebrow="How it plays" tone="sky" title="Three squares from glory" />
        <div className="mt-9 grid gap-5 sm:grid-cols-3">
          <StepCard
            step="1"
            rot={-1}
            tone="yellow"
            title="Build your board"
            body="Fill a grid with clubs, countries and honours. Every square is a football fact you're betting on."
          />
          <StepCard
            step="2"
            rot={1}
            tone="pink"
            title="Stickers get drawn"
            body="Real players, one by one. Slap each sticker on a square he genuinely fits - miss and it stays empty."
          />
          <StepCard
            step="3"
            rot={-0.6}
            tone="sky"
            title="Race to a line"
            body="Row, column or diagonal - first to fill one shouts BINGO and takes the roar of the room."
          />
        </div>
      </section>

      {/* ── Mode cards ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-5xl px-6 md:px-9">
        <SectionHead eyebrow="Pick your game" tone="pink" title="Two ways to play" />
        <div className="mt-9 grid gap-5 sm:grid-cols-2">
          <ModeCard
            title="Bingo"
            icon="⚽"
            rot={-0.6}
            blurb="Fill your board with the players drawn and be first to a full line. The signature mode."
            soloHref="/play/setup"
            multiHref="/room/new"
          />
          <ModeCard
            title="Trivia"
            icon="⚡"
            rot={0.6}
            blurb="Quick-fire football questions where the fastest correct answer wins the round."
            soloHref="/trivia/setup?mode=solo"
            multiHref="/trivia/setup?mode=multiplayer"
          />
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden border-t-[3px] border-white/35 bg-black/[0.16] px-6 py-20 md:px-9">
        <div className="pointer-events-none absolute bottom-[-320px] left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full border-[3px] border-white/[0.16]" />
        <div className="relative mx-auto max-w-[640px] text-center">
          <h2 className="font-display text-[clamp(2.5rem,8vw,60px)] font-black uppercase leading-[0.9] text-white">
            Ready for
            <br />
            <span className="mt-1 inline-block -rotate-1 bg-yellow px-3.5 text-pitch-deep shadow-[0_6px_0_rgba(0,0,0,0.3)]">
              kick-off?
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[420px] text-[15.5px] font-semibold leading-relaxed text-on-green-soft">
            No sign-up needed. Deal your first board and see how deep your football knowledge really
            runs.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3.5">
            <Link href="/play/setup" className="btn btn-primary btn-lg">
              Start playing
            </Link>
            <Link href="/room/new" className="btn btn-outline-light btn-lg">
              Start a room
            </Link>
          </div>
        </div>
      </section>
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
      <h2 className="mt-3 font-display text-[clamp(2rem,6vw,52px)] font-black uppercase leading-none text-white">
        {title}
      </h2>
    </motion.div>
  )
}

const ROUNDEL: Record<'yellow' | 'pink' | 'sky', string> = {
  yellow: 'bg-yellow text-pitch-deep',
  pink: 'bg-pink text-white',
  sky: 'bg-sky text-pitch-deep',
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
      className="rounded-[20px] bg-white p-[26px] shadow-[0_10px_0_rgba(0,0,0,0.22)]"
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <span
        className={`flex h-[46px] w-[46px] items-center justify-center rounded-full font-display text-[24px] font-black leading-none shadow-[0_4px_0_rgba(0,0,0,0.2)] ${ROUNDEL[tone]}`}
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

function ModeCard({
  title,
  icon,
  blurb,
  soloHref,
  multiHref,
  rot,
}: {
  title: string
  icon: string
  blurb: string
  soloHref: string
  multiHref: string
  rot: number
}) {
  return (
    <motion.div
      {...fadeUp}
      viewport={{ once: true, margin: '-60px' }}
      whileInView="animate"
      initial="initial"
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-[20px] bg-white p-7 shadow-[0_10px_0_rgba(0,0,0,0.22)]"
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <p className="font-display text-[34px] font-black uppercase leading-none text-card-ink">
        {title} <span className="text-[20px]">{icon}</span>
      </p>
      <p className="mt-2 text-[14.5px] font-semibold leading-relaxed text-card-muted">{blurb}</p>
      <div className="mt-[18px] flex gap-3">
        <Link href={soloHref} className="btn btn-primary flex-1">
          Solo
        </Link>
        <Link href={multiHref} className="btn btn-outline flex-1">
          Multiplayer
        </Link>
      </div>
    </motion.div>
  )
}
