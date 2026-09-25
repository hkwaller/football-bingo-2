'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TenableGroup } from '@/data/tenable'
import type {
  TenableConfig,
  TenableDifficultyFilter,
  TenableAnswerOrder,
} from '@/lib/tenable/types'
import { DEFAULT_TENABLE_CONFIG, HINTED_POINTS, POINTS_PER_ANSWER } from '@/lib/tenable/types'
import {
  clearTenableSession,
  loadTenableConfig,
  saveTenableConfig,
} from '@/lib/tenable/tenableStorage'
import {
  TENABLE_GROUPS,
  difficultyListCount,
  estimatedMinutes,
  groupListCount,
  pluralLists,
  selectedListCount,
} from '@/lib/tenable/setupMeta'
import { SetupPageFrame, SetupHeader, TacticsBoard } from '@/components/setup/SetupScaffold'
import { PresetPills, type Preset } from '@/components/setup/PresetPills'
import { SegmentedNumbers } from '@/components/setup/SegmentedNumbers'
import { TopicPicker, type TopicItem } from '@/components/setup/TopicPicker'
import { KickoffBar } from '@/components/setup/KickoffBar'
import { ControlLabel, ReadoutTile, SelectRow } from '@/components/setup/primitives'
import { TenableBrowse } from './TenableBrowse'

type PresetPatch = Partial<
  Pick<TenableConfig, 'lives' | 'questionCount' | 'difficulty' | 'answerOrder' | 'hints'>
>
const PRESETS: Array<Preset & { patch: PresetPatch }> = [
  {
    id: 'pubnight',
    emoji: '🍺',
    label: 'Pub Night',
    patch: { difficulty: 'mixed', questionCount: 3, lives: 3, answerOrder: 'any', hints: 3 },
  },
  {
    id: 'warmup',
    emoji: '👣',
    label: 'Warm-up',
    patch: { difficulty: 'easy', questionCount: 1, lives: 5, answerOrder: 'any', hints: 5 },
  },
  {
    id: 'anorak',
    emoji: '🤓',
    label: 'Anorak',
    patch: { difficulty: 'hard', questionCount: 5, lives: 2, answerOrder: 'any', hints: 0 },
  },
]

const DIFFICULTIES: Array<{ value: TenableDifficultyFilter; label: string }> = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]
const ORDERS: Array<{ value: TenableAnswerOrder; label: string; explainer: string }> = [
  { value: 'any', label: 'Any order', explainer: 'Name them as they come to you' },
  { value: 'topdown', label: 'Top down', explainer: 'Number one first, all the way down' },
]
const ALL_GROUP_IDS = TENABLE_GROUPS.map((g) => g.id)

type SetupTab = 'mix' | 'pick'

export function TenableSetup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('mode') as 'solo' | 'multiplayer' | null
  const isSolo = modeParam === 'solo'
  const isMultiplayer = modeParam === 'multiplayer'

  const [config, setConfig] = useState<TenableConfig>(DEFAULT_TENABLE_CONFIG)
  const [hydrated, setHydrated] = useState(false)
  const [tab, setTab] = useState<SetupTab>('mix')

  useEffect(() => {
    setConfig(loadTenableConfig())
    setHydrated(true)
  }, [])

  const persist = (next: TenableConfig) => {
    setConfig(next)
    saveTenableConfig(next)
  }
  function update<K extends keyof TenableConfig>(key: K, value: TenableConfig[K]) {
    persist({ ...config, [key]: value })
  }
  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    persist({ ...config, ...preset.patch, groups: 'all', selectedQuestionId: undefined })
    setTab('mix')
  }

  // The mix tab always plays the filters; only a gallery pick sets selectedQuestionId.
  function pickList(id: string) {
    const picked = { ...config, selectedQuestionId: id }
    persist(picked)
    if (isSolo) launchSolo(picked)
    else if (isMultiplayer) launchMultiplayer(picked)
  }

  function launchSolo(cfg: TenableConfig = { ...config, selectedQuestionId: undefined }) {
    clearTenableSession()
    saveTenableConfig(cfg)
    router.push('/tenable/play')
  }
  function launchMultiplayer(cfg: TenableConfig = { ...config, selectedQuestionId: undefined }) {
    saveTenableConfig(cfg)
    router.push('/tenable/room/new')
  }

  const selectedGroups = useMemo<Set<TenableGroup>>(
    () => (config.groups === 'all' ? new Set(ALL_GROUP_IDS) : new Set(config.groups)),
    [config.groups],
  )
  function setGroups(next: Set<TenableGroup>) {
    if (next.size === ALL_GROUP_IDS.length) update('groups', 'all')
    else update('groups', Array.from(next))
  }
  const toggleGroup = (id: string) => {
    const g = id as TenableGroup
    const next = new Set(selectedGroups)
    if (next.has(g)) next.delete(g)
    else next.add(g)
    setGroups(next)
  }

  const activePreset = useMemo(() => {
    if (config.groups !== 'all') return null
    return (
      PRESETS.find((p) =>
        (Object.keys(p.patch) as Array<keyof PresetPatch>).every((k) => p.patch[k] === config[k]),
      )?.id ?? null
    )
  }, [config])

  if (!hydrated) return null

  const answerOrder: TenableAnswerOrder = config.answerOrder ?? 'any'
  const answers = config.questionCount * 10
  const minutes = estimatedMinutes(config.questionCount)
  const groupCount = selectedGroups.size
  const listPool = selectedListCount(selectedGroups, config.difficulty)
  // Some difficulties can be empty in the curated bank (e.g. no "easy" lists);
  // an empty pool would start a broken run, so the CTA must be disabled.
  const isValid = groupCount > 0 && listPool > 0
  const diffLabel = DIFFICULTIES.find((d) => d.value === config.difficulty)?.label ?? 'Mixed'

  const topicItems: TopicItem[] = TENABLE_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    count: pluralLists(groupListCount(g.id, config.difficulty)),
  }))

  let topicSummary: string
  if (groupCount === 0) topicSummary = 'Pick at least one topic'
  else if (groupCount === ALL_GROUP_IDS.length)
    topicSummary = `The full mix - ${groupCount} of ${ALL_GROUP_IDS.length} topics, ${listPool} lists in the pool`
  else if (groupCount === 1) {
    const only = TENABLE_GROUPS.find((g) => selectedGroups.has(g.id))!
    topicSummary = `Deep dive - ${only.label} only, ${listPool} lists in the pool`
  } else
    topicSummary = `${groupCount} of ${ALL_GROUP_IDS.length} topics, ${listPool} lists in the pool`

  const col1 = (
    <>
      <div>
        <ControlLabel className="mb-3">How many lists</ControlLabel>
        <SegmentedNumbers
          ariaLabel="How many lists"
          numberClass="text-[30px]"
          options={[
            { value: 1, sub: '10 answers' },
            { value: 3, sub: '30 answers' },
            { value: 5, sub: '50 answers' },
          ]}
          value={config.questionCount}
          onChange={(v) => update('questionCount', v)}
          helper={`≈ ${minutes} minutes · ${answers} answers to find`}
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
              <span>{config.lives} wrong and the run is over</span>
            </span>
          }
        />
      </div>
      <div>
        <ControlLabel className="mb-3">Hints</ControlLabel>
        <SegmentedNumbers
          ariaLabel="Hints"
          numberClass="text-[28px]"
          options={[{ value: 0 }, { value: 3 }, { value: 5 }]}
          value={config.hints}
          onChange={(v) => update('hints', v)}
          helper={
            config.hints === 0
              ? 'No hints - pure recall'
              : `${config.hints} per game · a hinted answer scores ${HINTED_POINTS}, not ${POINTS_PER_ANSWER}`
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
              count={pluralLists(difficultyListCount(d.value))}
            />
          ))}
        </div>
      </div>
      <div>
        <ControlLabel className="mb-3">Answer order</ControlLabel>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Answer order">
          {ORDERS.map((o) => (
            <SelectRow
              key={o.value}
              active={answerOrder === o.value}
              onClick={() => update('answerOrder', o.value)}
              name={o.label}
              explainer={o.explainer}
            />
          ))}
        </div>
      </div>
      <div className="mt-auto">
        <ReadoutTile label="Est. length" value={`≈ ${minutes} min`} />
      </div>
    </>
  )

  const topicsPanel = (
    <TopicPicker
      label="Topics in play"
      helper="Tick everything for the full mix, or leave one on for a deep dive."
      items={topicItems}
      selected={selectedGroups as Set<string>}
      onToggle={toggleGroup}
      onAll={() => update('groups', 'all')}
      onNone={() => update('groups', [])}
      summary={topicSummary}
      invalid={!isValid}
    />
  )

  const fields = [
    { label: 'The run', value: `${config.questionCount} lists · ${answers} answers` },
    { label: 'Lives', value: `${config.lives} wrong · ${config.hints} hints` },
    { label: 'Difficulty', value: `${diffLabel} · ≈${minutes} min` },
    { label: 'Topics', value: `${groupCount} of ${ALL_GROUP_IDS.length}` },
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
        <SetupHeader badge={`Tenable · ${isSolo ? 'Solo' : 'Multiplayer'}`} title="Name the ten">
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
              { id: 'pick' as const, label: 'Pick a list' },
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
          <TenableBrowse onPick={pickList} />
        )}
      </SetupPageFrame>

      {tab === 'mix' && (
        <KickoffBar
          fields={fields}
          mobilePrimary={`${config.questionCount} lists · ${answers} answers`}
          mobileDetail={`${config.lives} lives · ${config.hints} hints · ${diffLabel} · ≈${minutes} min`}
          hint={hint}
          ctaLabel={isSolo ? 'Kick off' : 'Create room'}
          onCta={isSolo ? () => launchSolo() : () => launchMultiplayer()}
          disabled={!isValid}
        />
      )}
    </>
  )
}
