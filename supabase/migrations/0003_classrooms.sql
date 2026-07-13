-- Phase 2: classrooms, classroom_members, children
-- Run this in the Supabase SQL editor for your project.

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age_group text not null,
  director_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.classroom_members (
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role_in_classroom text not null default 'teacher',
  created_at timestamptz not null default now(),
  primary key (classroom_id, user_id)
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  first_name text not null,
  created_at timestamptz not null default now()
);

alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;
alter table public.children enable row level security;

-- A user can see a classroom if they are a member of it.
create policy "Members can view their classrooms"
  on public.classrooms for select
  using (
    exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = classrooms.id
        and classroom_members.user_id = auth.uid()
    )
  );

create policy "Users can create classrooms"
  on public.classrooms for insert
  with check (auth.uid() = director_id);

-- A user can see classroom_members rows for classrooms they belong to.
create policy "Members can view their classroom membership"
  on public.classroom_members for select
  using (
    exists (
      select 1 from public.classroom_members as cm
      where cm.classroom_id = classroom_members.classroom_id
        and cm.user_id = auth.uid()
    )
  );

create policy "Users can add themselves as a classroom member"
  on public.classroom_members for insert
  with check (auth.uid() = user_id);

create policy "Members can view children in their classrooms"
  on public.children for select
  using (
    exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = children.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );

create policy "Members can add children to their classrooms"
  on public.children for insert
  with check (
    exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = children.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );

create policy "Members can remove children from their classrooms"
  on public.children for delete
  using (
    exists (
      select 1 from public.classroom_members
      where classroom_members.classroom_id = children.classroom_id
        and classroom_members.user_id = auth.uid()
    )
  );
