'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  /** Called with the chosen/typed name. Return value ignored (parent handles matching). */
  onGuess: (name: string) => void
  disabled?: boolean
  placeholder?: string
  /** Bump this to refocus the input (e.g. after each guess or turn change). */
  focusKey?: number
}

/**
 * Text input with a debounced suggestion dropdown over the CSV-derived name pool
 * (`/api/tenable/name-search`). The pool is decoy-heavy so suggestions don't give
 * the answer away; free-typed names still submit even when not suggested.
 */
export function NameAutocomplete({ onGuess, disabled, placeholder, focusKey }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [focusKey, disabled])

  // Debounced suggestion fetch.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    let cancelled = false
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/tenable/name-search?q=${encodeURIComponent(q)}&limit=8`)
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
      // Also handled by the form's onSubmit; this covers the highlighted-suggestion
      // case and environments where implicit form submit doesn't fire.
      e.preventDefault()
      submit(active >= 0 && suggestions[active] ? suggestions[active] : query)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit(active >= 0 && suggestions[active] ? suggestions[active] : query)
  }

  return (
    <div className="relative w-full">
      <form className="flex gap-2" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length && setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder ?? 'Name a player…'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-[14px] border-2 border-ink bg-white px-4 py-3.5 font-semibold text-ink outline-none placeholder:text-muted focus:border-green disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="btn btn-primary shrink-0 disabled:opacity-40"
        >
          Guess
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-[14px] border-2 border-ink bg-white py-1 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.5)]">
          {suggestions.map((name, i) => (
            <li key={`${name}-${i}`}>
              <button
                type="button"
                // onMouseDown (not onClick) so it fires before the input's onBlur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault()
                  submit(name)
                }}
                className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                  i === active ? 'bg-green-go text-white' : 'text-ink hover:bg-card-tint'
                }`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
