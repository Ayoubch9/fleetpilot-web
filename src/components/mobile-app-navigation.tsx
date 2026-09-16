"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ActivePage =
  | "overview"
  | "loads"
  | "trucks"
  | "expenses"
  | "reimbursements"
  | "maintenance"
  | "settlement"
  | "deposit"
  | "fuel"
  | "reports"
  | "documents"
  | "pilot"
  | "settings"
  | "notifications";

const primary = [
  ["overview", "Home", "/dashboard", "home"],
  ["loads", "Loads", "/loads", "loads"],
  ["trucks", "Trucks", "/trucks", "trucks"],
  ["expenses", "Expenses", "/expenses", "expenses"],
] as const;

const more = [
  ["maintenance", "Maintenance", "/maintenance", "maintenance"],
  ["reimbursements", "Reimbursements", "/reimbursements", "wallet"],
  ["settlement", "Weekly Settlement", "/settlement", "settlement"],
  ["deposit", "Security Deposit", "/security-deposit", "deposit"],
  ["fuel", "Fuel Analytics", "/fuel", "fuel"],
  ["reports", "Reports", "/reports", "report"],
  ["pilot", "Pilot AI", "/pilot-ai", "spark"],
  ["documents", "Documents", "/documents", "document"],
  ["notifications", "Notifications", "/notifications", "bell"],
  ["settings", "Settings", "/settings", "settings"],
] as const;

export default function MobileAppNavigation({
  active,
}: {
  active: ActivePage;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const moreActive = more.some(([key]) => key === active);

  return (
    <>
      <nav className="fp-mobile-bottom-nav lg:hidden" aria-label="Mobile navigation">
        {primary.map(([key, label, href, icon]) => (
          <Link
            key={key}
            href={href}
            className={active === key ? "active" : ""}
          >
            <MobileIcon type={icon} />
            <span>{label}</span>
          </Link>
        ))}

        <button
          type="button"
          className={moreActive ? "active" : ""}
          onClick={() => setOpen(true)}
          aria-label="More FleetPilot pages"
        >
          <MobileIcon type="more" />
          <span>More</span>
        </button>
      </nav>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-mobile-more-backdrop lg:hidden">
            <button
              type="button"
              className="fp-mobile-more-scrim"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            />

            <section className="fp-mobile-more-sheet">
              <div className="fp-mobile-sheet-handle" />

              <header>
                <div>
                  <span>FLEETPILOT</span>
                  <h2>More</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close more menu"
                >
                  ×
                </button>
              </header>

              <div className="fp-mobile-more-grid">
                {more.map(([key, label, href, icon]) => (
                  <Link
                    key={key}
                    href={href}
                    className={active === key ? "active" : ""}
                    onClick={() => setOpen(false)}
                  >
                    <span className="fp-mobile-more-icon">
                      <MobileIcon type={icon} />
                    </span>
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}

function MobileIcon({ type }: { type: string }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[20px] w-[20px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "home")
    return (
      <svg {...common}>
        <path d="M3 11 12 3l9 8v10H3z" />
        <path d="M9 21v-6h6v6" />
      </svg>
    );

  if (type === "loads" || type === "trucks")
    return (
      <svg {...common}>
        <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );

  if (type === "expenses")
    return (
      <svg {...common}>
        <path d="M5 3h14v18H5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );

  if (type === "more")
    return (
      <svg {...common}>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </svg>
    );

  if (type === "maintenance")
    return (
      <svg {...common}>
        <path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z" />
      </svg>
    );

  if (type === "wallet")
    return (
      <svg {...common}>
        <path d="M4 6h16v12H4z" />
        <path d="M16 10h5v4h-5a2 2 0 0 1 0-4Z" />
      </svg>
    );

  if (type === "settlement")
    return (
      <svg {...common}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    );

  if (type === "deposit")
    return (
      <svg {...common}>
        <path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Z" />
        <path d="M9 11h6M12 8v6" />
      </svg>
    );

  if (type === "fuel")
    return (
      <svg {...common}>
        <path d="M6 3h9v18H6zM8 7h5" />
        <path d="M15 8h2l2 3v6a2 2 0 0 0 2 2" />
      </svg>
    );

  if (type === "spark")
    return (
      <svg {...common}>
        <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
      </svg>
    );

  if (type === "bell")
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );

  if (type === "settings")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0" />
      </svg>
    );

  return (
    <svg {...common}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
