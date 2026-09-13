"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function monday(date: Date) {
  const clean = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = clean.getDay();
  clean.setDate(clean.getDate() - (day === 0 ? 6 : day - 1));
  return clean;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function dbDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function labelDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const row = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : null;
}

export default function WeekSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const calendarRef = useRef<HTMLInputElement>(null);

  const currentWeek = useMemo(() => monday(new Date()), []);

  const initialWeek = useMemo(() => {
    const fromUrl = parseDate(searchParams.get("week"));
    if (fromUrl) {
      const start = monday(fromUrl);
      return start > currentWeek ? currentWeek : start;
    }
    return currentWeek;
  }, [searchParams, currentWeek]);

  const [selected, setSelected] = useState(initialWeek);

  useEffect(() => {
    const fromUrl = parseDate(searchParams.get("week"));
    if (fromUrl) {
      const start = monday(fromUrl);
      setSelected(start > currentWeek ? currentWeek : start);
      return;
    }

    const fromCookie = parseDate(readCookie("fleetpilot_week"));
    if (fromCookie) {
      const start = monday(fromCookie);
      const safe = start > currentWeek ? currentWeek : start;
      setSelected(safe);

      if (dbDate(safe) !== dbDate(currentWeek)) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("week", dbDate(safe));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
      return;
    }

    setSelected(currentWeek);
  }, [pathname, router, searchParams, currentWeek]);

  const end = addDays(selected, 6);
  const isCurrent = dbDate(selected) === dbDate(currentWeek);

  function applyWeek(date: Date) {
    const safe = monday(date) > currentWeek ? currentWeek : monday(date);
    setSelected(safe);

    document.cookie = `fleetpilot_week=${encodeURIComponent(
      dbDate(safe)
    )}; Path=/; Max-Age=31536000; SameSite=Lax`;

    const params = new URLSearchParams(searchParams.toString());

    if (dbDate(safe) === dbDate(currentWeek)) {
      params.delete("week");
    } else {
      params.set("week", dbDate(safe));
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function openCalendar() {
    const input = calendarRef.current;
    if (!input) return;

    if ("showPicker" in input && typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  }

  return (
    <div className="fp-global-week">
      <button
        type="button"
        className="fp-week-arrow"
        onClick={() => applyWeek(addDays(selected, -7))}
        aria-label="Previous week"
        title="Previous week"
      >
        ←
      </button>

      <button
        type="button"
        className="fp-week-label"
        onClick={openCalendar}
        aria-label="Choose a week"
        title="Choose a date or week"
      >
        <span>{isCurrent ? "This Week" : "Selected Week"}</span>
        <strong>
          {labelDate(selected)} – {labelDate(end)}
        </strong>
      </button>

      <button
        type="button"
        className="fp-week-arrow"
        onClick={() => applyWeek(addDays(selected, 7))}
        disabled={isCurrent}
        aria-label="Next week"
        title={isCurrent ? "Current week" : "Next week"}
      >
        →
      </button>

      <div className="fp-week-calendar-wrap">
        <button
          type="button"
          className="fp-week-calendar-button"
          onClick={openCalendar}
          aria-label="Jump to date"
          title="Jump to date"
        >
          <CalendarIcon />
        </button>
        <input
          ref={calendarRef}
          className="fp-week-native-date"
          type="date"
          value={dbDate(selected)}
          max={dbDate(new Date())}
          onChange={(event) => {
            const picked = parseDate(event.target.value);
            if (picked) applyWeek(picked);
          }}
          aria-label="Select date"
        />
      </div>

      {!isCurrent && (
        <button
          type="button"
          className="fp-week-today"
          onClick={() => applyWeek(currentWeek)}
          title="Go to current week"
        >
          Today
        </button>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[16px] w-[16px] fill-none stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
    </svg>
  );
}
