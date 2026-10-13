"use client";

import { useSyncExternalStore } from "react";
import { openBetaFeedback } from "@/components/beta-feedback-center";

const DISMISS_KEY = "milevoxa_beta_settlement_feedback_dismissed_v1";

function subscribeDismissal(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("milevoxa:beta-dismissed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("milevoxa:beta-dismissed", callback);
  };
}
function readVisibility() {
  try { return window.localStorage.getItem(DISMISS_KEY) !== "1"; } catch { return true; }
}

export default function BetaMilestonePrompt({ show }: { show: boolean }) {
  const visible = useSyncExternalStore(subscribeDismissal, readVisibility, () => false);

  if (!show || !visible) return null;

  return (
    <div className="fp-beta-milestone-prompt">
      <div>
        <span>PUBLIC BETA</span>
        <strong>How is MileVoxa working for you?</strong>
        <p>Share your experience and help us improve.</p>
      </div>
      <div>
        <button type="button" onClick={() => openBetaFeedback("Weekly Settlement milestone")}>Share Feedback</button>
        <button type="button" className="dismiss" onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, "1");
          window.dispatchEvent(new Event("milevoxa:beta-dismissed"));
        }}>Dismiss</button>
      </div>
    </div>
  );
}
