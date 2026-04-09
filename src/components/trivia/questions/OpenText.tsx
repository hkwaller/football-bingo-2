'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { OpenTextQuestion, OpenTextClue } from '@/lib/trivia/types'

interface PlayerResult {
  playerId: string
  name: string
  imageUrl?: string
}

interface Props {
  question: OpenTextQuestion
  onAnswer: (value: string) => void
  disabled: boolean
  lastResult?: { correct: boolean; correctAnswer: string } | null
}

function clueLabel(clue: OpenTextClue): string {
  switch (clue.kind) {
    case 'era': return 'Era'
    case 'height': return 'Height'
    case 'position': return 'Position'
    case 'nationality': return 'Nationality'
    case 'club': return clue.label
    case 'stat': return clue.label
  }
}

function clueValue(clue: OpenTextClue): string {
  if (clue.kind === 'height') return `${clue.value} cm`
  return String(clue.value)
}

const IMMEDIATE_KINDS = new Set<OpenTextClue['kind']>(['era', 'height', 'position', 'nationality', 'club'])

export function OpenText({ question, onAnswer, disabled, lastResult }: Props) {
  const immediateClues = question.clues.filter((c) => IMMEDIATE_KINDS.has(c.kind))
  const stagedClues = question.clues.filter((c) => !IMMEDIATE_KINDS.has(c.kind))

  const [revealedStagedCount, setRevealedStagedCount] = useState(0)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlayerResult[]>([])
  const [searching, setSearching] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reveal staged clues (clubs, stats) one by one every 5s
  useEffect(() => {
    if (answered || disabled) return
    if (revealedStagedCount >= stagedClues.length) return
    const timer = setInterval(() => {
      setRevealedStagedCount((n) => Math.min(n + 1, stagedClues.length))
    }, 5000)
    return () => clearInterval(timer)
  }, [answered, disabled, stagedClues.length, revealedStagedCount])

  // Debounced player search
  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}&limit=8`)
        const data = await res.json() as { players: PlayerResult[] }
        setResults(data.players ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 220)
  }, [])

  function handleSelect(player: PlayerResult) {
    if (answered) return
    const isCorrect = player.playerId === question.correctPlayerId

    if (isCorrect) {
      setAnswered(true)
      setQuery(player.name)
      setResults([])
      onAnswer(player.name)
    } else {
      setWrongGuesses((prev) => [...prev, player.name])
      setQuery('')
      setResults([])
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      <motion.p
        className="font-mono text-chalk/70 text-sm uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Name the player
      </motion.p>

      {/* Clues */}
      <div className="w-full flex flex-col gap-2">
        {/* Immediate clues — all shown at once */}
        {immediateClues.map((clue, i) => (
          <motion.div
            key={clue.kind}
            className="flex items-center gap-4 border-2 border-white/20 bg-white/5 px-4 py-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
          >
            <span className="font-mono text-xs uppercase tracking-widest text-chalk/40 w-32 shrink-0">
              {clueLabel(clue)}
            </span>
            <span className="font-mono font-bold text-white">{clueValue(clue)}</span>
          </motion.div>
        ))}

        {/* Staged clues — clubs and stats revealed one by one */}
        <AnimatePresence>
          {stagedClues.slice(0, revealedStagedCount).map((clue, i) => (
            <motion.div
              key={`staged-${i}`}
              className="flex items-center gap-4 border-2 border-[var(--fb-accent-cyan)]/40 bg-[var(--fb-accent-cyan)]/5 px-4 py-3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--fb-accent-cyan)]/60 w-32 shrink-0">
                {clueLabel(clue)}
              </span>
              <span className="font-mono font-bold text-white">{clueValue(clue)}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {revealedStagedCount < stagedClues.length && !answered && (
          <p className="font-mono text-xs text-chalk/30 text-center mt-1">
            Next clue in a few seconds…
          </p>
        )}
      </div>

      {/* Wrong guesses */}
      {wrongGuesses.length > 0 && (
        <div className="w-full flex flex-wrap gap-2">
          {wrongGuesses.map((g) => (
            <span
              key={g}
              className="font-mono text-xs px-2 py-1 border-2 border-[var(--fb-accent-magenta)] text-[var(--fb-accent-magenta)] line-through"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      {!answered && !disabled && (
        <div className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value) }}
            placeholder="Type a player name…"
            className="w-full bg-black border-4 border-white text-white font-mono px-4 py-3 text-base focus:outline-none focus:border-[var(--fb-accent-cyan)] placeholder:text-chalk/30"
            autoComplete="off"
          />
          {searching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-chalk/40">
              …
            </span>
          )}

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.ul
                className="absolute top-full left-0 right-0 z-50 border-4 border-t-0 border-white bg-black"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {results.map((player) => (
                  <li key={player.playerId}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 font-mono text-sm text-white hover:bg-white hover:text-black transition-colors text-left"
                      onClick={() => handleSelect(player)}
                    >
                      {player.imageUrl && (
                        <img
                          src={player.imageUrl}
                          alt={player.name}
                          className="w-8 h-8 object-cover border-2 border-white/40 rounded-sm"
                        />
                      )}
                      {player.name}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Result feedback */}
      <AnimatePresence>
        {answered && lastResult && (
          <motion.p
            className={`font-mono font-bold uppercase tracking-widest text-lg ${lastResult.correct ? 'text-[var(--fb-accent-lime)]' : 'text-[var(--fb-accent-magenta)]'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {lastResult.correct ? `Correct — ${question.correctPlayerName}!` : `It was ${question.correctPlayerName}`}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
