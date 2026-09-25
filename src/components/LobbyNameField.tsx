'use client'

import { useEffect, useId, useState } from 'react'

interface Props {
  /** The name currently saved for this player. */
  value: string
  onSave: (name: string) => void
  autoFocus?: boolean
}

/** Lobby "your name" field with an explicit Save button (Enter also saves). */
export function LobbyNameField({ value, onSave, autoFocus }: Props) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [justSaved, setJustSaved] = useState(false)
  const dirty = draft.trim() !== '' && draft.trim() !== value

  // Pick up the stored name once it loads, but never clobber unsaved typing.
  useEffect(() => {
    setDraft((d) => (d.trim() === '' || !dirty ? value : d))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

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
        const next = draft.trim()
        onSave(next)
        setDraft(next)
        setJustSaved(true)
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
          className="input sm:flex-1"
          placeholder="Enter your name"
          maxLength={24}
          autoComplete="nickname"
          autoFocus={autoFocus}
        />
        <button
          type="submit"
          disabled={!dirty && !justSaved}
          className="btn btn-primary shrink-0 sm:w-28"
        >
          {justSaved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
      <p className="mt-2 text-xs font-medium text-card-muted">
        {dirty ? 'Unsaved - hit Save or Enter.' : 'This is how the room sees you.'}
      </p>
    </form>
  )
}
