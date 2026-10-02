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
  export_status?: string | null;
};

type Truck = {
  id: string;
  unit_number: string;
};

type ParsedMaintenanceRow = {
  truck_id: string;
  service_type: string;
  service_date: string;
  mileage: number;
  vendor: string | null;
  cost: number;
  next_service_mileage: number | null;
  next_service_date: string | null;
};

const MAINTENANCE_HEADERS = [
  "truck_unit",
  "service_type",
  "service_date",
  "mileage",
  "vendor",
  "cost",
  "next_service_mileage",
  "next_service_date",
];

export default function MaintenanceQuickActions({
  records,
  trucks,
}: {
  records: Maintenance[];
  trucks: Truck[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedMaintenanceRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportServiceFrom, setExportServiceFrom] = useState("");
  const [exportServiceTo, setExportServiceTo] = useState("");
  const [exportDueFrom, setExportDueFrom] = useState("");
  const [exportDueTo, setExportDueTo] = useState("");
  const [exportStatus, setExportStatus] = useState("all");
  const [exportTruck, setExportTruck] = useState("all");
  const [exportServiceType, setExportServiceType] = useState("all");
  const [exportError, setExportError] = useState("");

  function add() {
    window.dispatchEvent(
      new CustomEvent("fleetpilot:open-add-maintenance")
    );
  }

  function openImportGuide() {
    setRows([]);
    setFileName("");
    setError("");
    setOpen(true);
  }

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    try {
      const parsed = parseMaintenanceCsv(await file.text(), trucks);
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
    const createdMaintenanceIds: string[] = [];
    const createdExpenseIds: string[] = [];

    try {
      for (const row of rows) {
        let expenseId: string | null = null;

        if (row.cost > 0) {
          const { data: expense, error: expenseError } = await supabase
            .from("expenses")
            .insert({
              truck_id: row.truck_id,
              load_id: null,
              category: "Maintenance",
              expense_date: row.service_date,
              amount: row.cost,
              vendor: row.vendor,
              description: `${row.service_type} maintenance service`,
              gallons: null,
              fuel_price_per_gallon: null,
            })
            .select("id")
            .single();

          if (expenseError) throw expenseError;

          expenseId = expense?.id ?? null;
          if (expenseId) createdExpenseIds.push(expenseId);
        }

        const { data: maintenance, error: maintenanceError } = await supabase
          .from("maintenance_records")
          .insert({
            ...row,
            expense_id: expenseId,
          })
          .select("id")
          .single();

        if (maintenanceError) throw maintenanceError;
        if (maintenance?.id) createdMaintenanceIds.push(maintenance.id);
      }

      setOpen(false);
      setRows([]);
      router.refresh();
    } catch (caught) {
      if (createdMaintenanceIds.length > 0) {
        await supabase
          .from("maintenance_records")
          .delete()
          .in("id", createdMaintenanceIds);
      }

      if (createdExpenseIds.length > 0) {
        await supabase
          .from("expenses")
          .delete()
          .in("id", createdExpenseIds);
      }

      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to import maintenance records."
      );
    } finally {
      setBusy(false);
    }
  }


function openExportDialog() {
  setExportServiceFrom("");
  setExportServiceTo("");
  setExportDueFrom("");
  setExportDueTo("");
  setExportStatus("all");
  setExportTruck("all");
  setExportServiceType("all");
  setExportError("");
  setExportOpen(true);
}

function exportCsv() {
  setExportError("");

  if (exportServiceFrom && exportServiceTo && exportServiceFrom > exportServiceTo) {
    setExportError("Service From date cannot be after Service To date.");
    return;
  }

  if (exportDueFrom && exportDueTo && exportDueFrom > exportDueTo) {
    setExportError("Due From date cannot be after Due To date.");
    return;
  }

  const selectedRecords = records.filter((record) => {
    const serviceDate = (record.service_date || "").slice(0, 10);
    const dueDate = (record.next_service_date || "").slice(0, 10);
    const status = (record.export_status || "").toLowerCase();

    const matchesServiceFrom =
      !exportServiceFrom || serviceDate >= exportServiceFrom;
    const matchesServiceTo =
      !exportServiceTo || serviceDate <= exportServiceTo;

    const matchesDueFrom =
      !exportDueFrom || (dueDate && dueDate >= exportDueFrom);
    const matchesDueTo =
      !exportDueTo || (dueDate && dueDate <= exportDueTo);

    const matchesStatus =
      exportStatus === "all" || status === exportStatus.toLowerCase();

    const matchesTruck =
      exportTruck === "all" || record.truck_id === exportTruck;

    const matchesServiceType =
      exportServiceType === "all" ||
      (record.service_type || "").trim().toLowerCase() ===
        exportServiceType.toLowerCase();

    return (
      matchesServiceFrom &&
      matchesServiceTo &&
      matchesDueFrom &&
      matchesDueTo &&
      matchesStatus &&
      matchesTruck &&
      matchesServiceType
    );
  });

  if (!selectedRecords.length) {
    setExportError("No maintenance records match the selected export filters.");
    return;
  }

  const truckById = new Map(
    trucks.map((truck) => [truck.id, truck.unit_number])
  );

  const data = [
    [
      "Truck Unit",
      "Service Type",
      "Service Date",
      "Mileage",
      "Vendor",
      "Cost",
      "Status",
      "Next Service Mileage",
      "Next Due Date",
    ],
    ...selectedRecords.map((record) => [
      record.truck_id ? truckById.get(record.truck_id) || "" : "",
      record.service_type || "",
      record.service_date || "",
      String(Number(record.mileage || 0) || ""),
      record.vendor || "",
      String(Number(record.cost || 0) || ""),
      record.export_status || "",
      record.next_service_mileage == null
        ? ""
        : String(Number(record.next_service_mileage)),
      record.next_service_date || "",
    ]),
  ];

  const parts = ["milevoxa-maintenance"];

  if (exportTruck !== "all") {
    parts.push(`truck-${truckById.get(exportTruck) || "selected"}`);
  }

  if (exportStatus !== "all") {
    parts.push(exportStatus.toLowerCase());
  }

  if (exportServiceType !== "all") {
    parts.push(
      exportServiceType.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    );
  }

  if (exportServiceFrom || exportServiceTo) {
    parts.push(
      `service-${exportServiceFrom || "start"}-to-${exportServiceTo || "end"}`
    );
  }

  if (exportDueFrom || exportDueTo) {
    parts.push(
      `due-${exportDueFrom || "start"}-to-${exportDueTo || "end"}`
    );
  }

  downloadCsv(`${parts.join("-")}.csv`, data);
  setExportOpen(false);
}
  function downloadTemplate() {
    downloadCsv("milevoxa-maintenance-import-template.csv", [
      MAINTENANCE_HEADERS,
      [
        "101",
        "Oil Change",
        "2026-09-27",
        "485250",
        "Speedco",
        "389.50",
        "500000",
        "2026-12-27",
      ],
    ]);
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
          onClick={openImportGuide}
        />
        <Action
          label="Export Maintenance"
          type="export"
          onClick={openExportDialog}
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

      {exportOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-maint-import-backdrop">
            <div className="fp-maint-export-modal">
              <header>
                <div>
                  <span>CSV EXPORT</span>
                  <h2>Export Maintenance</h2>
                  <p>
                    Choose the maintenance records you want to include.
                    Leave a filter on All or blank to include everything.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExportOpen(false)}
                  aria-label="Close maintenance export dialog"
                >
                  ×
                </button>
              </header>

              <div className="fp-maint-export-body">
                <div className="fp-maint-export-section">
                  <strong>Service date</strong>
                  <div className="fp-maint-export-grid">
                    <label>
                      <span>From</span>
                      <input
                        type="date"
                        value={exportServiceFrom}
                        onChange={(event) => {
                          setExportServiceFrom(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>

                    <label>
                      <span>To</span>
                      <input
                        type="date"
                        min={exportServiceFrom || undefined}
                        value={exportServiceTo}
                        onChange={(event) => {
                          setExportServiceTo(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="fp-maint-export-section">
                  <strong>Next due date</strong>
                  <div className="fp-maint-export-grid">
                    <label>
                      <span>From</span>
                      <input
                        type="date"
                        value={exportDueFrom}
                        onChange={(event) => {
                          setExportDueFrom(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>

                    <label>
                      <span>To</span>
                      <input
                        type="date"
                        min={exportDueFrom || undefined}
                        value={exportDueTo}
                        onChange={(event) => {
                          setExportDueTo(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="fp-maint-export-grid fp-maint-export-select-grid">
                  <label>
                    <span>Status</span>
                    <select
                      value={exportStatus}
                      onChange={(event) => {
                        setExportStatus(event.target.value);
                        setExportError("");
                      }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </label>

                  <label>
                    <span>Truck</span>
                    <select
                      value={exportTruck}
                      onChange={(event) => {
                        setExportTruck(event.target.value);
                        setExportError("");
                      }}
                    >
                      <option value="all">All Trucks</option>
                      {trucks.map((truck) => (
                        <option key={truck.id} value={truck.id}>
                          Truck #{truck.unit_number}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="fp-maint-export-service-type">
                  <span>Service Type</span>
                  <select
                    value={exportServiceType}
                    onChange={(event) => {
                      setExportServiceType(event.target.value);
                      setExportError("");
                    }}
                  >
                    <option value="all">All Service Types</option>
                    {Array.from(
                      new Set(
                        records
                          .map((record) => (record.service_type || "").trim())
                          .filter(Boolean)
                      )
                    )
                      .sort((a, b) => a.localeCompare(b))
                      .map((serviceType) => (
                        <option key={serviceType} value={serviceType}>
                          {serviceType}
                        </option>
                      ))}
                  </select>
                </label>

                <div className="fp-maint-export-hint">
                  Example: choose Truck #101 + Overdue to export only overdue
                  maintenance for that truck. You can also combine service-date
                  and due-date ranges.
                </div>

                {exportError && (
                  <div className="fp-maint-import-error">
                    {exportError}
                  </div>
                )}
              </div>

              <footer>
                <button
                  type="button"
                  onClick={() => setExportOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={exportCsv}
                >
                  Export CSV
                </button>
              </footer>
            </div>
          </div>,
          document.body
        )}

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-maint-import-backdrop">
            <div className="fp-maint-import-modal fp-maint-import-guide-modal">
              <header>
                <div>
                  <span>CSV IMPORT</span>
                  <h2>Import Maintenance</h2>
                  <p>
                    Use the MileVoxa maintenance CSV format so each service is
                    matched to the correct truck.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close maintenance import guide"
                >
                  ×
                </button>
              </header>

              <div className="fp-maint-import-body">
                <section className="fp-maint-import-guide-card">
                  <div className="fp-maint-import-guide-title">
                    <strong>Required columns</strong>
                    <span>These must exist in the first CSV row.</span>
                  </div>
                  <div className="fp-maint-import-chip-row">
                    <code>truck_unit</code>
                    <code>service_type</code>
                    <code>service_date</code>
                  </div>
                </section>

                <section className="fp-maint-import-guide-card">
                  <div className="fp-maint-import-guide-title">
                    <strong>Optional columns</strong>
                    <span>
                      Add these for more complete maintenance history and
                      scheduling.
                    </span>
                  </div>
                  <div className="fp-maint-import-chip-row">
                    <code>mileage</code>
                    <code>vendor</code>
                    <code>cost</code>
                    <code>next_service_mileage</code>
                    <code>next_service_date</code>
                  </div>
                </section>

                <section className="fp-maint-import-guide-card">
                  <div className="fp-maint-import-guide-title">
                    <strong>Accepted format</strong>
                  </div>
                  <div className="fp-maint-import-guide-rules">
                    <span>
                      Dates: <b>YYYY-MM-DD</b>
                    </span>
                    <span>
                      Truck: visible <b>unit number</b>, for example 101
                    </span>
                    <span>
                      Mileage: <b>non-negative number</b>
                    </span>
                    <span>
                      Cost: <b>non-negative number</b>
                    </span>
                  </div>
                </section>

                <section className="fp-maint-import-guide-card">
                  <div className="fp-maint-import-guide-title">
                    <strong>Accounting behavior</strong>
                  </div>
                  <p className="fp-maint-import-guide-copy">
                    If <code>cost</code> is greater than $0, MileVoxa also
                    creates the matching Maintenance expense automatically,
                    just like adding maintenance manually. This keeps Expenses,
                    Weekly Settlement and maintenance totals synchronized.
                  </p>
                </section>

                <section className="fp-maint-import-guide-example">
                  <div className="fp-maint-import-guide-title">
                    <strong>Example row</strong>
                  </div>
                  <code>
                    101,Oil Change,2026-09-27,485250,Speedco,389.50,500000,2026-12-27
                  </code>
                </section>

                <div className="fp-maint-import-guide-actions">
                  <button type="button" onClick={downloadTemplate}>
                    Download CSV Template
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose CSV File
                  </button>
                </div>

                {fileName && (
                  <div className="fp-maint-import-file">
                    <strong>{fileName}</strong>
                    <span>{rows.length} valid rows ready</span>
                  </div>
                )}

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
                    : rows.length
                      ? `Import ${rows.length} Services`
                      : "Choose a File First"}
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

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseMaintenanceCsv(
  text: string,
  trucks: Truck[]
): ParsedMaintenanceRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) return [];

  const headers = csvLine(lines[0]).map(normalizeHeader);

  for (const required of [
    "truck_unit",
    "service_type",
    "service_date",
  ]) {
    if (!headers.includes(required)) {
      throw new Error(`CSV is missing required column: ${required}.`);
    }
  }

  const truckByUnit = new Map(
    trucks.map((truck) => [
      String(truck.unit_number).trim().toLowerCase(),
      truck.id,
    ])
  );

  return lines.slice(1).map((line, index) => {
    const rowNumber = index + 2;
    const cells = csvLine(line);
    const raw = Object.fromEntries(
      headers.map((header, cellIndex) => [
        header,
        (cells[cellIndex] || "").trim(),
      ])
    ) as Record<string, string>;

    const truckUnit = raw.truck_unit;
    const truckId = truckByUnit.get(truckUnit.toLowerCase());

    if (!truckUnit || !truckId) {
      throw new Error(
        `Row ${rowNumber}: truck_unit "${truckUnit || ""}" was not found in MileVoxa.`
      );
    }

    if (!raw.service_type) {
      throw new Error(`Row ${rowNumber}: service_type is required.`);
    }

    if (!isDate(raw.service_date)) {
      throw new Error(
        `Row ${rowNumber}: service_date must use YYYY-MM-DD.`
      );
    }

    if (raw.next_service_date && !isDate(raw.next_service_date)) {
      throw new Error(
        `Row ${rowNumber}: next_service_date must use YYYY-MM-DD.`
      );
    }

    const mileage = optionalNonNegativeNumber(
      raw.mileage,
      rowNumber,
      "mileage"
    ) ?? 0;

    const cost = optionalNonNegativeNumber(
      raw.cost,
      rowNumber,
      "cost"
    ) ?? 0;

    const nextServiceMileage = optionalNonNegativeNumber(
      raw.next_service_mileage,
      rowNumber,
      "next_service_mileage"
    );

    return {
      truck_id: truckId,
      service_type: raw.service_type,
      service_date: raw.service_date,
      mileage,
      vendor: raw.vendor || null,
      cost,
      next_service_mileage: nextServiceMileage,
      next_service_date: raw.next_service_date || null,
    };
  });
}

function optionalNonNegativeNumber(
  raw: string | undefined,
  rowNumber: number,
  field: string
) {
  if (!raw) return null;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `Row ${rowNumber}: ${field} must be a valid non-negative number.`
    );
  }

  return value;
}

function isDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function downloadCsv(fileName: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
  return `"${String(value).replaceAll('"', '""')}"`;
}
