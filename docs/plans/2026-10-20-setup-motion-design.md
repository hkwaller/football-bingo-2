# Setup motion: Matchday stickers

Approved direction: playful, tactile Matchday stickers across all six setup screens.

The player should feel like they are assembling their matchday, with paper and
sticker feedback grounded in the existing printed programme design.

- Focal moment: the mode badge stamps onto the page; selected format cards settle
  onto the pitch like collectible stickers.
- Continuity: kick-off readouts briefly turn over when their actual values change.
- Feedback: presets, number choices, rule rows and topic checks acknowledge
  selection with a short press/settle or ink reveal.
- Budget: CSS only, no dependencies, loops, sounds or delays to navigation.
- Accessibility: preserve semantics, focus and handlers. Reduced motion keeps
  color feedback while removing spatial animation. Content is visible by default.

Implementation: add narrowly scoped shared setup classes and keyframes; key only
readout text by its value, keeping interactive elements mounted. Retain copy,
layout, storage, game rules and navigation. Verify types/lint and inspect setup
interactions at desktop and mobile widths, including reduced-motion rules.
