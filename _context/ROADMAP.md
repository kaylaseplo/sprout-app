# Roadmap

The detailed, phase-by-phase build plan lives in `SPROUT_IMPLEMENTATION_PLAN.md`. This file is the quick status view.

## Done
- [x] Product brief written (`SPROUT_PRODUCT_BRIEF.md`)
- [x] Landing page built and deployed (separate `sprout-landing` repo)
- [x] Implementation plan written (`SPROUT_IMPLEMENTATION_PLAN.md`)
- [x] Context folder created

## Phases (see plan for detail)
- [ ] Phase 0 — Foundation (accounts, login, profiles table)
- [ ] Phase 1 — Behavior & Development Chat (first secure Edge Function)
- [ ] Phase 2 — Classrooms & rosters (with RLS)
- [ ] Phase 3 — Activity Generator (ported from toddler-toolkit + history)
- [ ] Phase 4 — Smart Photo Documentation (voice tag + AI caption)

## Later (not yet detailed)
- [ ] Director dashboard
- [ ] Classroom Knowledge Base
- [ ] Brightwheel / parent-comms integration
- [ ] Classroom context woven into chat

## Before building
- [ ] Create `sprout-app` GitHub repo
- [ ] Set up Supabase project (get URL + anon key)
- [ ] Get a fresh Anthropic API key for Sprout (stored as a Supabase secret, not in .env)

## Validation (parallel track, not code)
- [ ] Talk to 3-5 nursery directors/teachers — starting with Mateo's daycare — to confirm the pain is real
