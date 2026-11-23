-- =====================================================================
-- 蝶舞香港 · ButterflyHK — Supabase 資料庫架構
-- Butterflies of Hong Kong Eco-Education Portal — Database Schema
-- =====================================================================
-- 執行方法 / How to run:
--   1. 打開 Supabase Dashboard → SQL Editor → New query
--   2. 貼上本檔案全部內容 → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles：使用者資料表（學生 / 教師）
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,          -- 學生暱稱 / teacher username
  display_name text not null,                 -- 顯示名稱
  role        text not null default 'student' check (role in ('student','teacher')),
  created_at  timestamptz not null default now()
);

comment on table public.profiles is '使用者資料：學生與教師 / User profiles for students and teachers';

-- ---------------------------------------------------------------------
-- 2. quiz_attempts：測驗記錄（分數 + 答錯題目）
-- ---------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  score       integer not null,               -- 答對題數 / correct answers
  total       integer not null,               -- 總題數 / total questions
  answers     jsonb not null,                 -- 每題作答明細 / per-question detail
  created_at  timestamptz not null default now()
);

comment on table public.quiz_attempts is '學生小測驗記錄：分數及答錯題目 / Student quiz attempts with score and wrong answers';

create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts(user_id);
create index if not exists quiz_attempts_created_at_idx on public.quiz_attempts(created_at desc);

-- ---------------------------------------------------------------------
-- 3. chat_messages：AI 導師對話記錄（教師可查看學生提問，作為輔導參考）
-- ---------------------------------------------------------------------
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  in_scope   boolean not null default true,    -- 是否在蝴蝶/生態範疇內
  created_at timestamptz not null default now()
);

comment on table public.chat_messages is 'AI 蝴蝶導師對話記錄 / AI butterfly tutor chat log';

create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);

-- ---------------------------------------------------------------------
-- 4. matching_scores：配對遊戲成績
-- ---------------------------------------------------------------------
create table if not exists public.matching_scores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  score      integer not null,
  total      integer not null,
  seconds    integer,
  created_at timestamptz not null default now()
);

comment on table public.matching_scores is '配對遊戲成績 / Matching game scores';

create index if not exists matching_scores_user_id_idx on public.matching_scores(user_id);

-- =====================================================================
-- 5. Row Level Security（列層安全）政策
--    原則：學生只可看自己的資料；教師可看所有學生的資料。
-- =====================================================================

alter table public.profiles       enable row level security;
alter table public.quiz_attempts  enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.matching_scores enable row level security;

-- 輔助函式：判斷目前登入者是否為教師
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- profiles：自己可讀寫；教師可讀全部；可建立自己的 profile
drop policy if exists "profiles_select_own_or_teacher" on public.profiles;
create policy "profiles_select_own_or_teacher" on public.profiles
  for select using (auth.uid() = id or public.is_teacher());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- quiz_attempts：學生只可看/寫自己的；教師可看全部；學生亦可讀自己的
drop policy if exists "quiz_select_own_or_teacher" on public.quiz_attempts;
create policy "quiz_select_own_or_teacher" on public.quiz_attempts
  for select using (auth.uid() = user_id or public.is_teacher());

drop policy if exists "quiz_insert_own" on public.quiz_attempts;
create policy "quiz_insert_own" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);

-- chat_messages：學生自己的 + 教師可看全部
drop policy if exists "chat_select_own_or_teacher" on public.chat_messages;
create policy "chat_select_own_or_teacher" on public.chat_messages
  for select using (auth.uid() = user_id or public.is_teacher());

drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);

-- matching_scores：學生自己的 + 教師可看全部
drop policy if exists "matching_select_own_or_teacher" on public.matching_scores;
create policy "matching_select_own_or_teacher" on public.matching_scores
  for select using (auth.uid() = user_id or public.is_teacher());

drop policy if exists "matching_insert_own" on public.matching_scores;
create policy "matching_insert_own" on public.matching_scores
  for insert with check (auth.uid() = user_id);

-- =====================================================================
-- 6. 自動建立 profile（註冊時觸發）
--    學生自助註冊 → role 固定為 'student'，教師帳號不會被自助註冊佔用。
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', '使用者'),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 7. 建立教師帳號的輔助腳本（手動執行 / 教師白名單）
--    ⚠ 請把 'TeacherPass123!' 換成你自己的密碼，並在執行後立即修改。
--    ⚠ username 請用你指定的教師帳號名稱。
-- =====================================================================
-- 執行以下 SQL（在 SQL Editor 執行一次）：
--
-- insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
--   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
-- select
--   (select instance_id from auth.users limit 1),
--   gen_random_uuid(), 'authenticated', 'authenticated',
--   'teacher@example.com', crypt('TeacherPass123!', gen_salt('bf')),
--   now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
-- where not exists (select 1 from auth.users where email = 'teacher@example.com');
--
-- insert into public.profiles (id, username, display_name, role)
-- select id, 'teacher01', '陳老師', 'teacher'
-- from auth.users where email = 'teacher@example.com'
-- on conflict (id) do nothing;
