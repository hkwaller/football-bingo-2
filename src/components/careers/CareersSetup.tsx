'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import meta from '@/data/careers/meta.json'
import {
  CLUE_COST,
  CLUE_ORDER,
  DEFAULT_CAREERS_CONFIG,
  MAX_POINTS,
  type CareersConfig,
  type CareersDifficultyFilter,
} from '@/lib/careers/types'
import { pointsAfter } from '@/lib/careers/sessionEngine'
import { clearCareersSession, loadCareersConfig, saveCareersConfig } from '@/lib/careers/storage'
import { SetupPageFrame, SetupHeader, TacticsBoard } from '@/components/setup/SetupScaffold'
import { PresetPills, type Preset } from '@/components/setup/PresetPills'
import { SegmentedNumbers } from '@/components/setup/SegmentedNumbers'
import { KickoffBar } from '@/components/setup/KickoffBar'
import { ControlLabel, ReadoutTile, SelectRow } from '@/components/setup/primitives'

const POOL: Record<CareersDifficultyFilter, number> = {
  ...meta,
  mixed: meta.easy + meta.medium + meta.hard,
}

const DIFFICULTIES: Array<{ value: CareersDifficultyFilter; label: string; explainer: string }> = [
  { value: 'mixed', label: 'Mixed', explainer: 'Anyone from the whole pool' },
  { value: 'easy', label: 'Easy', explainer: 'Household names and legends' },
  { value: 'medium', label: 'Medium', explainer: 'Regulars you should know' },
  { value: 'hard', label: 'Hard', explainer: 'Journeymen and cult heroes' },
]

const CLUE_LABEL = {
  nationality: 'Nationality',
  position: 'Position',
  initials: 'Initials',
} as const

type PresetPatch = Partial<CareersConfig>
const PRESETS: Array<Preset & { patch: PresetPatch }> = [
  {
    id: 'pubnight',
    emoji: '🍺',
    label: 'Pub Night',
    patch: { difficulty: 'mixed', playerCount: 10, guesses: 3 },
  },
  {
    id: 'warmup',
    emoji: '👣',
    label: 'Warm-up',
    patch: { difficulty: 'easy', playerCount: 5, guesses: 3 },
  },
  {
    id: 'anorak',
    emoji: '🤓',
    label: 'Anorak',
    patch: { difficulty: 'hard', playerCount: 10, guesses: 1 },
  },
]

const plural = (n: number) => `${n} player${n === 1 ? '' : 's'}`
const estimatedMinutes = (count: number) => Math.max(1, Math.round(count * 0.6))

export function CareersSetup() {
  const router = useRouter()
  const [config, setConfig] = useState<CareersConfig>(DEFAULT_CAREERS_CONFIG)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConfig(loadCareersConfig())
    setHydrated(true)
  }, [])

  const persist = (next: CareersConfig) => {
    setConfig(next)
    saveCareersConfig(next)
  }
  function update<K extends keyof CareersConfig>(key: K, value: CareersConfig[K]) {
    persist({ ...config, [key]: value })
  }
  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id)
    if (preset) persist({ ...config, ...preset.patch })
  }
  function launch() {
    clearCareersSession()
    saveCareersConfig(config)
    router.push('/careers/play')
  }

  const activePreset = useMemo(
    () =>
      PRESETS.find((p) =>
        (Object.keys(p.patch) as Array<keyof PresetPatch>).every((k) => p.patch[k] === config[k]),
      )?.id ?? null,
    [config],
  )

  if (!hydrated) return null

  const minutes = estimatedMinutes(config.playerCount)
  const diffLabel = DIFFICULTIES.find((d) => d.value === config.difficulty)?.label ?? 'Mixed'
  const pool = POOL[config.difficulty]

  const col1 = (
    <>
      <div>
        <ControlLabel className="mb-3">How many players</ControlLabel>
        <SegmentedNumbers
          ariaLabel="How many players"
          numberClass="text-[30px]"
          options={[{ value: 5 }, { value: 10 }, { value: 15 }]}
          value={config.playerCount}
          onChange={(v) => update('playerCount', v)}
          helper={`≈ ${minutes} minutes`}
        />
      </div>
      <div>
        <ControlLabel className="mb-3">Guesses per player</ControlLabel>
        <SegmentedNumbers
          ariaLabel="Guesses per player"
          numberClass="text-[28px]"
          options={[{ value: 1 }, { value: 3 }, { value: 4 }]}
          value={config.guesses}
          onChange={(v) => update('guesses', v)}
          helper={
            config.guesses === 1
              ? 'One shot, no clues'
              : `Each miss reveals a clue · ${config.guesses} wrong and he's revealed`
          }
        />
      </div>
    </>
  )

  const col2 = (
    <>
      <div>
        <ControlLabel className="mb-3">Difficulty</ControlLabel>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <SelectRow
              key={d.value}
              active={config.difficulty === d.value}
              onClick={() => update('difficulty', d.value)}
              name={d.label}
              explainer={d.explainer}
              count={plural(POOL[d.value])}
            />
          ))}
        </div>
      </div>
      <div className="mt-auto">
        <ReadoutTile label="In pool" value={plural(pool)} />
      </div>
    </>
  )

  const cluesShown = Math.min(config.guesses - 1, CLUE_ORDER.length)
  const howPanel = (
    <div className="flex flex-col gap-4">
      <div>
        <ControlLabel className="mb-3">How it plays</ControlLabel>
        <p className="text-[13.5px] font-semibold leading-relaxed text-card-muted">
          You get the years and clubs, loans included. Name the player. A first-guess answer scores{' '}
          {MAX_POINTS}, each clue you need costs {CLUE_COST}.
        </p>
      </div>
      <div>
        <ControlLabel className="mb-3">Clue ladder</ControlLabel>
        <ol className="flex flex-col gap-2">
          <li className="flex items-center justify-between rounded-[12px] bg-card-tint px-[13px] py-[11px]">
            <span className="font-display text-[18px] font-black uppercase leading-none text-card-ink">
              Career only
            </span>
            <span className="font-mono text-[12px] font-bold text-card-muted">
              {pointsAfter(0)} pts
            </span>
          </li>
          {CLUE_ORDER.map((kind, i) => (
            <li
              key={kind}
              className={`flex items-center justify-between rounded-[12px] px-[13px] py-[11px] ${
                i < cluesShown ? 'bg-card-tint' : 'bg-card-tint/40 opacity-50'
              }`}
            >
              <span className="font-display text-[18px] font-black uppercase leading-none text-card-ink">
                + {CLUE_LABEL[kind]}
              </span>
              <span className="font-mono text-[12px] font-bold text-card-muted">
                {i < cluesShown ? `${pointsAfter(i + 1)} pts` : 'off'}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )

  return (
    <>
      <SetupPageFrame kickoff>
        <SetupHeader badge="Careers · Solo" title="Whose career?" badgeTone="sky">
          <PresetPills presets={PRESETS} activeId={activePreset} onSelect={applyPreset} />
        </SetupHeader>
        <div className="mt-5">
          <TacticsBoard tall col1={col1} col2={col2} topics={howPanel} />
        </div>
      </SetupPageFrame>

      <KickoffBar
        fields={[
          { label: 'Players', value: plural(config.playerCount) },
          { label: 'Guesses', value: `${config.guesses} each` },
          { label: 'Difficulty', value: diffLabel },
          { label: 'Length', value: `≈ ${minutes} min` },
        ]}
        mobilePrimary={plural(config.playerCount)}
        mobileDetail={`${config.guesses} guesses · ${diffLabel} · ≈${minutes} min`}
        ctaLabel="Kick off"
        onCta={launch}
        disabled={pool === 0}
      />
    </>
  )
}
