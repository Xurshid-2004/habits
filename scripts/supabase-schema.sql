-- Smart Habit Tracker (minimal schema for selections + daily logs)
-- Run inside Supabase SQL editor (schema: public)

-- 1) Selected habits per user
create table if not exists public.habit_selections (
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id bigint not null references public.habits (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, habit_id)
);

-- 2) Daily habit logs (done/not done) per date
create table if not exists public.habit_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id bigint not null references public.habits (id) on delete cascade,
  date date not null,
  -- status: not_done | in_progress | success
  status text not null default 'not_done' check (status in ('not_done','in_progress','success')),
  -- kept for backward-compat in app (success => true)
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id, date)
);

-- Migration helper (if table existed before):
-- alter table public.habit_logs add column if not exists status text not null default 'not_done';
-- alter table public.habit_logs add constraint if not exists habit_logs_status_check check (status in ('not_done','in_progress','success'));

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_habit_logs_updated_at on public.habit_logs;
create trigger trg_habit_logs_updated_at
before update on public.habit_logs
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.habit_selections enable row level security;
alter table public.habit_logs enable row level security;

-- Policies: only owner can read/write
drop policy if exists "habit_selections_owner" on public.habit_selections;
create policy "habit_selections_owner" on public.habit_selections
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "habit_logs_owner" on public.habit_logs;
create policy "habit_logs_owner" on public.habit_logs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

