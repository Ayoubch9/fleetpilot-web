"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Truck = { id: string; unit_number: string };

export default function ExpenseFilters({ trucks }: { trucks: Truck[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [dateOpen, setDateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  function update(patch: Record<string, string | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    router.push(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false });
  }

  useEffect(() => {
    const current = searchParams.get("q") || "";
    if (current !== search) {
      setSearch(current);
    }
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

  const hasDate = Boolean(searchParams.get("dateFrom") || searchParams.get("dateTo"));
  const moreCount = useMemo(() => [
    searchParams.get("vendor"),
    searchParams.get("minAmount"),
    searchParams.get("maxAmount"),
  ].filter(Boolean).length, [searchParams]);

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
      minAmount: String(data.get("minAmount") || ""),
      maxAmount: String(data.get("maxAmount") || ""),
    });
    setMoreOpen(false);
  }

  return (
    <div className="fp-expense-filterbar fp-expense-filterbar-operational">
      <label className="fp-expense-search">
        <SearchIcon />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();

            const value = search.trim();
            const params = new URLSearchParams(searchParams.toString());

            if (value) params.set("q", value);
            else params.delete("q");

            params.delete("page");

            const query = params.toString();
            router.push(query ? `${pathname}?${query}` : pathname, {
              scroll: false,
            });
          }}
          placeholder="Search description, vendor, category, truck..."
        />

        {search && (
          <button
            type="button"
            className="fp-expense-search-clear"
            aria-label="Clear expense search"
            onClick={(event) => {
              event.preventDefault();
              setSearch("");

              const params = new URLSearchParams(searchParams.toString());
              params.delete("q");
              params.delete("page");

              const query = params.toString();
              router.push(query ? `${pathname}?${query}` : pathname, {
                scroll: false,
              });
            }}
          >
            ×
          </button>
        )}
      </label>

      <div className="fp-expense-filter-pop" ref={dateRef}>
        <button type="button" className={`fp-expense-filter-button ${hasDate ? "active" : ""}`}
          onClick={() => { setDateOpen(v => !v); setMoreOpen(false); }}>
          <CalendarIcon /> {hasDate ? "Date Applied" : "Date Range"} <span>⌄</span>
        </button>
        {dateOpen && (
          <form className="fp-expense-popover date" onSubmit={applyDate}>
            <h3>Date Range</h3>
            <label><span>From</span><input type="date" name="dateFrom" defaultValue={searchParams.get("dateFrom") || ""}/></label>
            <label><span>To</span><input type="date" name="dateTo" defaultValue={searchParams.get("dateTo") || ""}/></label>
            <div className="fp-expense-popover-actions">
              <button type="button" onClick={() => { update({dateFrom:null,dateTo:null}); setDateOpen(false); }}>Clear</button>
              <button type="submit" className="primary">Apply</button>
            </div>
          </form>
        )}
      </div>

      <select className="fp-expense-filter-select" value={searchParams.get("category") || "all"}
        onChange={(e) => update({category:e.target.value})}>
        <option value="all">Category</option>
        <option value="fuel">Fuel</option><option value="maintenance">Maintenance</option>
        <option value="tolls">Tolls</option><option value="insurance">Insurance</option>
        <option value="other">Other</option>
      </select>

      <select className="fp-expense-filter-select" value={searchParams.get("truck") || "all"}
        onChange={(e) => update({truck:e.target.value})}>
        <option value="all">Truck</option>
        {trucks.map(t => <option key={t.id} value={t.id}>Truck #{t.unit_number}</option>)}
      </select>

      <div className="fp-expense-filter-pop" ref={moreRef}>
        <button type="button" className={`fp-expense-filter-button ${moreCount ? "active" : ""}`}
          onClick={() => { setMoreOpen(v => !v); setDateOpen(false); }}>
          <FilterIcon /> More Filters {moreCount > 0 && <b>{moreCount}</b>}
        </button>
        {moreOpen && (
          <form className="fp-expense-popover more" onSubmit={applyMore}>
            <h3>More Filters</h3>
            <label><span>Vendor contains</span><input name="vendor" defaultValue={searchParams.get("vendor") || ""}/></label>
            <div className="fp-expense-popover-grid">
              <label><span>Min Amount</span><input type="number" step="0.01" name="minAmount" defaultValue={searchParams.get("minAmount") || ""}/></label>
              <label><span>Max Amount</span><input type="number" step="0.01" name="maxAmount" defaultValue={searchParams.get("maxAmount") || ""}/></label>
            </div>
            <div className="fp-expense-popover-actions">
              <button type="button" onClick={() => { update({vendor:null,minAmount:null,maxAmount:null}); setMoreOpen(false); }}>Clear</button>
              <button type="submit" className="primary">Apply Filters</button>
            </div>
          </form>
        )}
      </div>

      <div className="fp-expense-sort">
        <span>Sort by</span>
        <select value={searchParams.get("sort") || "newest"} onChange={(e) => update({sort:e.target.value})}>
          <option value="newest">Date (Newest)</option><option value="oldest">Date (Oldest)</option>
          <option value="amount-desc">Amount (Highest)</option><option value="amount-asc">Amount (Lowest)</option>
        </select>
      </div>
    </div>
  );
}
function SearchIcon(){return <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>}
function CalendarIcon(){return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16"/></svg>}
function FilterIcon(){return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 6h16M7 12h10M10 18h4"/></svg>}
