"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type FuelView = "overview" | "truck" | "location" | "vendor";

type Truck = {
  id: string;
  unit_number: string;
};

export default function FuelControls({
  view,
  trucks,
  defaultFrom,
  defaultTo,
}: {
  view: FuelView;
  trucks: Truck[];
  defaultFrom: string;
  defaultTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [dateOpen, setDateOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const [datePosition, setDatePosition] = useState({ top: 0, left: 0 });

  function update(
    patch: Record<string, string | null | undefined>,
    replace = false
  ) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }

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

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, pathname, router, searchParams]);

  useEffect(() => {
    if (!dateOpen) return;

    function reposition() {
      const rect = dateRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 292;
      setDatePosition({
        top: rect.bottom + 6,
        left: Math.min(
          window.innerWidth - width - 12,
          Math.max(12, rect.left)
        ),
      });
    }

    function outside(event: MouseEvent) {
      const target = event.target as Node;
      const portal = document.querySelector(
        "[data-fuel-date-portal='true']"
      );

      if (
        !dateRef.current?.contains(target) &&
        !portal?.contains(target)
      ) {
        setDateOpen(false);
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
  }, [dateOpen]);

  function switchView(next: FuelView) {
    update({ view: next === "overview" ? null : next });
  }

  function applyDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const from = String(data.get("dateFrom") || "");
    const to = String(data.get("dateTo") || "");

    update({
      dateFrom: from,
      dateTo: to,
    });
    setDateOpen(false);
  }

  const hasCustomDate = Boolean(
    searchParams.get("dateFrom") || searchParams.get("dateTo")
  );

  return (
    <>
      <div className="fp-fuel-tabs fp-fuel-tabs-operational">
        <button
          type="button"
          className={view === "overview" ? "active" : ""}
          onClick={() => switchView("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          className={view === "truck" ? "active" : ""}
          onClick={() => switchView("truck")}
        >
          By Truck
        </button>
        <button
          type="button"
          className={view === "location" ? "active" : ""}
          onClick={() => switchView("location")}
        >
          By Location
        </button>
        <button
          type="button"
          className={view === "vendor" ? "active" : ""}
          onClick={() => switchView("vendor")}
        >
          By Vendor
        </button>
      </div>

      <div className="fp-fuel-filterbar fp-fuel-filterbar-operational">
        <label className="fp-fuel-search">
          <SearchIcon />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              update({ q: search.trim() });
            }}
            placeholder="Search by date, truck, vendor..."
          />

          {search && (
            <button
              type="button"
              className="fp-fuel-search-clear"
              aria-label="Clear fuel search"
              onClick={(event) => {
                event.preventDefault();
                setSearch("");
                update({ q: null });
              }}
            >
              ×
            </button>
          )}
        </label>

        <select
          value={searchParams.get("truck") || "all"}
          onChange={(event) => update({ truck: event.target.value })}
          className="fp-fuel-filter-select"
        >
          <option value="all">All Trucks</option>
          {trucks.map((truck) => (
            <option key={truck.id} value={truck.id}>
              Truck #{truck.unit_number}
            </option>
          ))}
        </select>

        <div ref={dateRef} className="fp-fuel-date-trigger">
          <button
            type="button"
            className={`fp-fuel-filter-button ${
              hasCustomDate ? "active" : ""
            }`}
            onClick={() => setDateOpen((value) => !value)}
          >
            <CalendarIcon />
            {hasCustomDate ? "Date Applied" : "Date Range"}
            <span>⌄</span>
          </button>
        </div>

        <div className="fp-fuel-sort">
          <span>Sort by</span>
          <select
            value={searchParams.get("sort") || "newest"}
            onChange={(event) => update({ sort: event.target.value })}
          >
            <option value="newest">Date (Newest)</option>
            <option value="oldest">Date (Oldest)</option>
            <option value="cost-desc">Cost (Highest)</option>
            <option value="cost-asc">Cost (Lowest)</option>
            <option value="gallons-desc">Gallons (Highest)</option>
            <option value="price-desc">Price/Gal (Highest)</option>
          </select>
        </div>
      </div>

      {dateOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <form
            data-fuel-date-portal="true"
            className="fp-fuel-date-popover"
            style={{
              top: datePosition.top,
              left: datePosition.left,
            }}
            onSubmit={applyDate}
          >
            <h3>Fuel Date Range</h3>
            <p>
              Filter every Fuel Analytics metric and transaction to this date
              period.
            </p>

            <label>
              <span>From</span>
              <input
                type="date"
                name="dateFrom"
                defaultValue={
                  searchParams.get("dateFrom") || defaultFrom
                }
              />
            </label>

            <label>
              <span>To</span>
              <input
                type="date"
                name="dateTo"
                defaultValue={searchParams.get("dateTo") || defaultTo}
              />
            </label>

            <div className="fp-fuel-date-actions">
              <button
                type="button"
                onClick={() => {
                  update({ dateFrom: null, dateTo: null });
                  setDateOpen(false);
                }}
              >
                Selected Week
              </button>
              <button type="submit" className="primary">
                Apply Range
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
      className="h-[14px] w-[14px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 9h16" />
    </svg>
  );
}
