'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { normalize } from '@/lib/tenable/normalize'

interface Props {
  onGuess: (name: string) => void
  disabled?: boolean
  placeholder?: string
  focusKey?: number
  /**
   * 'default' — light text on dark green background (pitch view).
   * 'bar'     — dark ink text on the light cream bottom bar; dropdown opens upward.
   */
  variant?: 'default' | 'bar'
}

/**
 * Text input with debounced suggestions from /api/famous-11s/name-search.
 * Pool includes all Famous 11s names + enrichedFootballPlayers for decoy
 * coverage. Free-typed names still submit when nothing is suggested.
 */
export function Famous11sAutocomplete({ onGuess, disabled, placeholder = 'Name a player…', focusKey, variant = 'default' }: Props) {
  const isBar = variant === 'bar'
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  /** The query the current suggestions were fetched for, so stale lists aren't auto-picked. */
  const [suggestionsFor, setSuggestionsFor] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [focusKey, disabled])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    let cancelled = false
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/famous-11s/name-search?q=${encodeURIComponent(q)}&limit=8`)
        const data = (await res.json()) as { suggestions?: { name: string }[] }
        if (!cancelled) {
          setSuggestions((data.suggestions ?? []).map((s) => s.name))
          setSuggestionsFor(q)
          setActive(-1)
          setOpen(true)
        }
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }, 180)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [query])

  const submit = useCallback(
    (name: string) => {
      const value = name.trim()
      if (!value || disabled) return
      onGuess(value)
      setQuery('')
      setSuggestions([])
      setOpen(false)
      setActive(-1)
    },
    [onGuess, disabled],
  )

  /**
   * What Enter submits: the highlighted suggestion, else an exact match in the list,
   * else the top suggestion (a partial like "viei" can never be right), else the
   * raw query. Suggestions fetched for an older query are ignored.
   */
  function bestGuess(): string {
    if (active >= 0 && suggestions[active]) return suggestions[active]
    const q = query.trim()
    if (suggestionsFor !== q) return query
    const key = normalize(q)
    const exact = suggestions.find((s) => normalize(s) === key)
    if (exact) return exact
    return suggestions[0] ?? query
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      // Also handled by the form's onSubmit; this covers environments where
      // implicit form submit doesn't fire.
      e.preventDefault()
      submit(bestGuess())
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit(bestGuess())
      }}
      className="relative"
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={`h-[52px] w-full rounded-[12px] border-2 px-4 font-display text-[17px] font-black uppercase focus:outline-none disabled:opacity-50 ${
          isBar
            ? 'border-ink/20 bg-surface-hi text-ink placeholder:text-ink/40 focus:border-ink'
            : 'border-surface/20 bg-surface/15 text-on-green placeholder:text-on-green-dim focus:border-yellow'
        }`}
      />
      {open && suggestions.length > 0 && (
        <ul
          className={`absolute left-0 right-0 z-20 overflow-hidden rounded-[10px] border bg-ink shadow-[0_8px_0_#0a2417] ${
            isBar
              ? 'bottom-[56px] border-ink/30 shadow-[0_-8px_0_#0a2417]'
              : 'top-[56px] border-surface/20'
          }`}
        >
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={() => submit(s)}
                className={`w-full px-4 py-2.5 text-left font-display text-[15px] font-black uppercase leading-none transition-colors ${
                  i === active ? 'bg-yellow text-ink' : 'text-on-green hover:bg-surface/10'
                }`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
