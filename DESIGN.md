# Football Bingo — "Floodlit" design system

The aesthetic is a **night match under floodlights**: deep green-black darkness, chalk-white
lines, one electric turf-green accent, gold reserved for wins. Refined and broadcast-quality
(think Apple Sports), never neon or brutalist. No hard offset shadows, no borders thicker than
1px, no uppercase-everything, no magenta/cyan/lime.

## Tokens (defined in globals.css / tailwind.config.ts)

Colors (Tailwind classes):
- `bg-pitch-dark` `#070d09` — page background (already on body, rarely needed)
- `bg-pitch` `#0d1510` — recessed areas, inputs
- `bg-pitch-light` `#141f17` — cards, panels (use with `border border-line`)
- `bg-pitch-lighter` `#1c2b20` — hover states, raised chips
- `text-chalk` `#e9f2ec` — primary text
- `text-chalk-dim` `#8fa697` — secondary/muted text
- `turf` `#3ce97e` — THE accent. Interactive highlights, active states, links, focus rings
- `turf-deep` `#14b85c` — gradients paired with turf
- `gold` `#f4c65d` — wins, bingo lines, trophies ONLY
- `flare` `#ff6b5e` — errors, destructive, opponent alerts
- `border-line` — `rgba(226,244,232,0.09)` hairline borders; `border-line-strong` (0.18) for emphasis

Shadows: `shadow-soft` (cards), `shadow-glow-turf`, `shadow-glow-gold` (sparingly).

## Typography
- `font-display` — Barlow Condensed. Headlines, numbers, scores. Use `font-semibold`/`font-bold`,
  `uppercase tracking-wide` is OK **for display font only**. Big and confident.
- `font-sans` — Instrument Sans. All body copy, buttons, labels. Sentence case.
- `font-mono` — Spline Sans Mono. Stats, seeds, room codes, timers only.
- Kill patterns like `font-mono text-xs uppercase tracking-[0.3em]` body text. Labels above
  sections: `text-xs font-medium uppercase tracking-[0.14em] text-chalk-dim` max.

## Components (prebuilt classes in globals.css — use these, don't reinvent)
- `.btn` + `.btn-primary` — pill, turf gradient, dark text. Main CTA per view.
- `.btn` + `.btn-secondary` — pill, surface bg + hairline border, chalk text.
- `.btn` + `.btn-ghost` — no bg, chalk-dim text, hover surface.
- `.btn-lg` / `.btn-sm` size modifiers.
- `.card` — `bg-pitch-light`, hairline border, `rounded-2xl`, `shadow-soft`.
- `.chip` — small pill badge, surface bg. Add `text-turf`/`text-gold` for semantic color.
- `.input` — recessed field: `bg-pitch`, hairline border, rounded-xl, focus ring turf.

## Shape & spacing
- Radii: cards `rounded-2xl`, cells/inputs `rounded-xl`, buttons/badges pill (`rounded-full`).
- No rotation transforms, no translate-on-hover-with-hard-shadow. Hover = `-translate-y-0.5`
  + border/glow shift, or brightness.
- Generous padding: cards `p-5`+, sections `gap-6`+.

## Motion (framer-motion already imported in most files)
- Entrances: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`, stagger children
  by 0.05–0.08s. Duration 0.35–0.5, ease out.
- Respect existing `reduceMotion` props.
- Wins: scale pulse + gold glow. Keep confetti where it exists.

## Migration notes
- Replace every `fb-brutal-btn`, `shadow-brutal*`, `border-2/4 border-black|white`,
  `bg-striped-yellow`, rotate hacks, and `--fb-accent-*` var usage with the tokens above.
- Legacy tailwind names `pitch`, `chalk`, `font-display` still exist but are remapped — verify
  each usage still makes sense in the new look.
- Semantics: solved bingo cell = turf; winning line = gold; vote target = turf ring;
  free cell = subtle turf-tinted surface with a ⚽ mark; disabled = opacity-40.
- Keep all logic, props, handlers, and accessibility attributes untouched. Styling only.
