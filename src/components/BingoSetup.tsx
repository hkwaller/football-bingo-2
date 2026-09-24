'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Grid3x3, LayoutGrid, Grid2x2 } from 'lucide-react'
import type { BoardConfig } from '@/lib/boardConfig'
import {
  categoriesRequired,
  categoryPoolForConfig,
  DEFAULT_BOARD_CONFIG,
  isBoardConfigViable,
  MAX_FAME_SCORE,
} from '@/lib/boardConfig'
import { achievements, clubs, managers, nationalities, traits } from '@/data/categories'
import { enrichedFootballPlayers } from '@/data/players'
import { DRAFT_POLICY_HELP, DRAFT_POLICY_LABEL, type DraftPolicy } from '@/lib/draftPolicy'
import { randomUUID } from '@/lib/randomUUID'
import { loadSolo, saveSolo } from '@/lib/soloStorage'
import { loadBingoRoomConfig, saveBingoRoomConfig } from '@/lib/bingoRoomConfig'
import type { PlayMode } from '@/lib/playMode'
import { PLAY_MODE_LABEL } from '@/lib/playMode'
import { SetupPageFrame, SetupHeader, TacticsBoard } from '@/components/setup/SetupScaffold'
import { PresetPills, type Preset } from '@/components/setup/PresetPills'
import { MarqueeRow, type MarqueeItem } from '@/components/setup/MarqueeRow'
import { DotGridDecoration } from '@/components/setup/MarqueeCard'
import { TopicPicker, type TopicItem } from '@/components/setup/TopicPicker'
import { KickoffBar } from '@/components/setup/KickoffBar'
import { ControlLabel, SelectRow } from '@/components/setup/primitives'

type KindKey = keyof BoardConfig['categoryKinds']
const KINDS: Array<{ key: KindKey; label: string; pool: readonly string[] }> = [
  { key: 'nationalities', label: 'Nations', pool: nationalities },
  { key: 'clubs', label: 'Clubs', pool: clubs },
  { key: 'achievements', label: 'Honours', pool: achievements },
  { key: 'traits', label: 'Traits', pool: traits },
  { key: 'managers', label: 'Managers', pool: managers },
]
const TOTAL_KINDS = KINDS.length

const GRID_ITEMS: MarqueeItem[] = [
  {
    id: '3',
    icon: Grid3x3,
    accent: 'sky',
    title: '3×3 · Classic',
    blurb: 'Nine squares, eight clues. A quick game with room to breathe.',
    renderDecoration: (s) => <DotGridDecoration size={3} selected={s} />,
  },
  {
    id: '4',
    icon: LayoutGrid,
    accent: 'sky',
    title: '4×4',
    blurb: 'Sixteen squares. The sweet spot.',
    renderDecoration: (s) => <DotGridDecoration size={4} selected={s} />,
  },
  {
    id: '5',
    icon: Grid2x2,
    accent: 'pink',
    title: '5×5',
    blurb: 'Twenty-five squares. The long haul.',
    renderDecoration: (s) => <DotGridDecoration size={5} selected={s} />,
  },
]

type PresetDef = Preset & {
  size: 3 | 4 | 5
  minFameScore: number
  draftPolicy: DraftPolicy
}
const PRESETS: PresetDef[] = [
  { id: 'classic', emoji: '⚽', label: 'Classic', size: 3, minFameScore: 42, draftPolicy: 'open' },
  {
    id: 'legends',
    emoji: '👑',
    label: 'Legends Only',
    size: 4,
    minFameScore: 70,
    draftPolicy: 'open',
  },
  {
    id: 'fullhouse',
    emoji: '🏟',
    label: 'Full House',
    size: 5,
    minFameScore: 0,
    draftPolicy: 'open',
  },
]

export function BingoSetup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMultiplayer = searchParams.get('mode') === 'multiplayer'

  const [boardConfig, setBoardConfig] = useState<BoardConfig>(DEFAULT_BOARD_CONFIG)
  const [lineHighlight, setLineHighlight] = useState(true)
  const [draftPolicy, setDraftPolicy] = useState<DraftPolicy>('open')
  // Multiplayer-only settings
  const [playMode, setPlayMode] = useState<PlayMode>('draft')
  const [boardLayout, setBoardLayout] = useState<'shared' | 'individual'>('individual')
  const [drawSource, setDrawSource] = useState<'shared' | 'independent'>('shared')
  const [singleGuess, setSingleGuess] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [launching, setLaunching] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    if (isMultiplayer) {
      const c = loadBingoRoomConfig()
      setBoardConfig({ ...c.boardConfig, freeSquare: true })
      setDraftPolicy(c.draftPolicy)
      setPlayMode(c.playMode)
      setBoardLayout(c.boardLayout)
      setDrawSource(c.drawSource)
      setSingleGuess(c.singleGuess)
    } else {
      const s = loadSolo()
      if (s) {
        // Free square is on by default for every new board; only the rest carries over.
        setBoardConfig({ ...(s.boardConfig ?? DEFAULT_BOARD_CONFIG), freeSquare: true })
        setLineHighlight(s.lineHighlight !== false)
        setDraftPolicy(s.draftPolicy === 'placeable' ? 'placeable' : 'open')
      }
    }
    setHydrated(true)
  }, [isMultiplayer])

  const poolCount = categoryPoolForConfig(boardConfig).length
  const needCount = categoriesRequired(boardConfig)
  const configOk = isBoardConfigViable(boardConfig)
  const minFameScore = boardConfig.minFameScore ?? 0

  const eligiblePlayerCount = useMemo(
    () =>
      minFameScore <= 0
        ? enrichedFootballPlayers.length
        : enrichedFootballPlayers.filter((p) => (p.fameScore ?? 0) >= minFameScore).length,
    [minFameScore],
  )

  const activeKinds = KINDS.filter((k) => boardConfig.categoryKinds[k.key])
  const selectedKinds = useMemo(() => new Set<string>(activeKinds.map((k) => k.key)), [activeKinds])

  const activePreset = useMemo(() => {
    const allKindsOn = activeKinds.length === TOTAL_KINDS
    if (!allKindsOn) return null
    return (
      PRESETS.find(
        (p) =>
          p.size === boardConfig.size &&
          p.minFameScore === minFameScore &&
          p.draftPolicy === draftPolicy,
      )?.id ?? null
    )
  }, [boardConfig.size, minFameScore, draftPolicy, activeKinds.length])

  function applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id)
    if (!p) return
    setBoardConfig((c) => ({
      ...c,
      size: p.size,
      minFameScore: p.minFameScore,
      categoryKinds: {
        nationalities: true,
        clubs: true,
        achievements: true,
        traits: true,
        managers: true,
      },
    }))
    setDraftPolicy(p.draftPolicy)
  }

  const toggleKind = (id: string) => {
    const key = id as KindKey
    setBoardConfig((c) => ({
      ...c,
      categoryKinds: { ...c.categoryKinds, [key]: !c.categoryKinds[key] },
    }))
  }
  const setAllKinds = (on: boolean) =>
    setBoardConfig((c) => ({
      ...c,
      categoryKinds: {
        nationalities: on,
        clubs: on,
        achievements: on,
        traits: on,
        managers: on,
      },
    }))

  const persistAndPlay = () => {
    if (!configOk || launching) return
    const prev = loadSolo()
    const mode: PlayMode = prev?.playMode === 'free' ? 'free' : 'draft'
    saveSolo({
      seed: randomUUID(),
      solved: {},
      playMode: mode,
      round: 0,
      boardConfig,
      lineHighlight,
      draftPolicy,
    })
    setLaunching(true)
    router.push('/play')
  }

  const createRoom = () => {
    if (!configOk || launching) return
    saveBingoRoomConfig({
      boardConfig: { ...boardConfig, freeSquare: true },
      playMode,
      boardLayout,
      drawSource,
      singleGuess,
      draftPolicy,
    })
    setLaunching(true)
    router.push('/room/new')
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="flex items-center gap-3 text-sm font-semibold text-on-green-dim">
          <span className="inline-block size-2 animate-pulse rounded-full bg-yellow" />
          Loading config…
        </span>
      </div>
    )
  }

  const topicItems: TopicItem[] = KINDS.map((k) => ({
    id: k.key,
    label: k.label,
    count: `${k.pool.length} clues`,
  }))

  let topicSummary: string
  if (activeKinds.length === 0) topicSummary = 'Pick at least one kind'
  else if (activeKinds.length === TOTAL_KINDS)
    topicSummary = `A varied board - ${activeKinds.length} of ${TOTAL_KINDS} kinds, ${poolCount} clues in the pool`
  else if (activeKinds.length === 1)
    topicSummary = `A themed board - ${activeKinds[0].label} only, ${poolCount} clues in the pool`
  else
    topicSummary = `${activeKinds.length} of ${TOTAL_KINDS} kinds, ${poolCount} clues in the pool`

  // ── Column 1: star quality + clues needed ────────────────────────────────
  const fillPct = (minFameScore / MAX_FAME_SCORE) * 100
  const col1 = (
    <>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <ControlLabel>Star quality</ControlLabel>
          <span
            className={`font-mono text-[11px] font-bold ${eligiblePlayerCount === 0 ? 'text-live-red' : 'text-card-muted-2'}`}
          >
            {eligiblePlayerCount} players in play
          </span>
        </div>
        <p className="mt-2 text-[12.5px] font-semibold leading-snug text-card-muted">
          Drag right to keep the journeymen out. Only players at or above this fame score get drawn.
        </p>
        <input
          type="range"
          min={0}
          max={MAX_FAME_SCORE}
          step={1}
          value={minFameScore}
          onChange={(e) => setBoardConfig((c) => ({ ...c, minFameScore: Number(e.target.value) }))}
          aria-label="Minimum fame score"
          className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full accent-green-go"
          style={{
            background: `linear-gradient(90deg, var(--green-go) ${fillPct}%, var(--card-tint) ${fillPct}%)`,
          }}
        />
        <div className="mt-2 flex items-center justify-between font-mono text-[13px] font-bold text-card-ink">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-card-muted-2">
            Anyone
          </span>
          <span>{minFameScore === 0 ? 'Anyone' : `≥ ${minFameScore}`}</span>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-card-muted-2">
            Legends only
          </span>
        </div>
      </div>

      <div>
        <ControlLabel className="mb-2">Clues needed</ControlLabel>
        <div
          className={`flex items-center justify-between rounded-[12px] px-[14px] py-[11px] ${configOk ? 'bg-card-tint' : 'bg-live-red/10'}`}
        >
          <span className="font-sans text-[11.5px] font-extrabold uppercase tracking-[0.12em] text-card-muted-2">
            {needCount} of {poolCount}
          </span>
          <span
            className={`font-display text-[18px] font-black leading-none ${configOk ? 'text-green-go' : 'text-live-red'}`}
          >
            {configOk ? '✓' : 'Too few'}
          </span>
        </div>
        {!configOk && (
          <p className="mt-2 text-[12px] font-bold text-live-red">
            Turn on more kinds - need {needCount} clues for a {boardConfig.size}×{boardConfig.size}{' '}
            board.
          </p>
        )}
      </div>
    </>
  )

  // ── Column 2: solo (draft rule + free square) or multiplayer settings ─────
  const col2 = isMultiplayer ? (
    <>
      <div>
        <ControlLabel className="mb-3">Mode</ControlLabel>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Mode">
          {(['draft', 'free'] as const).map((m) => (
            <SelectRow
              key={m}
              active={playMode === m}
              onClick={() => setPlayMode(m)}
              name={PLAY_MODE_LABEL[m]}
              explainer={
                m === 'draft'
                  ? 'Players are drawn one at a time - place who you can.'
                  : 'Pick any player, any time, and fill your own squares.'
              }
            />
          ))}
        </div>
      </div>

      <div>
        <ControlLabel className="mb-3">Boards</ControlLabel>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Boards">
          {(
            [
              ['individual', 'Individual', 'Everyone gets their own board and races in parallel.'],
              ['shared', 'Shared', 'One board for the whole room - the draft decides placement.'],
            ] as const
          ).map(([v, label, explainer]) => (
            <SelectRow
              key={v}
              active={boardLayout === v}
              onClick={() => setBoardLayout(v)}
              name={label}
              explainer={explainer}
            />
          ))}
        </div>
      </div>

      {/* Shared board → draft rule */}
      {boardLayout === 'shared' && playMode === 'draft' ? (
        <div>
          <ControlLabel className="mb-3">Draft rule</ControlLabel>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Draft rule">
            {(['open', 'placeable'] as const).map((p) => (
              <SelectRow
                key={p}
                active={draftPolicy === p}
                onClick={() => setDraftPolicy(p)}
                name={DRAFT_POLICY_LABEL[p]}
                explainer={DRAFT_POLICY_HELP[p]}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Individual draft → draw source + one-guess */}
      {boardLayout === 'individual' && playMode === 'draft' ? (
        <>
          <div>
            <ControlLabel className="mb-3">Draw</ControlLabel>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Draw">
              {(
                [
                  ['shared', 'Same player', 'Everyone gets the same drawn player each round.'],
                  ['independent', 'Own draws', 'Each player draws their own and races solo.'],
                ] as const
              ).map(([v, label, explainer]) => (
                <SelectRow
                  key={v}
                  active={drawSource === v}
                  onClick={() => setDrawSource(v)}
                  name={label}
                  explainer={explainer}
                />
              ))}
            </div>
          </div>
          <div className="mt-auto">
            <ControlLabel className="mb-3">Guesses</ControlLabel>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Guesses">
              {(
                [
                  [false, 'Unlimited', 'Keep trying squares until you place the drawn player.'],
                  [true, 'One per turn', 'A single placement attempt each round - no retries.'],
                ] as const
              ).map(([v, label, explainer]) => (
                <SelectRow
                  key={String(v)}
                  active={singleGuess === v}
                  onClick={() => setSingleGuess(v)}
                  name={label}
                  explainer={explainer}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </>
  ) : (
    <>
      <div>
        <ControlLabel className="mb-3">Draft rule</ControlLabel>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Draft rule">
          {(['open', 'placeable'] as const).map((p) => {
            const active = draftPolicy === p
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setDraftPolicy(p)}
                className={`flex items-start gap-3 rounded-[14px] px-[13px] py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  active
                    ? 'bg-card-tint shadow-[inset_0_0_0_3px_var(--card-ink)]'
                    : 'bg-card-tint/50 hover:-translate-y-px hover:bg-card-tint'
                }`}
              >
                <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-card-ink">
                  {active && <span className="h-[9px] w-[9px] rounded-full bg-pink" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block font-display text-[17px] font-black uppercase leading-none ${active ? 'text-card-ink' : 'text-card-muted'}`}
                  >
                    {DRAFT_POLICY_LABEL[p]}
                  </span>
                  <span className="mt-1 block text-[11.5px] font-semibold leading-snug text-card-muted">
                    {DRAFT_POLICY_HELP[p]}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-auto">
        <ControlLabel className="mb-3">Free square</ControlLabel>
        <button
          type="button"
          role="switch"
          aria-checked={boardConfig.freeSquare}
          onClick={() => setBoardConfig((c) => ({ ...c, freeSquare: !c.freeSquare }))}
          className="flex w-full items-center gap-3 rounded-[14px] bg-card-tint px-[13px] py-3 text-left transition-all duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <span
            className={`relative flex h-[22px] w-[38px] shrink-0 items-center rounded-full px-[3px] transition-colors ${
              boardConfig.freeSquare ? 'bg-pink' : 'bg-card-ink/25'
            }`}
          >
            <span
              className={`h-4 w-4 rounded-full bg-surface shadow transition-transform ${
                boardConfig.freeSquare ? 'translate-x-[16px]' : 'translate-x-0'
              }`}
            />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[17px] font-black uppercase leading-none text-card-ink">
              Centre ★ free
            </span>
            <span className="mt-1 block text-[11.5px] font-semibold leading-snug text-card-muted">
              {boardConfig.freeSquare
                ? 'On: the centre square starts solved as a head start.'
                : 'Off: every square must be earned, a tougher board.'}
            </span>
          </span>
        </button>
      </div>
    </>
  )

  const topicsPanel = (
    <TopicPicker
      label="Category kinds in play"
      helper="Tick everything for a varied board, or leave one on for a themed one."
      items={topicItems}
      selected={selectedKinds}
      onToggle={toggleKind}
      onAll={() => setAllKinds(true)}
      onNone={() => setAllKinds(false)}
      summary={topicSummary}
      invalid={activeKinds.length === 0}
    />
  )

  const starValue = minFameScore === 0 ? 'Anyone' : `≥ ${minFameScore} · ${eligiblePlayerCount} in`
  const fields = isMultiplayer
    ? [
        { label: 'Mode', value: PLAY_MODE_LABEL[playMode] },
        { label: 'Boards', value: boardLayout === 'shared' ? 'Shared' : 'Individual' },
        { label: 'Board', value: `${boardConfig.size}×${boardConfig.size} · ${needCount} clues` },
        { label: 'Kinds', value: `${activeKinds.length} of ${TOTAL_KINDS}` },
      ]
    : [
        { label: 'Board', value: `${boardConfig.size}×${boardConfig.size} · ${needCount} clues` },
        { label: 'Star quality', value: starValue },
        { label: 'Draft', value: DRAFT_POLICY_LABEL[draftPolicy] },
        { label: 'Kinds', value: `${activeKinds.length} of ${TOTAL_KINDS}` },
      ]

  return (
    <>
      <SetupPageFrame>
        <SetupHeader badge={`Bingo · ${isMultiplayer ? 'Multiplayer' : 'Solo'}`} title="Team talk">
          <PresetPills
            presets={PRESETS}
            activeId={activePreset}
            onSelect={applyPreset}
            trailing={
              <Link
                href={isMultiplayer ? '/' : '/play'}
                className="flex flex-none items-center gap-2 whitespace-nowrap rounded-lg border-[3px] border-surface/50 px-4 py-2 text-[13px] font-extrabold uppercase tracking-[0.04em] text-on-green transition-colors hover:bg-surface/10"
              >
                {isMultiplayer ? '← Back home' : '← Back to game'}
              </Link>
            }
          />
        </SetupHeader>

        <MarqueeRow
          items={GRID_ITEMS}
          selectedId={String(boardConfig.size)}
          onSelect={(id) => setBoardConfig((c) => ({ ...c, size: Number(id) as 3 | 4 | 5 }))}
        />

        <div className="mt-4">
          <TacticsBoard col1={col1} col2={col2} topics={topicsPanel} />
        </div>
      </SetupPageFrame>

      <KickoffBar
        fields={fields}
        mobilePrimary={
          isMultiplayer
            ? `${PLAY_MODE_LABEL[playMode]} · ${boardLayout === 'shared' ? 'Shared' : 'Individual'}`
            : `${boardConfig.size}×${boardConfig.size} · ${needCount} clues`
        }
        mobileDetail={
          isMultiplayer
            ? `${boardConfig.size}×${boardConfig.size} · ${activeKinds.length} of ${TOTAL_KINDS} kinds`
            : `${DRAFT_POLICY_LABEL[draftPolicy]} · ${activeKinds.length} of ${TOTAL_KINDS} kinds`
        }
        hint={isMultiplayer ? 'Room code comes next' : 'Saving starts a fresh board'}
        ctaLabel={
          launching
            ? isMultiplayer
              ? 'Creating…'
              : 'Launching…'
            : isMultiplayer
              ? 'Create room'
              : 'Save & kick off'
        }
        onCta={isMultiplayer ? createRoom : persistAndPlay}
        disabled={!configOk || launching}
      />
    </>
  )
}
