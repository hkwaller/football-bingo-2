# Local club crests

Run `npm run fetch-logos` to discover matching football-logos.cc pages, download PNGs, and rebuild `src/data/clubCrests.json`. Images are served locally from `public/logos/clubs`; there are no browser requests to the source site.

`clubCrestSources.json` records source pages. `clubCrestOverrides.json` contains reviewed mappings for abbreviated or ambiguous names. Add overrides rather than broad fuzzy matching. These use current crests, including for historical club names that identify the same club.

`npm run verify:logos` checks every club name gathered from curated clubs, Careers and loans, player histories, and Famous 11s club lineups. It validates PNG signatures and exits nonzero while any club group remains unresolved. This deliberately includes obscure historical, reserve and youth entries from the raw player data. `missingClubCrests.json` records the unresolved names after each download pass. Missing images return null through the shared lookup, preserving existing text/monogram fallbacks.

Refreshes resume from downloaded assets and the manifest. The downloader checks exact normalized names first, then removes common club designators only when the resulting source match is unique. Ambiguous matches require an override. Review mappings when source catalogue names change.
