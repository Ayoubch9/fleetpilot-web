"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Truck = {
  id: string;
  unit_number: string;
};

export default function MaintenanceFilters({
  trucks,
  serviceTypes,
}: {
  trucks: Truck[];
  serviceTypes: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [dateOpen, setDateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

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
    function outside(event: MouseEvent) {
      const target = event.target as Node;
      if (!dateRef.current?.contains(target)) setDateOpen(false);
      if (!moreRef.current?.contains(target)) setMoreOpen(false);
    }

    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const hasDate = Boolean(
    searchParams.get("dateFrom") || searchParams.get("dateTo")
  );

  const moreCount = useMemo(
    () =>
      [
        searchParams.get("vendor"),
        searchParams.get("minCost"),
        searchParams.get("maxCost"),
        searchParams.get("minMileage"),
        searchParams.get("maxMileage"),
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
      minCost: String(data.get("minCost") || ""),
      maxCost: String(data.get("maxCost") || ""),
      minMileage: String(data.get("minMileage") || ""),
      maxMileage: String(data.get("maxMileage") || ""),
    });
    setMoreOpen(false);
  }

  return (
    <div className="fp-maint-filterbar fp-maint-filterbar-operational">
      <label className="fp-maint-search">
        <SearchIcon />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            update({ q: search.trim() });
          }}
          placeholder="Search truck, service type, vendor..."
        />
        {search && (
          <button
            type="button"
            className="fp-maint-search-clear"
            onClick={(event) => {
              event.preventDefault();
              setSearch("");
              update({ q: null });
            }}
            aria-label="Clear maintenance search"
          >
            ×
          </button>
        )}
      </label>

      <div className="fp-maint-filter-pop" ref={dateRef}>
        <button
          type="button"
          className={`fp-maint-filter-button ${hasDate ? "active" : ""}`}
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
          <form className="fp-maint-popover date" onSubmit={applyDate}>
            <h3>Service Date Range</h3>
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
            <div className="fp-maint-popover-actions">
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
          </form>
        )}
      </div>

      <select
        value={searchParams.get("service") || "all"}
        onChange={(event) => update({ service: event.target.value })}
        className="fp-maint-filter-select"
      >
        <option value="all">Service Type</option>
        {serviceTypes.map((type) => (
          <option key={type} value={type.toLowerCase()}>
            {type}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("truck") || "all"}
        onChange={(event) => update({ truck: event.target.value })}
        className="fp-maint-filter-select"
      >
        <option value="all">Truck</option>
        {trucks.map((truck) => (
          <option key={truck.id} value={truck.id}>
            Truck #{truck.unit_number}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("state") || "all"}
        onChange={(event) => update({ state: event.target.value })}
        className="fp-maint-filter-select"
      >
        <option value="all">Status</option>
        <option value="upcoming">Upcoming</option>
        <option value="overdue">Overdue</option>
        <option value="completed">Completed</option>
      </select>

      <div className="fp-maint-filter-pop" ref={moreRef}>
        <button
          type="button"
          className={`fp-maint-filter-button ${moreCount > 0 ? "active" : ""}`}
          onClick={() => {
            setMoreOpen((value) => !value);
            setDateOpen(false);
          }}
        >
          <FilterIcon />
          More Filters
          {moreCount > 0 && <b>{moreCount}</b>}
        </button>

        {moreOpen && (
          <form className="fp-maint-popover more" onSubmit={applyMore}>
            <h3>More Filters</h3>

            <label>
              <span>Vendor contains</span>
              <input
                name="vendor"
                defaultValue={searchParams.get("vendor") || ""}
              />
            </label>

            <div className="fp-maint-popover-grid">
              <label>
                <span>Min Cost</span>
                <input
                  type="number"
                  step="0.01"
                  name="minCost"
                  defaultValue={searchParams.get("minCost") || ""}
                />
              </label>
              <label>
                <span>Max Cost</span>
                <input
                  type="number"
                  step="0.01"
                  name="maxCost"
                  defaultValue={searchParams.get("maxCost") || ""}
                />
              </label>
            </div>

            <div className="fp-maint-popover-grid">
              <label>
                <span>Min Mileage</span>
                <input
                  type="number"
                  step="1"
                  name="minMileage"
                  defaultValue={searchParams.get("minMileage") || ""}
                />
              </label>
              <label>
                <span>Max Mileage</span>
                <input
                  type="number"
                  step="1"
                  name="maxMileage"
                  defaultValue={searchParams.get("maxMileage") || ""}
                />
              </label>
            </div>

            <div className="fp-maint-popover-actions">
              <button
                type="button"
                onClick={() => {
                  update({
                    vendor: null,
                    minCost: null,
                    maxCost: null,
                    minMileage: null,
                    maxMileage: null,
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

      <div className="fp-maint-sort">
        <span>Sort by</span>
        <select
          value={searchParams.get("sort") || "newest"}
          onChange={(event) => update({ sort: event.target.value })}
        >
          <option value="newest">Date (Newest)</option>
          <option value="oldest">Date (Oldest)</option>
          <option value="cost-desc">Cost (Highest)</option>
          <option value="cost-asc">Cost (Lowest)</option>
          <option value="mileage">Mileage (Highest)</option>
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
