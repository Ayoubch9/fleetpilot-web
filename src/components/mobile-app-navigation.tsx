"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MileVoxaBrand from "@/components/milevoxa-brand";
import NavigationIcon from "@/components/navigation-icon";

type ActivePage =
  | "overview"
  | "loads"
  | "decision"
  | "trucks"
  | "expenses"
  | "reimbursements"
  | "maintenance"
  | "settlement"
  | "odometer"
  | "deposit"
  | "fuel"
  | "reports"
  | "documents"
  | "pilot"
  | "settings"
  | "notifications";

const primary = [
  ["overview", "Home", "/dashboard", "home"],
  ["loads", "Loads", "/loads", "load"],
  ["trucks", "Trucks", "/trucks", "truck"],
  ["expenses", "Expenses", "/expenses", "expense"],
] as const;

const more = [
  ["maintenance", "Maintenance", "/maintenance", "maintenance"],
  ["reimbursements", "Reimbursements", "/reimbursements", "reimbursements"],
  ["settlement", "Weekly Settlement", "/settlement", "settlement"],
  ["odometer", "Weekly Odometer", "/odometer", "odometer"],
  ["deposit", "Security Deposit", "/security-deposit", "deposit"],
  ["fuel", "Fuel Analytics", "/fuel", "fuel"],
  ["reports", "Reports", "/reports", "reports"],
  ["pilot", "Pilot AI", "/pilot-ai", "pilot"],
  ["documents", "Documents", "/documents", "documents"],
  ["notifications", "Notifications", "/notifications", "notifications"],
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
            <NavigationIcon
              type={icon}
              className="fp-mobile-navigation-emoji"
            />
            <span>{label}</span>
          </Link>
        ))}

        <button
          type="button"
          className={moreActive ? "active" : ""}
          onClick={() => setOpen(true)}
          aria-label="More MileVoxa pages"
        >
          <MoreMenuIcon />
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
                <div className="mv-mobile-more-brand">
                  <MileVoxaBrand
                    href="/dashboard"
                    className="mv-sidebar-brand fp-mobile-more-logo"
                  />
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
                      <NavigationIcon
                        type={icon}
                        className="fp-mobile-navigation-emoji"
                      />
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

function MoreMenuIcon() {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[20px] w-[20px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg {...common}>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}
