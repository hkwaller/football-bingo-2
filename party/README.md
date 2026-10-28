# Football Bingo room server

All six multiplayer games use this PartyServer Worker: Bingo, Trivia, Tenable,
Famous 11s, Connections and Careers. Each room has its own hibernating SQLite
Durable Object. The Worker validates signed room tickets, applies named game
actions, persists the room and player seats, and sends complete room snapshots.
Disconnected players retain their seats, names, answers and scores. Unoccupied
rooms expire after 24 hours without activity.

## Local development

Run `npm install`. Generate a random secret (`openssl rand -hex 32`) and set the
same value in `.env.local` and `party/.dev.vars` as `PARTY_SECRET`. Neither file
is committed. Set `NEXT_PUBLIC_PARTY_HOST=localhost:2001` in `.env.local`.

Run `npm run party:dev` and `npm run dev` in separate terminals (or use the
`party` and `football-bingo` launch configurations). Visit the host room on
`localhost:3000` and join from `127.0.0.1:3000` to test separate browser identities.
Room URLs keep their existing UUID and game prefixes. The socket route is
`/parties/room/:roomId`. Each reconnect gets a fresh ticket from `/api/party-auth`.

Only named, validated actions can change storage. The server derives identity,
connected turn rings and Trivia correctness/points. Dealt Connections/Careers
items are resolved against the server's own bank. Optimistic client actions are
reconciled against acknowledged server snapshots; random starts wait for the
server. Presence and host kick events also go through the Worker. Kicked seats
cannot reconnect to that room. Individual Bingo boards and draw history are
kept in the tab's session storage while the server retains its seat and wallet.

## Checks

- `npm test`
- `npx tsc --noEmit -p .`
- `npm run party:check`
- `npm run party:smoke` (with the local Worker running)
- `npm run build`
- `npx wrangler deploy --dry-run --config party/wrangler.jsonc --outdir /tmp/football-party-bundle`

## Preview and production rollout

1. If Supabase tracking is configured but `football_bingo_games` is absent,
   initialize it with `supabase/migrations/001_games.sql`. For an existing games
   table, apply `supabase/migrations/005_room_backend.sql` to normalize `room_id`.
2. Deploy the Worker with `npm run party:deploy` on the Cloudflare account owning
   the `playam.workers.dev` subdomain.
3. Set its secret using `npx wrangler secret put PARTY_SECRET --config party/wrangler.jsonc`.
4. Set the matching `PARTY_SECRET` on Vercel and set
   `NEXT_PUBLIC_PARTY_HOST=football-bingo-party.playam.workers.dev` for the target
   environment. The public host is embedded during the Next.js build.
5. Make a Vercel preview deployment. Play all six games from a host and a real
   phone. Reload both mid-round; lock the phone for 30 seconds and switch apps.
   Confirm the same seats, boards, names, scores and turns resume. Test host removal.
6. After the phone checks, merge/deploy production. The hosted native shell loads
   the live site, so no store resubmission is needed for this backend change.

The Worker deploy, remote secrets, database migration and Vercel environment
changes are separate operational steps; preparing this repository does not apply
them. Worker bindings and migrations are configured in `wrangler.jsonc`; its
separate tsconfig keeps Workers globals out of the Next.js application.
