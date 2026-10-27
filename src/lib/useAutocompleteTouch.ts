'use client'

import { useRef, type PointerEvent } from 'react'

/** Keep a suggestion mounted if a webview blurs the input during a touch. */
export function useAutocompleteTouch(onDismiss: () => void) {
  const touching = useRef(false)
  const blurred = useRef(false)

  return {
    onBlur() {
      if (touching.current) blurred.current = true
      else onDismiss()
    },
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      // Preserve desktop focus. Touch must still be able to scroll the list.
      event.preventDefault()
      touching.current = event.pointerType !== 'mouse'
      blurred.current = false
    },
    onPointerUp(event: PointerEvent<HTMLButtonElement>, select: () => void) {
      if (!touching.current) return
      touching.current = false
      const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
      if (event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom) {
        // Touch clicks can be lost after keyboard dismissal in native webviews.
        // Selecting here removes the list before a compatibility click arrives.
        event.preventDefault()
        select()
      } else if (blurred.current) onDismiss()
      blurred.current = false
    },
    onPointerCancel() {
      touching.current = false
      if (blurred.current) onDismiss()
      blurred.current = false
    },
  }
}
