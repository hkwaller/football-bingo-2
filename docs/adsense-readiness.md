# Football Bingo: AdSense preparation

No web ad SDK is loaded. Eligibility is in `src/lib/playam-monetization.ts`, generated from Playam's shared policy. Run `npm run monetization:sync` / `monetization:check` in amalie-games when changing it. Native AdMob, where present, is separate.

Public `/`, `/privacy`, `/terms` and crawler metadata bypass Clerk. Existing game/account authentication and native root rewrites are retained.

Future break: only after final session completion and after displaying results. Use `monetizationBreakReached({ game: 'football-bingo', completed: true, phase: 'results', contentSource: ... })`. This is an eligibility predicate, not an ad event or loader. Never fire on a per-question reveal, join, lobby, loading or a timed/drag interaction.

Deployment and a repeat anonymous crawler audit are required; local changes are not a live PASS. Set any production URL override to `https://bingo.playam.app`.

Completion implementation references:
- `src/components/BingoWinModal.tsx`
- `src/components/trivia/TriviaEndScreen.tsx`
- `src/components/tenable/TenableEndScreen.tsx`
- `src/components/famous11s/Famous11sEndScreen.tsx`
- `src/components/careers/CareersEndScreen.tsx`
