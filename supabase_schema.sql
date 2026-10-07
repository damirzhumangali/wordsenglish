-- ====================================================================
-- VocabFlow - Supabase Database Schema
-- Complete schema with RLS policies, indexes, and tables
-- ====================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. User Profiles Table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text default 'Damir',
  avatar_url text,
  english_level text default 'B1' check (english_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'Not sure')),
  learning_reasons text[] default array['Daily English', 'IT / Programming'],
  daily_goal_words int default 15,
  daily_study_minutes int default 15,
  current_streak int default 1,
  longest_streak int default 1,
  last_active_date date default current_date,
  total_xp int default 1250,
  user_level int default 5,
  target_lang text default 'ru' check (target_lang in ('ru', 'kz', 'en')),
  sound_enabled boolean default true,
  animations_enabled boolean default true,
  dark_mode boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Categories Table
create table if not exists public.categories (
  id text primary key,
  name text not null,
  description text,
  icon text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Global Words Table
create table if not exists public.words (
  id text primary key,
  word text not null,
  translation_ru text not null,
  translation_kz text,
  definition text not null,
  example text not null,
  pronunciation text not null,
  part_of_speech text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1')),
  category_id text references public.categories(id) on delete set null,
  synonyms text[] default array[]::text[],
  antonyms text[] default array[]::text[],
  audio_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. User Words & Spaced Repetition (SRS)
create table if not exists public.user_words (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  word_id text references public.words(id) on delete cascade not null,
  status text default 'NEW' check (status in ('NEW', 'LEARNING', 'REVIEW', 'MASTERED')),
  difficulty numeric(3, 2) default 2.5, -- Ease factor (1.3 to 3.0)
  interval_days numeric(6, 2) default 0,
  correct_count int default 0,
  incorrect_count int default 0,
  review_count int default 0,
  last_reviewed_at timestamp with time zone,
  next_review_at timestamp with time zone default timezone('utc'::text, now()),
  memory_strength int default 0, -- 0 to 100 %
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, word_id)
);

-- 6. Learning Sessions Table
create table if not exists public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  accuracy numeric(5, 2) default 0,
  xp_earned int default 0,
  words_learned int default 0,
  words_reviewed int default 0,
  duration_seconds int default 0
);

-- 7. Session Answers (Detailed Question Log)
create table if not exists public.session_answers (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  word_id text references public.words(id) on delete cascade not null,
  question_type text not null, -- 'en_ru', 'ru_en', 'fill_gap', 'recall', 'word_match', 'sentence_builder', 'listening', 'speaking'
  user_answer text not null,
  correct_answer text not null,
  is_correct boolean not null,
  response_time_ms int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Achievements Definition Table
create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  xp_reward int default 50,
  category text default 'general',
  condition_type text not null,
  condition_value int not null
);

-- 9. User Achievements Table
create table if not exists public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id text references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, achievement_id)
);

-- 10. Favorites Table (convenience relation)
create table if not exists public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  word_id text references public.words(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, word_id)
);

-- Indexes for lightning fast queries
create index if not exists idx_user_words_user_status on public.user_words(user_id, status);
create index if not exists idx_user_words_next_review on public.user_words(user_id, next_review_at);
create index if not exists idx_session_answers_user on public.session_answers(user_id, is_correct);
create index if not exists idx_words_level on public.words(level);
create index if not exists idx_words_category on public.words(category_id);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.user_words enable row level security;
alter table public.sessions enable row level security;
alter table public.session_answers enable row level security;
alter table public.user_achievements enable row level security;
alter table public.favorites enable row level security;

-- Public can read words and categories
alter table public.words enable row level security;
alter table public.categories enable row level security;
alter table public.achievements enable row level security;

create policy "Words are readable by all authenticated and anon users" on public.words for select using (true);
create policy "Categories are readable by all" on public.categories for select using (true);
create policy "Achievements are readable by all" on public.achievements for select using (true);

-- User specific policies
create policy "Users can view and update their own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users can CRUD their own user_words" on public.user_words
  for all using (auth.uid() = user_id);

create policy "Users can CRUD their own sessions" on public.sessions
  for all using (auth.uid() = user_id);

create policy "Users can CRUD their own session answers" on public.session_answers
  for all using (auth.uid() = user_id);

create policy "Users can view and unlock achievements" on public.user_achievements
  for all using (auth.uid() = user_id);

create policy "Users can manage favorites" on public.favorites
  for all using (auth.uid() = user_id);
