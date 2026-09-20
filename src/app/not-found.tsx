import Link from "next/link";

export default function NotFound() {
  return (
    <main className="fp-state-page">
      <div className="fp-state-card">
        <div className="fp-state-icon">404</div>
        <h1>Page not found</h1>
        <p>
          This MileVoxa page does not exist or the address has changed.
        </p>
        <div className="fp-state-actions">
          <Link href="/dashboard">Back to Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
