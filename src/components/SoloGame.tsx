'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [wrongCell, setWrongCell] = useState<{ cell: number; nonce: number } | null>(null)

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
  const placedPlayerIds = useMemo(
    () => [...solved.values()].map((p) => p.playerId),
    [solved],
  )

  useEffect(() => {
    if (!wrongCell) return
    const t = window.setTimeout(() => setWrongCell(null), 700)
    return () => window.clearTimeout(t)
  }, [wrongCell])

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
      placedPlayerIds,
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
  }, [playMode, seed, round, hydrated, draftPolicy, boardConfig, occupiedIndices, placedPlayerIds])

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
    setSettingsOpen(false)
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
        setWrongCell((w) => ({ cell: cellIndex, nonce: (w?.nonce ?? 0) + 1 }))
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
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold text-on-green-dim">
        Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 pb-32 md:px-9">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="chip -rotate-1 text-[12px] font-extrabold uppercase tracking-[0.08em] text-card-ink">
          {PLAY_MODE_LABEL[playMode]}
        </span>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={resetBoard}
            className="btn btn-outline-light btn-sm"
          >
            New board
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="btn btn-outline-light btn-sm"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
          >
            ⚙ Settings
          </button>
        </div>
      </div>

      {!configOk ? (
        <p className="mb-4 text-sm font-bold text-yellow">
          Your saved board needs at least {needCount} clues (currently {poolCount}).{' '}
          <Link href="/play/setup" className="underline">
            Fix in setup
          </Link>
        </p>
      ) : null}

      {createPortal(
        <AnimatePresence>
          {settingsOpen ? (
            <>
              <motion.div
                className="fixed inset-0 z-[90] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-[100] flex h-full w-[min(360px,90vw)] flex-col gap-6 overflow-y-auto bg-white p-6 shadow-[-10px_0_0_rgba(0,0,0,0.22)]"
              role="dialog"
              aria-label="Game settings"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[28px] font-black uppercase leading-none text-card-ink">
                  Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="btn btn-outline btn-sm"
                  aria-label="Close settings"
                >
                  ✕
                </button>
              </div>

              <div>
                <p className="mb-2 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-card-muted-2">
                  Game mode
                </p>
                <div className="flex rounded-full bg-card-tint p-[5px]">
                  {(['draft', 'free'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchMode(m)}
                      className={`flex-1 rounded-full px-[18px] py-2 text-[13px] font-extrabold uppercase tracking-[0.06em] transition-all duration-200 ${
                        playMode === m
                          ? 'bg-yellow text-pitch-deep shadow-[0_3px_0_rgba(0,0,0,0.3)]'
                          : 'text-card-muted hover:text-card-ink'
                      }`}
                    >
                      {PLAY_MODE_LABEL[m]}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[13.5px] font-semibold text-card-muted">
                  {playMode === 'draft'
                    ? 'Place the drawn player on a square that matches. Complete a line to win.'
                    : 'Pick a square, then search for a player who fits that clue.'}
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <Link
                  href="/play/setup"
                  className="btn btn-outline w-full"
                  onClick={() => setSettingsOpen(false)}
                >
                  Board setup
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    resetBoard()
                    setSettingsOpen(false)
                  }}
                  className="btn btn-outline w-full"
                >
                  New board
                </button>
              </div>
            </motion.aside>
            </>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}

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
        wrongNonce={wrongCell?.nonce ?? null}
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
          wrongCell={wrongCell}
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
