import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="fp-legal-page">
      <header className="fp-legal-header">
        <Link href="/" className="fp-legal-brand">
          Fleet<span>Pilot</span>
        </Link>
        <nav>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/data-deletion">Data Deletion</Link>
          <Link href="/login">Sign In</Link>
        </nav>
      </header>

      <article className="fp-legal-shell">
        <div className="fp-legal-hero">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <small>Last updated: September 18, 2026</small>
        </div>

        <div className="fp-legal-body">{children}</div>
      </article>

      <footer className="fp-legal-footer">
        <span>© 2026 FleetPilot</span>
        <div>
          <Link href="/">Home</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/data-deletion">Data Deletion</Link>
        </div>
      </footer>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
