"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SignOutFeedbackDialog from "@/components/signout-feedback-dialog";

const FEEDBACK_COOLDOWN_KEY = "milevoxa_signout_feedback_next_v1";
const SESSION_START_KEY = "milevoxa_session_started_v1";
const FEEDBACK_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export default function SidebarSignOut({
  feedbackEnabled = true,
}: {
  feedbackEnabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pageContext, setPageContext] = useState("");
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    try {
      if (!window.sessionStorage.getItem(SESSION_START_KEY)) {
        window.sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
      }
    } catch {
      // Storage is an enhancement only; sign-out must always continue to work.
    }
  }, []);

  function getSessionSeconds() {
    try {
      const raw = window.sessionStorage.getItem(SESSION_START_KEY);
      const started = raw ? Number(raw) : Date.now();
      if (!Number.isFinite(started)) return 0;
      return Math.max(0, Math.round((Date.now() - started) / 1000));
    } catch {
      return 0;
    }
  }

  function feedbackOnCooldown() {
    try {
      const raw = window.localStorage.getItem(FEEDBACK_COOLDOWN_KEY);
      const next = raw ? Number(raw) : 0;
      return Number.isFinite(next) && Date.now() < next;
    } catch {
      return false;
    }
  }

  function startCooldown() {
    try {
      window.localStorage.setItem(
        FEEDBACK_COOLDOWN_KEY,
        String(Date.now() + FEEDBACK_COOLDOWN_MS)
      );
    } catch {
      // Never block sign-out if browser storage is unavailable.
    }
  }

  async function completeSignOut() {
    if (busy) return;

    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setBusy(false);
      window.alert(error.message);
      return;
    }

    try {
      window.sessionStorage.removeItem(SESSION_START_KEY);
    } catch {
      // Ignore storage cleanup errors.
    }

    window.location.href = "/login";
  }

  async function requestSignOut() {
    if (busy || feedbackOpen) return;

    if (!feedbackEnabled || feedbackOnCooldown()) {
      await completeSignOut();
      return;
    }

    setPageContext(window.location.pathname || "/");
    setSessionSeconds(getSessionSeconds());
    setFeedbackOpen(true);
  }

  async function skipAndSignOut() {
    startCooldown();
    setFeedbackOpen(false);
    await completeSignOut();
  }

  async function feedbackSubmittedAndSignOut() {
    startCooldown();
    setFeedbackOpen(false);
    await completeSignOut();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void requestSignOut()}
        disabled={busy}
        className="fp-sidebar-signout"
        aria-label="Sign out of MileVoxa"
      >
        <SignOutIcon />
        <span>{busy ? "Signing Out..." : "Sign Out"}</span>
      </button>

      <SignOutFeedbackDialog
        open={feedbackOpen}
        pageContext={pageContext}
        sessionSeconds={sessionSeconds}
        onSkip={skipAndSignOut}
        onSubmitted={feedbackSubmittedAndSignOut}
      />
    </>
  );
}

function SignOutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
      <path d="m15 8 4 4-4 4" />
      <path d="M9 12h10" />
    </svg>
  );
}
