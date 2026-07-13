-- Phase 2 fix: remove recursive RLS policy, auto-add the creator as a
-- classroom member via trigger so the classrooms select policy can see it.
-- Run this in the Supabase SQL editor for your project.

-- 1. Replace the recursive classroom_members select policy.
-- The old policy queried classroom_members from within its own USING
-- clause (aliased as "cm"), which Postgres evaluates recursively for
-- every row and errors out. A user only ever needs to see their own
-- membership rows, so check user_id directly instead.
drop policy if exists "Members can view their classroom membership" on public.classroom_members;

create policy "Users can view their own classroom membership"
  on public.classroom_members for select
  using (auth.uid() = user_id);

-- 2. Auto-create the classroom_members row when a classroom is created,
-- so the creator immediately satisfies the classrooms select policy
-- (which requires membership) without a separate client-side insert.
create or replace function public.handle_new_classroom()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.classroom_members (classroom_id, user_id, role_in_classroom)
  values (new.id, new.director_id, 'teacher');
  return new;
end;
$$;

drop trigger if exists on_classroom_created on public.classrooms;

create trigger on_classroom_created
  after insert on public.classrooms
  for each row execute function public.handle_new_classroom();
