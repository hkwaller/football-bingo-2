'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CLUE_COST,
  DEEP_CUT_BONUS,
  DEFAULT_CONNECTIONS_CONFIG,
  FIRST_BONUS,
  MAX_POINTS,
  type ClubCount,
  type ConnectionsConfig,
  type ConnectionsDifficulty,
  type ConnectionsDifficultyFilter,
} from '@/lib/connections/types'
import {
  clearConnectionsSession,
  loadConnectionsConfig,
  saveConnectionsConfig,
} from '@/lib/connections/storage'
import { SetupPageFrame, SetupHeader, TacticsBoard } from '@/components/setup/SetupScaffold'
import { PresetPills, type Preset } from '@/components/setup/PresetPills'
import { SegmentedNumbers } from '@/components/setup/SegmentedNumbers'
import { KickoffBar } from '@/components/setup/KickoffBar'
import { ControlLabel, ReadoutTile, SelectRow } from '@/components/setup/primitives'

export type ConnectionsPools = Record<ClubCount, Record<ConnectionsDifficulty, number>>

const DIFFICULTIES: Array<{
  value: ConnectionsDifficultyFilter
  label: string
  explainer: string
}> = [
  { value: 'mixed', label: 'Mixed', explainer: 'Anything goes' },
  { value: 'easy', label: 'Easy', explainer: 'Big clubs, plenty of answers' },
  { value: 'medium', label: 'Medium', explainer: 'A handful of names to find' },
  { value: 'hard', label: 'Hard', explainer: 'One or two journeymen fit' },
]

type PresetPatch = Partial<ConnectionsConfig>
const PRESETS: Array<Preset & { patch: PresetPatch }> = [
  {
    id: 'pubnight',
    emoji: '🍺',
    label: 'Pub Night',
    patch: { difficulty: 'mixed', clubCount: 2, puzzleCount: 10, guesses: 3 },
  },
  {
    id: 'warmup',
    emoji: '👣',
    label: 'Warm-up',
    patch: { difficulty: 'easy', clubCount: 2, puzzleCount: 5, guesses: 3 },
  },
  {
    id: 'anorak',
    emoji: '🤓',
    label: 'Anorak',
    patch: { difficulty: 'hard', clubCount: 3, puzzleCount: 10, guesses: 1 },
  },
]

const pluralPuzzles = (n: number) => `${n} puzzle${n === 1 ? '' : 's'}`
const estimatedMinutes = (count: number) => Math.max(1, Math.round(count * 0.5))

export function ConnectionsSetup({ pools }: { pools: ConnectionsPools }) {
  const router = useRouter()
  const isMultiplayer = useSearchParams().get('mode') === 'multiplayer'
  const [config, setConfig] = useState<ConnectionsConfig>(DEFAULT_CONNECTIONS_CONFIG)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConfig(loadConnectionsConfig())
    setHydrated(true)
  }, [])

  const persist = (next: ConnectionsConfig) => {
    setConfig(next)
    saveConnectionsConfig(next)
  }
  function update<K extends keyof ConnectionsConfig>(key: K, value: ConnectionsConfig[K]) {
    persist({ ...config, [key]: value })
  }
  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id)
    if (preset) persist({ ...config, ...preset.patch })
  }
  function launch() {
    saveConnectionsConfig(config)
    if (isMultiplayer) {
      router.push('/connections/room/new')
      return
    }
    clearConnectionsSession()
    router.push('/connections/play')
  }

  const activePreset = useMemo(
    () =>
      PRESETS.find((p) =>
        (Object.keys(p.patch) as Array<keyof PresetPatch>).every((k) => p.patch[k] === config[k]),
      )?.id ?? null,
    [config],
  )

  if (!hydrated) return null

  const counts = pools[config.clubCount]
  const poolFor = (d: ConnectionsDifficultyFilter) =>
    d === 'mixed' ? counts.easy + counts.medium + counts.hard : counts[d]
  const pool = poolFor(config.difficulty)
  const minutes = estimatedMinutes(config.puzzleCount)
  const diffLabel = DIFFICULTIES.find((d) => d.value === config.difficulty)?.label ?? 'Mixed'

  const col1 = (
    <>
      <div>
        <ControlLabel className="mb-3">Clubs per puzzle</ControlLabel>
        <SegmentedNumbers
          ariaLabel="Clubs per puzzle"
          numberClass="text-[30px]"
          options={[
            { value: 2, sub: 'Played for both' },
            { value: 3, sub: 'All three' },
          ]}
          value={config.clubCount}
          onChange={(v) => update('clubCount', v === 3 ? 3 : 2)}
        />
      </div>
      <div>
        <ControlLabel className="mb-3">How many puzzles</ControlLabel>
        <SegmentedNumbers
          ariaLabel="How many puzzles"
          numberClass="text-[28px]"
          options={[{ value: 5 }, { value: 10 }, { value: 15 }]}
          value={config.puzzleCount}
          onChange={(v) => update('puzzleCount', v)}
          helper={`≈ ${minutes} minutes`}
        />
      </div>
      <div>
        <ControlLabel className="mb-3">Guesses per puzzle</ControlLabel>
        <SegmentedNumbers
          ariaLabel="Guesses per puzzle"
          numberClass="text-[28px]"
          options={[{ value: 1 }, { value: 3 }, { value: 4 }]}
          value={config.guesses}
          onChange={(v) => update('guesses', v)}
          helper={
            config.guesses === 1
              ? 'One shot, no clues'
              : `Each miss reveals a clue · ${config.guesses} wrong and you're out`
          }
        />
      </div>
      {isMultiplayer && (
        <div>
          <ControlLabel className="mb-3">Clock per puzzle</ControlLabel>
          <SegmentedNumbers
            ariaLabel="Clock per puzzle"
            numberClass="text-[26px]"
            options={[
              { value: 0, sub: 'Off' },
              { value: 30, sub: '30s' },
              { value: 60, sub: '60s' },
            ]}
            value={config.roundSeconds}
            onChange={(v) => update('roundSeconds', v)}
            helper={
              config.roundSeconds > 0
                ? `Revealed after ${config.roundSeconds}s, or once everyone's done`
                : "Revealed once everyone's done (or the host calls it)"
            }
          />
        </div>
      )}
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
              count={poolFor(d.value).toLocaleString()}
            />
          ))}
        </div>
      </div>
      <div className="mt-auto">
        <ReadoutTile label="Possible puzzles" value={pool.toLocaleString()} />
      </div>
    </>
  )

  const howPanel = (
    <div className="flex flex-col gap-4">
      <div>
        <ControlLabel className="mb-3">How it plays</ControlLabel>
        <p className="text-[13.5px] font-semibold leading-relaxed text-card-muted">
          You get {config.clubCount} clubs. Name any player who played for{' '}
          {config.clubCount === 3 ? 'all three' : 'both'} - loans count. Every puzzle is built
          from real careers, so there&apos;s always at least one answer.
          {isMultiplayer &&
            ` Everyone races the same clubs - the first to connect them gets +${FIRST_BONUS}.`}
        </p>
      </div>
      <div>
        <ControlLabel className="mb-3">Scoring</ControlLabel>
        <ul className="flex flex-col gap-2">
          {[
            ['First guess', `${MAX_POINTS} pts`],
            ['Each clue needed', `-${CLUE_COST}`],
            ['Deep cut (not an obvious one)', `+${DEEP_CUT_BONUS}`],
            ["A name we don't know", 'free go'],
          ].map(([label, value]) => (
            <li
              key={label}
              className="flex items-center justify-between gap-3 rounded-[12px] bg-card-tint px-[13px] py-[11px]"
            >
              <span className="font-display text-[17px] font-black uppercase leading-none text-card-ink">
                {label}
              </span>
              <span className="shrink-0 font-mono text-[12px] font-bold text-card-muted">
                {value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  return (
    <>
      <SetupPageFrame kickoff>
        <SetupHeader
          badge={`Connections · ${isMultiplayer ? 'Multiplayer' : 'Solo'}`}
          title="Who played for both?"
          badgeTone="yellow"
        >
          <PresetPills presets={PRESETS} activeId={activePreset} onSelect={applyPreset} />
        </SetupHeader>
        <div className="mt-5">
          <TacticsBoard tall col1={col1} col2={col2} topics={howPanel} />
        </div>
      </SetupPageFrame>

      <KickoffBar
        fields={[
          { label: 'Puzzles', value: pluralPuzzles(config.puzzleCount) },
          { label: 'Clubs', value: `${config.clubCount} each` },
          { label: 'Difficulty', value: diffLabel },
          isMultiplayer
            ? { label: 'Clock', value: config.roundSeconds ? `${config.roundSeconds}s` : 'Off' }
            : { label: 'Guesses', value: `${config.guesses} each` },
        ]}
        mobilePrimary={pluralPuzzles(config.puzzleCount)}
        mobileDetail={`${config.clubCount} clubs · ${diffLabel} · ≈${minutes} min`}
        hint={isMultiplayer ? 'Room code comes next' : undefined}
        ctaLabel={isMultiplayer ? 'Create room' : 'Kick off'}
        onCta={launch}
        disabled={pool === 0}
      />
    </>
  )
}
