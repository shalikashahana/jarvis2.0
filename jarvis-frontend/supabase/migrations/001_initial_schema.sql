-- JARVIS Voice Assistant — Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database.

-- Sessions table: one row per voice call
create table sessions (
  id uuid primary key default gen_random_uuid(),
  room_name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  title text
);

-- Messages table: each transcript segment (user or assistant)
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  role text check (role in ('user','assistant')) not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Index for efficient session transcript queries
create index on messages (session_id, created_at);

-- Enable Row Level Security
alter table sessions enable row level security;
alter table messages enable row level security;

-- Permissive policies for single-user / anon-key usage
-- ⚠️  Tighten these before any wider release (add auth checks)
create policy "Allow all on sessions" on sessions
  for all using (true) with check (true);

create policy "Allow all on messages" on messages
  for all using (true) with check (true);
