'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  onGuess: (name: string) => void
  disabled?: boolean
  placeholder?: string
  focusKey?: number
}

/**
 * Text input with debounced suggestions from /api/famous-11s/name-search.
 * Pool includes all Famous 11s names + enrichedFootballPlayers for decoy
 * coverage. Free-typed names still submit even when not suggested.
 */
export function Famous11sAutocomplete({ onGuess, disabled, placeholder = 'Name a player…', focusKey }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
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

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (active >= 0 && suggestions[active]) {
        e.preventDefault()
        submit(suggestions[active])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit(active >= 0 && suggestions[active] ? suggestions[active] : query)
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
        className="h-[52px] w-full rounded-[12px] border-2 border-surface/20 bg-surface/15 px-4 font-display text-[17px] font-black uppercase text-on-green placeholder:text-on-green-dim focus:border-yellow focus:outline-none disabled:opacity-50"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-[56px] z-20 overflow-hidden rounded-[10px] border border-surface/20 bg-ink shadow-[0_8px_0_#0a2417]">
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
