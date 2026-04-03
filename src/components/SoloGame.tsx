'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { BingoBoard } from '@/components/BingoBoard'
import { DrawnPlayerPanel, type DrawnPlayer } from '@/components/DrawnPlayerPanel'
import { PlayerPickModal } from '@/components/PlayerPickModal'
import type { BoardConfig } from '@/lib/boardConfig'
import {
  boardConfigPayload,
  categoryPoolForConfig,
  categoriesRequired,
  DEFAULT_BOARD_CONFIG,
  isBoardConfigViable,
} from '@/lib/boardConfig'
import type { DraftPolicy } from '@/lib/draftPolicy'
import { draftApiUrl } from '@/lib/draftQuery'
import type { CellPick } from '@/lib/cellPick'
import {
  loadSolo,
  mapToSolo,
  saveSolo,
  soloToMap,
} from '@/lib/soloStorage'
import {
  cellCategory,
  freeIndexForConfig,
  generateBoard,
  hasBingoForConfig,
} from '@/lib/board'
import { displayCategory } from '@/lib/canonical'
import type { PlayMode } from '@/lib/playMode'
import { PLAY_MODE_LABEL } from '@/lib/playMode'

const DRAFT_COOLDOWN_MS = 2500

export function SoloGame() {
  const [hydrated, setHydrated] = useState(false)
  const [seed, setSeed] = useState('')
  const [playMode, setPlayMode] = useState<PlayMode>('draft')
  const [round, setRound] = useState(0)
  const [solved, setSolved] = useState<Map<number, CellPick>>(new Map())
  const [modalCell, setModalCell] = useState<number | null>(null)
  const [boardConfig, setBoardConfig] = useState<BoardConfig>(DEFAULT_BOARD_CONFIG)
  const [lineHighlight, setLineHighlight] = useState(true)
  const [draftPolicy, setDraftPolicy] = useState<DraftPolicy>('open')
  const [reduceMotion, setReduceMotion] = useState(false)

  const [draftTargetCells, setDraftTargetCells] = useState<Set<number> | null>(null)
  const [draftRestrictCells, setDraftRestrictCells] = useState(false)
  const [draftFallbackNote, setDraftFallbackNote] = useState<string | null>(null)

  const [drawn, setDrawn] = useState<DrawnPlayer | null>(null)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [nowTick, setNowTick] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const fn = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  useEffect(() => {
    const saved = loadSolo()
    if (saved) {
      setSeed(saved.seed)
      setSolved(soloToMap(saved.solved))
      setPlayMode(saved.playMode === 'draft' ? 'draft' : 'free')
      setRound(
        typeof saved.round === 'number' && saved.round >= 0 ? saved.round : 0,
      )
      setBoardConfig(saved.boardConfig ?? DEFAULT_BOARD_CONFIG)
      setLineHighlight(saved.lineHighlight !== false)
      setDraftPolicy(saved.draftPolicy === 'placeable' ? 'placeable' : 'open')
    } else {
      setSeed(crypto.randomUUID())
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || !seed) return
    saveSolo({
      seed,
      solved: mapToSolo(solved),
      playMode,
      round,
      boardConfig,
      lineHighlight,
      draftPolicy,
    })
  }, [hydrated, seed, solved, playMode, round, boardConfig, lineHighlight, draftPolicy])

  const occupiedIndices = useMemo(() => [...solved.keys()], [solved])

  useEffect(() => {
    if (playMode !== 'draft' || !seed || !hydrated) {
      setDrawn(null)
      setDraftLoading(false)
      setDraftTargetCells(null)
      setDraftRestrictCells(false)
      setDraftFallbackNote(null)
      return
    }
    let cancelled = false
    setDraftLoading(true)
    setDraftError(null)
    const url = draftApiUrl({
      seed,
      round,
      policy: draftPolicy,
      boardConfig,
      occupiedIndices,
    })
    void fetch(url)
      .then(async (res) => {
        const j = (await res.json()) as {
          player?: DrawnPlayer
          error?: string
          validSquares?: number[]
          restrictToValidSquares?: boolean
          usedOpenFallback?: boolean
        }
        if (cancelled) return
        if (!res.ok) {
          setDrawn(null)
          setDraftError(j.error ?? 'Could not load draw')
          setDraftTargetCells(null)
          setDraftRestrictCells(false)
          setDraftFallbackNote(null)
          return
        }
        setDrawn(j.player ?? null)
        const vs = Array.isArray(j.validSquares) ? j.validSquares : []
        const restrict = Boolean(j.restrictToValidSquares) && vs.length > 0
        setDraftRestrictCells(restrict)
        setDraftTargetCells(restrict ? new Set(vs) : null)
        setDraftFallbackNote(
          j.usedOpenFallback
            ? 'No one matched an open square — showing a random player this round.'
            : null,
        )
      })
      .catch(() => {
        if (!cancelled) {
          setDrawn(null)
          setDraftError('Could not load draw')
          setDraftTargetCells(null)
          setDraftRestrictCells(false)
          setDraftFallbackNote(null)
        }
      })
      .finally(() => {
        if (!cancelled) setDraftLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [playMode, seed, round, hydrated, draftPolicy, boardConfig, occupiedIndices])

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const t = window.setInterval(() => setNowTick(Date.now()), 200)
    return () => window.clearInterval(t)
  }, [cooldownUntil])

  const cooldownRemainingMs = Math.max(0, cooldownUntil - nowTick)

  const poolCount = categoryPoolForConfig(boardConfig).length
  const needCount = categoriesRequired(boardConfig)
  const configOk = isBoardConfigViable(boardConfig)

  const won = useMemo(() => {
    const set = new Set(solved.keys())
    set.add(freeIndexForConfig(boardConfig))
    return hasBingoForConfig(set, boardConfig)
  }, [solved, boardConfig])

  const modalLabel = useMemo(() => {
    if (modalCell === null || !seed) return null
    return cellCategory(generateBoard(seed, boardConfig), modalCell)
  }, [modalCell, seed, boardConfig])

  const placementHint = useMemo(() => {
    if (playMode !== 'draft' || !draftRestrictCells || !draftTargetCells) return null
    const n = draftTargetCells.size
    if (n <= 1) return null
    return `This player fits ${n} open squares — pick the one you want (highlighted in lime).`
  }, [playMode, draftRestrictCells, draftTargetCells])

  const resetBoard = useCallback(() => {
    const s = crypto.randomUUID()
    setSeed(s)
    setSolved(new Map())
    setRound(0)
    setModalCell(null)
    setDraftError(null)
    setCooldownUntil(0)
    saveSolo({
      seed: s,
      solved: {},
      playMode,
      round: 0,
      boardConfig,
      lineHighlight,
      draftPolicy,
    })
  }, [playMode, boardConfig, lineHighlight, draftPolicy])

  const switchMode = (m: PlayMode) => {
    if (m === playMode) return
    setPlayMode(m)
    setModalCell(null)
    setDraftError(null)
    setCooldownUntil(0)
    const s = crypto.randomUUID()
    setSeed(s)
    setSolved(new Map())
    setRound(0)
    saveSolo({
      seed: s,
      solved: {},
      playMode: m,
      round: 0,
      boardConfig,
      lineHighlight,
      draftPolicy,
    })
  }

  const skipDraft = useCallback(() => {
    if (playMode !== 'draft' || won || draftLoading) return
    setDraftError(null)
    setCooldownUntil(0)
    setRound((r) => r + 1)
  }, [playMode, won, draftLoading])

  useEffect(() => {
    if (playMode !== 'draft' || won) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
      skipDraft()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playMode, won, skipDraft])

  const handleFreePick = useCallback(
    async (playerId: string) => {
      if (modalCell === null) return { ok: false as const, error: 'No cell' }
      const res = await fetch('/api/game/validate-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed,
          cellIndex: modalCell,
          playerId,
          boardConfig: boardConfigPayload(boardConfig),
        }),
      })
      const j = (await res.json()) as {
        ok?: boolean
        reason?: string
        player?: { playerId: string; name: string; imageUrl?: string }
      }
      if (!j.ok || !j.player) {
        return { ok: false as const, error: j.reason ?? 'No match' }
      }
      const pick: CellPick = {
        playerId: j.player.playerId,
        name: j.player.name,
        imageUrl: j.player.imageUrl,
      }
      setSolved((prev) => {
        const m = new Map(prev)
        m.set(modalCell, pick)
        return m
      })
      setModalCell(null)
      return { ok: true as const }
    },
    [modalCell, seed, boardConfig],
  )

  const handleDraftCell = useCallback(
    async (cellIndex: number) => {
      if (
        playMode !== 'draft' ||
        !drawn ||
        draftLoading ||
        won ||
        Date.now() < cooldownUntil
      ) {
        return
      }
      if (
        draftRestrictCells &&
        draftTargetCells &&
        !draftTargetCells.has(cellIndex)
      ) {
        return
      }
      setDraftError(null)
      const res = await fetch('/api/game/validate-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed,
          cellIndex,
          playerId: drawn.playerId,
          boardConfig: boardConfigPayload(boardConfig),
        }),
      })
      const j = (await res.json()) as {
        ok?: boolean
        reason?: string
        player?: { playerId: string; name: string; imageUrl?: string }
      }
      if (!j.ok || !j.player) {
        setDraftError(j.reason ?? 'That square does not match this player.')
        setCooldownUntil(Date.now() + DRAFT_COOLDOWN_MS)
        return
      }
      const pick: CellPick = {
        playerId: j.player.playerId,
        name: j.player.name,
        imageUrl: j.player.imageUrl,
      }
      setSolved((prev) => {
        const m = new Map(prev)
        m.set(cellIndex, pick)
        return m
      })
      setRound((r) => r + 1)
    },
    [
      playMode,
      drawn,
      draftLoading,
      won,
      cooldownUntil,
      seed,
      boardConfig,
      draftRestrictCells,
      draftTargetCells,
    ],
  )

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-chalk/60">
        Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-chalk md:text-5xl">
            Solo
          </h1>
          <p className="mt-2 text-base text-chalk/65">
            {playMode === 'draft'
              ? 'Each round you get a player — place them on the right square.'
              : 'Pick a square, then search for a player who fits that clue.'}
          </p>
          {!configOk ? (
            <p className="mt-2 text-sm text-red-300">
              Your saved board needs at least {needCount} clues (currently {poolCount}
              ).{' '}
              <Link href="/play/setup" className="underline hover:text-red-200">
                Fix in setup
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl border border-white/15 p-0.5">
            {(['draft', 'free'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  playMode === m
                    ? 'bg-[var(--fb-accent-lime)] text-black'
                    : 'text-chalk/70 hover:text-chalk'
                }`}
              >
                {PLAY_MODE_LABEL[m]}
              </button>
            ))}
          </div>
          <Link
            href="/play/setup"
            className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-chalk hover:bg-white/10"
          >
            Board setup
          </Link>
          <button
            type="button"
            onClick={resetBoard}
            className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-chalk hover:bg-white/10"
          >
            New board
          </button>
          <Link
            href="/"
            className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-chalk/85 hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {won ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-[var(--fb-accent-yellow)]/45 bg-[var(--fb-accent-yellow)]/12 px-4 py-3 text-center font-semibold text-[var(--fb-accent-yellow)]"
          >
            Bingo! You cleared a line.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DrawnPlayerPanel
        mode={playMode}
        round={round}
        loading={draftLoading}
        player={drawn}
        error={draftError}
        cooldownRemainingMs={cooldownRemainingMs}
        onSkip={playMode === 'draft' ? skipDraft : undefined}
        skipDisabled={won || draftLoading}
        placementHint={placementHint}
        draftWarning={draftFallbackNote}
      />

      {seed ? (
        <BingoBoard
          seed={seed}
          boardConfig={boardConfig}
          solved={solved}
          lineHighlight={lineHighlight}
          reduceMotion={reduceMotion}
          draftTargetCells={playMode === 'draft' ? draftTargetCells : null}
          onCellClick={(i) => {
            if (won || !configOk) return
            if (playMode === 'draft') void handleDraftCell(i)
            else setModalCell(i)
          }}
        />
      ) : null}

      <AnimatePresence>
        {playMode === 'free' && modalCell !== null && modalLabel ? (
          <PlayerPickModal
            open
            title={`Pick a player: ${displayCategory(modalLabel)}`}
            onClose={() => setModalCell(null)}
            onPick={handleFreePick}
            cooldownMs={DRAFT_COOLDOWN_MS}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
