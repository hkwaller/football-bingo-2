'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BoardConfig } from '@/lib/boardConfig'
import {
  categoryPoolForConfig,
  categoriesRequired,
  DEFAULT_BOARD_CONFIG,
  isBoardConfigViable,
} from '@/lib/boardConfig'
import {
  DRAFT_POLICY_HELP,
  DRAFT_POLICY_LABEL,
  type DraftPolicy,
} from '@/lib/draftPolicy'
import { loadSolo, saveSolo } from '@/lib/soloStorage'
import type { PlayMode } from '@/lib/playMode'

export function SoloPlaySetup() {
  const router = useRouter()
  const [boardConfig, setBoardConfig] = useState<BoardConfig>(DEFAULT_BOARD_CONFIG)
  const [lineHighlight, setLineHighlight] = useState(true)
  const [draftPolicy, setDraftPolicy] = useState<DraftPolicy>('open')
  const [configSigAtLoad, setConfigSigAtLoad] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    const s = loadSolo()
    if (s) {
      setBoardConfig(s.boardConfig ?? DEFAULT_BOARD_CONFIG)
      setLineHighlight(s.lineHighlight !== false)
      setDraftPolicy(s.draftPolicy === 'placeable' ? 'placeable' : 'open')
      setConfigSigAtLoad(JSON.stringify(s.boardConfig ?? DEFAULT_BOARD_CONFIG))
    } else {
      setConfigSigAtLoad(JSON.stringify(DEFAULT_BOARD_CONFIG))
    }
    setHydrated(true)
  }, [])

  const poolCount = categoryPoolForConfig(boardConfig).length
  const needCount = categoriesRequired(boardConfig)
  const configOk = isBoardConfigViable(boardConfig)

  const persistAndPlay = () => {
    const prev = loadSolo()
    const nextSig = JSON.stringify(boardConfig)
    const configChanged = configSigAtLoad !== nextSig
    const playMode: PlayMode = prev?.playMode === 'free' ? 'free' : 'draft'

    if (configChanged) {
      saveSolo({
        seed: crypto.randomUUID(),
        solved: {},
        playMode,
        round: 0,
        boardConfig,
        lineHighlight,
        draftPolicy,
      })
    } else {
      saveSolo({
        seed: prev?.seed ?? crypto.randomUUID(),
        solved: prev?.solved ?? {},
        playMode,
        round: typeof prev?.round === 'number' ? prev.round : 0,
        boardConfig,
        lineHighlight,
        draftPolicy,
      })
    }
    router.push('/play')
  }

  const toggleKind = (key: keyof BoardConfig['categoryKinds']) => {
    const next = {
      ...boardConfig,
      categoryKinds: {
        ...boardConfig.categoryKinds,
        [key]: !boardConfig.categoryKinds[key],
      },
    }
    if (!isBoardConfigViable(next)) return
    setBoardConfig(next)
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-chalk/60">
        Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-chalk md:text-5xl">
            Solo setup
          </h1>
          <p className="mt-2 max-w-xl text-base text-chalk/65">
            Choose grid size, which clue types appear, and how draft draws work.
            Changing the grid or categories starts a new board when you save.
          </p>
        </div>
        <Link
          href="/play"
          className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-chalk/85 hover:bg-white/10"
        >
          Back to game
        </Link>
      </div>

      <div className="space-y-8 rounded-2xl border border-white/12 bg-white/[0.04] p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-chalk/55">
            Grid size
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setBoardConfig((c) => ({ ...c, size: n }))}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  boardConfig.size === n
                    ? 'bg-[var(--fb-accent-magenta)] text-white'
                    : 'border border-white/20 bg-black/20 text-chalk/80 hover:bg-white/10'
                }`}
              >
                {n}×{n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-chalk/55">
            Categories
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {(
              [
                ['nationalities', 'Nationalities'],
                ['clubs', 'Clubs'],
                ['achievements', 'Achievements'],
              ] as const
            ).map(([k, label]) => (
              <label
                key={k}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={boardConfig.categoryKinds[k]}
                  onChange={() => toggleKind(k)}
                  className="h-4 w-4 rounded border-white/30"
                />
                <span className="text-sm font-medium text-chalk">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <p className={`text-sm ${configOk ? 'text-chalk/60' : 'text-red-300'}`}>
          {configOk
            ? `${poolCount} clues in pool — need ${needCount} for this grid.`
            : `Turn on more categories: need at least ${needCount} clues.`}
        </p>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-chalk/55">
            Draft draws
          </p>
          <div className="mt-3 space-y-3">
            {(['open', 'placeable'] as const).map((p) => (
              <label
                key={p}
                className="flex cursor-pointer gap-3 rounded-xl border border-white/15 bg-black/20 p-4 hover:bg-black/30"
              >
                <input
                  type="radio"
                  name="draftPolicy"
                  checked={draftPolicy === p}
                  onChange={() => setDraftPolicy(p)}
                  className="mt-1 h-4 w-4 border-white/30"
                />
                <div>
                  <p className="font-bold text-chalk">{DRAFT_POLICY_LABEL[p]}</p>
                  <p className="mt-1 text-sm text-chalk/60">{DRAFT_POLICY_HELP[p]}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={lineHighlight}
            onChange={() => setLineHighlight((v) => !v)}
            className="h-4 w-4 rounded border-white/30"
          />
          <span className="text-sm text-chalk/80">Highlight winning lines</span>
        </label>

        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-6">
          <button
            type="button"
            disabled={!configOk}
            onClick={persistAndPlay}
            className="rounded-xl bg-[var(--fb-accent-lime)] px-6 py-3 text-base font-bold text-black hover:opacity-95 disabled:opacity-40"
          >
            Save & play
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-white/25 px-6 py-3 text-base font-semibold text-chalk hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
