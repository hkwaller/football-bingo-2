# PartyServer migration

Apply the supplied migration playbook to all six games in this repository.
Use one Cloudflare Worker (`football-bingo-party`) with a hibernating Durable
Object per existing room URL. Adopt server-owned JSON state, signed room tickets
and full room snapshots, with a single multiplayer backend.

Game-specific shared models and action reducers live in `src/lib/party`. Existing
room screens call named actions through a shared React context and PartySocket.
The Worker validates input, identity, host permissions, turn ownership, deadlines
and action scope, then persists the accepted state before broadcasting. Random
starts run on the server. Client predictions reconcile on every acknowledgement.

Use the existing Clerk/guest rules with a per-tab identity. Persist numeric seats
for Bingo/Trivia and stable player IDs for the turn-based and race games. Store
presence in the room so reloading and reconnecting restore names and progress.
Keep individual Bingo boards and draw history in per-tab session storage. Relay
only server-accepted game events; host removals persist across reconnects.

Keep the current game controls and UI. Replace the room-auth route and realtime
dependencies, normalize Supabase's room identifier, and update processor/privacy
text and environment examples. Document the Worker-first preview rollout and
real-phone reconnect checks in `party/README.md`.

Validate each game's reducer through complete rounds, ticket rejection, runtime
sockets, browser joins/reloads, Next.js and Worker typechecks, a production build,
and a Worker bundle dry run. Deployment is a separate operational step.
