-- Phase 6: child_notes table (child-aware chat context)
-- Run this in the Supabase SQL editor for your project.
--
-- Decisions this migration encodes (see _context/DECISIONS.md "Phase 6 decisions"):
--   - Visibility: any classroom member can read/write notes for children in
--     their classrooms (same membership pattern as every other table).
--   - Retention: notes auto-expire on a rolling 12-month window from
--     creation. Enforced two ways here: the select policy hides notes older
--     than 12 months even if the cron below hasn't run yet, and a daily
--     pg_cron job hard-deletes them so they don't linger indefinitely.
--   - Any classroom member can manually delete a note at any time (not just
--     the author) — supports care-team correction and parent deletion
--     requests.

create table if not exists public.child_notes (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  note text not null,
  source text not null default 'manual' check (source in ('chat', 'manual')),
  created_at timestamptz not null default now()
);

alter table public.child_notes enable row level security;

create policy "Members can view non-expired notes in their classrooms"
  on public.child_notes for select
  using (
    created_at >= now() - interval '12 months'
    and exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = child_notes.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );

create policy "Members can create notes in their classrooms"
  on public.child_notes for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = child_notes.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );

create policy "Members can delete notes in their classrooms"
  on public.child_notes for delete
  using (
    exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = child_notes.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );

-- Hard-delete notes past the 12-month retention window daily. If pg_cron
-- isn't available on this project, the select policy above still hides
-- expired notes from every client — this job just ensures they don't
-- persist indefinitely in storage.
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'delete-expired-child-notes',
  '0 3 * * *',
  $$ delete from public.child_notes where created_at < now() - interval '12 months' $$
);
