-- Scope chat_messages to a classroom, so switching classrooms shows a
-- separate chat history instead of one continuous per-user conversation.
-- Run this in the Supabase SQL editor for your project.
--
-- classroom_id is nullable to preserve any existing messages saved before
-- this migration (they show up as "no classroom" history) and to support
-- chatting before a teacher has created/selected any classroom yet.

alter table public.chat_messages
  add column if not exists classroom_id uuid references public.classrooms (id) on delete cascade;

drop policy if exists "Users can view their own chat messages" on public.chat_messages;
drop policy if exists "Users can insert their own chat messages" on public.chat_messages;

-- Chat stays private to the author (matches the existing per-user model —
-- this is not shared with other classroom members like child_notes is).
-- The classroom-membership check is an added guard for classroom-tied rows:
-- a message with a classroom_id only shows up if the caller is still a
-- member of that classroom.
create policy "Users can view their own scoped chat messages"
  on public.chat_messages for select
  using (
    auth.uid() = user_id
    and (
      classroom_id is null
      or exists (
        select 1 from public.classroom_members
        where classroom_members.classroom_id = chat_messages.classroom_id
          and classroom_members.user_id = auth.uid()
      )
    )
  );

create policy "Users can insert their own scoped chat messages"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id
    and (
      classroom_id is null
      or exists (
        select 1 from public.classroom_members
        where classroom_members.classroom_id = chat_messages.classroom_id
          and classroom_members.user_id = auth.uid()
      )
    )
  );
