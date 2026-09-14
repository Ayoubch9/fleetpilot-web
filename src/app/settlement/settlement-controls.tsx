"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type SettlementTab = "loads" | "costs" | "reimbursements";

export default function SettlementControls({
  tab,
  loadCount,
  costCount,
  reimbursementCount,
  selectedWeek,
  loadStatuses,
  costCategories,
}: {
  tab: SettlementTab;
  loadCount: number;
  costCount: number;
  reimbursementCount: number;
  selectedWeek: string;
  loadStatuses: string[];
  costCategories: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [weekOpen, setWeekOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const weekRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [weekPosition, setWeekPosition] = useState({ top: 0, left: 0 });
  const [morePosition, setMorePosition] = useState({ top: 0, left: 0 });

  function update(
    patch: Record<string, string | null | undefined>,
    replace = false
  ) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }

    params.delete("page");
    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;

    if (replace) router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }

  useEffect(() => {
    const current = searchParams.get("q") || "";
    if (current !== search) setSearch(current);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = search.trim();
      const current = searchParams.get("q") || "";
      if (value === current) return;

      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, pathname, router, searchParams]);

  useEffect(() => {
    function place(
      trigger: HTMLDivElement | null,
      width: number,
      setPosition: (position: { top: number; left: number }) => void
    ) {
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const left = Math.min(
        window.innerWidth - width - 12,
        Math.max(12, rect.left)
      );

      setPosition({ top: rect.bottom + 6, left });
    }

    function reposition() {
      if (weekOpen) place(weekRef.current, 280, setWeekPosition);
      if (moreOpen) place(moreRef.current, 292, setMorePosition);
    }

    function outside(event: MouseEvent) {
      const target = event.target as Node;
      const weekPortal = document.querySelector(
        "[data-settle-week-portal='true']"
      );
      const morePortal = document.querySelector(
        "[data-settle-more-portal='true']"
      );

      if (
        !weekRef.current?.contains(target) &&
        !weekPortal?.contains(target)
      ) {
        setWeekOpen(false);
      }

      if (
        !moreRef.current?.contains(target) &&
        !morePortal?.contains(target)
      ) {
        setMoreOpen(false);
      }
    }

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("mousedown", outside);

    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("mousedown", outside);
    };
  }, [weekOpen, moreOpen]);

  const statusValue = searchParams.get("status") || "all";
  const sort = searchParams.get("sort") || "newest";
  const hasMore = Boolean(
    searchParams.get("minAmount") ||
      searchParams.get("maxAmount")
  );

  function switchTab(next: SettlementTab) {
    update({
      tab: next === "loads" ? null : next,
      status: null,
      q: null,
      minAmount: null,
      maxAmount: null,
      sort: null,
    });
    setSearch("");
  }

  function applyWeek(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = String(data.get("weekDate") || "");
    if (!value) return;

    const date = new Date(`${value}T12:00:00`);
    const day = date.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + offset);

    const monday = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    update({ week: monday });
    setWeekOpen(false);
  }

  function applyMore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    update({
      minAmount: String(data.get("minAmount") || ""),
      maxAmount: String(data.get("maxAmount") || ""),
    });
    setMoreOpen(false);
  }

  const filterLabel =
    tab === "loads"
      ? "Status"
      : tab === "costs"
        ? "Category"
        : "Recovery Type";

  return (
    <>
      <div className="fp-settle-tabs">
        <button
          type="button"
          className={`fp-settle-tab ${tab === "loads" ? "active" : ""}`}
          onClick={() => switchTab("loads")}
        >
          Settlement Loads <b>{loadCount}</b>
        </button>
        <button
          type="button"
          className={`fp-settle-tab ${tab === "costs" ? "active" : ""}`}
          onClick={() => switchTab("costs")}
        >
          Costs <b>{costCount}</b>
        </button>
        <button
          type="button"
          className={`fp-settle-tab ${
            tab === "reimbursements" ? "active" : ""
          }`}
          onClick={() => switchTab("reimbursements")}
        >
          Reimbursements <b>{reimbursementCount}</b>
        </button>
      </div>

      <div className="fp-settle-filterbar fp-settle-filterbar-operational">
        <label className="fp-settle-search">
          <SearchIcon />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              update({ q: search.trim() });
            }}
            placeholder={
              tab === "loads"
                ? "Search load, route, date..."
                : tab === "costs"
                  ? "Search category, vendor, notes..."
                  : "Search reference, notes, category..."
            }
          />
          {search && (
            <button
              type="button"
              className="fp-settle-search-clear"
              onClick={(event) => {
                event.preventDefault();
                setSearch("");
                update({ q: null });
              }}
              aria-label="Clear settlement search"
            >
              ×
            </button>
          )}
        </label>

        <div className="fp-settle-filter-pop" ref={weekRef}>
          <button
            type="button"
            className="fp-settle-filter-button"
            onClick={() => {
              setWeekOpen((value) => !value);
              setMoreOpen(false);
            }}
          >
            <CalendarIcon />
            Week Range
            <span>⌄</span>
          </button>
        </div>

        <select
          className="fp-settle-filter-select"
          value={statusValue}
          onChange={(event) => update({ status: event.target.value })}
        >
          <option value="all">{filterLabel}</option>

          {tab === "loads" &&
            loadStatuses.map((status) => (
              <option key={status} value={status.toLowerCase()}>
                {status}
              </option>
            ))}

          {tab === "costs" &&
            costCategories.map((category) => (
              <option key={category} value={category.toLowerCase()}>
                {category}
              </option>
            ))}

          {tab === "reimbursements" && (
            <>
              <option value="linked">Linked</option>
              <option value="standalone">Standalone</option>
            </>
          )}
        </select>

        <div className="fp-settle-filter-pop" ref={moreRef}>
          <button
            type="button"
            className={`fp-settle-filter-button ${hasMore ? "active" : ""}`}
            onClick={() => {
              setMoreOpen((value) => !value);
              setWeekOpen(false);
            }}
          >
            <FilterIcon />
            More Filters
            {hasMore && <b>•</b>}
          </button>
        </div>

        <div className="fp-settle-sort">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) => update({ sort: event.target.value })}
          >
            <option value="newest">Date (Newest)</option>
            <option value="oldest">Date (Oldest)</option>
            <option value="amount-desc">Amount (Highest)</option>
            <option value="amount-asc">Amount (Lowest)</option>
          </select>
        </div>
      </div>

      {weekOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <form
            data-settle-week-portal="true"
            className="fp-settle-filter-portal fp-settle-week-popover"
            style={{
              top: weekPosition.top,
              left: weekPosition.left,
            }}
            onSubmit={applyWeek}
          >
            <h3>Choose Settlement Week</h3>
            <p>Select any date inside the week you want to review.</p>
            <label>
              <span>Date</span>
              <input
                type="date"
                name="weekDate"
                defaultValue={selectedWeek}
              />
            </label>
            <div className="fp-settle-popover-actions">
              <button
                type="button"
                onClick={() => {
                  update({ week: null });
                  setWeekOpen(false);
                }}
              >
                Current Week
              </button>
              <button type="submit" className="primary">
                Apply Week
              </button>
            </div>
          </form>,
          document.body
        )}

      {moreOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <form
            data-settle-more-portal="true"
            className="fp-settle-filter-portal fp-settle-more-popover"
            style={{
              top: morePosition.top,
              left: morePosition.left,
            }}
            onSubmit={applyMore}
          >
            <h3>More Filters</h3>
            <p>
              Limit the active settlement view by transaction amount.
            </p>

            <div className="fp-settle-popover-grid">
              <label>
                <span>Min Amount</span>
                <input
                  name="minAmount"
                  type="number"
                  step="0.01"
                  defaultValue={searchParams.get("minAmount") || ""}
                />
              </label>
              <label>
                <span>Max Amount</span>
                <input
                  name="maxAmount"
                  type="number"
                  step="0.01"
                  defaultValue={searchParams.get("maxAmount") || ""}
                />
              </label>
            </div>

            <div className="fp-settle-popover-actions">
              <button
                type="button"
                onClick={() => {
                  update({ minAmount: null, maxAmount: null });
                  setMoreOpen(false);
                }}
              >
                Clear
              </button>
              <button type="submit" className="primary">
                Apply Filters
              </button>
            </div>
          </form>,
          document.body
        )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[14px] w-[14px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[13px] w-[13px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 9h16" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[13px] w-[13px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
