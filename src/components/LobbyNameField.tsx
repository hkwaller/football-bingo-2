'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'

import { canAutoFocus } from '@/lib/autoFocus'
import { isClerkConfigured } from '@/lib/env'
import { getSavedDisplayName } from '@/lib/roomPlayer'

function useClerkName(): string {
  const { user } = useUser()
  return (user?.firstName || user?.username || '').trim()
}

// Clerk is optional (no provider without a key); the choice is fixed per build.
const useSignedInName = isClerkConfigured() ? useClerkName : () => ''

/** Old builds stored their random fallback as the saved name. */
const isGeneratedName = (n: string) => /^Player \d+$/.test(n)

interface Props {
  /** The name currently saved for this player. */
  value: string
  onSave: (name: string) => void
  autoFocus?: boolean
}

/**
 * Lobby "your name" field with an explicit Save button (Enter also saves).
 * Starts empty - players type their own name. A signed-in account name and the
 * name used last time are offered as one-tap pills instead of being prefilled.
 */
export function LobbyNameField({ value, onSave, autoFocus }: Props) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [justSaved, setJustSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dirty = draft.trim() !== '' && draft.trim() !== value

  const accountName = useSignedInName()
  const [savedName, setSavedName] = useState('')
  useEffect(() => setSavedName(getSavedDisplayName()), [])
  const suggestions = [accountName, savedName]
    .map((n) => n.slice(0, 24).trim())
    .filter((n, i, arr) => n && !isGeneratedName(n) && n !== value && arr.indexOf(n) === i)

  const save = (name: string) => {
    onSave(name)
    setDraft(name)
    setJustSaved(true)
  }

  // Pick up the stored name once it loads, but never clobber unsaved typing.
  useEffect(() => {
    setDraft((d) => (d.trim() === '' || !dirty ? value : d))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Not the autoFocus attribute: on a phone the keyboard would cover the lobby.
  useEffect(() => {
    if (autoFocus && canAutoFocus()) inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!justSaved) return
    const t = window.setTimeout(() => setJustSaved(false), 1800)
    return () => window.clearTimeout(t)
  }, [justSaved])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!dirty) return
        save(draft.trim())
      }}
    >
      <label
        htmlFor={id}
        className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-card-muted-2"
      >
        Your name
      </label>
      <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setJustSaved(false)
          }}
          className="input sm:flex-1 text-[16px]"
          placeholder="Enter your name"
          maxLength={24}
          autoComplete="nickname"
          ref={inputRef}
        />
        <button
          type="submit"
          disabled={!dirty && !justSaved}
          className="btn btn-primary shrink-0 sm:w-28"
        >
          {justSaved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-card-muted">Use</span>
          {suggestions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => save(n)}
              className="rounded-full border-2 border-card-ink bg-surface-hi px-3 py-1 text-[13px] font-bold text-card-ink hover:bg-yellow"
            >
              {n}
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs font-medium text-card-muted">
        {dirty ? 'Unsaved - hit Save or Enter.' : 'This is how the room sees you.'}
      </p>
    </form>
  )
}
