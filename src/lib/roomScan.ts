/** Room pages a QR invite can point at (RoomInvite encodes `${origin}${joinPath}`). */
const ROOM_PATH =
  /^\/(?:(?:trivia|tenable|famous-11s)\/)?room\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i

/**
 * The in-app path to open for a scanned QR code, or null when it isn't one of
 * our room invites. Only the path is kept, so a code can never send the app to
 * another site; the host is ignored (bingo.playam.app, footballbingo.cc and a
 * dev server all serve the same rooms).
 */
export function roomPathFromScan(text: string): string | null {
  let url: URL
  try {
    url = new URL(text.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const match = ROOM_PATH.exec(url.pathname)
  if (!match) return null
  return url.pathname.replace(/\/$/, '').toLowerCase()
}
