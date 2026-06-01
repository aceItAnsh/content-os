-- Supabase SQL Migration for Content OS
-- Run this in the Supabase SQL Editor

-- Content Cards table
create table public.content_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  platform text not null check (platform in ('instagram', 'youtube')),
  status text not null default 'idea' check (status in ('idea', 'scripted', 'filmed', 'edited', 'posted')),
  scheduled_date date,
  notes text,
  script text,
  hook text,
  priority text not null default 'normal' check (priority in ('high', 'normal')),
  post_url text,
  checklist jsonb not null default '{"script_written":false,"hook_chosen":false,"filmed":false,"edited":false,"caption_ready":false,"posted":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AI Runs table
create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  run_type text not null check (run_type in ('scrape', 'validate', 'script', 'hooks', 'full_pipeline')),
  topic text not null,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Voice Samples table
create table public.voice_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.content_cards enable row level security;
alter table public.ai_runs enable row level security;
alter table public.voice_samples enable row level security;

-- RLS Policies for content_cards
create policy "Users can view own cards" on public.content_cards
  for select using (auth.uid() = user_id);
create policy "Users can insert own cards" on public.content_cards
  for insert with check (auth.uid() = user_id);
create policy "Users can update own cards" on public.content_cards
  for update using (auth.uid() = user_id);
create policy "Users can delete own cards" on public.content_cards
  for delete using (auth.uid() = user_id);

-- RLS Policies for ai_runs
create policy "Users can view own runs" on public.ai_runs
  for select using (auth.uid() = user_id);
create policy "Users can insert own runs" on public.ai_runs
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own runs" on public.ai_runs
  for delete using (auth.uid() = user_id);

-- RLS Policies for voice_samples
create policy "Users can view own samples" on public.voice_samples
  for select using (auth.uid() = user_id);
create policy "Users can insert own samples" on public.voice_samples
  for insert with check (auth.uid() = user_id);
create policy "Users can update own samples" on public.voice_samples
  for update using (auth.uid() = user_id);
create policy "Users can delete own samples" on public.voice_samples
  for delete using (auth.uid() = user_id);

-- Updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for content_cards updated_at
create trigger on_content_card_updated
  before update on public.content_cards
  for each row execute function public.handle_updated_at();

-- Indexes for performance
create index idx_content_cards_user_id on public.content_cards(user_id);
create index idx_content_cards_status on public.content_cards(status);
create index idx_content_cards_scheduled_date on public.content_cards(scheduled_date);
create index idx_ai_runs_user_id on public.ai_runs(user_id);
create index idx_ai_runs_run_type on public.ai_runs(run_type);
create index idx_voice_samples_user_id on public.voice_samples(user_id);
