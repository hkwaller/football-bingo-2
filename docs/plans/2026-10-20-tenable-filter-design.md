# Tenable browse: Matchday sticker filters

Approved direction: Matchday stickers, selected by the user on 2026-10-20.

The player should feel like they are sorting their football sticker collection,
with confident, tactile controls that make each change to the available lists clear.

- Topic controls become paper tabs with football topic icons and real faceted counts.
- Search, type and difficulty form one cream-paper filter desk; sort lives beside results.
- The live result tally turns over when its count changes. Clear filters remains reachable.
- Existing Framer Motion animates stable list IDs between positions and briefly settles new cards.
- Motion remains interruptible, with no loops, sound, delayed filtering or new dependencies.
- Reduced motion removes spatial effects while preserving color and result feedback.
- Keep search/filter logic, data, list selection, gameplay and other setup screens intact.

Implementation sequence: build route-local filter controls and styles; integrate keyed
layout transitions; check lint/types and the design detector; inspect desktop/mobile,
empty recovery, sorting, search, keyboard interaction and reduced-motion behavior.

## Famous 11s extension

User requested the same treatment for Famous 11s. Reuse the paper desk, tactile
choices, live tally and card rearrangement, with green era tabs (All eras,
Classic, Big Nights). Counts remain derived from actual matching fixtures; retain
both fixture and lineup totals, all sort options and team selection behavior.
Share the filter-choice component and gallery stylesheet with Tenable so both
surfaces retain the same motion, responsive and reduced-motion rules.
