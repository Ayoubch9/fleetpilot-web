import PublicLayout from "@/components/public-layout";
import type { ReactNode } from "react";

export default function LegalPage({
  eyebrow,
  title,
  intro,
  updated = "September 20, 2026",
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <PublicLayout mainClassName="fp-legal-page">
      <article className="fp-legal-shell">
        <div className="fp-legal-hero">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <small>Last updated: {updated}</small>
        </div>

        <div className="fp-legal-body">{children}</div>
      </article>
    </PublicLayout>
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
