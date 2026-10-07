"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { trackEvent } from "@/lib/analytics";

const RATINGS = [
  { value: 1, emoji: "😕", label: "Very poor" },
  { value: 2, emoji: "😐", label: "Not great" },
  { value: 3, emoji: "🙂", label: "Okay" },
  { value: 4, emoji: "😄", label: "Good" },
  { value: 5, emoji: "🤩", label: "Excellent" },
] as const;

const TAGS = [
  "Easy to use",
  "Saved me time",
  "Missing feature",
  "Something confusing",
  "Too many steps",
  "Bug / issue",
] as const;

type Props = {
  open: boolean;
  pageContext: string;
  sessionSeconds: number;
  onSkip: () => Promise<void> | void;
  onSubmitted: () => Promise<void> | void;
};

function categoryFor(tags: string[], rating: number) {
  if (tags.includes("Bug / issue")) return "Bug";
  if (tags.includes("Something confusing") || tags.includes("Too many steps")) {
    return "Confusing experience";
  }
  if (tags.includes("Missing feature")) return "Suggestion";
  if (rating <= 2) return "Other";
  return "Suggestion";
}

export default function SignOutFeedbackDialog({
  open,
  pageContext,
  sessionSeconds,
  onSkip,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setRating(0);
      setTags([]);
      setMessage("");
      setBusy(false);
      setStatus("");
    }
  }, [open]);

  const prompt = useMemo(() => {
    if (tags.includes("Missing feature")) return "What feature would help you most?";
    if (tags.includes("Bug / issue")) return "What happened?";
    if (tags.includes("Something confusing")) return "What felt confusing?";
    if (rating > 0 && rating <= 2) return "What went wrong?";
    if (rating >= 4) return "What did you like most?";
    return "What could we improve?";
  }, [rating, tags]);

  const placeholder = useMemo(() => {
    if (tags.includes("Missing feature")) {
      return "Example: I wish MileVoxa could...";
    }
    if (tags.includes("Bug / issue")) {
      return "A short description is enough. We already include the page you were on.";
    }
    if (rating >= 4) {
      return "Optional — tell us what worked well.";
    }
    return "Optional — one sentence is enough.";
  }, [rating, tags]);

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!rating || busy) return;

    setBusy(true);
    setStatus("");

    try {
      const category = categoryFor(tags, rating);
      const fallbackMessage = `Sign-out experience rating: ${rating}/5${
        tags.length ? `. Tags: ${tags.join(", ")}` : ""
      }.`;

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim() || fallbackMessage,
          pageContext,
          mayContact: false,
          rating,
          tags,
          feedbackKind: "signout",
          sessionSeconds,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Could not send feedback.");
      }

      trackEvent("feedback_submitted", {
        feedback_kind: "signout",
        rating,
        tag_count: tags.length,
      });

      setStatus("Thanks — your feedback directly helps shape MileVoxa.");
      window.setTimeout(() => {
        void onSubmitted();
      }, 550);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not send feedback. You can still sign out."
      );
      setBusy(false);
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fp-signout-feedback-backdrop" role="presentation">
      <form
        className="fp-signout-feedback-modal"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fp-signout-feedback-title"
      >
        <div className="fp-signout-feedback-kicker">PUBLIC BETA</div>
        <h2 id="fp-signout-feedback-title">
          Before you go — help us improve MileVoxa
        </h2>
        <p className="fp-signout-feedback-intro">
          Takes about 10 seconds. Your feedback directly shapes what we improve next.
        </p>

        <fieldset className="fp-signout-feedback-rating">
          <legend>How was your experience today?</legend>
          <div>
            {RATINGS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={rating === item.value ? "selected" : ""}
                onClick={() => setRating(item.value)}
                aria-pressed={rating === item.value}
                aria-label={`${item.value} out of 5 — ${item.label}`}
                title={item.label}
              >
                <span aria-hidden="true">{item.emoji}</span>
                <small>{item.value}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="fp-signout-feedback-tags">
          <strong>What stood out?</strong>
          <span>Optional — choose any that apply.</span>
          <div>
            {TAGS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={selected ? "selected" : ""}
                  aria-pressed={selected}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <label className="fp-signout-feedback-comment">
          <span>{prompt}</span>
          <textarea
            rows={3}
            maxLength={1200}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={placeholder}
          />
        </label>

        {status && (
          <div
            className={`fp-signout-feedback-status ${
              status.startsWith("Thanks") ? "success" : "error"
            }`}
            role="status"
          >
            {status}
          </div>
        )}

        <div className="fp-signout-feedback-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => void onSkip()}
            disabled={busy}
          >
            Skip &amp; Sign Out
          </button>
          <button
            type="submit"
            className="primary"
            disabled={!rating || busy}
          >
            {busy ? "Sending..." : "Send Feedback"}
          </button>
        </div>

        <p className="fp-signout-feedback-note">
          Feedback is optional and never affects your MileVoxa access.
        </p>
      </form>
    </div>,
    document.body
  );
}
