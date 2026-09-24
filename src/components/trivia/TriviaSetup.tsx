'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ListChecks, Heart, Timer } from 'lucide-react'
import type {
  TriviaConfig,
  TriviaDifficulty,
  TriviaSessionType,
  TriviaMultiplayerMechanic,
  TriviaTopic,
} from '@/lib/trivia/types'
import { DEFAULT_TRIVIA_CONFIG, TRIVIA_TOPICS, triviaCategoryFromTopics } from '@/lib/trivia/types'
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS } from '@/lib/trivia/difficulty'
import {
  eligiblePlayerCount,
  estimatedMinutes,
  selectedPoolCount,
  topicPlayerCount,
} from '@/lib/trivia/setupMeta'
import { loadTriviaConfig, saveTriviaConfig, clearTriviaSession } from '@/lib/trivia/triviaStorage'
import { SetupPageFrame, SetupHeader, TacticsBoard } from '@/components/setup/SetupScaffold'
import { PresetPills, type Preset } from '@/components/setup/PresetPills'
import { MarqueeRow, type MarqueeItem } from '@/components/setup/MarqueeRow'
import { SegmentedNumbers } from '@/components/setup/SegmentedNumbers'
import { TopicPicker, type TopicItem } from '@/components/setup/TopicPicker'
import { KickoffBar } from '@/components/setup/KickoffBar'
import { ControlLabel, ReadoutTile, SelectRow } from '@/components/setup/primitives'

// ── Presets ─────────────────────────────────────────────────────────────────
type PresetPatch = Partial<
  Pick<TriviaConfig, 'sessionType' | 'questionCount' | 'difficulty' | 'multiplayerMechanic'>
>
const PRESETS: Array<Preset & { patch: PresetPatch }> = [
  {
    id: 'quickfire',
    emoji: '⚡',
    label: 'Quickfire',
    patch: {
      sessionType: 'fixed',
      questionCount: 5,
      difficulty: 'easy',
      multiplayerMechanic: 'race',
    },
  },
  {
    id: 'pub',
    emoji: '🍺',
    label: 'Pub Quiz',
    patch: {
      sessionType: 'fixed',
      questionCount: 10,
      difficulty: 'medium',
      multiplayerMechanic: 'simultaneous',
    },
  },
  {
    id: 'lastman',
    emoji: '💔',
    label: 'Last Man Standing',
    patch: { sessionType: 'survival', difficulty: 'medium', multiplayerMechanic: 'simultaneous' },
  },
  {
    id: 'anorak',
    emoji: '🤓',
    label: 'Anorak',
    patch: {
      sessionType: 'fixed',
      questionCount: 20,
      difficulty: 'hard',
      multiplayerMechanic: 'simultaneous',
    },
  },
]

// ── Marquee (formats) ─────────────────────────────────────────────────────────
const FORMAT_ITEMS: MarqueeItem[] = [
  {
    id: 'fixed',
    icon: ListChecks,
    accent: 'sky',
    title: 'Fixed rounds',
    blurb: 'Answer a set number of questions and tally your score.',
  },
  {
    id: 'survival',
    icon: Heart,
    accent: 'pink',
    title: 'Survival',
    blurb: "Sudden death - one wrong answer and you're out.",
  },
  {
    id: 'timed',
    icon: Timer,
    accent: 'sky',
    title: 'Timed',
    blurb: "Beat the clock. Rack up as many as you can before time's up.",
  },
]
const FORMAT_LABEL: Record<Exclude<TriviaSessionType, 'category'>, string> = {
  fixed: 'Fixed rounds',
  survival: 'Survival',
  timed: 'Timed',
}

const DIFFICULTIES: TriviaDifficulty[] = ['easy', 'medium', 'hard']
const MECHANICS: Array<{ value: TriviaMultiplayerMechanic; label: string; explainer: string }> = [
  { value: 'simultaneous', label: 'Simultaneous', explainer: 'Everyone answers, then reveal' },
  { value: 'race', label: 'Race', explainer: 'First correct answer wins the round' },
  { value: 'turn-based', label: 'Turn-based', explainer: 'Players answer one at a time' },
]
const TOPIC_LABEL: Record<TriviaTopic, string> = {
  clubs: 'Clubs',
  stats: 'Stats',
  achievements: 'Achievements',
  nationalities: 'Nationalities',
}

export function TriviaSetup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('mode') as 'solo' | 'multiplayer' | null
  const isSolo = modeParam === 'solo'
  const isMultiplayer = modeParam === 'multiplayer'

  const [config, setConfig] = useState<TriviaConfig>(DEFAULT_TRIVIA_CONFIG)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConfig(loadTriviaConfig())
    setHydrated(true)
  }, [])

  const persist = (next: TriviaConfig) => {
    setConfig(next)
    saveTriviaConfig(next)
    return next
  }
  function update<K extends keyof TriviaConfig>(key: K, value: TriviaConfig[K]) {
    persist({ ...config, [key]: value })
  }
  function setTopics(next: TriviaTopic[]) {
    persist({ ...config, topics: next, category: triviaCategoryFromTopics(next) })
  }
  function applyPreset(id: string) {
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    persist({
      ...config,
      ...preset.patch,
      topics: [...TRIVIA_TOPICS],
      category: 'all',
    })
  }

  function launchSolo() {
    clearTriviaSession()
    saveTriviaConfig(config)
    router.push('/trivia/play')
  }
  function launchMultiplayer() {
    saveTriviaConfig(config)
    router.push('/trivia/room/new')
  }

  const topics = useMemo(() => config.topics ?? [...TRIVIA_TOPICS], [config.topics])
  const selectedTopics = useMemo(() => new Set<string>(topics), [topics])

  const activePreset = useMemo(() => {
    const allTopics = topics.length === TRIVIA_TOPICS.length
    if (!allTopics) return null
    return (
      PRESETS.find((p) =>
        (Object.keys(p.patch) as Array<keyof PresetPatch>).every((k) => p.patch[k] === config[k]),
      )?.id ?? null
    )
  }, [config, topics.length])

  if (!hydrated) return null

  const sessionType = (['fixed', 'survival', 'timed'] as const).includes(
    config.sessionType as never,
  )
    ? (config.sessionType as Exclude<TriviaSessionType, 'category'>)
    : 'fixed'
  const minutes = estimatedMinutes(config.questionCount)
  const topicCount = topics.length
  const poolSize = selectedPoolCount(topics, config.difficulty)
  const isValid = topicCount > 0

  // Topic summary
  let topicSummary: string
  if (topicCount === 0) topicSummary = 'Pick at least one topic'
  else if (topicCount === TRIVIA_TOPICS.length)
    topicSummary = `The full mix - ${topicCount} of ${TRIVIA_TOPICS.length} topics, ${poolSize} players in the pool`
  else if (topicCount === 1)
    topicSummary = `Deep dive - ${TOPIC_LABEL[topics[0]]} only, ${poolSize} players in the pool`
  else
    topicSummary = `${topicCount} of ${TRIVIA_TOPICS.length} topics, ${poolSize} players in the pool`

  const topicItems: TopicItem[] = TRIVIA_TOPICS.map((t) => ({
    id: t,
    label: TOPIC_LABEL[t],
    count: `${topicPlayerCount(t, config.difficulty)} players`,
  }))

  const toggleTopic = (id: string) => {
    const t = id as TriviaTopic
    setTopics(topics.includes(t) ? topics.filter((x) => x !== t) : [...topics, t])
  }

  // ── Column 1: format parameter + difficulty ──────────────────────────────
  const col1 = (
    <>
      <div>
        {sessionType === 'fixed' && (
          <>
            <ControlLabel className="mb-3">How many questions</ControlLabel>
            <SegmentedNumbers
              ariaLabel="How many questions"
              options={[{ value: 5 }, { value: 10 }, { value: 20 }]}
              value={config.questionCount}
              onChange={(v) => update('questionCount', v)}
              helper={`≈ ${minutes} minute${minutes === 1 ? '' : 's'} a round`}
            />
          </>
        )}
        {sessionType === 'timed' && (
          <>
            <ControlLabel className="mb-3">Seconds on the clock</ControlLabel>
            <SegmentedNumbers
              ariaLabel="Seconds on the clock"
              options={[{ value: 60 }, { value: 120 }, { value: 180 }]}
              value={config.timeLimitSeconds}
              onChange={(v) => update('timeLimitSeconds', v)}
              helper="Rack up as many as you can before it hits zero"
            />
          </>
        )}
        {sessionType === 'survival' && (
          <>
            <ControlLabel className="mb-3">The stakes</ControlLabel>
            <ReadoutTile label="Sudden death" value="1 life" />
            <p className="mt-2 font-mono text-[12px] font-bold text-card-muted-2">
              One wrong answer ends the run
            </p>
          </>
        )}
      </div>

      <div>
        <ControlLabel className="mb-3">Difficulty</ControlLabel>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <SelectRow
              key={d}
              active={config.difficulty === d}
              onClick={() => update('difficulty', d)}
              name={DIFFICULTY_LABELS[d]}
              count={`${eligiblePlayerCount(d)} players`}
            />
          ))}
        </div>
      </div>
    </>
  )

  // ── Column 2: multiplayer mechanic (or solo how-it-plays) ─────────────────
  const col2 = isSolo ? (
    <>
      <div>
        <ControlLabel className="mb-3">How it plays</ControlLabel>
        <div className="rounded-[12px] bg-card-tint px-[13px] py-3">
          <p className="text-[13px] font-semibold leading-snug text-card-muted">
            {DIFFICULTY_DESCRIPTIONS[config.difficulty]}
          </p>
        </div>
      </div>
      <div>
        <ControlLabel className="mb-3">The pool</ControlLabel>
        <ReadoutTile label="In play" value={`${eligiblePlayerCount(config.difficulty)}`} />
      </div>
    </>
  ) : (
    <>
      <div>
        <ControlLabel className="mb-3">Multiplayer mechanic</ControlLabel>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Multiplayer mechanic">
          {MECHANICS.map((m) => (
            <SelectRow
              key={m.value}
              active={config.multiplayerMechanic === m.value}
              onClick={() => update('multiplayerMechanic', m.value)}
              name={m.label}
              explainer={m.explainer}
            />
          ))}
        </div>
      </div>
      <div className="mt-auto">
        <ReadoutTile label="Room size" value="2–8 players" />
      </div>
    </>
  )

  const topicsPanel = (
    <TopicPicker
      label="Topics in play"
      helper="Tick everything for the full mix, or leave one on for a deep dive."
      items={topicItems}
      selected={selectedTopics}
      onToggle={toggleTopic}
      onAll={() => setTopics([...TRIVIA_TOPICS])}
      onNone={() => setTopics([])}
      summary={topicSummary}
      invalid={!isValid}
    />
  )

  // ── Kick-off readout ──────────────────────────────────────────────────────
  const lengthField =
    sessionType === 'timed'
      ? { label: 'Time', value: `${config.timeLimitSeconds}s` }
      : sessionType === 'survival'
        ? { label: 'Lives', value: '1' }
        : { label: 'Questions', value: `${config.questionCount} · ≈${minutes} min` }

  const fields = [
    { label: 'Format', value: FORMAT_LABEL[sessionType] },
    lengthField,
    { label: 'Difficulty', value: DIFFICULTY_LABELS[config.difficulty] },
    { label: 'Topics', value: `${topicCount} of ${TRIVIA_TOPICS.length}` },
  ]

  const hint = isSolo ? undefined : isMultiplayer ? (
    'Room code comes next'
  ) : (
    <button type="button" onClick={launchSolo} className="underline hover:text-on-green">
      or play solo →
    </button>
  )

  return (
    <>
      <SetupPageFrame>
        <SetupHeader badge={`Trivia · ${isSolo ? 'Solo' : 'Multiplayer'}`} title="Pick your battle">
          <PresetPills presets={PRESETS} activeId={activePreset} onSelect={applyPreset} />
        </SetupHeader>

        <MarqueeRow
          items={FORMAT_ITEMS}
          selectedId={sessionType}
          onSelect={(id) => update('sessionType', id as TriviaSessionType)}
        />

        <div className="mt-4">
          <TacticsBoard col1={col1} col2={col2} topics={topicsPanel} />
        </div>
      </SetupPageFrame>

      <KickoffBar
        fields={fields}
        mobilePrimary={`${FORMAT_LABEL[sessionType]} · ${lengthField.value}`}
        mobileDetail={`${DIFFICULTY_LABELS[config.difficulty]} · ${topicCount} of ${TRIVIA_TOPICS.length} topics`}
        hint={hint}
        ctaLabel={isSolo ? 'Play solo' : 'Create room'}
        onCta={isSolo ? launchSolo : launchMultiplayer}
        disabled={!isValid}
      />
    </>
  )
}
