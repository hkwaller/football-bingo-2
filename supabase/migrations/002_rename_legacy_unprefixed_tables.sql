-- One-time upgrade: if you applied an older 001 with `games` / `game_participants`,
-- rename them to the football_bingo_ prefix. Safe to skip if prefixed tables already exist.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'games'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'football_bingo_games'
  ) then
    alter table public.games rename to football_bingo_games;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'game_participants'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'football_bingo_game_participants'
  ) then
    alter table public.game_participants rename to football_bingo_game_participants;
  end if;
end $$;
