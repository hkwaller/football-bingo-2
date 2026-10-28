# Bingo hints

Approved: each correct placement earns 100 points. In draft mode, Hint costs 50 points and reveals every matching empty square until the drawn player is placed or skipped. A draw is charged at most once. No matching squares means no charge. A balance below 50 prevents buying a hint.

Use the existing placement matcher on the server, excluding filled and free squares. Keep player data out of the hint client. Add a persistent hint-purchase ledger to solo saves; derive score from placements minus purchases so reloads cannot restore spent points. Legacy saves start with no purchases. A board reset clears the ledger.

Room games use individual wallets on individual boards and a team wallet on shared boards, with purchases stored in PartyServer. A shared draw on a shared board needs only one team purchase. Hints never place or restrict a square.

Use the existing paper/yellow visual style, a lightbulb action beside Skip, accessible match labels, a live hint message, and visible points on desktop and mobile. Keep the mobile action area compact.

Implementation plan:
1. Add scoring helpers and a validated hint endpoint using the existing matcher.
2. Add a reusable hint request hook with in-flight and stale-result protection.
3. Integrate the purchase ledger, score, hint action and board highlights into solo and room games.
4. Test matching, pricing, repeated purchases, malformed requests, persistence and browser interactions at desktop/mobile sizes. Run TypeScript and lint checks.
