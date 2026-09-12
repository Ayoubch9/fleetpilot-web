"use client";

import { FormEvent, useMemo, useState } from "react";

type Metrics = {
  revenue: number;
  costs: number;
  profit: number;
  fuel: number;
  activeTrucks: number;
  serviceDue: number;
  totalMiles: number;
};

type Message = { role: "user" | "assistant"; text: string };

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default function PilotChat({
  metrics,
  suggested,
}: {
  metrics: Metrics;
  suggested: string[];
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Ask me about revenue, expenses, fuel, mileage, maintenance, or fleet performance. I’ll answer from the FleetPilot data currently loaded for your account.",
    },
  ]);
  const [question, setQuestion] = useState("");

  const margin = useMemo(
    () => (metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : 0),
    [metrics]
  );

  function answer(input: string) {
    const q = input.toLowerCase();

    if (q.includes("fuel")) {
      return `Your recorded fuel spend is ${money(metrics.fuel)}. Fuel represents ${
        metrics.costs > 0 ? ((metrics.fuel / metrics.costs) * 100).toFixed(1) : "0.0"
      }% of recorded expenses. Compare vendors and price-per-gallon on Fuel Analytics, then prioritize the highest-cost fuel stops first.`;
    }

    if (q.includes("profit") || q.includes("margin")) {
      return `Recorded revenue is ${money(metrics.revenue)}, recorded costs are ${money(
        metrics.costs
      )}, and net profit is ${money(metrics.profit)}. That is a ${margin.toFixed(
        1
      )}% margin on the currently loaded data.`;
    }

    if (q.includes("maintenance") || q.includes("service")) {
      return `${metrics.serviceDue} maintenance record${
        metrics.serviceDue === 1 ? "" : "s"
      } currently include a next-service date. Open Maintenance to review exact due dates and mileage thresholds.`;
    }

    if (q.includes("truck") || q.includes("fleet")) {
      return `FleetPilot currently sees ${metrics.activeTrucks} active truck${
        metrics.activeTrucks === 1 ? "" : "s"
      }. The fleet has ${metrics.totalMiles.toLocaleString()} recorded load miles in the loaded dataset.`;
    }

    if (q.includes("expense") || q.includes("cost")) {
      return `Recorded business costs total ${money(metrics.costs)}. Fuel accounts for ${money(
        metrics.fuel
      )}. Check Expenses and Fuel Analytics to identify the largest categories and recurring cost drivers.`;
    }

    if (q.includes("revenue") || q.includes("load")) {
      return `Recorded load revenue is ${money(metrics.revenue)} across the loaded FleetPilot data. Use Reports and Loads to compare revenue, mileage, and estimated profitability by truck and route.`;
    }

    return `From your current FleetPilot data: revenue ${money(
      metrics.revenue
    )}, costs ${money(metrics.costs)}, profit ${money(
      metrics.profit
    )}, fuel ${money(metrics.fuel)}, and ${metrics.activeTrucks} active truck${
      metrics.activeTrucks === 1 ? "" : "s"
    }. Ask a more specific question and I’ll focus the answer.`;
  }

  function submitText(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: clean },
      { role: "assistant", text: answer(clean) },
    ]);
    setQuestion("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    submitText(question);
  }

  return (
    <>
      <div className="fp-ai-message-list">
        {messages.map((message, index) => (
          <div key={index} className={`fp-ai-message ${message.role}`}>
            {message.role === "assistant" && <span className="fp-ai-message-icon">✦</span>}
            <p>{message.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="fp-ai-composer">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything about your fleet, expenses, loads..."
        />
        <button>➤</button>
      </form>

      <div className="fp-ai-chip-row">
        {suggested.slice(0, 4).map((item) => (
          <button key={item} type="button" onClick={() => submitText(item)}>
            {item}
          </button>
        ))}
      </div>

      <small className="fp-ai-note">
        This version answers from FleetPilot business data using a deterministic insights engine.
      </small>
    </>
  );
}
