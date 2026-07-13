# Sprout — Implementation Plan

This is the master build plan for the Sprout app. It is written to be handed to Claude Code (Fable 5) one phase at a time. Each phase is self-contained: it states what to build, what "done" looks like, and what NOT to touch yet.

**How to use this doc across sessions:**
At the start of a Claude Code session, say: "Read SPROUT_IMPLEMENTATION_PLAN.md and the _context folder. We are on Phase X. Implement only Phase X." When a phase is done, update the Status line for that phase to `DONE` and commit.

---

## Product summary

Sprout is an AI-powered classroom assistant for nursery/daycare teachers. It reduces documentation burden, supports teachers in the moment, and builds institutional knowledge. Full context is in `SPROUT_PRODUCT_BRIEF.md`.

**This app is teacher-facing.** There is no parent interface. Parents receive updates through existing tools (e.g. Brightwheel) — that integration is out of scope for the MVP.

---

## Tech stack (decided — do not change without discussion)

- **Frontend:** React + Vite (matches existing experience)
- **Backend/data:** Supabase (Postgres database, Auth, Storage, Edge Functions)
- **AI:** Anthropic Claude API, called **only** from Supabase Edge Functions — never from the browser. The API key lives as a Supabase secret, never in frontend code and never in a committed file.
- **Styling:** Reuse the warm-neutral + sage/terracotta design language from the Sprout landing page for visual consistency.
- **Model:** `claude-sonnet-4-6` for the app's runtime AI calls unless a phase says otherwise.

**Security rule that differs from toddler-toolkit:** toddler-toolkit used `dangerouslyAllowBrowser: true`. Sprout must NOT do this. All Claude calls go through Edge Functions so the key is never exposed.

---

## Data model (target — built incrementally across phases)

Do not create all of this in Phase 0. Each phase creates only the tables it needs. This is the destination.

- **users** (handled by Supabase Auth) — teachers and directors
- **profiles** — app-level user info: `id` (FK to auth user), `full_name`, `role` ('teacher' | 'director'), `created_at`
- **classrooms** — `id`, `name`, `age_group`, `director_id`, `created_at`
- **classroom_members** — join table: `classroom_id`, `user_id`, `role_in_classroom`
- **children** — `id`, `classroom_id`, `first_name`, `created_at` (first name only; minimize stored PII)
- **chat_messages** — `id`, `user_id`, `role` ('user' | 'assistant'), `content`, `created_at`
- **activities** — `id`, `classroom_id`, `created_by`, `inputs_json`, `output_json`, `rating`, `created_at`
- **photo_updates** — `id`, `classroom_id`, `created_by`, `storage_path`, `caption`, `tagged_children_json`, `created_at`

---

## Phase 0 — Foundation (no features)

**Status: DONE**

Goal: stand up the skeleton everything else depends on. No product features yet. When this phase is done, a teacher can create an account, log in, log out, and see an empty authenticated home screen.

### Tasks
1. Initialize a fresh React + Vite project in the repo (if not already present).
2. Install and configure the Supabase JS client. Create a `src/lib/supabase.js` that initializes the client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables. (The anon key is safe for the browser — it is not the service key and not the Anthropic key.)
3. Set up Supabase Auth with email/password sign up and login.
4. Create the `profiles` table with a row automatically created on signup (via a Supabase trigger or a post-signup insert). Fields: `id`, `full_name`, `role` (default 'teacher'), `created_at`.
5. Build these screens:
   - Sign up (name, email, password)
   - Log in (email, password)
   - A bare authenticated "Home" screen that shows the logged-in user's name and a Log out button.
6. Implement route protection: unauthenticated users can only reach login/signup; authenticated users land on Home.
7. Add a `.env.example` file listing the required env var NAMES (no values). Confirm `.env` is gitignored.

### Done looks like
- I can sign up, get logged in, refresh the page and stay logged in, and log out.
- A `profiles` row exists for my account.
- No Anthropic key anywhere in the frontend.

### Do NOT do yet
- No chat, no classrooms, no children, no photos. Foundation only.

---

## Phase 1 — Behavior & Development Chat

**Status: DONE**

Goal: a logged-in teacher can chat with an early-childhood-expert assistant. This phase also establishes the secure Edge Function pattern for all future AI calls.

### Tasks
1. Create a Supabase Edge Function named `chat`. It:
   - Receives the conversation history from the client.
   - Reads the Anthropic API key from a Supabase secret (`ANTHROPIC_API_KEY`).
   - Calls the Claude API with a system prompt that frames the assistant as an experienced early childhood educator giving practical, in-the-moment, developmentally-grounded guidance for nursery teachers. It should be warm, concise, and practical, and should recommend escalating to a supervisor or specialist when a situation is beyond general guidance (e.g. safeguarding concerns).
   - Returns the assistant's reply.
2. Create the `chat_messages` table so conversations persist per user.
3. Build a chat UI on the Home screen (or a dedicated Chat route): message list, input box, send button, loading state. Show full conversation history on load.
4. Persist each user message and assistant reply to `chat_messages`.

### Done looks like
- I can ask "a 2 year old keeps biting when frustrated, what should I do?" and get a practical, grounded answer.
- The Anthropic key is only in the Edge Function secret — never in the browser bundle.
- My chat history is still there after I refresh.

### Do NOT do yet
- No classroom context in the chat yet. It's a general assistant for now.

---

## Phase 2 — Classrooms & rosters

**Status: NOT STARTED**

Goal: structure the app around classrooms. A teacher can create a classroom, set its age group, and add children (first name only).

### Tasks
1. Create `classrooms`, `classroom_members`, and `children` tables.
2. Build classroom creation (name, age group).
3. Build a roster view: list children in a classroom, add a child (first name only), remove a child.
4. Add a classroom switcher if a user has more than one classroom.
5. Set up Supabase Row Level Security so users can only see classrooms they belong to and the children in them. (Important — do this properly, it's a real security boundary.)

### Done looks like
- I can create "Lions Room", set age group 2-3, add children by first name, and see them listed.
- I cannot see another user's classroom or children.

### Do NOT do yet
- Don't wire classroom context into chat or activities yet — that's polish for later.

---

## Phase 3 — Activity Generator

**Status: NOT STARTED**

Goal: port the toddler-toolkit activity generator into Sprout, upgraded with classroom context and history.

### Tasks
1. Create the `activities` table.
2. Create a Supabase Edge Function `generate-activities` (same secure pattern as `chat`).
3. Build the activity form: pull age group from the selected classroom automatically; inputs for energy level, time available, indoor/outdoor, supplies, and this week's theme/agenda.
4. Include recent activity history in the prompt so it avoids repeats.
5. Render the 3 activity results as cards (reuse the toddler-toolkit card pattern).
6. Let the teacher rate an activity (simple thumbs up/down or 1-5). Store the rating.

### Done looks like
- From within a classroom, I generate age-appropriate activities without re-entering the age.
- Activities I've recently generated aren't repeated.
- I can rate an activity and the rating is saved.

### Do NOT do yet
- Don't build the full "knowledge base" analytics yet — just capture the ratings for now.

---

## Phase 4 — Smart Photo Documentation

**Status: NOT STARTED**

Goal: the differentiator. Teacher snaps a photo, tags children fast, gets an AI-drafted caption, saves the update. This is the most complex phase — voice, image, and storage together — which is why it's last.

### Tasks
1. Create the `photo_updates` table and a Supabase Storage bucket for photos (private, RLS-protected).
2. Build photo capture (reuse the camera-capture input pattern from toddler-toolkit's World Explorer).
3. Tagging:
   - Primary: voice. Use the browser Web Speech API to capture spoken names, then match spoken text against the classroom roster (simple string match). No facial recognition — ever.
   - Fallback: show the roster as large tap buttons for manual tagging.
4. Create an Edge Function `draft-caption` that sends the photo plus context (activity, tagged children's first names) to Claude and returns a warm one or two sentence caption.
5. Review screen: show photo, tagged children, editable drafted caption, Save button.
6. On save, upload the photo to Storage and write the `photo_updates` row.

### Done looks like
- I snap a photo, say "Mateo and Sofia", both get tagged, a caption is drafted, I tweak it, and it saves.
- If voice fails, I can tap names instead.
- No facial recognition is used anywhere.

### Do NOT do yet
- Don't build the Brightwheel push. Saving inside Sprout is enough for the MVP.

---

## Phase 5+ — Later (not scoped in detail yet)

These are noted so they're not forgotten, but each will get its own detailed plan when we get there:
- Director dashboard (usage across classrooms, add/manage staff)
- Classroom Knowledge Base (turn captured ratings + notes into real institutional memory)
- Brightwheel or other parent-comms integration
- Classroom context woven into the chat assistant

---

## Working principles for every phase

- **One phase per session.** Don't let Fable wander ahead — it wastes tokens and creates drift.
- **Mobile-first always.** Teachers use this on a phone in the classroom. Design every screen for a narrow touch viewport first; desktop is secondary.
- **Keep AI calls in Edge Functions.** Never reintroduce `dangerouslyAllowBrowser`.
- **Minimize stored data about children.** First names only. No birthdates, no photos of faces used for recognition, no biometric data.
- **RLS is not optional.** Every table that holds classroom or child data needs Row Level Security so users only see their own.
- **Reuse the design language** from the landing page and toddler-toolkit for consistency.
- **Commit at the end of every working phase**, and update that phase's Status line to DONE.
