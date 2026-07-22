-- Football Bingo - Tenable game results (written from Next.js API with service role).
-- One row per completed Tenable session. Powers per-user profile stats.
-- Uses the football_bingo_ prefix; RLS deny-all (reads go through the service role).

create table if not exists public.football_bingo_tenable_results (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  session_id text not null,
  categories_played int not null default 0,
  categories_cleared int not null default 0,
  answers_found int not null default 0,
  total_answers int not null default 0,
  lives_used int not null default 0,
  score int not null default 0,
  won boolean not null default false,
  duration_ms int,
  created_at timestamptz not null default now()
);

create index if not exists football_bingo_tenable_results_user_idx
  on public.football_bingo_tenable_results (clerk_user_id, created_at desc);

alter table public.football_bingo_tenable_results enable row level security;

-- No direct anon access; profile reads use the service role from the Next API.
create policy "football_bingo_tenable_results_service_only"
  on public.football_bingo_tenable_results for all
  using (false)
  with check (false);

comment on table public.football_bingo_tenable_results is 'Per-user Tenable game results; inserts from Next API using service role.';
