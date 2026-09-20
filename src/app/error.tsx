"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("MileVoxa page error:", error);
  }, [error]);

  return (
    <main className="fp-state-page">
      <div className="fp-state-card">
        <div className="fp-state-icon">!</div>
        <h1>MileVoxa hit a temporary problem</h1>
        <p>
          Your data has not been changed. Try loading the page again. If the
          problem continues, check the development console or deployment logs.
        </p>
        {error.digest && <small>Error reference: {error.digest}</small>}
        <div className="fp-state-actions">
          <button onClick={reset}>Try Again</button>
          <a href="/dashboard">Dashboard</a>
        </div>
      </div>
    </main>
  );
}
