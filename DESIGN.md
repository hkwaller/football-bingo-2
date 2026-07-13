# Football Bingo — "Sticker Album" design system

The aesthetic is a **retro football sticker album**: warm cream album paper, white sticker
cards with red name bars, a deep-green masthead, and gold-foil reserved for wins. Confident and
nostalgic, never neon or brutalist. No dark backgrounds, no hard neon accents — ink-brown text
on warm paper, one red for action, green for structure, gold-foil for the win moment.

## Tokens (defined in globals.css / tailwind.config.ts)

Colors (Tailwind classes):
- `bg-paper` `#ece0c8` — page background (album paper, dotted texture already on body)
- `bg-panel` `#f7efdd` — cards / panels; `bg-panel-white` `#fff` — sticker cards, inputs, selected tiles
- `text-ink` `#262019` — primary text + hard 2px borders; `text-ink-soft` `#4c4638` — labels
- `text-muted` `#6b5f4c` — secondary/body text
- `green` `#1d3b2a` — masthead, headings, "correct/ready"; `green-deep` for depth
- `red` `#d64533` — THE action color: primary buttons, eyebrows, progress fill; `red-deep` hover
- `cream` `#f2e8d5` — text on green; `cream-dim` `#c9b98f` — inactive nav on green
- `nation` `#14264f`, `foil`/`gold` `#b8862c` — category colors (Nation / Honour); Club uses `green`
- `link` `#e8c15a` / `link-hover` `#f3d78a` — links in dark (on-green) contexts
- `border-line` (rgba(38,32,25,0.18)) hairline; `border-line-strong` (0.32) for dashed/empty slots

Shadows: `shadow-soft`/`shadow-panel` (panels), `shadow-sticker`/`shadow-sticker-lg` (sticker cards),
`shadow-foil-ring` (win modal inner ring). Backgrounds: `bg-foil` (gold-foil gradient), `bg-paper-dots`.

## Typography
- `font-display` — **Anton**. Headlines, big numerals, sticker name bars, letter prefixes, room-code
  tiles. Always `uppercase leading-none`. Single weight — never set `font-*` weight on it.
- `font-sans` — **Libre Franklin**. All body copy, buttons, labels (weights 400–800).
- `font-mono` — **Courier Prime**. Scores, streaks, counters, timers, room codes/seeds only.
- Eyebrow labels: use `.eyebrow` (11px extrabold uppercase tracking-[0.2em], red).

## Components (prebuilt classes in globals.css — use these, don't reinvent)
- `.btn` + `.btn-primary` — solid red pill, white uppercase bold text. Main CTA per view.
- `.btn` + `.btn-outline` (or `.btn-secondary`) — the ubiquitous outline pill: 2px solid ink border,
  panel bg, ink text. Secondary actions everywhere.
- `.btn` + `.btn-ghost` — no border, muted text, subtle hover.
- `.btn-lg` / `.btn-sm` size modifiers.
- `.card` / `.panel` — `bg-panel`, hairline border, `rounded-[14px]`, soft shadow.
- `.eyebrow` — small red section label.
- `.chip` — white pill with 2px ink border.
- `.input` — white field, 2px ink border, rounded-xl, red focus glow.
- `.foil` — gold-foil gradient fill (free square, wins, ★ roundels).
- `<Sticker>` (`@/components/Sticker`) — player portrait as a collectible sticker (white card, tilt,
  red name bar; `win` → gold-foil bar). The signature motif; reused on home, board, drawn panel.

## Shape & spacing
- Radii: panels `rounded-[14px]`, sticker cards/cells `rounded-[6px]`, tiles/options `rounded-xl`,
  buttons/pills `rounded-full`.
- Selected tiles: solid `border-2 border-ink` on `bg-panel-white`, small deterministic tilt + shadow.
- Empty/inactive slots & toggles: `border-2 border-dashed border-line-strong`, `text-muted`.
- Sticker rotation is deterministic: `((i*7)%5 - 2) * 0.9` deg. Hover = `-translate-y-0.5`.
- Generous padding: panels `p-6`, board tray `p-[22px]` with `gap-3.5`, sections `gap-[18px]`.

## Chrome
- Masthead (`SiteHeader.tsx`): full-width green bar, `border-b-[5px] border-red`, ⚽ cream roundel +
  "Football Bingo" in Anton 30px, nav pills (active = `bg-cream/[0.12] text-cream`, inactive
  `text-cream-dim`), red "New game" CTA / cream-outline "Sign in".

## Motion (framer-motion)
- Entrances: fade-up (`opacity 0→1`, `y 12→0`), stagger children 0.05–0.08s, 0.35–0.5s easeOut.
- Respect `reduceMotion` props. Board placement: sticker peel/drag/slap-down (spring).
- Wins: gold-foil ★ roundel + confetti recolored to `#e8b93e, #fdf0c0, #d64533, #1d3b2a`.

## Semantics
- Solved bingo cell = the player's Sticker; winning line = gold-foil name bar; free cell = gold-foil
  ★ + "FREE"; vote target (multiplayer) = red ring; disabled = `opacity-40`.
- Category tabs on empty cells: Nation `bg-nation`, Club `bg-green`, Honour `bg-foil`, cream/white text.

## Migration notes (from the old "Floodlit" dark theme)
- Legacy Tailwind names `pitch`/`chalk`/`turf`/`gold`/`flare`/`shadow-glow-*` still exist but are
  **remapped** onto the sticker palette so un-migrated callers stay coherent. Prefer the new names
  above and replace legacy usage when you touch a file.
- Keep all logic, props, handlers, Liveblocks storage, and accessibility attributes untouched —
  the redesign is styling only.
