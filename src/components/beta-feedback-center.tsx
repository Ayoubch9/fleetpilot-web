"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const CATEGORIES = ["Bug", "Suggestion", "Confusing experience", "Other"] as const;

export function openBetaFeedback(context?: string) {
  window.dispatchEvent(
    new CustomEvent("milevoxa:open-beta-feedback", {
      detail: { context: context || "" },
    })
  );
}

export function BetaFeedbackTrigger({
  className = "",
  label = "Send Feedback",
  context = "",
}: {
  className?: string;
  label?: string;
  context?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => openBetaFeedback(context)}
    >
      {label}
    </button>
  );
}

export default function BetaFeedbackCenter() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Suggestion");
  const [message, setMessage] = useState("");
  const [pageContext, setPageContext] = useState("");
  const [mayContact, setMayContact] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const listener = (event: Event) => {
      const custom = event as CustomEvent<{ context?: string }>;
      const context = custom.detail?.context || window.location.pathname;
      setPageContext(context);
      setStatus("");
      setOpen(true);
    };

    window.addEventListener("milevoxa:open-beta-feedback", listener);
    return () => window.removeEventListener("milevoxa:open-beta-feedback", listener);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, pageContext, mayContact }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Could not submit feedback.");
      }

      setStatus(payload?.message || "Feedback sent. Thank you.");
      setMessage("");
      setMayContact(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not submit feedback.");
    } finally {
      setBusy(false);
    }
  }

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div className="fp-beta-feedback-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <form className="fp-beta-feedback-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Send MileVoxa feedback">
        <header>
          <div>
            <span>PUBLIC BETA</span>
            <h2>Send Feedback</h2>
            <p>Tell us what worked, what was confusing, or what you want MileVoxa to improve.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close feedback form">×</button>
        </header>

        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number])}>
            {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>

        <label>
          Message
          <textarea
            rows={6}
            minLength={5}
            maxLength={5000}
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What happened, what did you expect, or what would make this workflow better?"
          />
        </label>

        <label>
          Page context <small>Optional</small>
          <input
            value={pageContext}
            maxLength={300}
            onChange={(event) => setPageContext(event.target.value)}
            placeholder="/settlement or a short note about where you were"
          />
        </label>

        <label className="fp-beta-feedback-contact">
          <input
            type="checkbox"
            checked={mayContact}
            onChange={(event) => setMayContact(event.target.checked)}
          />
          <span>
            <b>You may contact me about this feedback.</b>
            <small>Optional. This does not give MileVoxa permission to publish your feedback.</small>
          </span>
        </label>

        {status && <div className={`fp-beta-feedback-status ${status.startsWith("Thanks") || status.startsWith("Feedback sent") ? "success" : "error"}`}>{status}</div>}

        <footer>
          <button type="button" onClick={() => setOpen(false)}>Close</button>
          <button type="submit" className="primary" disabled={busy || message.trim().length < 5}>
            {busy ? "Sending..." : "Send Feedback"}
          </button>
        </footer>
      </form>
    </div>,
    window.document.body
  );
}
