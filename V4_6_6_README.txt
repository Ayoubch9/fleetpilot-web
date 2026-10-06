MileVoxa Web v4.6.6 — Sign-Out Experience Feedback

NEW
- Public Beta sign-out feedback modal
- 1–5 emoji experience rating (required to submit)
- Quick feedback chips: Easy to use, Saved me time, Missing feature,
  Something confusing, Too many steps, Bug / issue
- Dynamic follow-up copy for low/high ratings and feature/bug selections
- Optional short comment
- Send Feedback -> thank-you -> automatic sign out
- Skip & Sign Out -> immediate sign out
- 7-day browser cooldown after submit or skip
- Automatic page context and approximate session duration
- Reuses existing authenticated /api/feedback and beta_feedback storage
- Backwards-compatible API fallback if the optional SQL migration is not yet applied
- Desktop modal + mobile bottom-sheet styling

SUPABASE
Run supabase_signout_feedback_v4_6_6.sql before production to store rating,
tags, feedback kind, app version and session duration as structured fields.
The feature still submits to the old schema if this additive migration has not
been applied, but structured fields will not be stored separately.

LOCAL TEST
rmdir /s /q .next
npm install
npm run typecheck
npm run test:action-center
npm run test:load-decision
npm run test:signout-feedback
npm run build

Do not run npm audit fix --force as part of this feature update.
