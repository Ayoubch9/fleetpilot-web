"use client";

import { useMemo, useState } from "react";
import DocumentActions from "./document-actions";

type DocumentRow = {
  id: string;
  name: string;
  document_type: string | null;
  truck_id: string | null;
  expiration_date: string | null;
  storage_path: string;
  file_name: string;
  created_at: string | null;
};

type Truck = { id: string; unit_number: string };

type Tab = "all" | "expiring" | "expired";

export default function DocumentCenter({
  docs,
  trucks,
  setupMissing,
}: {
  docs: DocumentRow[];
  trucks: Truck[];
  setupMissing: boolean;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [truckFilter, setTruckFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const truckMap = useMemo(
    () => new Map(trucks.map((truck) => [truck.id, truck])),
    [trucks]
  );

  const now = useMemo(() => new Date(), []);
  const soon = useMemo(
    () => new Date(now.getTime() + 30 * 86400000),
    [now]
  );

  function statusFor(doc: DocumentRow) {
    if (!doc.expiration_date) return "Valid";
    const exp = new Date(`${doc.expiration_date}T12:00:00`);
    if (exp < now) return "Expired";
    if (exp <= soon) return "Expiring Soon";
    return "Valid";
  }

  const counts = useMemo(() => {
    let expiring = 0;
    let expired = 0;
    for (const doc of docs) {
      const status = statusFor(doc);
      if (status === "Expiring Soon") expiring += 1;
      if (status === "Expired") expired += 1;
    }
    return { all: docs.length, expiring, expired };
  }, [docs, now, soon]);

  const documentTypes = useMemo(
    () =>
      [...new Set(docs.map((doc) => doc.document_type || "Other"))].sort(),
    [docs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return [...docs]
      .filter((doc) => {
        const status = statusFor(doc);

        if (tab === "expiring" && status !== "Expiring Soon") return false;
        if (tab === "expired" && status !== "Expired") return false;

        if (typeFilter !== "all" && (doc.document_type || "Other") !== typeFilter) {
          return false;
        }

        if (truckFilter !== "all") {
          if (truckFilter === "company" && doc.truck_id) return false;
          if (truckFilter !== "company" && doc.truck_id !== truckFilter) return false;
        }

        if (statusFilter !== "all" && status !== statusFilter) return false;

        if (q) {
          const truckLabel = doc.truck_id
            ? truckMap.get(doc.truck_id)?.unit_number || ""
            : "company";
          const haystack = [
            doc.name,
            doc.file_name,
            doc.document_type || "Other",
            truckLabel,
            status,
          ]
            .join(" ")
            .toLowerCase();

          if (!haystack.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);

        if (sort === "expiration") {
          const aDate = a.expiration_date || "9999-12-31";
          const bDate = b.expiration_date || "9999-12-31";
          return aDate.localeCompare(bDate);
        }

        const aDate = a.created_at || "";
        const bDate = b.created_at || "";
        return sort === "oldest"
          ? aDate.localeCompare(bDate)
          : bDate.localeCompare(aDate);
      });
  }, [
    docs,
    query,
    typeFilter,
    truckFilter,
    statusFilter,
    sort,
    tab,
    truckMap,
    now,
    soon,
  ]);

  return (
    <section className="fp-panel">
      <div className="fp-tabs-row fp-doc-live-tabs">
        <button
          className={tab === "all" ? "active" : ""}
          onClick={() => setTab("all")}
        >
          All Documents <b>{counts.all}</b>
        </button>
        <button
          className={tab === "expiring" ? "active" : ""}
          onClick={() => setTab("expiring")}
        >
          Expiring Soon <b>{counts.expiring}</b>
        </button>
        <button
          className={tab === "expired" ? "active" : ""}
          onClick={() => setTab("expired")}
        >
          Expired <b>{counts.expired}</b>
        </button>
      </div>

      <div className="fp-doc-live-filters">
        <div className="fp-doc-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents, file names, truck..."
          />
        </div>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">All Types</option>
          {documentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={truckFilter}
          onChange={(event) => setTruckFilter(event.target.value)}
        >
          <option value="all">All Trucks</option>
          <option value="company">Company</option>
          {trucks.map((truck) => (
            <option key={truck.id} value={truck.id}>
              Truck #{truck.unit_number}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="Valid">Valid</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
        </select>

        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Date (Newest)</option>
          <option value="oldest">Date (Oldest)</option>
          <option value="name">Name</option>
          <option value="expiration">Expiration</option>
        </select>
      </div>

      <div className="fp-doc-table-wrap">
        <table className="fp-compact-table docs">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Type</th>
              <th>Associated With</th>
              <th>Expiration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((doc, index) => {
              const status = statusFor(doc);
              return (
                <tr key={doc.id}>
                  <td>#{String(index + 1).padStart(4, "0")}</td>
                  <td>
                    <div className="fp-doc-name-cell">
                      <strong>{doc.name}</strong>
                      <small>{doc.file_name}</small>
                    </div>
                  </td>
                  <td>
                    <span className="fp-doc-type">
                      {doc.document_type || "Other"}
                    </span>
                  </td>
                  <td>
                    {doc.truck_id
                      ? `#${truckMap.get(doc.truck_id)?.unit_number || "—"}`
                      : "Company"}
                  </td>
                  <td>{doc.expiration_date || "—"}</td>
                  <td>
                    <span
                      className={`fp-doc-status ${status
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {status}
                    </span>
                  </td>
                  <td>
                    <DocumentActions id={doc.id} storagePath={doc.storage_path} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="fp-empty-docs">
          <strong>
            {docs.length === 0
              ? "No documents uploaded yet."
              : "No documents match these filters."}
          </strong>
          <span>
            {setupMissing
              ? "Complete the one-time Supabase Documents setup first."
              : docs.length === 0
                ? "Use Upload Document to begin building your fleet document center."
                : "Change the search or filters to see more documents."}
          </span>
        </div>
      )}
    </section>
  );
}
