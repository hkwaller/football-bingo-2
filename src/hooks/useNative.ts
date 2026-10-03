'use client'

import { useEffect, useSyncExternalStore } from 'react'

import { haptic, isNativeApp, nativePlatform, type HapticKind } from '@/lib/native'

/** Buzzes once when a verdict shows (and again only when `key` changes). */
export function useHaptic(kind: HapticKind | null, key: string | number, delayMs = 0) {
  useEffect(() => {
    if (!kind) return
    const id = setTimeout(() => haptic(kind), delayMs)
    return () => clearTimeout(id)
  }, [kind, key, delayMs])
}

/** True inside the native app. False on the server and the first render, so hydration matches. */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(noSubscribe, isNativeApp, () => false)
}

/** 'ios', 'android' or 'web' (also on the server and the first render). */
export function useNativePlatform(): 'ios' | 'android' | 'web' {
  return useSyncExternalStore(noSubscribe, nativePlatform, () => 'web')
}

const noSubscribe = () => () => {}
