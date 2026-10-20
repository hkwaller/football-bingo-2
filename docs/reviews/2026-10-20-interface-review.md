# Interface and keyboard review — 20 October 2026

Preserved the Matchday palette, self-hosted typography, sticker artwork and guest-first flows. Reviewed shared chrome, bingo keyboard handling, name-entry components, focus styling and reduced-motion conventions. This was a targeted implementation review with browser samples, not certification of every game state or native build.

## Shipped

- Header shortcut guide: native modal dialog with focus containment, Escape dismissal and focus restoration. Opt-in character shortcuts persist locally and can be disabled.
- `?` opens the guide; `/` focuses a visible main-content field. Typing, composition, modifier keys, held keys, other dialogs and the mobile account menu suppress these shortcuts.
- Bingo arrows move between available squares; Home/End move to the first/last available square of the row. Disabled squares are skipped, horizontal movement stays in its row, and ordinary Tab navigation remains available. Each square exposes its position, clue and placed player.
- Space-to-skip no longer intercepts focused buttons, links, fields or dialogs. The existing background skip action remains.
- Shared skip-to-content link, named mobile logo link, named navigation regions and two-tone focus indicators on paper and pitch surfaces.
- Mobile account navigation receives focus when opened, contains Tab navigation and closes with Escape.
- Tenable and Famous 11s autocomplete fields expose combobox/listbox semantics and highlighted suggestions. Suggestions use click activation and 44px targets, stale-query selections are guarded, and composition does not prematurely submit guesses.
- Player picker and win overlays now expose named dialogs, contain keyboard focus, restore prior focus and support Escape. The win screen scrolls on short viewports; celebration motion follows the reduced-motion preference and delayed confetti timers are cleaned up.
- Text selection and input carets follow the existing palette.

## Verification

- All 22 existing tests pass via `node --import tsx --test 'src/**/*.test.ts'`. The npm test wrapper was blocked by sandbox restrictions on its IPC socket; the direct runner worked.
- TypeScript check and targeted lint for shared chrome, board, new guide and Space handler pass.
- Impeccable mechanical detector returned no findings on the reviewed UI targets.
- Browser checks: guide opening, opt-in question-mark shortcut, Escape focus restoration, mobile account focus, bingo arrow/End/vertical movement, Space activation of the guide without increasing skips, slash-to-focus in Tenable, and highlighted autocomplete options exposed in the accessibility tree.
- Visual samples: 375px phone viewport and 1280px desktop viewport. Phone viewport emulation does not verify physical-device touch behavior.

## Follow-up findings

- Existing lint warnings remain in Famous11sAutocomplete and PlayerPickModal: effect-driven state resets and the picker’s render-time cooldown check. The new shortcut and shared focus implementations pass targeted lint without warnings.
- PRODUCT.md still describes three modes although the app has six, and declares web while Capacitor iOS/Android projects are present. Refresh that product context separately without replacing the current web guidance automatically.

The existing custom bingo overlays still merit a full assistive-technology walkthrough; their shared keyboard behavior was checked in code and by TypeScript/lint, rather than by completing an entire winning game.

Multiplayer timing, authenticated profile variants, all win/error paths and physical iOS/Android devices were not exercised in this pass.
