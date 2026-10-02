"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { expenseRequiresLoad } from "@/lib/expense-load-link";

type Expense = {
  category: string | null;
  expense_date: string | null;
  amount: number | string | null;
  vendor: string | null;
  description: string | null;
  truck_id: string | null;
  load_id: string | null;
  gallons: number | string | null;
  fuel_price_per_gallon: number | string | null;
};

type Truck = {
  id: string;
  unit_number: string;
};

type Load = {
  id: string;
  load_number: string | null;
  pickup: string | null;
  delivery: string | null;
};

type ParsedRow = {
  expense_date: string;
  category: string;
  amount: number;
  vendor: string | null;
  description: string | null;
  truck_id: string | null;
  load_id: string | null;
  gallons: number | null;
  fuel_price_per_gallon: number | null;
};

const IMPORT_HEADERS = [
  "expense_date",
  "category",
  "amount",
  "vendor",
  "description",
  "truck_unit",
  "load_number",
  "gallons",
  "fuel_price_per_gallon",
];

export default function ExpenseQuickActions({
  expenses,
  trucks,
  loads,
}: {
  expenses: Expense[];
  trucks: Truck[];
  loads: Load[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportCategory, setExportCategory] = useState("all");
  const [exportError, setExportError] = useState("");

  function add() {
    window.dispatchEvent(new CustomEvent("fleetpilot:open-add-expense"));
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
      const parsed = parseCsv(await file.text(), loads, trucks);
      if (!parsed.length) {
        throw new Error("No valid expense rows found.");
      }
      setRows(parsed);
      setOpen(true);
    } catch (caught) {
      setRows([]);
      setError(
        caught instanceof Error ? caught.message : "Could not read CSV."
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
    const { error: insertError } = await supabase
      .from("expenses")
      .insert(rows);

    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setOpen(false);
    setRows([]);
    router.refresh();
  }


function openExportDialog() {
  setExportError("");
  setExportFrom("");
  setExportTo("");
  setExportCategory("all");
  setExportOpen(true);
}

function exportCsv() {
  setExportError("");

  if (!exportFrom || !exportTo) {
    setExportError("Choose both From and To dates.");
    return;
  }

  if (exportFrom > exportTo) {
    setExportError("From date cannot be after To date.");
    return;
  }

  const selectedExpenses = expenses.filter((expense) => {
    const date = (expense.expense_date || "").slice(0, 10);
    const inDateRange = date >= exportFrom && date <= exportTo;
    const categoryMatches =
      exportCategory === "all" ||
      (expense.category || "").trim().toLowerCase() ===
        exportCategory.toLowerCase();

    return inDateRange && categoryMatches;
  });

  if (!selectedExpenses.length) {
    setExportError(
      exportCategory === "all"
        ? `No expenses were found between ${exportFrom} and ${exportTo}.`
        : `No ${exportCategory} expenses were found between ${exportFrom} and ${exportTo}.`
    );
    return;
  }

  const truckById = new Map(
    trucks.map((truck) => [truck.id, truck.unit_number])
  );
  const loadById = new Map(
    loads.map((load) => [load.id, load.load_number || ""])
  );

  const data = [
    IMPORT_HEADERS,
    ...selectedExpenses.map((expense) => [
      expense.expense_date || "",
      expense.category || "",
      String(Number(expense.amount || 0)),
      expense.vendor || "",
      expense.description || "",
      expense.truck_id ? truckById.get(expense.truck_id) || "" : "",
      expense.load_id ? loadById.get(expense.load_id) || "" : "",
      String(Number(expense.gallons || 0) || ""),
      String(Number(expense.fuel_price_per_gallon || 0) || ""),
    ]),
  ];

  const categorySuffix =
    exportCategory === "all"
      ? "all-categories"
      : exportCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  downloadCsv(
    `milevoxa-expenses-${categorySuffix}-${exportFrom}-to-${exportTo}.csv`,
    data
  );

  setExportOpen(false);
}
  function downloadTemplate() {
    downloadCsv("milevoxa-expense-import-template.csv", [
      IMPORT_HEADERS,
      [
        "2026-09-27",
        "Fuel",
        "425.50",
        "Love's",
        "Fuel purchase",
        "101",
        "012631",
        "82.4",
        "5.164",
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
        <Action label="Add Expense" type="add" primary onClick={add} />
        <Action
          label="Import from File"
          type="import"
          onClick={openImportGuide}
        />
        <Action
          label="Export Expenses"
          type="export"
          onClick={openExportDialog}
          disabled={!expenses.length}
        />
        <Link
          href="/reimbursements"
          className="fp-expense-side-action"
        >
          <span className="fp-expense-side-icon">
            <Icon type="reimburse" />
          </span>
          <span>Reimbursements</span>
          <span>›</span>
        </Link>
      </div>

      {error && !open && (
        <div className="fp-expense-quick-error">{error}</div>
      )}

      {exportOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-expense-import-backdrop">
            <div className="fp-expense-export-modal">
              <header>
                <div>
                  <span>CSV EXPORT</span>
                  <h2>Export Expenses</h2>
                  <p>Choose the expense date range you want to export.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setExportOpen(false)}
                  aria-label="Close export dialog"
                >
                  ×
                </button>
              </header>

              <div className="fp-expense-export-body">
                <div className="fp-expense-export-date-grid">
                  <label>
                    <span>From date *</span>
                    <input
                      type="date"
                      value={exportFrom}
                      onChange={(event) => {
                        setExportFrom(event.target.value);
                        setExportError("");
                      }}
                    />
                  </label>

                  <label>
                    <span>To date *</span>
                    <input
                      type="date"
                      value={exportTo}
                      min={exportFrom || undefined}
                      onChange={(event) => {
                        setExportTo(event.target.value);
                        setExportError("");
                      }}
                    />
                  </label>
                </div>

                <label className="fp-expense-export-category">
                  <span>Expense category</span>
                  <select
                    value={exportCategory}
                    onChange={(event) => {
                      setExportCategory(event.target.value);
                      setExportError("");
                    }}
                  >
                    <option value="all">All Categories</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Tolls">Tolls</option>
                    <option value="Parking">Parking</option>
                    <option value="Scale">Scale</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Permits">Permits</option>
                    <option value="Driver Pay">Driver Pay</option>
                    <option value="Truck Payment">Truck Payment</option>
                    <option value="Trailer">Trailer</option>
                    <option value="Food / Travel">Food / Travel</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <div className="fp-expense-export-hint">
                  For a single day, select the same date in both fields.
                  Choose a category to export only that expense type, or keep
                  All Categories for the full period. The current page filters
                  do not limit the export.
                </div>

                {exportError && (
                  <div className="fp-expense-import-error">
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
                  disabled={!exportFrom || !exportTo}
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
          <div className="fp-expense-import-backdrop">
            <div className="fp-expense-import-modal fp-expense-import-guide-modal">
              <header>
                <div>
                  <span>CSV IMPORT</span>
                  <h2>Import Expenses</h2>
                  <p>
                    Use the MileVoxa CSV format below so your data can be matched
                    to trucks and loads correctly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close import guide"
                >
                  ×
                </button>
              </header>

              <div className="fp-expense-import-body">
                <section className="fp-import-guide-card">
                  <div className="fp-import-guide-title">
                    <strong>Required columns</strong>
                    <span>These must exist in the first CSV row.</span>
                  </div>
                  <div className="fp-import-chip-row">
                    <code>expense_date</code>
                    <code>category</code>
                    <code>amount</code>
                  </div>
                </section>

                <section className="fp-import-guide-card">
                  <div className="fp-import-guide-title">
                    <strong>Recommended columns</strong>
                    <span>
                      Use user-facing truck and load numbers. MileVoxa converts
                      them to database IDs during import.
                    </span>
                  </div>
                  <div className="fp-import-chip-row">
                    <code>vendor</code>
                    <code>description</code>
                    <code>truck_unit</code>
                    <code>load_number</code>
                    <code>gallons</code>
                    <code>fuel_price_per_gallon</code>
                  </div>
                </section>

                <section className="fp-import-guide-card">
                  <div className="fp-import-guide-title">
                    <strong>Accepted format</strong>
                  </div>
                  <div className="fp-import-guide-rules">
                    <span>
                      Date: <b>YYYY-MM-DD</b>
                    </span>
                    <span>
                      Amount: <b>positive number</b>
                    </span>
                    <span>
                      Truck: use the visible <b>truck unit number</b>
                    </span>
                    <span>
                      Load: use the visible <b>load number</b>
                    </span>
                  </div>
                </section>

                <section className="fp-import-guide-card">
                  <div className="fp-import-guide-title">
                    <strong>Load linking rule</strong>
                  </div>
                  <p className="fp-import-guide-copy">
                    Trip-level expenses such as Fuel, Tolls, Parking, Scale,
                    Maintenance, Food / Travel and Other must include a
                    <code> load_number</code>. Company-level costs such as
                    Insurance, Permits, Driver Pay, Truck Payment and Trailer
                    may be imported without one.
                  </p>
                </section>

                <section className="fp-import-guide-example">
                  <div className="fp-import-guide-title">
                    <strong>Example row</strong>
                  </div>
                  <code>
                    2026-09-27,Fuel,425.50,Love&apos;s,Fuel purchase,101,012631,82.4,5.164
                  </code>
                </section>

                <div className="fp-import-guide-actions">
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
                  <div className="fp-expense-import-file">
                    <strong>{fileName}</strong>
                    <span>{rows.length} valid rows ready</span>
                  </div>
                )}

                {error && (
                  <div className="fp-expense-import-error">{error}</div>
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
                  className="primary"
                  type="button"
                  onClick={importRows}
                  disabled={busy || !rows.length}
                >
                  {busy
                    ? "Importing..."
                    : rows.length
                      ? `Import ${rows.length} Expenses`
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
      className={`fp-expense-side-action ${primary ? "primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="fp-expense-side-icon">
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
  type: "add" | "import" | "export" | "reimburse";
}) {
  const c = {
    viewBox: "0 0 24 24",
    className: "h-[13px] w-[13px] fill-none stroke-current",
    strokeWidth: 1.8,
  };

  if (type === "add") {
    return <svg {...c}><path d="M12 5v14M5 12h14" /></svg>;
  }
  if (type === "import") {
    return <svg {...c}><path d="M12 3v12M8 7l4-4 4 4M5 19h14" /></svg>;
  }
  if (type === "export") {
    return <svg {...c}><path d="M12 3v12M8 11l4 4 4-4M5 19h14" /></svg>;
  }

  return (
    <svg {...c}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
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

function parseCsv(text: string, loads: Load[], trucks: Truck[]): ParsedRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    return [];
  }

  const headers = csvLine(lines[0]).map(normalizeHeader);

  for (const required of ["expense_date", "category", "amount"]) {
    if (!headers.includes(required)) {
      throw new Error(`CSV is missing required column: ${required}.`);
    }
  }

  const loadByNumber = new Map(
    loads
      .filter((load) => load.load_number)
      .map((load) => [String(load.load_number).trim().toLowerCase(), load.id])
  );

  const truckByUnit = new Map(
    trucks.map((truck) => [
      String(truck.unit_number).trim().toLowerCase(),
      truck.id,
    ])
  );

  const loadIds = new Set(loads.map((load) => load.id));
  const truckIds = new Set(trucks.map((truck) => truck.id));

  return lines.slice(1).map((line, index) => {
    const lineNumber = index + 2;
    const cells = csvLine(line);
    const raw = Object.fromEntries(
      headers.map((header, i) => [header, (cells[i] || "").trim()])
    ) as Record<string, string>;

    const expenseDate = raw.expense_date;
    const category = raw.category;
    const amount = Number(raw.amount);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate || "")) {
      throw new Error(
        `Row ${lineNumber}: expense_date must use YYYY-MM-DD.`
      );
    }

    if (!category) {
      throw new Error(`Row ${lineNumber}: category is required.`);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        `Row ${lineNumber}: amount must be a number greater than zero.`
      );
    }

    let loadId: string | null = null;
    if (raw.load_number) {
      loadId =
        loadByNumber.get(raw.load_number.trim().toLowerCase()) || null;
      if (!loadId) {
        throw new Error(
          `Row ${lineNumber}: load_number "${raw.load_number}" was not found in MileVoxa.`
        );
      }
    } else if (raw.load_id) {
      loadId = loadIds.has(raw.load_id) ? raw.load_id : null;
      if (!loadId) {
        throw new Error(
          `Row ${lineNumber}: load_id does not match a known load.`
        );
      }
    }

    if (expenseRequiresLoad(category) && !loadId) {
      throw new Error(
        `Row ${lineNumber}: ${category} requires a load_number.`
      );
    }

    let truckId: string | null = null;
    if (raw.truck_unit) {
      truckId =
        truckByUnit.get(raw.truck_unit.trim().toLowerCase()) || null;
      if (!truckId) {
        throw new Error(
          `Row ${lineNumber}: truck_unit "${raw.truck_unit}" was not found in MileVoxa.`
        );
      }
    } else if (raw.truck_id) {
      truckId = truckIds.has(raw.truck_id) ? raw.truck_id : null;
      if (!truckId) {
        throw new Error(
          `Row ${lineNumber}: truck_id does not match a known truck.`
        );
      }
    }

    const gallons = optionalPositiveNumber(raw.gallons, lineNumber, "gallons");
    const fuelPrice = optionalPositiveNumber(
      raw.fuel_price_per_gallon,
      lineNumber,
      "fuel_price_per_gallon"
    );

    return {
      expense_date: expenseDate,
      category,
      amount,
      vendor: raw.vendor || null,
      description: raw.description || null,
      truck_id: truckId,
      load_id: loadId,
      gallons,
      fuel_price_per_gallon: fuelPrice,
    };
  });
}

function optionalPositiveNumber(
  raw: string | undefined,
  lineNumber: number,
  field: string
) {
  if (!raw) return null;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `Row ${lineNumber}: ${field} must be a valid non-negative number.`
    );
  }

  return value;
}

function downloadCsv(fileName: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    )
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
  const out: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  out.push(current);
  return out;
}
