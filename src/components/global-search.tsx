"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SearchItem = {
  id: string;
  type: "page" | "load" | "truck" | "expense" | "maintenance" | "document";
  title: string;
  subtitle: string;
  href: string;
};

const pageItems: SearchItem[] = [
  { id: "page-dashboard", type: "page", title: "Dashboard", subtitle: "Fleet overview and weekly performance", href: "/dashboard" },
  { id: "page-loads", type: "page", title: "Loads", subtitle: "Loads, brokers, routes and rates", href: "/loads" },
  { id: "page-trucks", type: "page", title: "Trucks", subtitle: "Fleet vehicles and mileage", href: "/trucks" },
  { id: "page-expenses", type: "page", title: "Expenses", subtitle: "Fuel and business expenses", href: "/expenses" },
  { id: "page-maintenance", type: "page", title: "Maintenance", subtitle: "Service records and upcoming maintenance", href: "/maintenance" },
  { id: "page-reimbursements", type: "page", title: "Reimbursements", subtitle: "Recovered out-of-pocket costs", href: "/reimbursements" },
  { id: "page-settlement", type: "page", title: "Weekly Settlement", subtitle: "Weekly revenue, fees and net profit", href: "/settlement" },
  { id: "page-fuel", type: "page", title: "Fuel Analytics", subtitle: "Fuel costs, gallons and MPG", href: "/fuel" },
  { id: "page-reports", type: "page", title: "Reports", subtitle: "Fleet reports and exports", href: "/reports" },
  { id: "page-documents", type: "page", title: "Documents", subtitle: "Fleet and company documents", href: "/documents" },
  { id: "page-pilot", type: "page", title: "Pilot AI", subtitle: "Ask MileVoxa about your business", href: "/pilot-ai" },
  { id: "page-settings", type: "page", title: "Settings", subtitle: "Account, company and preferences", href: "/settings" },
];

export default function GlobalSearch() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const pageMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pageItems.slice(0, 6);
    return pageItems.filter((item) =>
      `${item.title} ${item.subtitle}`.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    function outside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const pattern = `%${escapeLike(q)}%`;

        const [
          loadsResult,
          trucksResult,
          expensesResult,
          maintenanceResult,
          documentsResult,
        ] = await Promise.all([
          supabase
            .from("loads")
            .select("id, load_number, broker, pickup, delivery")
            .or(
              `load_number.ilike.${pattern},broker.ilike.${pattern},pickup.ilike.${pattern},delivery.ilike.${pattern}`
            )
            .limit(6),
          supabase
            .from("trucks")
            .select("id, unit_number, make, model, license_plate")
            .or(
              `unit_number.ilike.${pattern},make.ilike.${pattern},model.ilike.${pattern},license_plate.ilike.${pattern}`
            )
            .limit(6),
          supabase
            .from("expenses")
            .select("id, category, vendor, description, amount, expense_date")
            .or(
              `category.ilike.${pattern},vendor.ilike.${pattern},description.ilike.${pattern}`
            )
            .order("expense_date", { ascending: false })
            .limit(6),
          supabase
            .from("maintenance_records")
            .select("id, service_type, vendor, service_date, truck_id")
            .or(`service_type.ilike.${pattern},vendor.ilike.${pattern}`)
            .order("service_date", { ascending: false })
            .limit(6),
          supabase
            .from("documents")
            .select("id, name, document_type, file_name")
            .or(
              `name.ilike.${pattern},document_type.ilike.${pattern},file_name.ilike.${pattern}`
            )
            .limit(6),
        ]);

        if (cancelled) return;

        const items: SearchItem[] = [];

        for (const row of loadsResult.data ?? []) {
          items.push({
            id: `load-${row.id}`,
            type: "load",
            title: row.load_number ? `Load #${row.load_number}` : "Load",
            subtitle: [row.broker, row.pickup && row.delivery ? `${row.pickup} → ${row.delivery}` : row.pickup || row.delivery]
              .filter(Boolean)
              .join(" · "),
            href: `/loads?q=${encodeURIComponent(row.load_number || row.broker || q)}`,
          });
        }

        for (const row of trucksResult.data ?? []) {
          items.push({
            id: `truck-${row.id}`,
            type: "truck",
            title: `Truck #${row.unit_number || "—"}`,
            subtitle: [[row.make, row.model].filter(Boolean).join(" "), row.license_plate]
              .filter(Boolean)
              .join(" · "),
            href: `/trucks?q=${encodeURIComponent(row.unit_number || row.make || q)}`,
          });
        }

        for (const row of expensesResult.data ?? []) {
          items.push({
            id: `expense-${row.id}`,
            type: "expense",
            title: row.vendor || row.category || "Expense",
            subtitle: `${row.category || "Other"} · ${formatMoney(Number(row.amount || 0))}${row.expense_date ? ` · ${row.expense_date}` : ""}`,
            href: `/expenses?q=${encodeURIComponent(row.vendor || row.category || q)}`,
          });
        }

        for (const row of maintenanceResult.data ?? []) {
          items.push({
            id: `maintenance-${row.id}`,
            type: "maintenance",
            title: row.service_type || "Maintenance",
            subtitle: [row.vendor, row.service_date].filter(Boolean).join(" · "),
            href: `/maintenance?q=${encodeURIComponent(row.service_type || row.vendor || q)}`,
          });
        }

        if (!documentsResult.error) {
          for (const row of documentsResult.data ?? []) {
            items.push({
              id: `document-${row.id}`,
              type: "document",
              title: row.name || row.file_name || "Document",
              subtitle: row.document_type || row.file_name || "Document",
              href: `/documents`,
            });
          }
        }

        setResults(items);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const combined = [...pageMatches, ...results].slice(0, 12);

  return (
    <div className="fp-global-search" ref={rootRef}>
      <div className={`fp-global-search-box ${open ? "open" : ""}`}>
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && combined[0]) {
              window.location.href = combined[0].href;
            }
          }}
          placeholder="Search loads, trucks, expenses..."
          aria-label="Search MileVoxa"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="fp-global-search-clear"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="fp-global-search-menu">
          <div className="fp-global-search-menu-head">
            <span>{query.trim().length >= 2 ? "Search Results" : "Quick Navigation"}</span>
            {loading && <b>Searching…</b>}
          </div>

          {combined.length > 0 ? (
            <div className="fp-global-search-results">
              {combined.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="fp-global-search-result"
                  onClick={() => setOpen(false)}
                >
                  <span className={`fp-global-search-result-icon ${item.type}`}>
                    <ResultIcon type={item.type} />
                  </span>
                  <span className="fp-global-search-result-copy">
                    <strong>{item.title}</strong>
                    <small>{item.subtitle}</small>
                  </span>
                  <span className="fp-global-search-result-type">
                    {typeLabel(item.type)}
                  </span>
                  <span className="fp-global-search-result-arrow">›</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="fp-global-search-empty">
              <strong>No matches found</strong>
              <span>Try a load number, truck unit, vendor, category, route or document name.</span>
            </div>
          )}

          {query.trim().length >= 2 && (
            <div className="fp-global-search-footer">
              Press <kbd>Enter</kbd> to open the first result
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function escapeLike(value: string) {
  return value.replace(/[%_]/g, "");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function typeLabel(type: SearchItem["type"]) {
  if (type === "page") return "Page";
  if (type === "load") return "Load";
  if (type === "truck") return "Truck";
  if (type === "expense") return "Expense";
  if (type === "maintenance") return "Service";
  return "Document";
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="fp-global-search-icon" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

function ResultIcon({ type }: { type: SearchItem["type"] }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[14px] w-[14px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "load") return <svg {...common}><path d="M3 7h12v9H3zM15 10h3l3 3v3h-6z"/><circle cx="7" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/></svg>;
  if (type === "truck") return <svg {...common}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
  if (type === "expense") return <svg {...common}><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  if (type === "maintenance") return <svg {...common}><path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z"/></svg>;
  if (type === "document") return <svg {...common}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/></svg>;
  return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h6"/></svg>;
}
