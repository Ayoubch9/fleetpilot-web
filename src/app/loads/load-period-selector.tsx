"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Period = "week" | "month" | "all";

export default function LoadPeriodSelector({
  label,
  isCustom,
}: {
  label: string;
  isCustom: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = (searchParams.get("period") || "week") as Period;

  function selectPeriod(next: Period) {
    const params = new URLSearchParams(searchParams.toString());

    if (next === "week") params.delete("period");
    else params.set("period", next);

    params.delete("dateFrom");
    params.delete("dateTo");
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div className="fp-load-period-shell">
      <div className="fp-load-period-context">
        <span>Performance Period</span>
        <strong>{isCustom ? `Custom · ${label}` : label}</strong>
      </div>

      <div className="fp-load-period-switch" role="group" aria-label="Loads performance period">
        <button
          type="button"
          className={!isCustom && period === "week" ? "active" : ""}
          onClick={() => selectPeriod("week")}
        >
          Week
        </button>
        <button
          type="button"
          className={!isCustom && period === "month" ? "active" : ""}
          onClick={() => selectPeriod("month")}
        >
          Month
        </button>
        <button
          type="button"
          className={!isCustom && period === "all" ? "active" : ""}
          onClick={() => selectPeriod("all")}
        >
          All Time
        </button>
        {isCustom && (
          <span className="fp-load-period-custom">Custom Range</span>
        )}
      </div>
    </div>
  );
}
