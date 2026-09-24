'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Famous11sDifficultyFilter, Famous11sEraFilter, Famous11sKindFilter } from '@/lib/famous11s/types'
import { DEFAULT_FAMOUS11S_CONFIG, type Famous11sConfig } from '@/lib/famous11s/types'
import {
  clearFamous11sSession,
  loadFamous11sConfig,
  saveFamous11sConfig,
} from '@/lib/famous11s/storage'
import { lineupPoolSize, estimatedMinutes, pluralLineups } from '@/lib/famous11s/setupMeta'
import { SetupPageFrame, SetupHeader, TacticsBoard } from '@/components/setup/SetupScaffold'
import { PresetPills, type Preset } from '@/components/setup/PresetPills'
import { SegmentedNumbers } from '@/components/setup/SegmentedNumbers'
import { KickoffBar } from '@/components/setup/KickoffBar'
import { ControlLabel, ReadoutTile, SelectRow } from '@/components/setup/primitives'
import { Famous11sBrowse } from './Famous11sBrowse'

const DIFFICULTIES: Array<{ value: Famous11sDifficultyFilter; label: string; explainer: string }> =
  [
    {
      value: 'mixed',
      label: 'Mixed',
      explainer: 'All difficulties - biggest nights and tough ones',
    },
    { value: 'easy', label: 'Easy', explainer: 'Household names, modern classics' },
    { value: 'medium', label: 'Medium', explainer: 'Mix of stars and deeper knowledge' },
    { value: 'hard', label: 'Hard', explainer: 'Historical sides - real football knowledge' },
  ]

const KINDS: Array<{ value: Famous11sKindFilter; label: string; explainer: string }> = [
  { value: 'all', label: 'All', explainer: 'National teams and club sides' },
  { value: 'national', label: 'National teams', explainer: 'World Cups, Euros, and beyond' },
  { value: 'club', label: 'Club sides', explainer: 'CL finals, domestic champions' },
]

const ERAS: Array<{ value: Famous11sEraFilter; label: string; explainer: string }> = [
  { value: 'all', label: 'All', explainer: 'Classic XIs and recent Big Nights' },
  { value: 'classic', label: 'Classic', explainer: 'Folklore sides - finals and legendary XIs' },
  { value: 'big-nights', label: 'Big Nights', explainer: 'Recent marquee matches' },
]

type PresetPatch = Partial<
  Pick<Famous11sConfig, 'lineupCount' | 'difficulty' | 'kind' | 'era' | 'lives'>
>

const PRESETS: Array<Preset & { patch: PresetPatch }> = [
  {
    id: 'pubnight',
    emoji: '🍺',
    label: 'Pub Night',
    patch: { difficulty: 'mixed', lineupCount: 3, lives: 3, kind: 'all', era: 'all' },
  },
  {
    id: 'warmup',
    emoji: '👣',
    label: 'Warm-up',
    patch: { difficulty: 'easy', lineupCount: 1, lives: 5, kind: 'all', era: 'all' },
  },
  {
    id: 'anorak',
    emoji: '🤓',
    label: 'Anorak',
    patch: { difficulty: 'hard', lineupCount: 5, lives: 2, kind: 'national', era: 'classic' },
  },
]

type SetupTab = 'mix' | 'pick'

export function Famous11sSetup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('mode') as 'solo' | 'multiplayer' | null
  const isSolo = modeParam === 'solo'
  const isMultiplayer = modeParam === 'multiplayer'

  const [config, setConfig] = useState<Famous11sConfig>(DEFAULT_FAMOUS11S_CONFIG)
  const [hydrated, setHydrated] = useState(false)
  const [tab, setTab] = useState<SetupTab>('mix')

  useEffect(() => {
    setConfig(loadFamous11sConfig())
    setHydrated(true)
  }, [])

  const persist = (next: Famous11sConfig) => {
    setConfig(next)
    saveFamous11sConfig(next)
  }
  function update<K extends keyof Famous11sConfig>(key: K, value: Famous11sConfig[K]) {
    persist({ ...config, [key]: value })
  }
  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    persist({ ...config, ...preset.patch, selectedLineupId: undefined })
    setTab('mix')
  }

  function pickLineup(id: string) {
    persist({ ...config, lineupCount: 1, selectedLineupId: id })
    if (isSolo) launchSolo(id)
    else if (isMultiplayer) launchMultiplayer({ ...config, lineupCount: 1, selectedLineupId: id })
  }

  function launchSolo(selectedId?: string) {
    const cfg = selectedId
      ? { ...config, selectedLineupId: selectedId, lineupCount: 1 as const }
      : { ...config, selectedLineupId: undefined }
    clearFamous11sSession()
    saveFamous11sConfig(cfg)
    router.push('/famous-11s/play')
  }
  function launchMultiplayer(next?: Famous11sConfig) {
    saveFamous11sConfig(next ?? { ...config, selectedLineupId: undefined })
    router.push('/famous-11s/room/new')
  }

  const poolSize = useMemo(
    () => lineupPoolSize(config.kind, config.difficulty, config.era),
    [config.kind, config.difficulty, config.era],
  )
  const isValid = poolSize > 0

  const activePreset = useMemo(() => {
    return (
      PRESETS.find((p) =>
        (Object.keys(p.patch) as Array<keyof PresetPatch>).every((k) => p.patch[k] === config[k]),
      )?.id ?? null
    )
  }, [config])

  if (!hydrated) return null

  const col1 = (
    <>
      <div>
        <ControlLabel className="mb-3">How many lineups</ControlLabel>
        <SegmentedNumbers
          ariaLabel="How many lineups"
          numberClass="text-[30px]"
          options={[
            { value: 1, sub: '1 XI' },
            { value: 3, sub: '3 XIs' },
            { value: 5, sub: '5 XIs' },
          ]}
          value={config.lineupCount}
          onChange={(v) => update('lineupCount', v as 1 | 3 | 5 | 7)}
          helper={`≈ ${estimatedMinutes(config.lineupCount)} minutes`}
        />
      </div>
      <div>
        <ControlLabel className="mb-3">Lives (wrong guesses)</ControlLabel>
        <SegmentedNumbers
          ariaLabel="Lives"
          numberClass="text-[28px]"
          options={[{ value: 2 }, { value: 3 }, { value: 5 }]}
          value={config.lives}
          onChange={(v) => update('lives', v)}
          helper={
            <span className="flex items-center gap-1.5">
              <span aria-hidden>{'❤️'.repeat(config.lives)}</span>
              <span>{config.lives} wrong and the lineup ends</span>
            </span>
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
              count={`${pluralLineups(lineupPoolSize(config.kind, d.value, config.era))}`}
            />
          ))}
        </div>
      </div>
      <div>
        <ControlLabel className="mb-3">Options</ControlLabel>
        <div className="flex flex-col gap-2">
          <SelectRow
            active={config.includeManager}
            onClick={() => update('includeManager', !config.includeManager)}
            name="Include manager"
            explainer="Manager is a 12th bonus guess"
            role="checkbox"
          />
          {isMultiplayer && (
            <SelectRow
              active={config.penaltyOnMiss}
              onClick={() => update('penaltyOnMiss', !config.penaltyOnMiss)}
              name="-50 on miss"
              explainer="Wrong guess costs score as well as a life"
              role="checkbox"
            />
          )}
        </div>
      </div>
      {isMultiplayer && (
        <div>
          <ControlLabel className="mb-3">Turn timer</ControlLabel>
          <SegmentedNumbers
            ariaLabel="Turn timer"
            numberClass="text-[26px]"
            options={[
              { value: 0, sub: 'Off' },
              { value: 30, sub: '30s' },
              { value: 60, sub: '60s' },
            ]}
            value={config.turnSeconds}
            onChange={(v) => update('turnSeconds', v)}
          />
        </div>
      )}
      <div className="mt-auto">
        <ReadoutTile label="In pool" value={pluralLineups(poolSize)} />
      </div>
    </>
  )

  const topicsPanel = (
    <div className="flex flex-col gap-4">
      <div>
        <ControlLabel className="mb-3">Lineup type</ControlLabel>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Lineup type">
          {KINDS.map((k) => (
            <SelectRow
              key={k.value}
              active={config.kind === k.value}
              onClick={() => update('kind', k.value)}
              name={k.label}
              explainer={k.explainer}
              count={`${pluralLineups(lineupPoolSize(k.value, config.difficulty, config.era))}`}
            />
          ))}
        </div>
      </div>
      <div>
        <ControlLabel className="mb-3">Era</ControlLabel>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Era">
          {ERAS.map((e) => (
            <SelectRow
              key={e.value}
              active={config.era === e.value}
              onClick={() => update('era', e.value)}
              name={e.label}
              explainer={e.explainer}
              count={`${pluralLineups(lineupPoolSize(config.kind, config.difficulty, e.value))}`}
            />
          ))}
        </div>
      </div>
    </div>
  )

  const diffLabel = DIFFICULTIES.find((d) => d.value === config.difficulty)?.label ?? 'Mixed'
  const eraLabel = ERAS.find((e) => e.value === config.era)?.label ?? 'All'

  const fields = [
    { label: 'Lineups', value: `${config.lineupCount} XI${config.lineupCount === 1 ? '' : 's'}` },
    { label: 'Lives', value: `${config.lives} wrong` },
    { label: 'Difficulty', value: diffLabel },
    { label: 'Era', value: eraLabel },
  ]

  const hint = isSolo ? undefined : isMultiplayer ? (
    'Room code comes next'
  ) : (
    <button type="button" onClick={() => launchSolo()} className="underline hover:text-on-green">
      or play solo →
    </button>
  )

  return (
    <>
      <SetupPageFrame kickoff={tab === 'mix'}>
        <SetupHeader
          badge={`Famous 11s · ${isSolo ? 'Solo' : 'Multiplayer'}`}
          title="Name the eleven"
          badgeTone="yellow"
        >
          {tab === 'mix' && (
            <PresetPills presets={PRESETS} activeId={activePreset} onSelect={applyPreset} />
          )}
        </SetupHeader>

        <div
          role="tablist"
          aria-label="How to play"
          className="mt-5 flex gap-1.5 rounded-full border-[2.5px] border-surface/30 bg-black/20 p-1.5"
        >
          {(
            [
              { id: 'mix' as const, label: 'Play a mix' },
              { id: 'pick' as const, label: 'Pick an XI' },
            ] as const
          ).map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-full px-4 py-2.5 font-display text-[16px] font-black uppercase leading-none tracking-wide transition-colors md:text-[18px] ${
                  active
                    ? 'bg-yellow text-ink shadow-[0_3px_0_#0a2417]'
                    : 'text-on-green-soft hover:text-on-green'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'mix' ? (
          <div className="mt-5">
            <TacticsBoard tall col1={col1} col2={col2} topics={topicsPanel} />
          </div>
        ) : (
          <Famous11sBrowse onPick={pickLineup} />
        )}
      </SetupPageFrame>

      {tab === 'mix' && (
        <KickoffBar
          fields={fields}
          mobilePrimary={`${config.lineupCount} lineup${config.lineupCount === 1 ? '' : 's'}`}
          mobileDetail={`${config.lives} lives · ${diffLabel} · ${eraLabel}`}
          hint={hint}
          ctaLabel={isSolo ? 'Kick off' : 'Create room'}
          onCta={isSolo ? () => launchSolo() : () => launchMultiplayer()}
          disabled={!isValid}
        />
      )}
    </>
  )
}
