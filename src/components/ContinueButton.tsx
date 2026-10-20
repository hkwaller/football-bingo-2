'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { canAutoFocus } from '@/lib/autoFocus'

/** Focus the next step when an answer field is replaced by the round result. */
export function ContinueButton({
  onClick,
  className = 'btn btn-primary btn-lg',
  children,
}: {
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const element = button.current
    if (canAutoFocus() && element?.getClientRects().length) {
      element.focus({ preventScroll: true })
    }
  }, [])

  return (
    <button
      ref={button}
      type="button"
      onClick={onClick}
      onKeyDown={(event) => {
        // The submission keypress is already consumed by the answer form.
        // Holding Enter must not immediately dismiss the newly mounted result.
        if (event.key === 'Enter' && (event.repeat || event.nativeEvent.isComposing)) {
          event.preventDefault()
        }
      }}
      className={className}
    >
      {children}
    </button>
  )
}
