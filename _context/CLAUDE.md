# Sprout — Project Context for Claude

When I say "I want to work on Sprout" or "let's work on sprout-app", read this file first, then read the other files in this `_context` folder AND `SPROUT_IMPLEMENTATION_PLAN.md` at the repo root before doing anything else.

## What this project is

Sprout is an AI-powered classroom assistant for nursery/daycare teachers. It reduces documentation burden, supports teachers in the moment with expert guidance, and builds institutional knowledge over time. It is teacher-facing — there is NO parent interface. Parents receive updates through existing tools like Brightwheel; that integration is out of scope for the MVP.

Full product context is in `SPROUT_PRODUCT_BRIEF.md`. The build plan is in `SPROUT_IMPLEMENTATION_PLAN.md`.


## Tech stack (decided — do not change without discussion)
- React + Vite (frontend)
- Mobile-first: all UI is designed for phone use first, desktop second. Touch-friendly, narrow-viewport layouts.
- Supabase (Postgres database, Auth, Storage, Edge Functions)
- Anthropic Claude API — called ONLY from Supabase Edge Functions, never the browser
- Model: `claude-sonnet-4-6` for runtime AI calls
- Styling: warm neutrals + sage/terracotta, consistent with the Sprout landing page

## Critical security rules
- NEVER use `dangerouslyAllowBrowser`. All Claude calls go through Edge Functions.
- The Anthropic API key lives ONLY as a Supabase secret. Never in frontend code, never committed.
- The Supabase anon key is fine in the browser. The service key is NOT — never expose it.
- Row Level Security (RLS) on every table holding classroom or child data.

## Child privacy rules (non-negotiable)
- Store first names only for children. No birthdates, no last names, no biometric data.
- NO facial recognition, ever — not for tagging, not for anything.
- Photo tagging is done by voice + manual roster tap, never by recognizing faces.

## How we work
- This project is built in phases, defined in `SPROUT_IMPLEMENTATION_PLAN.md`.
- Work ONE phase per session. Do not jump ahead to future phases.
- At the start of a session I'll tell you which phase we're on. Implement only that phase.
- When a phase is done, update its Status line in the plan to DONE and commit.
- Keep the planning/architecture thinking lightweight — the plan already exists, follow it.

## Project structure (target)
```
sprout-app/
  _context/                        ← you are here
  SPROUT_PRODUCT_BRIEF.md
  SPROUT_IMPLEMENTATION_PLAN.md
  src/
    lib/
      supabase.js                  ← Supabase client init
    components/                    ← UI components
    ...
  supabase/
    functions/                     ← Edge Functions (chat, generate-activities, draft-caption)
  .env                             ← never committed
  .env.example                     ← lists env var names only
```

## Current status
Check the Status lines in `SPROUT_IMPLEMENTATION_PLAN.md` to see which phase is next.
