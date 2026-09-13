"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Truck = {
  id: string;
  unit_number: string;
};

export default function LoadFilters({
  trucks,
}: {
  trucks: Truck[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [dateOpen, setDateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(event: MouseEvent) {
      const target = event.target as Node;
      if (!dateRef.current?.contains(target)) setDateOpen(false);
      if (!moreRef.current?.contains(target)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = searchParams.get("q") || "";
      if (search.trim() !== current) {
        update({ q: search.trim(), page: null });
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeMoreCount = useMemo(() => {
    return [
      searchParams.get("truck"),
      searchParams.get("broker"),
      searchParams.get("minRate"),
      searchParams.get("maxRate"),
      searchParams.get("minMiles"),
      searchParams.get("maxMiles"),
    ].filter(Boolean).length;
  }, [searchParams]);

  const hasDate =
    Boolean(searchParams.get("dateFrom")) ||
    Boolean(searchParams.get("dateTo"));

  function update(
    patch: Record<string, string | null | undefined>
  ) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function applyDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update({
      dateFrom: String(form.get("dateFrom") || ""),
      dateTo: String(form.get("dateTo") || ""),
      period: "custom",
      page: null,
    });
    setDateOpen(false);
  }

  function applyMore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update({
      truck: String(form.get("truck") || ""),
      broker: String(form.get("broker") || ""),
      minRate: String(form.get("minRate") || ""),
      maxRate: String(form.get("maxRate") || ""),
      minMiles: String(form.get("minMiles") || ""),
      maxMiles: String(form.get("maxMiles") || ""),
      page: null,
    });
    setMoreOpen(false);
  }

  return (
    <div className="fp-load-filterbar">
      <label className="fp-load-search">
        <SearchIcon />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by load #, broker, origin, destination..."
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </label>

      <div className="fp-load-filter-pop" ref={dateRef}>
        <button
          type="button"
          className={`fp-filter-button ${hasDate ? "active" : ""}`}
          onClick={() => {
            setDateOpen((value) => !value);
            setMoreOpen(false);
          }}
        >
          <CalendarIcon />
          {hasDate ? "Date Applied" : "Date Range"}
          <span>⌄</span>
        </button>

        {dateOpen && (
          <form className="fp-load-popover date" onSubmit={applyDate}>
            <h3>Date Range</h3>
            <label>
              <span>Pickup From</span>
              <input
                type="date"
                name="dateFrom"
                defaultValue={searchParams.get("dateFrom") || ""}
              />
            </label>
            <label>
              <span>Pickup To</span>
              <input
                type="date"
                name="dateTo"
                defaultValue={searchParams.get("dateTo") || ""}
              />
            </label>
            <div className="fp-load-popover-actions">
              <button
                type="button"
                onClick={() => {
                  update({
                    dateFrom: null,
                    dateTo: null,
                    period: null,
                    page: null,
                  });
                  setDateOpen(false);
                }}
              >
                Clear
              </button>
              <button type="submit" className="primary">
                Apply
              </button>
            </div>
          </form>
        )}
      </div>

      <select
        value={searchParams.get("status") || "all"}
        onChange={(event) =>
          update({ status: event.target.value, page: null })
        }
        className="fp-filter-select"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="upcoming">Upcoming</option>
        <option value="in-transit">In Transit</option>
        <option value="dispatched">Dispatched</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <div className="fp-load-filter-pop" ref={moreRef}>
        <button
          type="button"
          className={`fp-filter-button ${activeMoreCount > 0 ? "active" : ""}`}
          onClick={() => {
            setMoreOpen((value) => !value);
            setDateOpen(false);
          }}
        >
          <FilterIcon />
          More Filters
          {activeMoreCount > 0 && (
            <b className="fp-load-filter-count">{activeMoreCount}</b>
          )}
        </button>

        {moreOpen && (
          <form className="fp-load-popover more" onSubmit={applyMore}>
            <h3>More Filters</h3>

            <label>
              <span>Truck</span>
              <select
                name="truck"
                defaultValue={searchParams.get("truck") || ""}
              >
                <option value="">All Trucks</option>
                {trucks.map((truck) => (
                  <option key={truck.id} value={truck.id}>
                    Truck #{truck.unit_number}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Broker / Customer</span>
              <input
                name="broker"
                defaultValue={searchParams.get("broker") || ""}
                placeholder="Contains..."
              />
            </label>

            <div className="fp-load-popover-grid">
              <label>
                <span>Min Rate</span>
                <input
                  type="number"
                  step="0.01"
                  name="minRate"
                  defaultValue={searchParams.get("minRate") || ""}
                />
              </label>
              <label>
                <span>Max Rate</span>
                <input
                  type="number"
                  step="0.01"
                  name="maxRate"
                  defaultValue={searchParams.get("maxRate") || ""}
                />
              </label>
            </div>

            <div className="fp-load-popover-grid">
              <label>
                <span>Min Miles</span>
                <input
                  type="number"
                  step="0.1"
                  name="minMiles"
                  defaultValue={searchParams.get("minMiles") || ""}
                />
              </label>
              <label>
                <span>Max Miles</span>
                <input
                  type="number"
                  step="0.1"
                  name="maxMiles"
                  defaultValue={searchParams.get("maxMiles") || ""}
                />
              </label>
            </div>

            <div className="fp-load-popover-actions">
              <button
                type="button"
                onClick={() => {
                  update({
                    truck: null,
                    broker: null,
                    minRate: null,
                    maxRate: null,
                    minMiles: null,
                    maxMiles: null,
                    page: null,
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
          </form>
        )}
      </div>

      <div className="fp-load-sort">
        <span>Sort by</span>
        <select
          value={searchParams.get("sort") || "newest"}
          onChange={(event) =>
            update({ sort: event.target.value, page: null })
          }
        >
          <option value="newest">Pickup Date (Newest)</option>
          <option value="oldest">Pickup Date (Oldest)</option>
          <option value="delivery-newest">Delivery Date (Newest)</option>
          <option value="rate">Highest Revenue</option>
          <option value="rate-low">Lowest Revenue</option>
          <option value="profit">Highest Profit</option>
          <option value="profit-low">Lowest Profit</option>
          <option value="miles">Highest Miles</option>
          <option value="miles-low">Lowest Miles</option>
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
