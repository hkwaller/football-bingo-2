'use client'

import { useEffect, useState } from 'react'
import { normalize } from '@/lib/tenable/normalize'
import type { KnownNames } from './sessionEngine'

const EMPTY: KnownNames = new Set()
let cached: Promise<KnownNames> | null = null

function fetchKnownNames(): Promise<KnownNames> {
  cached ??= fetch('/api/connections/names')
    .then((res) => (res.ok ? (res.json() as Promise<{ names: string[] }>) : { names: [] }))
    .then(({ names }) => new Set(names.map(normalize)))
    .catch(() => {
      cached = null
      return EMPTY
    })
  return cached
}

/**
 * Normalized names of every player in the bank. Until it loads (or if it
 * fails) it's empty, so every miss counts as unknown and costs nothing.
 */
export function useKnownNames(): KnownNames {
  const [known, setKnown] = useState<KnownNames>(EMPTY)
  useEffect(() => {
    let live = true
    fetchKnownNames().then((names) => live && setKnown(names))
    return () => {
      live = false
    }
  }, [])
  return known
}
