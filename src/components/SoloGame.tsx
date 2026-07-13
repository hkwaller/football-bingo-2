'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { BingoBoard } from '@/components/BingoBoard'
import { BingoWinModal } from '@/components/BingoWinModal'
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
import { loadSolo, mapToSolo, saveSolo, soloToMap } from '@/lib/soloStorage'
import { cellCategory, freeIndexForConfig, generateBoard, hasBingoForConfig } from '@/lib/board'
import { displayCategory } from '@/lib/canonical'
import type { PlayMode } from '@/lib/playMode'
import { randomUUID } from '@/lib/randomUUID'
import { PLAY_MODE_LABEL } from '@/lib/playMode'

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
      setRound(typeof saved.round === 'number' && saved.round >= 0 ? saved.round : 0)
      setBoardConfig(saved.boardConfig ?? DEFAULT_BOARD_CONFIG)
      setLineHighlight(saved.lineHighlight !== false)
      setDraftPolicy(saved.draftPolicy === 'placeable' ? 'placeable' : 'open')
    } else {
      setSeed(randomUUID())
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

  const resetBoard = useCallback(() => {
    const s = randomUUID()
    setSeed(s)
    setSolved(new Map())
    setRound(0)
    setModalCell(null)
    setDraftError(null)
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
    const s = randomUUID()
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
      if (playMode !== 'draft' || !drawn || draftLoading || won) {
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
    [playMode, drawn, draftLoading, won, seed, boardConfig],
  )

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-muted">
        Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-9">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[40px] uppercase leading-none text-green md:text-[44px]">
            Solo game
          </h1>
          <p className="mt-1.5 text-sm font-medium text-muted">
            {playMode === 'draft'
              ? 'Place the drawn player on a square that matches. Complete a line to win.'
              : 'Pick a square, then search for a player who fits that clue.'}
          </p>
          {!configOk ? (
            <p className="mt-2 text-sm font-semibold text-red">
              Your saved board needs at least {needCount} clues (currently {poolCount}).{' '}
              <Link href="/play/setup" className="underline">
                Fix in setup
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-full border-2 border-ink bg-panel p-1">
            {(['draft', 'free'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors duration-200 ${
                  playMode === m ? 'bg-red text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {PLAY_MODE_LABEL[m]}
              </button>
            ))}
          </div>
          <Link href="/play/setup" className="btn btn-outline">
            Board setup
          </Link>
          <button type="button" onClick={resetBoard} className="btn btn-outline">
            New board
          </button>
        </div>
      </div>

      <BingoWinModal
        open={won}
        onPlayAgain={resetBoard}
        onClose={() => {}}
      />

      <DrawnPlayerPanel
        mode={playMode}
        round={round}
        loading={draftLoading}
        player={drawn}
        error={draftError}
        onSkip={playMode === 'draft' ? skipDraft : undefined}
        skipDisabled={won || draftLoading}
        draftWarning={draftFallbackNote}
      />

      {seed ? (
        <BingoBoard
          seed={seed}
          boardConfig={boardConfig}
          solved={solved}
          lineHighlight={lineHighlight}
          reduceMotion={reduceMotion}
          draftTargetCells={null}
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
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
