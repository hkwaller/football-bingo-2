# Matchday design system

Replaces Prime Time Green with the Matchday look: a matchday programme on a mown pitch. Cream paper cards, thick ink borders, hard ink shadows, Big Shoulders headlines, one loud action colour (yellow). Spec is in `DESIGN.md`.

## What changed

**1. Tokens and fonts** (`8628258`)
- New palette behind the existing token names, so every caller restyles at once. New `surface` (paper) and `coral` tokens.
- Striped pitch background, ink borders and ink shadows on `.btn` / `.card` / `.chip` / `.input`. `.eyebrow` is now a mono tag.
- Big Shoulders / Archivo / IBM Plex Mono replace Passion One / Libre Franklin / Courier Prime.
- Ink text instead of white on coral everywhere (contrast).

**2. Shared components** (`ce0384b`)
- Board squares are size containers: type, crests and padding scale with the square (about 66px on mobile to 165px on the home hero). Category colour bars; lucide trophy/target instead of emoji.
- Sticker and header restyled; ball mark replaces the emoji logo.

**3a. Solo bingo** (`a5a3046`)
- Desktop: three columns (drawn player + last four draws / board / scoreboard + closest lines + category key).
- Mobile: stats strip above the board, drawn player docked to the bottom as a slim bar.
- New `BingoSidePanels.tsx`. SoloGame gains two display-only bits of state (skip count, recent draws, not persisted).

**3b + 4. Rooms and sweep** (`d679326`)
- Room in play uses the same layout; the right column is a live room scoreboard that adapts to the room setting (same player, own draws, shared board, free play). Mobile gets an avatar strip with progress rings.
- Shared board shows voters as roundels on each square.
- Mini boards per player. **Logic change:** presence gains an optional `solvedCells: number[]`, written wherever `solvedCount` already was. In same-player rounds the latest pick stays hidden until everyone has acted.
- Full-time banner with winner, standings and a host-only Rematch (reuses `handleStart`).
- Lobby restyled.
- Sweep across all components: black shadows to ink, `bg-white` to paper, white text to cream (ink on accent fills), old hexes migrated, big radii tightened.

## How it was checked
- `tsc --noEmit` passes on every commit.
- Solo, Trivia, Tenable and setup screens rendered in headless Chromium at 1440px and 390px (no horizontal overflow, no console errors).
- **Not run:** multiplayer rooms (no Liveblocks keys in the test copy) and the home page (needs Clerk). Please try a room with two browsers, especially the same-player and shared-board settings.

## Not in this PR
- Home page hero and mode cards from the canvas. The stashed Broadcast work (`stash@{0}`) already rebuilds that page, so it should land on top of it.
- Pill buttons whose classes span several lines, dropping the legacy token remaps, renaming `pink` to `coral`, OG image and icon fonts.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01QsUCXLQtDqYAigYzAKrc7f
