"use client";

import Link from "next/link";

export type AppTabItem = {
  key: string;
  label: string;
  count?: number;
  href?: string;
  disabled?: boolean;
};

export default function AppTabs({
  items,
  activeKey,
  onChange,
  ariaLabel = "Section tabs",
  className = "",
}: {
  items: AppTabItem[];
  activeKey: string;
  onChange?: (key: string) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <nav
      className={`mv-app-tabs ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        const content = (
          <>
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <b className="mv-app-tab-count">{item.count}</b>
            )}
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            className={active ? "active" : ""}
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onChange?.(item.key)}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
