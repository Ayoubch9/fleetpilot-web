"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function PilotChat({
  suggested,
  initialQuestion = "",
}: {
  suggested: string[];
  initialQuestion?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "I’m connected to your FleetPilot business data. Ask me about loads, revenue, expenses, trucks, fuel, routes, maintenance, or profitability.",
    },
  ]);
  const [question, setQuestion] = useState(initialQuestion);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submitText(text: string) {
    const clean = text.trim();
    if (!clean || sending) return;

    const priorHistory = messages.slice(-8);
    setQuestion("");
    setError("");
    setSending(true);
    setMessages((current) => [...current, { role: "user", text: clean }]);

    try {
      const response = await fetch("/api/pilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: clean,
          history: priorHistory,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error || "Pilot AI could not answer the question."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: String(payload.answer || "No answer returned."),
        },
      ]);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Pilot AI could not answer the question.";

      setError(message);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I couldn’t complete that request. Check the Pilot AI configuration and try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void submitText(question);
  }

  return (
    <>
      <div className="fp-ai-message-list" aria-live="polite">
        {messages.map((message, index) => (
          <div key={index} className={`fp-ai-message ${message.role}`}>
            {message.role === "assistant" && (
              <span className="fp-ai-message-icon">✦</span>
            )}
            <p className="whitespace-pre-wrap">{message.text}</p>
          </div>
        ))}

        {sending && (
          <div className="fp-ai-message assistant fp-ai-thinking">
            <span className="fp-ai-message-icon">✦</span>
            <p>
              Analyzing your FleetPilot data
              <span className="fp-ai-dots" aria-hidden="true">•••</span>
            </p>
          </div>
        )}
      </div>

      {error && <div className="fp-ai-error">{error}</div>}

      <form onSubmit={submit} className="fp-ai-composer">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything about your fleet, expenses, loads..."
          maxLength={2000}
          disabled={sending}
        />
        <button disabled={sending || !question.trim()} aria-label="Send question">
          ➤
        </button>
      </form>

      <div className="fp-ai-chip-row">
        {suggested.slice(0, 4).map((item) => (
          <button
            key={item}
            type="button"
            disabled={sending}
            onClick={() => void submitText(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <small className="fp-ai-note">
        Pilot AI analyzes the FleetPilot data available to your signed-in company account. Review important business decisions before acting.
      </small>
    </>
  );
}
