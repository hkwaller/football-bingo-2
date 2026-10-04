'use client'

import { useLayoutEffect, useRef } from 'react'

/**
 * Shrinks an element's font until its text fits its box, instead of letting
 * `truncate` / `line-clamp` cut a name off. The CSS font-size is the maximum;
 * the element keeps its truncation classes as a last resort below `minPx`.
 * Refits when the text changes, the container resizes, or web fonts land.
 */
export function useFitText<T extends HTMLElement>(text: string, minPx = 14) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const fit = () => {
      el.style.fontSize = ''
      let size = parseFloat(getComputedStyle(el).fontSize)
      const overflows = () =>
        el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
      while (size > minPx && overflows()) {
        size = Math.max(minPx, size - 1)
        el.style.fontSize = `${size}px`
      }
    }

    fit()
    let cancelled = false
    document.fonts?.ready.then(() => !cancelled && fit())
    // Watch the parent: resizing the element itself would re-trigger on every fit.
    const ro = new ResizeObserver(fit)
    ro.observe(el.parentElement ?? el)
    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [text, minPx])

  return ref
}
