# Decisions

A running log of technical and product choices for Sprout and why.

## Product decisions

**Teacher-facing only, no parent interface**
Parents already live in tools like Brightwheel. Building a parent interface would multiply complexity and put Sprout in direct competition with established players. Sprout complements those tools instead. Parent-comms integration is deferred.

**Build real from the start (not frontend-only)**
Chose to build with real auth, database, and storage from Phase 0 rather than faking data first. Slower, but it means the app is real, and the foundational work doubles as the main learning goal.

**Start with the Behavior Chat as Phase 1**
It's the simplest feature to build, so the foundational plumbing (secure Edge Function pattern, message persistence) can be the focus rather than fighting feature complexity.

**Smart Photo Documentation is last (Phase 4)**
It's the differentiator but also the most complex — voice, image, and storage together. Building it last means the foundation is solid first.

## Technical decisions

**Mobile-first is a hard requirement**
Teachers use Sprout on their feet in the classroom, on a phone — not at a desk. Every screen must be designed mobile-first: touch-friendly tap targets, layouts that work on a narrow viewport, minimal typing where possible. Desktop is secondary. This applies to all phases going forward.

**Supabase over Firebase**
Supabase's Postgres foundation teaches more durable, transferable skills (relational data, SQL, RLS) and locks you in less than Firebase. It bundles auth, database, and storage in one service with a generous free tier.

**Claude calls go through Edge Functions, never the browser**
toddler-toolkit used `dangerouslyAllowBrowser: true`, which exposes the API key. That's acceptable for a personal toy but not for a real app with users. Edge Functions keep the Anthropic key server-side as a Supabase secret. This is a hard rule.

**Separate repo from the landing page**
`sprout-app` is separate from `sprout-landing`. Different dependencies, deploy settings, and lifecycles. Keeping them apart keeps each clean.

**First names only for children**
Minimize stored PII. No birthdates, last names, or biometric data. Reduces privacy risk and is the right thing to do for a product handling data about young children.

**No facial recognition, ever**
Facial recognition of minors is a legal minefield (COPPA, GDPR, state biometric laws like Illinois BIPA) and a dealbreaker for nursery adoption. Photo tagging uses voice + manual roster tap instead.

## Open questions
- Pricing model: per-classroom vs per-staff (decide before director dashboard)
- Whether to persist chat context per classroom or keep chat general
- Which speech-to-text approach for photo tagging: browser Web Speech API (free, less accurate) vs a hosted service — start with Web Speech API

## Phase 6 decisions (child-aware chat / notes)

**Note visibility:** Child behavioral notes are visible to all classroom members, matching the app's existing membership model and serving continuity of care (a substitute or co-teacher needs to know what helps a specific child). Flagged to confirm with a real nursery director, since center policies on record access vary.

**Retention:** Notes auto-expire on a rolling 12-month window from creation, AND can be manually deleted by classroom members at any time before that. Rationale: avoids accumulating a permanent dossier on a child; supports parent deletion requests.

**Safeguarding:** The chat system prompt directs teachers to follow their center's own safeguarding/escalation procedure when serious child-safety concerns surface. Sprout is a support tool and does not attempt to handle safeguarding itself.

**Observational, not diagnostic:** Notes and guidance describe observed behavior ("bit a peer when frustrated") and never diagnose, label, or make clinical judgments about a child. Enforced in the system prompt.
