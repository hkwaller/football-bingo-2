# Tenable category ideas

Backlog of categories not yet in `src/data/tenable/questions.ts`. Verify figures against
Wikipedia before adding (Transfermarkt blocks fetching).

**Staleness:** lists that are still "live" (ranked career totals, transfer fees) go stale
every season or window. Open sets of closed history (winners, finals) stay correct for years.

## Open sets (name any 10)

- **Champions League winners with 2+ clubs.** For example Seedorf, Cristiano Ronaldo, Kovačić. Medium. Stable.
- **Played for both Man Utd and Liverpool.** Owen, Ince, Beardsley. Good trick answers. Medium.
- **Played for both Arsenal and Tottenham.** Sol Campbell, Adebayor, Jennings. Medium.
- **Clubs that have played in the Premier League.** 51 clubs, very easy. Answers are clubs, not
  players, so no portraits (name-chip fallback). Check matching/autocomplete handles club names.
- **Managers who've won the Champions League / European Cup.** New domain. Portraits likely sparse.
- **Players who scored in a World Cup final.** Stable, medium-hard.

## Ranked top 10s

- **Most Premier League assists.** Giggs, Fàbregas, De Bruyne, Rooney, Lampard. Live, update each season.
- **Most Premier League clean sheets.** Čech, James, Schwarzer, Given. Live.
- **Most Premier League titles (players).** Giggs 13 at the top. Ties at the bottom, so decide
  on a tiebreak or make it open.
- **Most Premier League titles (managers).** Fewer than 10 managers have won it, so this
  would have to be open ("every PL-winning manager").
- **Most expensive Premier League signings.** Reuses the Wikipedia transfer list; pairs with
  the existing transfer categories. Live, stale after each window.
- **Largest-capacity European stadiums.** Clubs and grounds, a change of pace. Stable.
- **Most men's World Cup appearances.** Messi, Matthäus, Klose, Ronaldo, Maldini. Update after each World Cup.

## New areas

- **Women's football.** Nothing yet. For example most international goals (Sinclair, Wambach, Marta)
  or Women's Ballon d'Or winners (open set). Check player CSV coverage for portraits.

## Portraits

`npm run tenable:images` fills gaps from Wikipedia/Wikidata by name (free licenses only)
into `src/data/tenable/wikiImages.json`. Re-run it after adding categories. For an
ambiguous name, set `wikiTitle` on the answer (see the 1960 Luis Suárez). As of
2026-09-25, 1,459 of 1,644 answers have a portrait. The ~180 left are mostly journeymen
in the open sets with no free photo anywhere.
