-- Sport Team Manager — Postgres schema (Supabase)
-- sql/schema.sql (MySQL)-ийн Postgres хувилбар. Миграцийн төлөвлөгөөний дагуу:
--   * ENUM -> text + CHECK (Postgres enum нэмэхэд AЛTER TYPE шаардлагатай тул)
--   * users -> profiles (auth.users-тэй 1:1 биш, зөвхөн auth_user_id-ээр холбогддог —
--     login эрхгүй placeholder тоглогч/менежерийг дэмжихийн тулд)
--   * events.type-д 'game'-ийг нэмсэн (workload тооцоололд ашиглагддаг байсан ч
--     хуучин MySQL enum-д байхгүй байсан цоорхойг засав)
--   * events.rpe / duration_min-ийг эхнээсээ баганаар нэмсэн (runtime ALTER анти-паттерн арилгав)

create extension if not exists pgcrypto;

-- =====================
-- Профайл (auth.users-тэй сул холбоотой)
-- =====================
create table profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null, -- NULL = login эрхгүй (placeholder)
  name          text not null,
  email         text unique,
  phone         varchar(20),
  system_role   text not null default 'user' check (system_role in ('superadmin','user')),
  photo_url     text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- =====================
-- Клубууд
-- =====================
create table clubs (
  id          bigint generated always as identity primary key,
  name        text not null,
  description text,
  logo_url    text,
  active      boolean not null default true,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table club_members (
  id         bigint generated always as identity primary key,
  club_id    bigint not null references clubs(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       text not null default 'manager' check (role in ('manager','owner')),
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

-- =====================
-- Багууд
-- =====================
create table teams (
  id          bigint generated always as identity primary key,
  club_id     bigint not null references clubs(id) on delete cascade,
  name        text not null,
  description text,
  logo_url    text,
  active      boolean not null default true,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table team_members (
  id            bigint generated always as identity primary key,
  team_id       bigint not null references teams(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  role          text not null default 'player' check (role in ('coach','player')),
  jersey_number int,
  position      varchar(10),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (team_id, user_id)
);

-- =====================
-- Арга хэмжээ
-- =====================
create table events (
  id            bigint generated always as identity primary key,
  team_id       bigint references teams(id) on delete cascade,
  title         text not null,
  type          text not null default 'practice' check (type in ('practice','meeting','game','other')),
  date          date not null,
  time          time,
  location      text,
  description   text,
  rpe           smallint,
  duration_min  smallint,
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table event_attendance (
  id         bigint generated always as identity primary key,
  event_id   bigint not null references events(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  status     text default 'present' check (status in ('present','absent','late','excused')),
  notes      text,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table event_notes (
  id         bigint generated always as identity primary key,
  event_id   bigint not null references events(id) on delete cascade,
  content    text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =====================
-- Постууд
-- =====================
create table posts (
  id         bigint generated always as identity primary key,
  team_id    bigint references teams(id) on delete cascade,
  title      text not null,
  content    text,
  type       text default 'news' check (type in ('news','video','file','scout')),
  file_url   text,
  file_name  text,
  video_url  text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table post_views (
  id        bigint generated always as identity primary key,
  post_id   bigint not null references posts(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- =====================
-- Push subscriptions
-- =====================
create table push_subscriptions (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, auth)
);

-- =====================
-- Индексүүд (сонголттой query-нүүдэд)
-- =====================
create index idx_teams_club_id on teams(club_id);
create index idx_events_team_id_date on events(team_id, date);
create index idx_posts_team_id on posts(team_id);
create index idx_club_members_user_id on club_members(user_id);
create index idx_team_members_user_id on team_members(user_id);

-- =====================
-- RLS: бүх хүснэгтэд идэвхжүүлнэ, гэхдээ policy нэмэхгүй.
-- Эрхийн шалгалт нь application-layer (lib/auth.ts, Server Action/Route Handler)
-- дээр хийгдэнэ; server код service-role key ашиглаж RLS-ийг тойрно.
-- Ингэснээр anon/authenticated (browser) түлхүүрээр шууд query хийхэд default-аар
-- юу ч буцахгүй — санамсаргүй мэдээлэл алдагдахаас хамгаална.
-- =====================
alter table profiles          enable row level security;
alter table clubs             enable row level security;
alter table club_members      enable row level security;
alter table teams             enable row level security;
alter table team_members      enable row level security;
alter table events            enable row level security;
alter table event_attendance  enable row level security;
alter table event_notes       enable row level security;
alter table posts             enable row level security;
alter table post_views        enable row level security;
alter table push_subscriptions enable row level security;
