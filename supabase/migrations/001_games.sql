-- Football Bingo — durable games (written from Next.js API with service role).
-- All tables use the football_bingo_ prefix.
-- Enable RLS; clients should not use the anon key for writes in v1.

create extension if not exists "pgcrypto";

create table if not exists public.football_bingo_games (
  id uuid primary key default gen_random_uuid(),
  seed text not null,
  liveblocks_room_id text,
  host_clerk_user_id text,
  settings jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.football_bingo_game_participants (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.football_bingo_games (id) on delete cascade,
  clerk_user_id text,
  display_name text,
  finished_at timestamptz,
  final_rank int,
  created_at timestamptz not null default now()
);

create index if not exists football_bingo_game_participants_game_id_idx on public.football_bingo_game_participants (game_id);
create index if not exists football_bingo_games_liveblocks_room_id_idx on public.football_bingo_games (liveblocks_room_id);

alter table public.football_bingo_games enable row level security;
alter table public.football_bingo_game_participants enable row level security;

-- No direct anon access; use Supabase Dashboard or service role from API.
create policy "football_bingo_games_service_only"
  on public.football_bingo_games for all
  using (false)
  with check (false);

create policy "football_bingo_game_participants_service_only"
  on public.football_bingo_game_participants for all
  using (false)
  with check (false);

-- To open read access for signed-in users later, replace policies with e.g.:
-- create policy "football_bingo_participants_read_own" on public.football_bingo_game_participants
--   for select using (auth.jwt()->>'sub' = clerk_user_id);

comment on table public.football_bingo_games is 'Persisted game sessions; inserts from Next API using service role.';
comment on table public.football_bingo_game_participants is 'Per-player results; optional clerk_user_id for signed-in users.';
