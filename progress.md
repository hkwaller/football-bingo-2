Original prompt: Add a bingo hint that costs 50 points and reveals where the drawn player can be played.

Approved design: 100 points per correct placement; 50 points once per draw to reveal all matching empty squares. No match means no charge. Persist solo purchases; sync room purchases with individual/team wallets.

Work in progress: implement helpers, endpoint, shared hook, controls and highlights; then verify with unit and browser checks.

Implemented scoring helpers and a validated server hint endpoint using the placement matcher; reusable hint request handling ignores stale/unmounted responses and deduplicates clicks. Solo purchases persist; room purchases use a PartyServer ledger with board-scoped wallets. Added hint controls, accessible yellow match markers, responsive points, a balanced four-counter scoreboard and final solo points.

Verification: all 41 unit tests passed, including six new hint/scoring/API/persistence tests. TypeScript passed. Changed hint helpers/components pass lint; SoloGame/RoomGame retain existing React warnings. Browser verified: 0-point disabled hint; correct placement +100; purchase -50; three simultaneous matches; no-match request free; skip/place clears highlights; reload retains spent points and allows free re-show of purchased hint.

Browser tooling: prescribed web-game client cannot run because Playwright is not installed; used the built-in browser for interactions and visual inspection instead. Multiplayer browser verification initially hit an unrelated concurrent Tenable stylesheet build error.

Implemented scoring helpers and a validated server hint endpoint using the placement matcher. Hint requests ignore stale/unmounted responses and deduplicate clicks. Solo purchases persist; room purchases use a PartyServer ledger with board-scoped wallets. Added hint controls, accessible yellow match markers, responsive points, a balanced four-counter scoreboard and final solo points.

Verification: all 41 unit tests passed, including six new hint/scoring/API/persistence tests. TypeScript passed. Hint helpers/components pass lint; SoloGame/RoomGame retain existing React warnings. Browser verified: 0-point disabled hint; correct placement +100; purchase -50; three simultaneous matches; no-match request free; skip/place clears highlights; reload retains spent points and allows free re-show of a purchased hint.

Browser tooling: prescribed web-game client cannot run because Playwright is not installed; used the built-in browser for interactions and visual inspection instead. Multiplayer browser verification in progress.

Completed browser room check on a fresh individual-board room: Kevin Keegan placement earned 100 points; Desire Doue had no match and cost nothing; Miroslav Klose hint highlighted Germany and reduced the balance to 50. Visually inspected compact/tablet solo layout and 1280x720 desktop room layout. Saved room preview at /private/tmp/bingo-hint-room-preview.png. No remaining implementation TODOs; full multi-client shared-wallet concurrency and narrow phone viewport were not exercised in the browser.
