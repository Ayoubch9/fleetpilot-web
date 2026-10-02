"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Period = "week" | "month" | "year" | "custom";
type StandardPeriod = Exclude<Period, "custom">;

export default function ReportPeriodControls({
  period,
  anchor,
  periodLabel,
}: {
  period: Period;
  anchor: string;
  periodLabel: string;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(anchor);
  const activeStandardPeriod: StandardPeriod =
    period === "custom" ? "week" : period;

  function go(nextPeriod: StandardPeriod, nextDate: string) {
    if (!nextDate) return;

    setSelectedDate(nextDate);

    const params = new URLSearchParams();
    params.set("period", nextPeriod);
    params.set("date", nextDate);
    router.push(`/reports?${params.toString()}`);
  }

  function changePeriod(nextPeriod: StandardPeriod) {
    go(nextPeriod, selectedDate || anchor);
  }

  function move(direction: -1 | 1) {
    const next = shiftPeriod(
      selectedDate || anchor,
      activeStandardPeriod,
      direction
    );
    go(activeStandardPeriod, next);
  }

  return (
    <div className="fp-report-period-shell fp-report-period-shell-v3">
      <div className="fp-report-period-tabs" aria-label="Report period">
        {(["week", "month", "year"] as const).map((item) => (
          <button
            type="button"
            key={item}
            className={period === item ? "active" : ""}
            onClick={() => changePeriod(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}

        {period === "custom" && (
          <span className="fp-report-custom-active">Custom</span>
        )}
      </div>

      <div className="fp-report-period-navigation">
        <button
          type="button"
          aria-label={`Previous ${activeStandardPeriod}`}
          title={`Previous ${activeStandardPeriod}`}
          onClick={() => move(-1)}
        >
          ←
        </button>

        <div className="fp-report-period-current">
          <span>REPORTING PERIOD</span>
          <strong>{periodLabel}</strong>
          {period === "custom" && (
            <small>Custom Date X → Date Y range</small>
          )}
        </div>

        <button
          type="button"
          aria-label={`Next ${activeStandardPeriod}`}
          title={`Next ${activeStandardPeriod}`}
          onClick={() => move(1)}
        >
          →
        </button>
      </div>
    </div>
  );
}

function parseDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return {
      year: new Date().getFullYear(),
      month: 1,
      day: 1,
    };
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function shiftPeriod(
  value: string,
  period: StandardPeriod,
  direction: -1 | 1
) {
  const parts = parseDateParts(value);
  const date = new Date(parts.year, parts.month - 1, parts.day);

  if (period === "year") {
    date.setFullYear(date.getFullYear() + direction);
  } else if (period === "month") {
    date.setDate(1);
    date.setMonth(date.getMonth() + direction);
  } else {
    date.setDate(date.getDate() + direction * 7);
  }

  return formatDate(date);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
