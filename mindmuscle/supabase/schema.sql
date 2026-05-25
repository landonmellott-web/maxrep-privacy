-- MindMuscle Database Schema
-- Run in Supabase SQL Editor

-- ─── Enable Extensions ────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- ─── Profiles ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  first_name        text not null default '',
  email             text not null default '',
  primary_motivator text check (primary_motivator in ('enforcer','igniter','visionary')),
  motivation_scores jsonb,
  goal_text         text,
  goal_category     text check (goal_category in ('Fitness','Career','Discipline','Mindset','Business','Recovery','Other')),
  preferred_time    text default '07:00',
  subscription_status text not null default 'free'
    check (subscription_status in ('free','trialing','active','past_due','canceled')),
  stripe_customer_id text unique,
  stripe_price_id    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- ─── Motivators ───────────────────────────────────────────────────────────
create table if not exists motivators (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  name         text not null,
  profile_type text not null check (profile_type in ('enforcer','igniter','visionary')),
  blend        jsonb not null default '{"enforcer":34,"igniter":33,"visionary":33}',
  intensity    smallint not null default 3 check (intensity between 1 and 5),
  goal_id      uuid,
  schedule     jsonb not null default '{"days":["daily"],"time":"07:00"}',
  is_active    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table motivators enable row level security;

create policy "Users manage own motivators"
  on motivators for all using (auth.uid() = user_id);

-- ─── Goals ────────────────────────────────────────────────────────────────
create table if not exists goals (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  category    text not null default 'Other'
    check (category in ('Fitness','Career','Discipline','Mindset','Business','Recovery','Other')),
  why         text not null default '',
  target_date date,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table goals enable row level security;

create policy "Users manage own goals"
  on goals for all using (auth.uid() = user_id);

-- ─── Habits ───────────────────────────────────────────────────────────────
create table if not exists habits (
  id         uuid primary key default uuid_generate_v4(),
  goal_id    uuid not null references goals(id) on delete cascade,
  title      text not null,
  frequency  jsonb not null default '"daily"',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table habits enable row level security;

create policy "Users manage habits via goals"
  on habits for all using (
    exists (
      select 1 from goals
      where goals.id = habits.goal_id
        and goals.user_id = auth.uid()
    )
  );

-- ─── Habit Logs ───────────────────────────────────────────────────────────
create table if not exists habit_logs (
  id         uuid primary key default uuid_generate_v4(),
  habit_id   uuid not null references habits(id) on delete cascade,
  date       date not null,
  completed  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

alter table habit_logs enable row level security;

create policy "Users manage habit logs via habits"
  on habit_logs for all using (
    exists (
      select 1 from habits
      join goals on goals.id = habits.goal_id
      where habits.id = habit_logs.habit_id
        and goals.user_id = auth.uid()
    )
  );

-- ─── Messages ─────────────────────────────────────────────────────────────
create table if not exists messages (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  content       text not null,
  motivator_ref text not null check (motivator_ref in ('enforcer','igniter','visionary')),
  delivered_at  timestamptz not null default now(),
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Users read own messages"
  on messages for select using (auth.uid() = user_id);

create policy "Users update own messages"
  on messages for update using (auth.uid() = user_id);

-- ─── Assessment Responses ─────────────────────────────────────────────────
create table if not exists assessment_responses (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  answers     jsonb not null,
  result      jsonb not null,
  taken_at    timestamptz not null default now()
);

alter table assessment_responses enable row level security;

create policy "Users manage own assessments"
  on assessment_responses for all using (auth.uid() = user_id);

-- ─── Push Subscriptions ───────────────────────────────────────────────────
create table if not exists push_subscriptions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles(id) on delete cascade,
  endpoint        text not null,
  p256dh          text not null,
  auth            text not null,
  created_at      timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on push_subscriptions for all using (auth.uid() = user_id);

-- ─── Stripe Webhook Helper ────────────────────────────────────────────────
-- Called by webhook edge function to update subscription status
create or replace function update_subscription_status(
  p_customer_id text,
  p_status text
) returns void language plpgsql security definer as $$
begin
  update profiles
  set subscription_status = p_status,
      updated_at = now()
  where stripe_customer_id = p_customer_id;
end;
$$;

-- ─── Auto-create Profile on Sign-up ──────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, first_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Indexes ──────────────────────────────────────────────────────────────
create index if not exists idx_motivators_user_id on motivators(user_id);
create index if not exists idx_motivators_active on motivators(user_id, is_active) where is_active = true;
create index if not exists idx_goals_user_id on goals(user_id);
create index if not exists idx_habits_goal_id on habits(goal_id);
create index if not exists idx_habit_logs_habit_date on habit_logs(habit_id, date);
create index if not exists idx_habit_logs_date on habit_logs(date);
create index if not exists idx_messages_user_id on messages(user_id);
create index if not exists idx_messages_delivered on messages(user_id, delivered_at desc);
