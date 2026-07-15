-- Phase 4: photo_updates table + private storage bucket for photos
-- Run this in the Supabase SQL editor for your project.

create table if not exists public.photo_updates (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  caption text,
  tagged_children_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.photo_updates enable row level security;

create policy "Members can view photo updates in their classrooms"
  on public.photo_updates for select
  using (
    exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = photo_updates.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );

create policy "Members can create photo updates in their classrooms"
  on public.photo_updates for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = photo_updates.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );

-- Private storage bucket for classroom photos. Objects are stored at
-- "<classroom_id>/<filename>" so RLS can scope access by classroom
-- membership using the first path segment.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "Members can view photos in their classrooms"
  on storage.objects for select
  using (
    bucket_id = 'photos'
    and exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = (storage.foldername(name))[1]::uuid
        and classroom_members.user_id = auth.uid()
    )
  );

create policy "Members can upload photos to their classrooms"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = (storage.foldername(name))[1]::uuid
        and classroom_members.user_id = auth.uid()
    )
  );
