'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'

import { backupDeviceStorage, isNativeApp, restoreDeviceStorage } from '@/lib/native'

/**
 * Native app only (does nothing in a browser):
 *  1. light status bar text over the pitch, and `native-app` on <html> so CSS
 *     can drop what the app can't use (Google sign-in),
 *  2. universal links (a scanned QR code, a shared invite) open in the app,
 *  3. the game's localStorage survives iOS clearing it (see lib/native.ts).
 */
export function NativeBoot() {
  const router = useRouter()

  useEffect(() => {
    if (!isNativeApp()) return
    document.documentElement.classList.add('native-app')
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
    void restoreDeviceStorage()

    const links = App.addListener('appUrlOpen', ({ url }) => {
      const { pathname, search } = new URL(url)
      router.push(pathname + search)
    })
    const pauses = App.addListener('pause', () => void backupDeviceStorage())
    return () => {
      void links.then((h) => h.remove())
      void pauses.then((h) => h.remove())
    }
  }, [router])

  return null
}
