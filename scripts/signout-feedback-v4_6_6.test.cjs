const fs = require("fs");
const assert = require("assert");

const read = (p) => fs.readFileSync(p, "utf8");
const sidebar = read("src/components/sidebar-sign-out.tsx");
const dialog = read("src/components/signout-feedback-dialog.tsx");
const api = read("src/app/api/feedback/route.ts");
const css = read("src/app/globals.css");
const shell = read("src/components/app-shell.tsx");
const privacy = read("src/app/privacy/page.tsx");
const migration = read("supabase_signout_feedback_v4_6_6.sql");

const pass = (name, fn) => {
  fn();
  console.log(`PASS ${name}`);
};

pass("sign-out intercepts with feedback", () => {
  assert.ok(sidebar.includes("feedbackOnCooldown"));
  assert.ok(sidebar.includes("setFeedbackOpen(true)"));
  assert.ok(sidebar.includes("SignOutFeedbackDialog"));
});

pass("7-day cooldown after submit or skip", () => {
  assert.ok(sidebar.includes("7 * 24 * 60 * 60 * 1000"));
  assert.ok(sidebar.includes("startCooldown();"));
  assert.ok(sidebar.includes("skipAndSignOut"));
  assert.ok(sidebar.includes("feedbackSubmittedAndSignOut"));
});

pass("10-second feedback experience", () => {
  assert.ok(dialog.includes("Takes about 10 seconds"));
  assert.ok(dialog.includes("How was your experience today?"));
  assert.ok(dialog.includes("Skip &amp; Sign Out"));
  assert.ok(dialog.includes("Send Feedback"));
});

pass("rating, chips and dynamic prompts", () => {
  assert.ok(dialog.includes("Very poor"));
  assert.ok(dialog.includes("Excellent"));
  assert.ok(dialog.includes("Missing feature"));
  assert.ok(dialog.includes("Bug / issue"));
  assert.ok(dialog.includes("What went wrong?"));
  assert.ok(dialog.includes("What did you like most?"));
});

pass("feedback reuses existing authenticated API", () => {
  assert.ok(dialog.includes('fetch("/api/feedback"'));
  assert.ok(api.includes('.from("beta_feedback").insert'));
  assert.ok(api.includes("feedback_kind"));
  assert.ok(api.includes("session_seconds"));
});

pass("old feedback schema remains compatible", () => {
  assert.ok(api.includes("schemaLooksOld"));
  assert.ok(api.includes("baseInsert"));
});

pass("structured migration is additive", () => {
  assert.ok(migration.includes("add column if not exists rating"));
  assert.ok(migration.includes("add column if not exists feedback_tags"));
  assert.ok(migration.includes("add column if not exists feedback_kind"));
});

pass("responsive MileVoxa modal", () => {
  assert.ok(css.includes(".fp-signout-feedback-modal"));
  assert.ok(css.includes("@media(max-width:640px)"));
  assert.ok(css.includes("font-family:inherit"));
});

pass("public beta and privacy integration", () => {
  assert.ok(shell.includes("<SidebarSignOut feedbackEnabled={publicBeta} />"));
  assert.ok(privacy.includes("experience"));
  assert.ok(privacy.includes("approximate session duration"));
});
