"use client";

import AppTabs from "@/components/app-tabs";
import { useEffect, useMemo, useState } from "react";
import DocumentActions from "./document-actions";
import { documentStatus } from "@/lib/document-domain";

type Doc = {
  id: string;
  name: string;
  document_type: string | null;
  truck_id: string | null;
  expiration_date: string | null;
  storage_path: string;
  file_name: string;
  created_at: string | null;
  folder_id: string | null;
  jurisdiction: string | null;
  document_number: string | null;
  carry_in_truck: boolean;
  issue_date: string | null;
  effective_date: string | null;
  notes: string | null;
};

type Truck = { id: string; unit_number: string };
type Folder = { id: string; name: string };
type Tab = "all" | "expiring" | "expired";

export default function DocumentCenter({
  docs,
  trucks,
  folders,
  setupMissing,
  initialSearch = "",
  initialFocus = "",
}: {
  docs: Doc[];
  trucks: Truck[];
  folders: Folder[];
  setupMissing: boolean;
  initialSearch?: string;
  initialFocus?: string;
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState("all");
  const [truckFilter, setTruckFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [folderFilter, setFolderFilter] = useState("all");
  const [packOnly, setPackOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [focusedId, setFocusedId] = useState(initialFocus);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialSearch));

  const truckMap = useMemo(
    () => new Map(trucks.map((truck) => [truck.id, truck])),
    [trucks]
  );
  const folderMap = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders]
  );

  const types = useMemo(
    () => [...new Set(docs.map((doc) => doc.document_type || "Other"))].sort(),
    [docs]
  );

  const counts = useMemo(
    () => ({
      all: docs.length,
      expiring: docs.filter(
        (doc) => documentStatus(doc.expiration_date) === "Expiring Soon"
      ).length,
      expired: docs.filter(
        (doc) => documentStatus(doc.expiration_date) === "Expired"
      ).length,
    }),
    [docs]
  );

  function searchableText(doc: Doc) {
    return [
      doc.name,
      doc.file_name,
      doc.document_type || "Other",
      doc.jurisdiction || "",
      doc.document_number || "",
      doc.truck_id
        ? truckMap.get(doc.truck_id)?.unit_number || ""
        : "company",
      doc.folder_id
        ? folderMap.get(doc.folder_id)?.name || ""
        : "",
      documentStatus(doc.expiration_date),
    ]
      .join(" ")
      .toLowerCase();
  }

  const directMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return docs
      .filter((doc) => searchableText(doc).includes(q))
      .slice(0, 8);
  }, [docs, query, truckMap, folderMap]);

  const filtered = useMemo(() => {
    return [...docs]
      .filter((doc) => {
        const status = documentStatus(doc.expiration_date);

        if (tab === "expiring" && status !== "Expiring Soon") return false;
        if (tab === "expired" && status !== "Expired") return false;
        if (
          typeFilter !== "all" &&
          (doc.document_type || "Other") !== typeFilter
        ) return false;

        if (truckFilter !== "all") {
          if (truckFilter === "company" && doc.truck_id) return false;
          if (
            truckFilter !== "company" &&
            doc.truck_id !== truckFilter
          ) return false;
        }

        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (
          folderFilter !== "all" &&
          (doc.folder_id || "") !== folderFilter
        ) return false;
        if (packOnly && !doc.carry_in_truck) return false;

        const q = query.trim().toLowerCase();
        if (q && !searchableText(doc).includes(q)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "expiration") {
          return (a.expiration_date || "9999-12-31").localeCompare(
            b.expiration_date || "9999-12-31"
          );
        }
        if (sort === "oldest") {
          return (a.created_at || "").localeCompare(b.created_at || "");
        }
        return (b.created_at || "").localeCompare(a.created_at || "");
      });
  }, [
    docs,
    query,
    typeFilter,
    truckFilter,
    statusFilter,
    folderFilter,
    packOnly,
    sort,
    tab,
    truckMap,
    folderMap,
  ]);

  function scrollToDocument(id: string) {
    window.setTimeout(() => {
      window.document
        .getElementById(`document-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 90);
  }

  function revealDocument(doc: Doc) {
    setTab("all");
    setTypeFilter("all");
    setTruckFilter("all");
    setStatusFilter("all");
    setFolderFilter("all");
    setPackOnly(false);
    setQuery(doc.name);
    setFocusedId(doc.id);
    setSearchOpen(false);

    const url = new URL(window.location.href);
    url.searchParams.set("q", doc.name);
    url.searchParams.set("focus", doc.id);
    url.hash = `document-${doc.id}`;
    window.history.replaceState({}, "", url.toString());

    scrollToDocument(doc.id);
  }

  useEffect(() => {
    const viewExpiring = () => {
      setTab("expiring");
      setStatusFilter("all");
      setFocusedId("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener(
      "milevoxa:documents-view-expiring",
      viewExpiring
    );
    return () =>
      window.removeEventListener(
        "milevoxa:documents-view-expiring",
        viewExpiring
      );
  }, []);

  useEffect(() => {
    if (!initialSearch && !initialFocus) return;

    setTab("all");
    setTypeFilter("all");
    setTruckFilter("all");
    setStatusFilter("all");
    setFolderFilter("all");
    setPackOnly(false);

    if (initialSearch) setQuery(initialSearch);
    if (initialFocus) setFocusedId(initialFocus);

    const timer = window.setTimeout(() => {
      const q = initialSearch.trim().toLowerCase();
      const targetId =
        initialFocus ||
        docs.find((doc) => q && searchableText(doc).includes(q))?.id;

      if (!targetId) return;
      setFocusedId(targetId);
      scrollToDocument(targetId);
    }, 140);

    return () => window.clearTimeout(timer);
  }, [initialSearch, initialFocus, docs]);

  useEffect(() => {
    if (!focusedId) return;
    const timer = window.setTimeout(() => {
      setFocusedId((current) =>
        current === focusedId ? "" : current
      );
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [focusedId]);

  return (
    <section className="fp-panel fp-doc-center">
      <AppTabs
        activeKey={tab}
        ariaLabel="Document status"
        items={[
          { key: "all", label: "All Documents", count: counts.all },
          { key: "expiring", label: "Expiring Soon", count: counts.expiring },
          { key: "expired", label: "Expired", count: counts.expired },
        ]}
        onChange={(key) => setTab(key as Tab)}
      />

      <div className="fp-doc-live-filters">
        <div className="fp-doc-search fp-doc-search-smart">
          <span>⌕</span>
          <input
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setFocusedId("");
              setSearchOpen(true);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                directMatches.length > 0
              ) {
                event.preventDefault();
                revealDocument(directMatches[0]);
              }
              if (event.key === "Escape") {
                setSearchOpen(false);
              }
            }}
            placeholder="Search document, truck, jurisdiction, credential..."
          />

          {query && (
            <button
              type="button"
              className="fp-doc-search-clear"
              aria-label="Clear document search"
              onClick={() => {
                setQuery("");
                setFocusedId("");
                setSearchOpen(false);
              }}
            >
              ×
            </button>
          )}

          {searchOpen && query.trim().length >= 2 && (
            <div className="fp-doc-search-results">
              <div className="fp-doc-search-results-head">
                <span>Matching Documents</span>
                <b>{directMatches.length}</b>
              </div>

              {directMatches.length > 0 ? (
                directMatches.map((doc) => (
                  <button
                    type="button"
                    key={doc.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => revealDocument(doc)}
                  >
                    <span className="fp-doc-search-result-icon">▣</span>
                    <span>
                      <strong>{doc.name}</strong>
                      <small>
                        {[
                          doc.document_type || "Other",
                          doc.truck_id
                            ? `Truck #${truckMap.get(doc.truck_id)?.unit_number || "—"}`
                            : "Company",
                          doc.jurisdiction,
                          doc.expiration_date
                            ? `Exp. ${doc.expiration_date}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </span>
                    <em>›</em>
                  </button>
                ))
              ) : (
                <div className="fp-doc-search-no-results">
                  No matching documents
                </div>
              )}

              {directMatches.length > 0 && (
                <div className="fp-doc-search-hint">
                  Click a result to jump to its exact row
                </div>
              )}
            </div>
          )}
        </div>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {types.map((type) => <option key={type}>{type}</option>)}
        </select>

        <select value={truckFilter} onChange={(e) => setTruckFilter(e.target.value)}>
          <option value="all">All Trucks</option>
          <option value="company">Company</option>
          {trucks.map((truck) => (
            <option key={truck.id} value={truck.id}>
              Truck #{truck.unit_number}
            </option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option>Valid</option>
          <option>Expiring Soon</option>
          <option>Expired</option>
        </select>

        <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)}>
          <option value="all">All Folders</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`fp-doc-pack-filter ${packOnly ? "active" : ""}`}
          onClick={() => setPackOnly((value) => !value)}
        >
          Truck Pack
        </button>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Date (Newest)</option>
          <option value="oldest">Date (Oldest)</option>
          <option value="name">Name</option>
          <option value="expiration">Expiration</option>
        </select>
      </div>

      <div className="fp-doc-search-status" aria-live="polite">
        {query.trim() ? (
          <>
            <b>{filtered.length}</b>{" "}
            {filtered.length === 1 ? "document" : "documents"} found for{" "}
            <strong>“{query.trim()}”</strong>
          </>
        ) : (
          <>{filtered.length} documents shown</>
        )}
      </div>

      <div className="fp-doc-table-wrap">
        <table className="fp-compact-table docs">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Type</th>
              <th>Associated With</th>
              <th>Jurisdiction</th>
              <th>Expiration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, index) => {
              const status = documentStatus(doc.expiration_date);
              return (
                <tr
                  key={doc.id}
                  id={`document-${doc.id}`}
                  className={
                    focusedId === doc.id
                      ? "fp-doc-row-focused"
                      : undefined
                  }
                >
                  <td>#{String(index + 1).padStart(4, "0")}</td>
                  <td>
                    <div className="fp-doc-name-cell">
                      <strong>
                        {doc.name}
                        {doc.carry_in_truck && (
                          <i className="fp-doc-pack-badge">TRUCK PACK</i>
                        )}
                      </strong>
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
                  <td>{doc.jurisdiction || "—"}</td>
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
                    <DocumentActions
                      document={doc}
                      trucks={trucks}
                      folders={folders}
                    />
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
              ? "Run the Documents Command Center migration first."
              : docs.length === 0
                ? "Upload your first truck or company document."
                : "Change the filters to see more documents."}
          </span>
        </div>
      )}
    </section>
  );
}
