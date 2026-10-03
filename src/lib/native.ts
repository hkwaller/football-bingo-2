/**
 * The thin layer between the web app and the native shell (Capacitor, see
 * NATIVE.md). Every helper works in a plain browser too, so components call
 * these and never ask which platform they are on.
 */
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Preferences } from '@capacitor/preferences'
import { Share } from '@capacitor/share'

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform()
}

export function nativePlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web'
  const p = Capacitor.getPlatform()
  return p === 'ios' || p === 'android' ? p : 'web'
}

export type HapticKind = 'tap' | 'select' | 'right' | 'wrong' | 'turn'

/** A short buzz in the native app. Does nothing in a browser, so the website stays as it was. */
export function haptic(kind: HapticKind): void {
  if (!isNativeApp()) return
  const done = (p: Promise<void>) => void p.catch(() => {})
  if (kind === 'tap') done(Haptics.impact({ style: ImpactStyle.Light }))
  else if (kind === 'select') done(Haptics.selectionChanged())
  else if (kind === 'right') done(Haptics.notification({ type: NotificationType.Success }))
  else if (kind === 'wrong') done(Haptics.notification({ type: NotificationType.Error }))
  else done(Haptics.notification({ type: NotificationType.Warning }))
}

/**
 * Shares text through the system share sheet, falling back to the clipboard.
 * `cancelled` means the player closed the sheet: no copy, no message.
 */
export async function shareText(
  text: string,
): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  if (isNativeApp()) {
    try {
      await Share.share({ text })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  try {
    if (navigator.share) {
      await navigator.share({ text })
      return 'shared'
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/** The game's own localStorage keys (settings, sessions, guest id, name). */
const DEVICE_KEY = /^(fb_|football-)/

/**
 * iOS may clear a web view's localStorage. In the app, NativeBoot copies the
 * game's keys to native Preferences whenever the app goes to the background,
 * and puts back any that went missing on launch.
 */
export async function restoreDeviceStorage(): Promise<void> {
  if (!isNativeApp()) return
  try {
    const { keys } = await Preferences.keys()
    for (const key of keys) {
      if (!DEVICE_KEY.test(key) || localStorage.getItem(key) !== null) continue
      const { value } = await Preferences.get({ key })
      if (value !== null) localStorage.setItem(key, value)
    }
  } catch {
    // Private mode or no Preferences: nothing to restore.
  }
}

export async function backupDeviceStorage(): Promise<void> {
  if (!isNativeApp()) return
  try {
    const local = new Set<string>()
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !DEVICE_KEY.test(key)) continue
      local.add(key)
      await Preferences.set({ key, value: localStorage.getItem(key) ?? '' })
    }
    // A finished session removed from localStorage must not come back.
    const { keys } = await Preferences.keys()
    for (const key of keys)
      if (DEVICE_KEY.test(key) && !local.has(key)) await Preferences.remove({ key })
  } catch {
    // Keep the last backup.
  }
}

/**
 * Native app only: opens the camera and returns whatever QR code it reads, or
 * null if the player closes the scanner. The caller decides if it's a room.
 * (In a browser the phone's own camera app already scans the invite code.)
 */
export async function scanQr(instructions: string): Promise<string | null> {
  if (!isNativeApp()) return null
  try {
    const { ScanResult } = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      scanInstructions: instructions,
      cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
    })
    return ScanResult || null
  } catch {
    return null
  }
}
