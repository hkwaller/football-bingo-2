# Football Bingo - native app (iOS + Android)

The App Store and Google Play builds are a Capacitor shell around the live site, the same setup as Anno (`/Users/hkwaller/privat/anno`, its NATIVE.md).

## How it works

- **Remote URL, not a bundled export.** The app opens `https://bingo.playam.app` in a WKWebView (iOS) or WebView (Android). The game needs its server (Liveblocks auth, Clerk `proxy.ts`, the validate and stats API routes), and a remote URL means every Vercel deploy reaches the app without a store review. The shell only ships the icon, splash, offline page and native plugins.
- **One codebase.** Components ask `useIsNativeApp()` or call helpers in `src/lib/native.ts`. In a browser every helper does nothing or falls back to the web API, so the website is unchanged. No game logic knows about Capacitor.
- **Capacitor 8**, iOS through Swift Package Manager (no CocoaPods), Android through Gradle.

## Files

| Path | What |
|---|---|
| `capacitor.config.ts` | App id `app.playam.bingo`, server URL (or `CAP_SERVER_URL` for dev), hosts allowed inside the web view (Clerk, Sign in with Apple), offline page. |
| `native.config.json` | The values the game-native-app skill filled into the templates. |
| `native/www/` | `index.html` (required by Capacitor, never shown) and `offline.html` (shown when the site can't load, with retry). |
| `native/assets/` | Icon and splash sources. `npm run native:icons` redraws them (`scripts/native/icons.mjs`, the favicon's ball on a yellow tile) and generates every size. |
| `ios/App/FootballBingo.xcworkspace` | Open this one (`npm run native:ios`). It wraps `ios/App/App.xcodeproj`, whose file and folder names the Capacitor CLI hardcodes; the target, product and scheme inside are named FootballBingo (`ios.scheme` in `capacitor.config.ts`). Don't rename `App.xcodeproj`: `cap sync` then can't update the plugin package. |
| `ios/`, `android/` | Generated native projects, committed. Edits: `ios/App/App/App.entitlements` (universal links), camera text in `Info.plist`, App Links and `CAMERA` in `android/app/src/main/AndroidManifest.xml`. |
| `src/lib/native.ts` | `isNativeApp`, `nativePlatform`, `haptic`, `shareText`, `scanQr`, `restoreDeviceStorage` / `backupDeviceStorage`. |
| `src/hooks/useNative.ts` | `useIsNativeApp()` / `useNativePlatform()` (hydration-safe), `useHaptic(kind, key)`. |
| `src/components/NativeBoot.tsx` | Mounted in `AppShell`: status bar style, `native-app` class on `<html>`, universal links routed to Next, localStorage backup on pause. |
| `src/lib/roomScan.ts` | `roomPathFromScan`: turns a scanned room QR into an in-app path (tested in `roomScan.test.ts`). |
| `src/app/.well-known/*` | `apple-app-site-association` and `assetlinks.json`, served only when `APPLE_TEAM_ID` / `ANDROID_CERT_SHA256` are set. |
| `src/app/api/delete-account` | Account deletion (below). |

## Native extras

- **Haptics.** Right / wrong on every verdict: bingo picks (solo and rooms), Trivia answers, Tenable and Famous 11s guesses, solo and room. Native only; the website does not vibrate.
- **Scan to join.** "Scan to join a room" on the home page, app only (`@capacitor/barcode-scanner`). `roomPathFromScan` accepts only a link to `/room/<uuid>`, `/trivia/room/<uuid>`, `/tenable/room/<uuid>` or `/famous-11s/room/<uuid>` and keeps just the path, so another QR code never leaves the app. On the website the phone's own camera already opens the invite.
- **Share sheet.** The room invite's "Copy invite link" is "Share invite" in the app (Messages, WhatsApp...). The website still copies.
- **Storage that survives.** The game keeps settings, sessions, the guest id and the display name in localStorage (`fb_*`, `football-*` keys). iOS may clear a web view's localStorage, so the app copies those keys to native Preferences when it goes to the background and restores missing ones on launch.
- **Universal links / App Links.** Invite links and QR codes for `bingo.playam.app` open the app when it's installed.
- **Safe area.** `body` pads by `env(safe-area-inset-top)` with a pitch-coloured strip behind the status bar; the bottom bars already pad by `safe-area-inset-bottom`. Both are 0 in a browser tab.
- **Sign-in.** Google blocks OAuth inside app web views (`disallowed_useragent`), so `globals.css` hides Clerk's Google button and the divider when `html.native-app`. Email sign-in must stay on.
- **Ads.** Off unless the Adsterra env vars are set (`src/lib/ads.ts`). When they are on: never a popunder in the app, and no "Remove ads" / "Go ad-free" links (store billing rules; a pass bought on the web still applies). The banner may show; if review objects, hide it in the app too.
- **Account deletion.** "Delete account" on `/account` (two steps, web and app). `/api/delete-account` runs `football_bingo_delete_identity` (migration `004`: deletes solo and Tenable results, strips the id and name from room participant rows, clears the host id) and then deletes the Clerk user. The device forgets its local progress.

Left out on purpose: no daily reminder (the game has no daily, so `@capacitor/local-notifications` isn't installed and there is no exact-alarm permission to declare) and no AirPlay TV screen (every player has their own board; there is no TV view to cast).

## Dev loop

```bash
npm run dev
```

```bash
CAP_SERVER_URL=http://localhost:3000 npm run native:dev
```

```bash
npm run native:ios
```

Then run on a simulator from Xcode, or build from the command line:

```bash
xcodebuild -workspace ios/App/FootballBingo.xcworkspace -scheme FootballBingo -configuration Debug -sdk iphonesimulator -destination 'name=iPhone 17 Pro' -derivedDataPath ios/App/build CODE_SIGNING_ALLOWED=NO build
```

Use the dev server's actual port in `CAP_SERVER_URL`. Web changes hot-reload into the app; only `capacitor.config.ts`, plugins and native files need a new sync and build. The "1 Issue" dev overlay after closing the scanner is Capacitor's debug bridge logging the cancelled call; it is handled.

**Before any release build, sync without `CAP_SERVER_URL`** (`npm run native:sync`) so the generated config points at production. The generated `ios/App/App/capacitor.config.json` is gitignored, so this is easy to forget.

## Before the first store submission

1. **Apply migration `004_delete_identity.sql`** to the Supabase project (until then deleting an account fails at the RPC and deletes nothing).
2. **Clerk production instance.** bingo.playam.app and footballbingo.cc both run on a development instance (`handy-louse-97.clerk.accounts.dev`). Move to production, then check `allowNavigation` in `capacitor.config.ts` matches the production Frontend API host and re-sync.
3. **Apple Developer**: set the Team in Xcode, add the Associated Domains capability (the entitlement file is in place), set `APPLE_TEAM_ID` on Vercel.
   Debug builds sign with `App.Debug.entitlements` (no Associated Domains), so a free personal team can run the app on a device. Universal links only work in Release, which needs the paid team.
4. **Google Play**: closed test with 12 testers for 14 days (new personal accounts), set `ANDROID_CERT_SHA256` from Play Console > App integrity.
5. **Store listings**: copy, screenshots (6.9" iPhone, Android phone), privacy labels (PostHog analytics, Clerk email, Supabase game stats, Adsterra only if ads are on in production), age rating, privacy policy URL. The site has no privacy page yet; the stores require one.
6. **A real-device pass**: the QR scanner (the simulator has no camera), haptics, the share sheet, sign-in by email.

## Not done yet

- Sign in with Apple (optional; with Google hidden, Apple's rule 4.8 doesn't apply). If added, drop `.cl-dividerRow` from the hide rule.
- Tested on a real device. So far only the iOS simulator.
