'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { normalize } from '@/lib/tenable/normalize'
import { canAutoFocus } from '@/lib/autoFocus'

interface Props {
  /** Called with the chosen/typed name. Return value ignored (parent handles matching). */
  onGuess: (name: string) => void
  disabled?: boolean
  placeholder?: string
  /** Bump this to refocus the input (e.g. after each guess or turn change). */
  focusKey?: number
  /** Names already on the board - never suggested (every spelling, see foundAnswerNames). */
  exclude?: readonly string[]
  /** Change per category: forgets the names guessed so far, which are hidden meanwhile. */
  resetKey?: string | number
}

/** Fetch extra so hiding used names still leaves a full dropdown. */
const FETCH_LIMIT = 20
const SHOW_LIMIT = 8

/**
 * Text input with a debounced suggestion dropdown over the CSV-derived name pool
 * (`/api/tenable/name-search`). The pool is decoy-heavy so suggestions don't give
 * the answer away; free-typed names still submit even when not suggested.
 */
export function NameAutocomplete({
  onGuess,
  disabled,
  placeholder,
  focusKey,
  exclude,
  resetKey,
}: Props) {
  const [query, setQuery] = useState('')
  const [fetched, setFetched] = useState<string[]>([])
  /** Normalized names this player already guessed in the current category (right or wrong). */
  const [guessed, setGuessed] = useState<ReadonlySet<string>>(new Set())
  /** The query the current suggestions were fetched for, so stale lists aren't auto-picked. */
  const [suggestionsFor, setSuggestionsFor] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!disabled && canAutoFocus()) inputRef.current?.focus()
  }, [focusKey, disabled])

  useEffect(() => setGuessed(new Set()), [resetKey])

  const suggestions = useMemo(() => {
    const hidden = new Set([...(exclude ?? []).map(normalize), ...guessed])
    return fetched.filter((n) => !hidden.has(normalize(n))).slice(0, SHOW_LIMIT)
  }, [fetched, exclude, guessed])
  const listVisible = open && suggestions.length > 0 && suggestionsFor === query.trim()

  // Debounced suggestion fetch.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setFetched([])
      return
    }
    let cancelled = false
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/tenable/name-search?q=${encodeURIComponent(q)}&limit=${FETCH_LIMIT}`,
        )
        const data = (await res.json()) as { suggestions?: { name: string }[] }
        if (!cancelled) {
          setFetched((data.suggestions ?? []).map((s) => s.name))
          setSuggestionsFor(q)
          setActive(-1)
          setOpen(true)
        }
      } catch {
        if (!cancelled) setFetched([])
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
      setGuessed((g) => new Set(g).add(normalize(value)))
      setQuery('')
      setFetched([])
      setOpen(false)
      setActive(-1)
    },
    [onGuess, disabled],
  )

  /**
   * What Enter submits: the highlighted suggestion, else an exact match in the list,
   * else the top suggestion (answers only match on full names, so a partial like
   * "Rival" would always be wrong), else the raw query. A full name that's hidden
   * because it's already used submits as typed, never swapped for a lookalike.
   */
  function bestGuess(): string {
    if (listVisible && active >= 0 && suggestions[active]) return suggestions[active]
    const q = query.trim()
    if (suggestionsFor !== q) return query
    const key = normalize(q)
    const exact = fetched.find((s) => normalize(s) === key)
    if (exact) return exact
    return suggestions[0] ?? query
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return
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
      submit(bestGuess())
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit(bestGuess())
  }

  return (
    <div className="relative w-full">
      <form className="flex gap-2" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          role="combobox"
          aria-label="Name a player"
          aria-autocomplete="list"
          aria-expanded={listVisible}
          aria-controls={listVisible ? listId : undefined}
          aria-activedescendant={listVisible && active >= 0 && suggestions[active] ? `${listId}-${active}` : undefined}
          value={query}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setActive(-1) }}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length && setOpen(true)}
          onBlur={() => { setOpen(false); setActive(-1) }}
          placeholder={placeholder ?? 'Name a player…'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 w-full rounded-[14px] border-2 border-ink bg-surface px-4 py-3.5 font-semibold text-ink outline-none placeholder:text-muted focus:border-green disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="btn btn-primary shrink-0 disabled:opacity-40"
        >
          Guess
        </button>
      </form>

      {listVisible && (
        <ul id={listId} role="listbox" aria-label="Player suggestions" className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-[14px] border-2 border-ink bg-surface py-1 shadow-[0_18px_40px_-18px_rgba(10,36,23,0.5)]">
          {suggestions.map((name, i) => (
            <li key={`${name}-${i}`} id={`${listId}-${i}`} role="option" aria-selected={active === i}>
              <button
                type="button"
                tabIndex={-1}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => submit(name)}
                className={`min-h-11 w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                  i === active ? 'bg-green-go text-ink' : 'text-ink hover:bg-card-tint'
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
