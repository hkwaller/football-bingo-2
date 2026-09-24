---
target: trivia setup screen
total_score: 27
max_score: 40
na_heuristics:
p0_count: 1
p1_count: 1
timestamp: 2026-07-28T08-22-12Z
slug: src-components-trivia-triviasetup-tsx
---

# Critique - Trivia Setup (/trivia/setup)

Method: dual-agent (A: design review · B: detector + browser). Detector: clean (exit 0, [] findings).

## Design Health Score

| # | Heuristic | Score | Key Issue |
| --- | --- | --- | --- |
| 1 | Visibility of System Status | 3 | `if (!hydrated) return null` blank-flashes route; no step cue |
| 2 | Match System / Real World | 3 | "Session type"/"Multiplayer mechanic" are settings-speak, not broadcast voice |
| 3 | User Control and Freedom | 3 | Auto-saves; no reset-to-defaults, no in-component back |
| 4 | Consistency and Standards | 3 | Two selected-state languages: OptionButton inset ring vs NumberSelect green fill+rotate |
| 5 | Error Prevention | 3 | Valid defaults, errors near-impossible |
| 6 | Recognition Rather Than Recall | 3 | "Category" is both a session type and a topic section |
| 7 | Flexibility and Efficiency | 3 | Remembers config; no one-tap quick-start |
| 8 | Aesthetic and Minimalist Design | 2 | Core failure: flat identical-panel stack, zero hierarchy, muted vs loud brand |
| 9 | Error Recovery | 2 | No loading/empty/error state; hydration returns null |
| 10 | Help and Documentation | 2 | Thin one-liner descriptions; nothing explains what each mode feels like |
| Total |  | 27/40 | Acceptable - serviceable but flat |

## Design Specificity Verdict - category-interchangeable

Strip difficulty copy and this drops into any quiz app. Signature sticker motif appears nowhere on setup. Yellow only on one CTA. No rotation on panels. Detector clean (0 findings) - dullness is compositional (identical-but-valid tokens), NOT a token violation; the scanner structurally can't see "everything styled identically." Human review caught what the detector can't.

Browser: renders clean desktop+mobile, no errors, no overflow. 10 near-identical 600x66px option rows across Session type / Difficulty / MP mechanic. ~2.2 viewports tall; CTAs far below fold. CTAs stack on mobile, side-by-side near-equal weight on desktop.

## Priority Issues

- [P0] Session type carries same visual weight as every other setting (the "same weighting" complaint). It redefines the game + controls which sections exist, but renders as same panel+eyebrow. Fix: hero block, 2x2 tiles w/ icon+description, distinct eyebrow, rotation; demote the rest. → /impeccable layout
- [P1] Four session types are a list, not an explanation (the "doesn't explain" complaint). Fix: benefit-led football-voiced copy + stakes/length token per mode so four modes read as four games. → /impeccable clarify then /impeccable layout
- [P2] No focus-visible ring on OptionButton/NumberSelect; no toggle semantics. Fix: focus-visible ring + aria-pressed + role=radiogroup. → /impeccable audit
- [P3] Hydration returns null (blank flash). Fix: SSR scaffolding from defaults or branded skeleton. → /impeccable harden
- [P3] Multiplayer CTA de-emphasized vs "live multiplayer roar" positioning; "Category" duplicated concept. Fix: dominant CTA for intended path; rename session type to "Single topic". → /impeccable clarify

## Persona Red Flags

- Jordan: five identical boxes, no start-here; jargon labels; opaque MP mechanics.
- Casey: CTAs ~2 viewports down; conditional sections shift layout under thumb; blank flash reads broken.
- Football mate: no quick-start preset; social path is the quiet button; no stakes framing.

## Minor Observations

- Entrance stagger only on mount; revealed sections un-animated.
- .eyebrow -1.5° is the only rotation on a rotation-everywhere system.
- Non-parallel session-type copy.
- AdsterraBanner imported but never rendered (dead import).
