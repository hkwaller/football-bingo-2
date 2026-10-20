# Bingo board difficulty

Approved: Easy, Medium and Hard control board categories independently of the player fame filter. Easy is the default for new games.

- Easy uses familiar nations and major clubs, at least eight eligible answers per category, and at least eight matching players with fame >=40. Other enabled kinds use the same coverage thresholds.
- Medium opens up all enabled categories with at least four eligible players.
- Hard opens up all enabled categories with at least one eligible player.
- Eligibility is measured after the selected minimum fame score, using the exact nationality, club aliases (including youth clubs), achievement, trait and manager fields used by placement validation.
- Setup counts reflect filtered coverage. Insufficient pools block launch and explain how to adjust settings; difficulty is never silently relaxed.
- Store difficulty in solo settings and multiplayer room storage. Include it and fame in the deterministic board key. Missing difficulty identifies a legacy board and preserves its original pool and seed key on resume. Opening setup upgrades future boards to Easy.
- Generate small category coverage metadata alongside existing derived player data, avoiding a player database import in setup.

Implementation: generate coverage metadata, filter board configuration pools, persist and synchronise the setting, add the existing setup radio rows and lobby summary, verify coverage, determinism and legacy compatibility.
