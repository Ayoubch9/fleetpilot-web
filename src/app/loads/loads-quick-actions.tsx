"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeUsLocation, validateLoadMiles } from "@/lib/load-domain";

type Load = {
  id: string;
  load_number: string | null;
  broker: string | null;
  pickup: string | null;
  delivery: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  rate: number | string | null;
  loaded_miles: number | string | null;
  deadhead_miles: number | string | null;
  status: string | null;
  truck_id: string | null;
};

type ExportLoad = Load & {
  profit: number | null;
};

export default function LoadsQuickActions({
  loads,
  exportLoads,
}: {
  loads: Load[];
  exportLoads: ExportLoad[];
}) {
  const router = useRouter();
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedLoad = useMemo(
    () => loads.find((load) => load.id === selectedLoadId) || null,
    [loads, selectedLoadId]
  );

  function openAdd(mode: "add" | "import") {
    window.dispatchEvent(
      new CustomEvent("fleetpilot:open-add-load", {
        detail: { mode },
      })
    );
  }

  async function duplicateLoad() {
    if (!selectedLoad) {
      setError("Choose a load to duplicate.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const copyNumber = makeCopyNumber(
        selectedLoad.load_number || "LOAD"
      );

      const mileage = validateLoadMiles(
        selectedLoad.loaded_miles,
        selectedLoad.deadhead_miles
      );
      const pickup = normalizeUsLocation(selectedLoad.pickup || "");
      const delivery = normalizeUsLocation(selectedLoad.delivery || "");

      if (!mileage.ok) throw new Error(mileage.error);
      if (!pickup.ok) throw new Error(`Pickup: ${pickup.error}`);
      if (!delivery.ok) throw new Error(`Delivery: ${delivery.error}`);

      const { error } = await supabase.from("loads").insert({
        truck_id: selectedLoad.truck_id,
        load_number: copyNumber,
        broker: selectedLoad.broker,
        pickup: pickup.value,
        delivery: delivery.value,
        pickup_date: selectedLoad.pickup_date,
        delivery_date: selectedLoad.delivery_date,
        rate: Number(selectedLoad.rate || 0),
        loaded_miles: mileage.loadedMiles,
        deadhead_miles: mileage.deadheadMiles,
        status: "UPCOMING",
      });

      if (error) throw error;

      setDuplicateOpen(false);
      setSelectedLoadId("");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not duplicate this load."
      );
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    if (exportLoads.length === 0) {
      setError("There are no loads in the current view to export.");
      return;
    }

    const rows = [
      [
        "Load #",
        "Broker / Customer",
        "Pickup",
        "Delivery",
        "Pickup Date",
        "Delivery Date",
        "Rate",
        "Loaded Miles",
        "Deadhead Miles",
        "Profit",
        "Status",
      ],
      ...exportLoads.map((load) => [
        load.load_number || "",
        load.broker || "",
        load.pickup || "",
        load.delivery || "",
        load.pickup_date || "",
        load.delivery_date || "",
        String(Number(load.rate || 0)),
        load.loaded_miles == null ? "" : String(Number(load.loaded_miles)),
        load.deadhead_miles == null ? "" : String(Number(load.deadhead_miles)),
        load.profit == null ? "" : String(load.profit),
        load.status || "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `milevoxa-loads-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setError("");
  }

  return (
    <>
      <div className="mt-3 grid gap-2">
        <ActionButton
          label="Add Load"
          type="add"
          primary
          onClick={() => openAdd("add")}
        />
        <ActionButton
          label="Add from Telegram"
          type="import"
          onClick={() => openAdd("import")}
        />
        <ActionButton
          label="Duplicate Load"
          type="duplicate"
          onClick={() => {
            setError("");
            setDuplicateOpen(true);
          }}
          disabled={loads.length === 0}
        />
        <ActionButton
          label="Export Loads"
          type="export"
          onClick={exportCsv}
          disabled={exportLoads.length === 0}
        />
      </div>

      {error && !duplicateOpen && (
        <div className="fp-load-quick-error">{error}</div>
      )}

      {duplicateOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fp-duplicate-load-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) {
                setDuplicateOpen(false);
                setError("");
              }
            }}
          >
            <div className="fp-duplicate-load-modal">
              <header>
                <div>
                  <span>Quick Action</span>
                  <h2>Duplicate Load</h2>
                  <p>
                    Choose an existing load. MileVoxa will create a new
                    Upcoming copy that you can edit afterward.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDuplicateOpen(false)}
                  disabled={saving}
                >
                  ×
                </button>
              </header>

              <div className="fp-duplicate-load-body">
                <label>
                  <span>Load to duplicate</span>
                  <select
                    value={selectedLoadId}
                    onChange={(event) =>
                      setSelectedLoadId(event.target.value)
                    }
                  >
                    <option value="">Select a load</option>
                    {loads.map((load) => (
                      <option key={load.id} value={load.id}>
                        #{load.load_number || "—"} ·{" "}
                        {load.pickup || "Unknown"} →{" "}
                        {load.delivery || "Unknown"}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedLoad && (
                  <div className="fp-duplicate-load-preview">
                    <strong>
                      #{selectedLoad.load_number || "—"}
                    </strong>
                    <span>
                      {selectedLoad.pickup || "Unknown"} →{" "}
                      {selectedLoad.delivery || "Unknown"}
                    </span>
                    <small>
                      {selectedLoad.broker || "No broker"} · $
                      {Number(selectedLoad.rate || 0).toLocaleString()}
                    </small>
                  </div>
                )}

                {error && (
                  <div className="fp-duplicate-load-error">
                    {error}
                  </div>
                )}
              </div>

              <footer>
                <button
                  type="button"
                  onClick={() => setDuplicateOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={duplicateLoad}
                  disabled={saving || !selectedLoad}
                >
                  {saving ? "Duplicating..." : "Duplicate Load"}
                </button>
              </footer>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function ActionButton({
  label,
  type,
  primary = false,
  onClick,
  disabled = false,
}: {
  label: string;
  type: "add" | "import" | "duplicate" | "export";
  primary?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`fp-load-side-action ${
        primary ? "primary" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="fp-load-side-icon">
        <ActionIcon type={type} />
      </span>
      <span>{label}</span>
      <span>›</span>
    </button>
  );
}

function ActionIcon({
  type,
}: {
  type: "add" | "import" | "duplicate" | "export";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[13px] w-[13px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "add") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (type === "import") {
    return (
      <svg {...common}>
        <path d="M12 3v12M8 7l4-4 4 4M5 15v5h14v-5" />
      </svg>
    );
  }
  if (type === "duplicate") {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3v12M8 11l4 4 4-4M5 19h14" />
    </svg>
  );
}

function makeCopyNumber(value: string) {
  const clean = value.replace(/\s+COPY(?:-\d+)?$/i, "").trim();
  return `${clean} COPY-${String(Date.now()).slice(-4)}`;
}

function csvCell(value: string) {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}
