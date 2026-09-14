"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Truck = { id: string; unit_number: string };
type Category = string;

export default function ReimbursementFilters({
  trucks,
  categories,
}: {
  trucks: Truck[];
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [dateOpen, setDateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [datePosition, setDatePosition] = useState({ top: 0, left: 0 });
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
    function placePopup(
      trigger: HTMLDivElement | null,
      width: number,
      setPosition: (position: { top: number; left: number }) => void
    ) {
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const left = Math.min(
        window.innerWidth - width - viewportPadding,
        Math.max(viewportPadding, rect.left)
      );

      setPosition({
        top: rect.bottom + 6,
        left,
      });
    }

    function reposition() {
      if (dateOpen) {
        placePopup(dateRef.current, 292, setDatePosition);
      }
      if (moreOpen) {
        placePopup(moreRef.current, 292, setMorePosition);
      }
    }

    function outside(event: MouseEvent) {
      const target = event.target as Node;

      const datePortal = document.querySelector(
        "[data-reimb-date-portal='true']"
      );
      const morePortal = document.querySelector(
        "[data-reimb-more-portal='true']"
      );

      if (
        dateRef.current?.contains(target) ||
        datePortal?.contains(target)
      ) {
        // click belongs to date controls
      } else {
        setDateOpen(false);
      }

      if (
        moreRef.current?.contains(target) ||
        morePortal?.contains(target)
      ) {
        // click belongs to more-filter controls
      } else {
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
  }, [dateOpen, moreOpen]);

  const hasDate = Boolean(
    searchParams.get("dateFrom") || searchParams.get("dateTo")
  );

  const moreCount = useMemo(
    () =>
      [
        searchParams.get("vendor"),
        searchParams.get("category"),
        searchParams.get("minAmount"),
        searchParams.get("maxAmount"),
      ].filter(Boolean).length,
    [searchParams]
  );

  function applyDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    update({
      dateFrom: String(data.get("dateFrom") || ""),
      dateTo: String(data.get("dateTo") || ""),
    });
    setDateOpen(false);
  }

  function applyMore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    update({
      vendor: String(data.get("vendor") || ""),
      category: String(data.get("category") || ""),
      minAmount: String(data.get("minAmount") || ""),
      maxAmount: String(data.get("maxAmount") || ""),
    });
    setMoreOpen(false);
  }

  return (
    <div className="fp-reimb-filterbar fp-reimb-filterbar-operational">
      <label className="fp-reimb-search">
        <SearchIcon />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            update({ q: search.trim() });
          }}
          placeholder="Search notes, category, vendor, truck..."
        />
        {search && (
          <button
            type="button"
            className="fp-reimb-search-clear"
            onClick={(event) => {
              event.preventDefault();
              setSearch("");
              update({ q: null });
            }}
            aria-label="Clear reimbursement search"
          >
            ×
          </button>
        )}
      </label>

      <div className="fp-reimb-filter-pop" ref={dateRef}>
        <button
          type="button"
          className={`fp-reimb-filter-button ${hasDate ? "active" : ""}`}
          onClick={() => {
            setDateOpen((value) => !value);
            setMoreOpen(false);
          }}
        >
          <CalendarIcon />
          {hasDate ? "Date Applied" : "Date Range"}
          <span>⌄</span>
        </button>

        {dateOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <form
              data-reimb-date-portal="true"
              className="fp-reimb-popover fp-reimb-filter-portal date"
              style={{
                top: datePosition.top,
                left: datePosition.left,
              }}
              onSubmit={applyDate}
            >
              <h3>Reimbursement Date Range</h3>
              <label>
                <span>From</span>
                <input
                  type="date"
                  name="dateFrom"
                  defaultValue={searchParams.get("dateFrom") || ""}
                />
              </label>
              <label>
                <span>To</span>
                <input
                  type="date"
                  name="dateTo"
                  defaultValue={searchParams.get("dateTo") || ""}
                />
              </label>
              <div className="fp-reimb-popover-actions">
                <button
                  type="button"
                  onClick={() => {
                    update({ dateFrom: null, dateTo: null });
                    setDateOpen(false);
                  }}
                >
                  Clear
                </button>
                <button type="submit" className="primary">
                  Apply
                </button>
              </div>
            </form>,
            document.body
          )}
      </div>

      <select
        value={searchParams.get("truck") || "all"}
        onChange={(event) => update({ truck: event.target.value })}
        className="fp-reimb-filter-select"
      >
        <option value="all">Truck</option>
        {trucks.map((truck) => (
          <option key={truck.id} value={truck.id}>
            Truck #{truck.unit_number}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("kind") || "all"}
        onChange={(event) => update({ kind: event.target.value })}
        className="fp-reimb-filter-select"
      >
        <option value="all">Recovery Type</option>
        <option value="full">Full Recovery</option>
        <option value="partial">Partial Recovery</option>
        <option value="standalone">Standalone</option>
      </select>

      <div className="fp-reimb-filter-pop" ref={moreRef}>
        <button
          type="button"
          className={`fp-reimb-filter-button ${moreCount > 0 ? "active" : ""}`}
          onClick={() => {
            setMoreOpen((value) => !value);
            setDateOpen(false);
          }}
        >
          <FilterIcon />
          More Filters
          {moreCount > 0 && <b>{moreCount}</b>}
        </button>

        {moreOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <form
              data-reimb-more-portal="true"
              className="fp-reimb-popover fp-reimb-filter-portal more"
              style={{
                top: morePosition.top,
                left: morePosition.left,
              }}
              onSubmit={applyMore}
            >
              <h3>More Filters</h3>

              <label>
                <span>Vendor contains</span>
                <input
                  name="vendor"
                  defaultValue={searchParams.get("vendor") || ""}
                />
              </label>

              <label>
                <span>Expense Category</span>
                <select
                  name="category"
                  defaultValue={searchParams.get("category") || ""}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category.toLowerCase()}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <div className="fp-reimb-popover-grid">
                <label>
                  <span>Min Amount</span>
                  <input
                    type="number"
                    step="0.01"
                    name="minAmount"
                    defaultValue={searchParams.get("minAmount") || ""}
                  />
                </label>
                <label>
                  <span>Max Amount</span>
                  <input
                    type="number"
                    step="0.01"
                    name="maxAmount"
                    defaultValue={searchParams.get("maxAmount") || ""}
                  />
                </label>
              </div>

              <div className="fp-reimb-popover-actions">
                <button
                  type="button"
                  onClick={() => {
                    update({
                      vendor: null,
                      category: null,
                      minAmount: null,
                      maxAmount: null,
                    });
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
      </div>

      <div className="fp-reimb-sort">
        <span>Sort by</span>
        <select
          value={searchParams.get("sort") || "newest"}
          onChange={(event) => update({ sort: event.target.value })}
        >
          <option value="newest">Date (Newest)</option>
          <option value="oldest">Date (Oldest)</option>
          <option value="amount-desc">Amount (Highest)</option>
          <option value="amount-asc">Amount (Lowest)</option>
        </select>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 9h16" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
