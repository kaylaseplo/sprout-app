-- Phase 3: activities table
-- Run this in the Supabase SQL editor for your project.

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  inputs_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  rating smallint,
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "Members can view activities in their classrooms"
  on public.activities for select
  using (
    exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = activities.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );

create policy "Members can create activities in their classrooms"
  on public.activities for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = activities.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );

create policy "Members can rate activities in their classrooms"
  on public.activities for update
  using (
    exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = activities.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = activities.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );
