"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Maintenance = {
  id: string;
  truck_id: string | null;
  service_type: string | null;
  service_date: string | null;
  mileage: number | string | null;
  vendor: string | null;
  cost: number | string | null;
  next_service_mileage: number | string | null;
  next_service_date: string | null;
  expense_id: string | null;
};

export default function MaintenanceQuickActions({
  records,
}: {
  records: Maintenance[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function add() {
    window.dispatchEvent(
      new CustomEvent("fleetpilot:open-add-maintenance")
    );
  }

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    try {
      const parsed = parseMaintenanceCsv(await file.text());
      if (!parsed.length) {
        throw new Error("No valid maintenance rows found.");
      }
      setRows(parsed);
      setOpen(true);
    } catch (caught) {
      setRows([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not read maintenance CSV."
      );
      setOpen(true);
    } finally {
      event.target.value = "";
    }
  }

  async function importRows() {
    if (!rows.length) return;

    setBusy(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_records")
      .insert(rows);

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setOpen(false);
    setRows([]);
    router.refresh();
  }

  function exportCsv() {
    if (!records.length) {
      setError("No maintenance records in the current view to export.");
      return;
    }

    const data = [
      [
        "Truck ID",
        "Service Type",
        "Service Date",
        "Mileage",
        "Vendor",
        "Cost",
        "Next Service Mileage",
        "Next Service Date",
      ],
      ...records.map((record) => [
        record.truck_id || "",
        record.service_type || "",
        record.service_date || "",
        String(Number(record.mileage || 0)),
        record.vendor || "",
        String(Number(record.cost || 0)),
        record.next_service_mileage == null
          ? ""
          : String(Number(record.next_service_mileage)),
        record.next_service_date || "",
      ]),
    ];

    const csv = data
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fleetpilot-maintenance-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={choose}
      />

      <div className="mt-3 grid gap-2">
        <Action label="Add Maintenance" type="add" primary onClick={add} />
        <Action
          label="Import from File"
          type="import"
          onClick={() => fileRef.current?.click()}
        />
        <Action
          label="Export Maintenance"
          type="export"
          onClick={exportCsv}
          disabled={!records.length}
        />
        <Link
          href="/maintenance?state=overdue"
          className="fp-maint-side-action"
        >
          <span className="fp-maint-side-icon">
            <Icon type="overdue" />
          </span>
          <span>View Overdue</span>
          <span>›</span>
        </Link>
      </div>

      {error && !open && (
        <div className="fp-maint-quick-error">{error}</div>
      )}

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-maint-import-backdrop">
            <div className="fp-maint-import-modal">
              <header>
                <div>
                  <span>CSV IMPORT</span>
                  <h2>Import Maintenance</h2>
                  <p>Review the file before importing service records.</p>
                </div>
                <button type="button" onClick={() => setOpen(false)}>
                  ×
                </button>
              </header>

              <div className="fp-maint-import-body">
                <div className="fp-maint-import-file">
                  <strong>{fileName}</strong>
                  <span>{rows.length} valid rows</span>
                </div>

                <div className="fp-maint-import-format">
                  <strong>Required columns</strong>
                  <span>
                    truck_id, service_type, service_date. Optional:
                    mileage, vendor, cost, next_service_mileage,
                    next_service_date.
                  </span>
                </div>

                {error && (
                  <div className="fp-maint-import-error">{error}</div>
                )}
              </div>

              <footer>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={importRows}
                  disabled={busy || !rows.length}
                >
                  {busy
                    ? "Importing..."
                    : `Import ${rows.length} Services`}
                </button>
              </footer>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function Action({
  label,
  type,
  primary = false,
  onClick,
  disabled = false,
}: {
  label: string;
  type: "add" | "import" | "export";
  primary?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`fp-maint-side-action ${primary ? "primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="fp-maint-side-icon">
        <Icon type={type} />
      </span>
      <span>{label}</span>
      <span>›</span>
    </button>
  );
}

function Icon({
  type,
}: {
  type: "add" | "import" | "export" | "overdue";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[13px] w-[13px] fill-none stroke-current",
    strokeWidth: 1.8,
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
        <path d="M12 3v12M8 7l4-4 4 4M5 19h14" />
      </svg>
    );
  }

  if (type === "export") {
    return (
      <svg {...common}>
        <path d="M12 3v12M8 11l4 4 4-4M5 19h14" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="m12 3 9 16H3L12 3Z" />
      <path d="M12 9v4M12 16h.01" />
    </svg>
  );
}

function parseMaintenanceCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = csvLine(lines[0]).map((header) =>
    header
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
  );

  for (const required of [
    "truck_id",
    "service_type",
    "service_date",
  ]) {
    if (!headers.includes(required)) {
      throw new Error(`CSV is missing ${required}.`);
    }
  }

  return lines
    .slice(1)
    .map(csvLine)
    .map((cells) =>
      Object.fromEntries(
        headers.map((header, index) => [
          header,
          (cells[index] || "").trim(),
        ])
      )
    )
    .filter(
      (row) =>
        row.truck_id && row.service_type && row.service_date
    )
    .map((row) => ({
      truck_id: row.truck_id,
      service_type: row.service_type,
      service_date: row.service_date,
      mileage: row.mileage ? Number(row.mileage) : 0,
      vendor: row.vendor || null,
      cost: row.cost ? Number(row.cost) : 0,
      next_service_mileage: row.next_service_mileage
        ? Number(row.next_service_mileage)
        : null,
      next_service_date: row.next_service_date || null,
      expense_id: null,
    }));
}

function csvLine(line: string) {
  const output: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      output.push(value);
      value = "";
    } else {
      value += character;
    }
  }

  output.push(value);
  return output;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
