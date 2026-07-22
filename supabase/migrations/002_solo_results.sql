-- Football Bingo - solo game results (written from Next.js API with service role).
-- One row per completed solo board. Powers per-user profile stats.
-- Uses the football_bingo_ prefix; RLS deny-all (reads go through the service role).

create table if not exists public.football_bingo_solo_results (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  seed text not null,
  play_mode text not null,
  board_size int not null,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  total_cells int not null default 0,
  duration_ms int,
  won boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists football_bingo_solo_results_user_idx
  on public.football_bingo_solo_results (clerk_user_id, created_at desc);

alter table public.football_bingo_solo_results enable row level security;

-- No direct anon access; profile reads use the service role from the Next API.
create policy "football_bingo_solo_results_service_only"
  on public.football_bingo_solo_results for all
  using (false)
  with check (false);

comment on table public.football_bingo_solo_results is 'Per-user solo game results; inserts from Next API using service role.';
