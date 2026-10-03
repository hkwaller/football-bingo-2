-- Football Bingo - delete everything stored about one Clerk user (App Store
-- rule 5.1.1(v), account deletion in the app). Service role only, called from
-- /api/delete-account where the id comes from Clerk, never the request.
--
-- Solo and Tenable results are the player's own and are deleted. Room games
-- keep their rows for the other players, with this player's id and name
-- stripped from their participant row and the host id cleared.

create or replace function public.football_bingo_delete_identity(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  solo_deleted int;
  tenable_deleted int;
  rooms_scrubbed int;
  hosts_cleared int;
begin
  if p_id is null or p_id = '' then
    raise exception 'invalid id';
  end if;

  delete from public.football_bingo_solo_results where clerk_user_id = p_id;
  get diagnostics solo_deleted = row_count;

  delete from public.football_bingo_tenable_results where clerk_user_id = p_id;
  get diagnostics tenable_deleted = row_count;

  update public.football_bingo_game_participants
     set clerk_user_id = null, display_name = null
   where clerk_user_id = p_id;
  get diagnostics rooms_scrubbed = row_count;

  update public.football_bingo_games
     set host_clerk_user_id = null
   where host_clerk_user_id = p_id;
  get diagnostics hosts_cleared = row_count;

  return jsonb_build_object(
    'solo_deleted', solo_deleted,
    'tenable_deleted', tenable_deleted,
    'rooms_scrubbed', rooms_scrubbed,
    'hosts_cleared', hosts_cleared
  );
end;
$$;

revoke all on function public.football_bingo_delete_identity(text) from public, anon, authenticated;
grant execute on function public.football_bingo_delete_identity(text) to service_role;
