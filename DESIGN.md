# Football Bingo - "Matchday" design system

The look is a **matchday programme on a mown pitch**: a deep turf-green stage with wide stripes and faint chalk markings, cream paper cards with thick ink borders and hard ink shadows (printed, not plastic), stadium-signage headlines, and one loud action colour. The collectible sticker stays the signature motif. Confident and broadcast-loud, never muted, never dark-mode.

Reference designs: the "Football Bingo · Matchday take" canvas (home, solo bingo, mobile bingo, trivia, room lobby, room in play, full time).

## Tokens (globals.css + tailwind.config.ts)

Token names from Prime Time Green are kept for now so every caller restyles at once. New names are listed first; prefer them in new code.

| Token | Value | Use |
|---|---|---|
| `pitch` | `#0e4a2c` | the stage. Body = stripes `#0f5030`/`#0d472a` (`--stripe` 120px, 65px under 640px) with a darkening wash to the bottom |
| `pitch-bright` / `pitch-deep` | `#15603a` / `#093820` | stage highlights / footers, board tray |
| `surface` | `#f5f0e1` | **paper**: every card, panel, board square |
| `surface-2` | `#e9e1c9` | inactive fills, Trait chips, empty progress |
| `surface-hi` | `#fffdf6` | sticker card, inputs |
| `card-ink` (`ink`) | `#0a2417` | all text on paper, every border and hard shadow |
| `card-muted` / `card-muted-2` | `#3d5a48` / `#6b8575` | secondary / tertiary text on paper |
| `yellow` | `#ffd62e` | **the action colour**: primary CTAs, FREE square, winning line, highlights. Text on it is always ink |
| `coral` (legacy `pink`, `red`) | `#ff5b45` | Trivia, wrong answers, LIVE, eyebrow tags. Ink text only |
| `sky` (legacy `nation`) | `#6fd3f2` | Tenable, Nation category |
| `green-go` | `#3ddc84` | correct, Club category, ✓ Ready/Placed |
| `on-green` / `-soft` / `-dim` | `#f5f0e1` / `#ddebe1` / `#b7d3c1` | text on the stage |

Legacy names (`paper`, `panel`, `cream`, `nation`, `foil`, `gold`, `turf`, `chalk`...) still resolve onto the values above. They go away in the cleanup phase.

**Shadows** are hard, no blur, always ink: cards `0 6px 0`, buttons `0 5px 0` (hover 7px, active 2px), chips `0 3px 0`. On the ink scoreboard panels the shadow is `#052012`.

**Borders**: 2.5px ink on cards, buttons and inputs; 2px on board squares and stickers; 1.5px on chips and flags.

**Radii**: cards 14px (hero boards 16px), buttons and inputs 8px, board squares 8px (6px on mobile), chips 5-6px, tags 4px. No pills except progress bars.

## Typography

- `font-display` - **Big Shoulders** (variable, `opsz` axis, 700-900). Headlines, numerals, sticker name bars, board labels. Always uppercase, tight line-height (0.84-1.05). Big headlines at 900.
- `font-sans` - **Archivo** (400-800). Body, buttons (800, uppercase, 0.04em tracking), labels.
- `font-mono` - **IBM Plex Mono** (500-700). Scores, rounds, timers, room IDs, eyebrow tags and small uppercase labels (0.08-0.14em tracking).

## Components (globals.css classes)

- `.btn` + `.btn-primary` - yellow, ink border, ink shadow that presses down. One per view.
- `.btn` + `.btn-outline` - transparent with ink border, for paper surfaces.
- `.btn` + `.btn-outline-light` - transparent with cream border, for the stage.
- `.btn-ghost`, `.btn-lg`, `.btn-sm` as before.
- `.card` / `.panel` - paper, ink border, ink shadow, 14px.
- `.eyebrow` - small mono tag, coral by default, rotated -1.5°. `.eyebrow-sky`, `.eyebrow-yellow`.
- `.chip` - paper, 1.5px ink border, `0 3px 0` shadow.
- `.input` - `surface-hi`, ink border, yellow focus ring.
- `.foil` - solid yellow fill (FREE square, win moments).

### Board square (container-query rule)

Board squares must work from ~66px (mobile 5×5) to ~165px (home hero). Each square is a size container and **everything that scales lives on an inner layer**, because `cqi` units on the container's own box resolve against an ancestor, not the square:

```html
<button class="bingo-cell">          <!-- aspect-square, container-type: inline-size, position: relative -->
  <span class="bingo-cell-inner">    <!-- absolute inset-0, padding in cqi, flex column -->
    category bar · crest (32cqi) · label (clamp(8.5px, 11.5cqi, 15px), 3 lines max, 2 on mobile)
  </span>
</button>
```

States: open = paper; FREE = yellow + ink star, rotated -1.5°; filled = the player's sticker on a translucent tray (dashed cream border); on the winning line / nearest line = `#fff3b8` tray with a yellow border; vote target (shared board) = 4px coral outline, voters as small roundels on the square's bottom edge; disabled = 40% opacity.

Category bars (5px bar at the top of the square): Club `green-go`, Nation `sky`, Honour `yellow`, Trait `card-muted`. The mono category name sits beside it on desktop and is dropped on mobile.

### Sticker

`surface-hi` card, 2px ink border, small tilt, portrait on a halftone backdrop (mode colour + `radial-gradient` dots), flag in the top-right corner, ink name bar with yellow Big Shoulders text. Name-bar variants: ink/yellow (default), yellow/ink (win). Never white text on coral.

### Mode colours

Bingo = `yellow`, Trivia = `coral`, Tenable = `sky`. All three take **ink** text. Home mode cards use the full colour as the card background with a `MODE 0X` mono tag and a 104px Big Shoulders title.

### Chrome

- Ticker strip (ink, yellow bottom border, mono uppercase, coral LIVE tag) above the header on marketing pages only.
- Header: 46px yellow logo tile with the ball mark, rotated -6°, wordmark in Big Shoulders 32px. Nav items: active = cream text on `rgba(245,240,225,0.12)` with a 3px yellow underline; idle `#cfe3d5`. "New game" = small primary button.
- Scoreboard panels: ink card, row of yellow bulbs along the top, IBM Plex Mono digits in `#052a15` wells.

## Screens

- **Home** - hero with a small live board and a drawn sticker, three mode cards, sticker marquee on a tilted ink band, "How it plays" match timeline (1' / 45' / 90+'), scoreboard CTA.
- **Solo bingo, desktop** - three columns: drawn-player card + last four draws (left), board (centre), scoreboard (placed / missed / skipped) + closest lines (right). Closest lines are derived from `bingoLinesForConfig` and the filled squares.
- **Solo bingo, mobile** - header, one-line stats (placed, missed, closest line), board, and the drawn player in a slim bottom bar (small sticker, round, name, nation · position, Skip).
- **Room in play** - the solo layout with the right column as the room scoreboard. It adapts to the room setting:
  - *Same player*: "Everyone's on: [player]" at the top, per-player result this round (Placed / Playing), "Waiting on ...".
  - *Own draws*: no shared player; progress bar, squares filled, tries and last move per player.
  - *Shared board*: votes as roundels on the board, vote count in the column.
  - *Mini boards* (optional): a 5×5 dot grid per player. **Needs a logic change**: presence only carries `solvedCount` today, not which squares. With Same player the current round's pick stays hidden (striped) until everyone has played.
  - Mobile: an avatar strip (progress ring + ✓ / waiting badge) above the board; the bottom bar adds "You placed him · Waiting on ...".
- **Room lobby** - QR + room ID with copy buttons, "Starting XI" team sheet (Gaffer badge, ✓ Ready, In the tunnel..., open spots), match settings summary, name input, "Kick off".
- **Full time** - scoreboard banner with the winner and the winning line, standings table (squares, tries, Bingo badge), the winning board with the line highlighted, Rematch / New room / Home.

## Motion

Unchanged from Prime Time Green: fade-up entrances, spring slap-down when placing a sticker, modal pop on win, confetti (recolour to `['#ffd62e','#ff5b45','#6fd3f2','#f5f0e1']`), marquee, pulse on LIVE and "In the tunnel". Everything respects `prefers-reduced-motion`.

## Accessibility

- Ink text on every accent colour; never white on coral, sky or green-go.
- Caption text on paper is `card-muted` or darker; on the stage `on-green-dim` or lighter.
- Touch targets at least 44px; icon-only buttons get `aria-label`.

## Migration

The redesign is styling only: keep all logic, props, handlers, Liveblocks storage, API calls and accessibility attributes untouched (the mini boards are the one flagged exception).

1. **Tokens and fonts** - done on `design/matchday`: palette, stage, fonts, and the `.btn` / `.card` / `.chip` / `.eyebrow` / `.input` classes.
2. **Shared components** - `Sticker`, `BingoBoard` square (container rule above), category bars + Trait chip, `SiteHeader`, ticker, scoreboard panel.
3. **Screens** - home, solo bingo (desktop 3-column, mobile bottom bar), room in play, lobby, full time, then Trivia and Tenable.
4. **Cleanup** - move the ~64 hard-coded `rounded-[..]` values and ~43 hex literals in components to tokens, drop the legacy remaps, rename `pink` to `coral`, update the OG image and icon.
