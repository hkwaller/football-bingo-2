# Football Bingo - "Prime Time Green" design system

The aesthetic is a **TV game-show on a bright turf-green stage**: a vivid diagonal green gradient, chunky white cards with hard offset (no-blur) shadows, hot yellow/pink/sky accents, twinkling floodlight dots, and playful rotated badges. The collectible-sticker motif is kept. Confident, loud, broadcast-energy - never muted, never dark-mode.

## Tokens (defined in globals.css / tailwind.config.ts)

Colors (Tailwind classes):

- `pitch` `#0d7a3a` / `pitch-bright` `#1fae5a` / `pitch-deep` `#06592a` - the green stage. Body is a fixed `linear-gradient(165deg, #1fae5a 0%, #0d7a3a 60%, #06592a 100%)`. `pitch-deep` = dark text on yellow + sticker name bars.
- `card-ink` `#0a3d20` - headings/borders on white cards; `card-muted` `#3c6e4d` - secondary text; `card-muted-2` `#6f9c7f` - tertiary; `card-tint` `#ecf7ef` - inactive fills / input backgrounds.
- `yellow` `#ffe23a` - **THE action color**: primary CTAs, free square, highlights (`yellow-deep` hover).
- `pink` `#ff4d8d` - hot pop: eyebrows, round tags, wrong answers, "Bingo!" (`pink-deep` hover).
- `sky` `#4de1ff` - cool pop: "Nation" chips, section eyebrows.
- `green-go` `#22c55e` - correct answers, active toggles/pills, "Club" chips, ✓ Ready.
- `live-red` `#e0301e` - the pulsing LIVE badge only.
- `on-green` `#fff` / `on-green-soft` `#d7f2df` / `on-green-dim` `#b9e6c8` - text on the green stage.

Legacy Sticker-Album names (`paper`/`panel`/`ink`/`red`/`green`/`cream`/`nation`/`foil`/`gold`/`muted`) are **remapped** onto Prime Time Green so un-migrated callers stay coherent (`red`→pink, `foil`/`gold`→ yellow, `nation`→sky, `green`→card-ink, `cream`→white, etc). Prefer the new names when you touch a file.

Shadows: hard offset, no blur. `shadow-soft`/`shadow-panel`/`shadow-hard` = `0 8px 0 rgba(0,0,0,0.22)`; `shadow-btn` = `0 6px 0`; `shadow-chip` = `0 3px 0`; `shadow-sticker` = `0 5px 0`.

## Typography

- `font-display` - **Passion One** (700/900). Headlines, big numerals, sticker name bars. Always `uppercase font-black` (or `font-bold`), tight line-height (0.86–1.1).
- `font-sans` - **Libre Franklin** (400–800). Body, buttons, labels - buttons/labels at 800.
- `font-mono` - **Courier Prime**. Scores, room IDs, pool counts, timers only.

## Components (prebuilt classes in globals.css - use these)

- `.btn` + `.btn-primary` - solid **yellow** pill, `pitch-deep` text, `0 6px 0` shadow that presses down on `:active`. The main CTA per view.
- `.btn` + `.btn-outline` - 3px `card-ink` border pill, for **white** surfaces.
- `.btn` + `.btn-outline-light` - 3px translucent-white border pill, for the **green stage**.
- `.btn-ghost` - no border, `on-green-soft` text.
- `.btn-lg` / `.btn-sm` size modifiers.
- `.card` / `.panel` - white, `rounded-[20px]`, `0 8px 0` hard shadow, `card-ink` text.
- `.eyebrow` - solid **pink** rounded chip, rotated `-1.5°`, `0 4px 0` shadow. Variants `.eyebrow-sky` and `.eyebrow-yellow`.
- `.chip` - white pill, `0 3px 0` shadow.
- `.input` - `card-tint` bg, 3px `card-ink` border, yellow focus ring.
- `.foil` - solid yellow fill (free square / win moments).
- `<Sticker>` (`@/components/Sticker`) - player portrait as a collectible sticker: white card, tilt, `pitch-deep` name bar with `yellow` text. `drawn` → yellow outline ring; `win` → yellow name bar; `variant` `green`/`pink`/`yellow` for marquee alternation. The signature motif.
- `<TwinkleDots>` - ambient fixed floodlight glints (yellow/pink/sky), added globally in AppShell.

## Shape, spacing, rotation

- Radii: cards `20px` (hero `24px`, win modal `26px`), board cells `14px`, option tiles `16px`, pills `999px`, small badges `6–10px`.
- **Rotation everywhere** (±0.3° to ±6°): cards, badges, eyebrow chips, letter tiles all get a small deterministic rotation. Solved sticker tilt: `((i*7)%5 - 2) * 1.2` deg.
- Hover: `translateY(-2 to -3px)`. Tap: press-down (shadow flattens) or `scale(0.97)`.

## Chrome

- Header (`SiteHeader.tsx`): **transparent**, sits on the gradient (no bg, no border). Logo = ⚽ on a 44px yellow rounded tile rotated `-6°`; wordmark Passion One 30px white; **LIVE** badge in `live-red` rotated `4°`, pulsing. Nav pills: active = `bg-white/16` + white, idle `on-green-dim`; "New game" = yellow pill with `pitch-deep` text.
- On the green stage, page titles/headings are **white**; body is `on-green-soft`. Inside white cards, headings are `card-ink`, body `card-muted`.

## Motion (framer-motion)

- Ambient: twinkle dots (opacity+scale, 2.2–3s, staggered); bob (`y:[0,-9,0]`, 3.4–5s) on drawn sticker / "Bingo!" pill / roster tiles / trivia sticker; LIVE + "in the tunnel" pulse (1.6–1.8s); marquee (translateX 0→-50%, 40s linear, list duplicated 2×). All skip under `prefers-reduced-motion`.
- Entrances: fade-up (`opacity 0→1, y 12→0`, 0.35–0.5s easeOut, stagger 0.05–0.08s).
- Board placement: spring slap-down (`scale 1.4→1, rotate tilt−10→tilt, y −40→0`, spring 320/18).
- Win: modal pop (`scale 0.6→1.08→1`), canvas-confetti recolored `['#ffe23a','#ff4d8d','#4de1ff','#fff']`.
- Trivia: shot clock is a `#ffe23a→#ff4d8d` gradient draining over 15s; correct tile → green-go pop; result is a rotated pill ("GOOOAL! Correct!" yellow / "Off the post - X" pink).

## Semantics

- Solved bingo cell = the player's sticker (spring slap-down); winning line = yellow name bar; free cell = solid yellow ★ "FREE"; vote target (multiplayer) = pink ring; disabled = `opacity-40`.
- Category chips: Nation `sky`, Club `green-go`, Honour `yellow` (🏆 emoji when no logo).

## Migration notes

- This replaced the earlier "Sticker Album" (cream/red/ink) theme, which itself replaced "Floodlit" (dark). All three generations' token names still resolve via the remaps above.
- Keep all logic, props, handlers, Liveblocks storage, API calls and accessibility attributes untouched - the redesign is styling + motion only.
