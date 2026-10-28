-- Normalize room identifiers on databases created before the room backend migration.
-- Fresh installations already use room_id in 001_games.sql.
do $$
declare
  previous_column text;
  previous_index text;
begin
  select column_name into previous_column
    from information_schema.columns
    where table_schema = 'public' and table_name = 'football_bingo_games'
      and column_name like '%\_room_id' escape '\' limit 1;
  if previous_column is not null and not exists (
    select 1 from information_schema.columns where table_schema = 'public'
      and table_name = 'football_bingo_games' and column_name = 'room_id'
  ) then
    execute format('alter table public.football_bingo_games rename column %I to room_id', previous_column);
  end if;
  select indexname into previous_index from pg_indexes
    where schemaname = 'public' and tablename = 'football_bingo_games'
      and indexname like '%\_room_id_idx' escape '\'
      and indexname <> 'football_bingo_games_room_id_idx' limit 1;
  if previous_index is not null then
    execute format('alter index public.%I rename to football_bingo_games_room_id_idx', previous_index);
  end if;
end $$;
