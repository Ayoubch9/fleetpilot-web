"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export default function QuickActionButton({
  label,
  icon,
  href,
  onClick,
  primary = false,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  const className = `mv-quick-action ${primary ? "primary" : ""}`.trim();

  const content = (
    <>
      <span className="mv-quick-action-icon">{icon}</span>
      <span className="mv-quick-action-label">{label}</span>
      <span className="mv-quick-action-chevron" aria-hidden="true">›</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-disabled={disabled || undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}
