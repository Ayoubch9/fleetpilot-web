"use client";

import { useEffect, useState } from "react";
import { openBetaFeedback } from "@/components/beta-feedback-center";

const DISMISS_KEY = "milevoxa_beta_settlement_feedback_dismissed_v1";

export default function BetaMilestonePrompt({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(window.localStorage.getItem(DISMISS_KEY) !== "1");
  }, [show]);

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
          setVisible(false);
        }}>Dismiss</button>
      </div>
    </div>
  );
}
