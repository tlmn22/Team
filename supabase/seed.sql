-- Demo/seed өгөгдөл — sql/schema.sql-ийн seed хэсгийн Postgres хувилбар.
-- Бүх demo хэрэглэгчийн нууц үг: password123
-- Анхаар: энэ файл зөвхөн dev/local орчинд `supabase db reset`-ээр ажиллана.

do $$
declare
  v_admin_auth   uuid := gen_random_uuid();
  v_manager_auth uuid := gen_random_uuid();
  v_owner_auth   uuid := gen_random_uuid();
  v_coach_auth   uuid := gen_random_uuid();
  v_p1_auth      uuid := gen_random_uuid();
  v_p2_auth      uuid := gen_random_uuid();
  v_p3_auth      uuid := gen_random_uuid();

  v_admin   uuid;
  v_manager uuid;
  v_owner   uuid;
  v_coach   uuid;
  v_p1      uuid;
  v_p2      uuid;
  v_p3      uuid;

  v_club1 bigint;
  v_club2 bigint;
  v_team1 bigint;
  v_team2 bigint;
  v_team3 bigint;
begin
  -- ---- auth.users (демо, бүгд password123) ----
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
    ('00000000-0000-0000-0000-000000000000', v_admin_auth,   'authenticated', 'authenticated', 'admin@sport.mn',     crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_manager_auth, 'authenticated', 'authenticated', 'manager@sport.mn',   crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_owner_auth,   'authenticated', 'authenticated', 'owner@sport.mn',     crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_coach_auth,   'authenticated', 'authenticated', 'coach@sport.mn',     crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_p1_auth,      'authenticated', 'authenticated', 'bilguun@sport.mn',   crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_p2_auth,      'authenticated', 'authenticated', 'ganzor@sport.mn',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_p3_auth,      'authenticated', 'authenticated', 'ankhbayar@sport.mn', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

  -- ---- profiles ----
  insert into profiles (auth_user_id, name, email, system_role, phone) values
    (v_admin_auth,   'Системийн Админ', 'admin@sport.mn',     'superadmin', '99000001') returning id into v_admin;
  insert into profiles (auth_user_id, name, email, system_role, phone) values
    (v_manager_auth, 'Менежер Бат',     'manager@sport.mn',   'user',       '99000002') returning id into v_manager;
  insert into profiles (auth_user_id, name, email, system_role, phone) values
    (v_owner_auth,   'Эзэн Дорж',       'owner@sport.mn',     'user',       '99000003') returning id into v_owner;
  insert into profiles (auth_user_id, name, email, system_role, phone) values
    (v_coach_auth,   'Дасгалжуулагч Г', 'coach@sport.mn',     'user',       '99000004') returning id into v_coach;
  insert into profiles (auth_user_id, name, email, system_role, phone) values
    (v_p1_auth,      'Билгүүн',         'bilguun@sport.mn',   'user',       '99000005') returning id into v_p1;
  insert into profiles (auth_user_id, name, email, system_role, phone) values
    (v_p2_auth,      'Ганзориг',        'ganzor@sport.mn',    'user',       '99000006') returning id into v_p2;
  insert into profiles (auth_user_id, name, email, system_role, phone) values
    (v_p3_auth,      'Анхбаяр',         'ankhbayar@sport.mn', 'user',       '99000007') returning id into v_p3;

  -- ---- clubs ----
  insert into clubs (name, description, created_by) values
    ('УБ Баскетбол Клуб',  'Монголийн тэргүүлэх баскетбол клуб', v_admin) returning id into v_club1;
  insert into clubs (name, description, created_by) values
    ('Эрдэнэт Спорт Клуб', 'Эрдэнэт хотын спортын клуб',        v_admin) returning id into v_club2;

  insert into club_members (club_id, user_id, role) values
    (v_club1, v_manager, 'manager'),
    (v_club1, v_owner,   'owner'),
    (v_club2, v_manager, 'manager');

  -- ---- teams ----
  insert into teams (club_id, name, description, created_by) values
    (v_club1, 'А баг', 'Үндсэн баг', v_manager) returning id into v_team1;
  insert into teams (club_id, name, description, created_by) values
    (v_club1, 'Б баг', 'Нөөц баг',   v_manager) returning id into v_team2;
  insert into teams (club_id, name, description, created_by) values
    (v_club2, 'Эрдэнэт А', 'Эрдэнэт клубын үндсэн баг', v_manager) returning id into v_team3;

  insert into team_members (team_id, user_id, role, jersey_number, position) values
    (v_team1, v_coach, 'coach',  null, null),
    (v_team1, v_p1,    'player', 7,    'PG'),
    (v_team1, v_p2,    'player', 11,   'SG'),
    (v_team2, v_coach, 'coach',  null, null),
    (v_team2, v_p3,    'player', 23,   'SF'),
    (v_team3, v_p1,    'player', 7,    'PG');

  -- ---- events ----
  insert into events (team_id, title, type, date, time, location, description, created_by) values
    (v_team1, 'Өглөөний бэлтгэл',       'practice', current_date + 1, '08:00', 'Үндэсний тамирын ордон', 'Стандарт өглөөний бэлтгэл', v_coach),
    (v_team1, 'Долоо хоногийн уулзалт', 'meeting',  current_date + 2, '14:00', 'Хурлын өрөө №1',         'Долоо хоногийн үнэлгээ',    v_coach),
    (v_team2, 'Орой бэлтгэл',           'practice', current_date + 3, '17:00', 'Үндэсний тамирын ордон', 'Халуун бэлтгэл',            v_coach);
end $$;
