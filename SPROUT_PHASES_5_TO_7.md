# Sprout — Phases 5-7 (Post-MVP)

These phases come after the core MVP (Phases 0-4) is complete. Append them to `SPROUT_IMPLEMENTATION_PLAN.md` or keep as a companion doc. Same working rules apply: one phase per session, read the _context folder first, keep AI calls in Edge Functions, RLS on all tables, mobile-first.

**Important:** Phases 6 and 7 handle sensitive data about individual named children and (in 7) communication with parents. These are not ordinary feature phases. The "Considerations" sections in each are not optional reading — they must be resolved before building, not after.

---

## Phase 5 — Make Sprout an installable app (PWA)

**Status: DONE**
**Risk level: Low. Self-contained. Safe to build anytime.**

Goal: turn the deployed web app into a Progressive Web App so teachers can add it to their phone home screen and it behaves like a native app (own icon, full screen, no browser chrome).

### Tasks
1. Add a web app manifest (`manifest.json` / `manifest.webmanifest`) with the app name "Sprout," theme colors matching the design (warm neutral background, sage green), display mode `standalone`, and the correct start URL.
2. Create app icons in the required sizes (at minimum 192x192 and 512x512, plus a maskable icon). Use the Sprout sprout/leaf mark on the warm background for consistency with the landing page.
3. Add a service worker for basic PWA installability. Keep caching conservative — this app is highly dynamic and auth-gated, so do NOT aggressively cache authenticated data or API responses. A minimal service worker that satisfies installability without caching sensitive content is the goal. Prefer a well-supported approach (e.g. the Vite PWA plugin) over hand-rolling.
4. Add the iOS-specific meta tags so "Add to Home Screen" works well on iPhone/Safari (apple-touch-icon, status bar style, etc.).
5. Verify installability: the browser should offer an install/Add-to-Home-Screen prompt, and once installed the app should open full-screen with the Sprout icon.

### Done looks like
- On a phone, the browser offers "Add to Home Screen" / install.
- Installed, Sprout opens full screen with its own icon, no browser bar.
- Auth still works normally when launched from the home screen.
- No sensitive data is being cached offline in a way that could leak.

### Considerations
- Because the app is auth-gated and handles children's data, be deliberate about the service worker: installability yes, offline caching of private data no. If unsure, cache only the static app shell (HTML/CSS/JS), never API responses or images from the private photos bucket.

### Do NOT do yet
- No offline mode for actual data. No push notifications (that's a separate, larger effort with its own privacy implications).

---

## Phase 6 — Child-aware chat (context memory)

**Status: NOT STARTED**
**Risk level: Elevated. Stores behavioral notes about named children. Resolve Considerations before building.**

Goal: when a teacher asks the behavior chat about a specific child ("Mateo is having a hard time at drop-off"), Sprout recognizes the child, can use relevant prior context to personalize its guidance, and can save notes from the conversation back to that child's record for continuity.

This is what makes the chat meaningfully better than a generic assistant — it knows *this* child in *this* classroom. But it also changes what data Sprout stores.

### Considerations — RESOLVE THESE FIRST (before writing code)
1. **This introduces sensitive per-child data.** Until now Sprout stored first names only. This phase stores behavioral observations tied to a named child ("struggles at separation," "bit a peer on Tuesday"). Decide and document: how long are these notes kept? Can they be deleted? Who can see them (any classroom member? only the author?)?
2. **Safeguarding.** A teacher might type something that indicates a child-safety concern (abuse, neglect, injury). Sprout must NOT quietly store-and-move-on in a way that buries it. Decide how the system behaves if serious concerns surface — at minimum, the assistant should encourage the teacher to follow their center's safeguarding/escalation procedure, and this should be explicit in the system prompt.
3. **Accuracy and tone.** Notes about a child should be observational, not diagnostic. The system must never label a child with a condition or make clinical judgments. The system prompt must enforce this.
4. **Consent/awareness.** Directors (and likely parents, per center policy) should be aware Sprout stores notes about children. This is a product/policy decision to confirm, not just a technical one.

Do not begin implementation until 1-4 have clear answers written into DECISIONS.md.

### Tasks (once Considerations are resolved)
1. Create a `child_notes` table: `id`, `child_id` (FK to children), `classroom_id`, `created_by`, `note` (text), `source` ('chat' | 'manual'), `created_at`. RLS: only classroom members can see/write notes for children in their classrooms — same membership pattern as every other table.
2. In the chat UI, let the teacher optionally associate a message/conversation with a specific child from the current classroom roster (e.g. a "who is this about?" selector). Keep it optional — general questions still work.
3. When a child is selected, the `chat` Edge Function includes that child's relevant existing notes as context in the prompt, so guidance is personalized. Keep the added context minimal and relevant.
4. Update the chat system prompt to: stay observational not diagnostic, never label children clinically, and explicitly direct the teacher to their center's escalation procedure if a safeguarding concern appears.
5. Optionally let the teacher save a short note from the conversation to the child's record (with their review — not automatic).

### Done looks like
- Asking about Mateo pulls in prior context and gives more specific guidance.
- Notes are observational, never diagnostic.
- Notes are RLS-protected exactly like other child data.
- The assistant appropriately redirects safeguarding concerns to the center's procedure.

### Do NOT do yet
- No sharing anything with parents — that is Phase 7 and must be a separate, deliberate step.

---

## Phase 7 — Sharing guidance with parents

**Status: NOT STARTED**
**Risk level: High. Crosses the "no parent interface" product boundary and involves communication about a child with that child's family. Resolve Considerations before building.**

Goal: let a teacher share supportive guidance or an update about a child with that child's parents, so the same approach is used at home and at daycare.

This is the most strategically significant and most sensitive feature in Sprout. It is powerful (closes the home/daycare loop) but it deliberately crosses a line you drew early ("teacher-facing only, complements Brightwheel, no parent interface"). Cross it on purpose or not at all.

### Considerations — RESOLVE THESE FIRST (before writing code)
1. **Product boundary.** This changes Sprout from a teacher tool into something that also talks to parents. Confirm this is intended and update VISION.md / DECISIONS.md if so. Revisit the Brightwheel positioning — does Sprout send directly, or format content for the teacher to paste into their existing parent-comms tool? The paste-into-existing-tool path is far lower risk and may be the right MVP of this idea.
2. **Teacher review is mandatory.** Nothing AI-generated about a child should ever be sent to a parent automatically. The teacher must review and explicitly approve every message before it leaves. Design for this as a hard requirement.
3. **Liability and tone.** AI-generated developmental guidance about a specific child, sent to their family, carries real risk if wrong or upsetting. Guidance must be framed as supportive suggestions, never as assessment or diagnosis. Consider whether the director must approve this channel existing at all.
4. **Center policy.** Most childcare centers have strict rules about how and when staff communicate with parents. This feature must fit within those rules, which vary by center. This likely needs to be configurable or director-gated.
5. **Data leaving the system.** Once something is shared with a parent, it has left Sprout's controlled environment. Be deliberate about what can be shared and keep a record of what was sent.

Do not begin implementation until 1-5 have clear answers written into DECISIONS.md. Strongly consider building the lowest-risk version first (format-for-teacher-to-share, with mandatory review) before anything that sends directly.

### Tasks (once Considerations are resolved — lowest-risk version)
1. Let a teacher take guidance from a child-aware chat (Phase 6) and generate a parent-friendly version: warm, plain-language, supportive, non-diagnostic. Via an Edge Function with a system prompt tuned for parent-facing tone.
2. Show the teacher the drafted parent message for MANDATORY review and editing before anything happens. Nothing is shared without an explicit teacher action.
3. Lowest-risk delivery: give the teacher a clean, copyable message to paste into their existing parent-comms channel (Brightwheel, email, etc.). Do NOT build direct-send in the first version.
4. Keep a record (a `parent_shares` table) of what was shared, about which child, by whom, and when — RLS-protected like all child data.

### Done looks like
- A teacher can turn in-app guidance into a warm, parent-appropriate message.
- The teacher must review and approve before anything is shareable.
- The first version outputs copyable text for existing channels, not auto-send.
- A record exists of what was shared.

### Considerations for any future "direct send"
- Only after the copy-to-share version is validated with real teachers/directors should direct sending even be considered, and only with director gating, delivery records, and clear center-policy fit.

---

## Suggested order and honest advice

- **Phase 5 (PWA)** is safe and satisfying — do it whenever.
- **Phase 6 (child memory)** is genuinely valuable but is the point where Sprout starts holding sensitive records about children. Do the Considerations work first; it's a product/policy decision as much as a technical one.
- **Phase 7 (parent sharing)** is the big one. Strongly consider validating Sprout with real teachers and at least one director *before* building it — they'll tell you whether this is wanted and what their policies allow. Build the copy-to-share version, not direct-send, first.

The theme across all three: the further you go, the less the hard part is code and the more it's judgment about privacy, consent, and the boundary of what Sprout should do with information about children. That judgment is exactly what will make Sprout trustworthy to the directors who'd actually buy it.
