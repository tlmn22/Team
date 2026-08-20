-- api/clubs.php?action=create_manager / api/teams.php?action=create_member-ийн орлого:
-- profile (login эрхгүй placeholder) + membership мөрийг нэг transaction-д атомик үүсгэнэ.
-- Утасны дугаараар давхардал шалгаж, байвал шинээр үүсгэлгүй хуучин profile-ыг ашиглана.

create or replace function create_club_manager(
  p_club_id bigint,
  p_name text,
  p_phone text,
  p_role text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if p_role not in ('manager', 'owner') then
    raise exception 'Invalid club role: %', p_role;
  end if;

  if p_phone is not null and p_phone <> '' then
    select id into v_user_id from profiles where phone = p_phone limit 1;
  end if;

  if v_user_id is null then
    insert into profiles (name, phone) values (p_name, nullif(p_phone, ''))
    returning id into v_user_id;
  end if;

  insert into club_members (club_id, user_id, role)
  values (p_club_id, v_user_id, p_role)
  on conflict (club_id, user_id) do update set role = excluded.role;

  return v_user_id;
end;
$$;

create or replace function create_team_member(
  p_team_id bigint,
  p_name text,
  p_phone text,
  p_role text,
  p_jersey_number int,
  p_position text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if p_role not in ('coach', 'player') then
    raise exception 'Invalid team role: %', p_role;
  end if;

  if p_phone is not null and p_phone <> '' then
    select id into v_user_id from profiles where phone = p_phone limit 1;
  end if;

  if v_user_id is null then
    insert into profiles (name, phone) values (p_name, nullif(p_phone, ''))
    returning id into v_user_id;
  end if;

  insert into team_members (team_id, user_id, role, jersey_number, position, active)
  values (p_team_id, v_user_id, p_role, p_jersey_number, p_position, true)
  on conflict (team_id, user_id) do update
    set role = excluded.role, jersey_number = excluded.jersey_number,
        position = excluded.position, active = true;

  return v_user_id;
end;
$$;
