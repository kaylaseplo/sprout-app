-- Phase 2 fix: allow a classroom's director to see it directly, so an
-- INSERT ... RETURNING (as used by supabase-js .insert().select()) can
-- read back the just-created row. The AFTER INSERT trigger that adds the
-- classroom_members row runs in the same statement, but RLS re-checks the
-- SELECT policy against a row set that isn't guaranteed to reflect it in
-- time for RETURNING, so directors need a membership-independent path.
-- Run this in the Supabase SQL editor for your project.

drop policy if exists "Members can view their classrooms" on public.classrooms;

create policy "Directors and members can view their classrooms"
  on public.classrooms for select
  using (
    auth.uid() = director_id
    or exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = classrooms.id
        and classroom_members.user_id = auth.uid()
    )
  );
