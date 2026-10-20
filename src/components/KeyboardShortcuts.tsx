'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Keyboard, X } from 'lucide-react'

const PREFERENCE_KEY = 'football-bingo:keyboard-shortcuts:v1'
let visitPreference = false
function getPreference() {
  try { return localStorage.getItem(PREFERENCE_KEY) === 'on' } catch { return visitPreference }
}
function subscribePreference(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('shortcuts-preference', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('shortcuts-preference', callback)
  }
}

/** Help stays available by button; character shortcuts are explicitly opt-in. */
export function KeyboardShortcuts() {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const enabled = useSyncExternalStore(subscribePreference, getPreference, () => false)
  const previousFocus = useRef<HTMLElement | null>(null)

  function openGuide() {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.current?.showModal()
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!enabled || event.defaultPrevented || event.repeat || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]')) return
      if (document.querySelector('#account-navigation, dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]')) return
      if (event.key === '?') {
        event.preventDefault()
        openGuide()
      }
      if (event.key === '/') {
        // Only focus a visible answer field; never submit or change game state.
        const input = Array.from(document.querySelectorAll<HTMLInputElement>('main input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([disabled])'))
          .find((element) => element.getClientRects().length > 0 && !element.readOnly)
        if (input) {
          event.preventDefault()
          input.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [enabled])

  function toggle(enabled: boolean) {
    visitPreference = enabled
    try { localStorage.setItem(PREFERENCE_KEY, enabled ? 'on' : 'off') } catch { /* Still works for this visit. */ }
    window.dispatchEvent(new Event('shortcuts-preference'))
  }

  return (
    <>
      <button ref={trigger} type="button" onClick={openGuide} aria-haspopup="dialog" title="Keyboard shortcuts" className="ml-auto inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-on-green hover:bg-surface/10">
        <Keyboard aria-hidden className="size-5" /><span className="sr-only lg:not-sr-only">Keyboard shortcuts</span>
      </button>
      <dialog ref={dialog} aria-labelledby="shortcuts-title" aria-describedby="shortcuts-description" onClose={() => (previousFocus.current?.isConnected ? previousFocus.current : trigger.current)?.focus()} className="shortcuts-dialog w-[calc(100%-2rem)] max-w-lg rounded-[14px] border-[2.5px] border-ink bg-surface p-5 text-ink shadow-[0_6px_0_var(--ink)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 id="shortcuts-title" className="font-display text-4xl font-black uppercase leading-none">Play by keyboard</h2>
          <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close keyboard shortcuts" className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-surface-2"><X aria-hidden className="size-5" /></button>
        </div>
        <p id="shortcuts-description" className="mt-4 text-sm text-card-muted">Keep your eyes on the game. These controls work alongside your mouse or touch screen.</p>
        <dl className="mt-5 divide-y divide-ink/15 text-sm">
          {[
            ['Tab / Shift + Tab', 'Move between controls'],
            ['Enter / Space', 'Activate a focused button'],
            ['Arrow keys', 'Move between available bingo squares'],
            ['Home / End', 'First or last available square in a row'],
            ['Escape', 'Close this guide or the account menu'],
            ['Space on bingo board', 'Skip the drawn player'],
          ].map(([key, label]) => <div key={key} className="flex flex-wrap items-center justify-between gap-2 py-3"><dt className="font-mono text-xs font-semibold">{key}</dt><dd className="text-card-muted">{label}</dd></div>)}
        </dl>
        <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 font-bold text-sm">
          <input type="checkbox" checked={enabled} onChange={(event) => toggle(event.target.checked)} className="size-5 accent-[var(--pitch)]" /> Enable single-key shortcuts
        </label>
        <p className="mt-2 text-sm text-card-muted"><kbd>?</kbd> opens this guide. <kbd>/</kbd> focuses the first answer or setup field. Single-key shortcuts pause while you type or use a dialog.</p>
      </dialog>
    </>
  )
}
