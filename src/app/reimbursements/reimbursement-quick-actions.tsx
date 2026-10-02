"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Reimbursement = {
  id: string;
  expense_id: string | null;
  truck_id: string | null;
  category: string | null;
  reference: string | null;
  reimbursement_date: string | null;
  amount: number | string | null;
  notes: string | null;
  export_kind?: string | null;
};

type Expense = {
  id: string;
  category: string | null;
  vendor: string | null;
  amount: number | string | null;
  expense_date: string | null;
  truck_id: string | null;
};

type Truck = {
  id: string;
  unit_number: string;
};

type ParsedReimbursement = {
  expense_id: string | null;
  truck_id: string | null;
  category: string;
  reference: string | null;
  reimbursement_date: string;
  amount: number;
  notes: string | null;
};

const REIMBURSEMENT_HEADERS = [
  "reimbursement_date",
  "amount",
  "category",
  "truck_unit",
  "expense_number",
  "reference",
  "notes",
];

export default function ReimbursementQuickActions({
  rows,
  expenses,
  trucks,
}: {
  rows: Reimbursement[];
  expenses: Expense[];
  trucks: Truck[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [importRows, setImportRows] = useState<ParsedReimbursement[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportKind, setExportKind] = useState("all");
  const [exportTruck, setExportTruck] = useState("all");
  const [exportCategory, setExportCategory] = useState("all");
  const [exportMinAmount, setExportMinAmount] = useState("");
  const [exportMaxAmount, setExportMaxAmount] = useState("");
  const [exportError, setExportError] = useState("");

  function add() {
    window.dispatchEvent(
      new CustomEvent("fleetpilot:open-add-reimbursement")
    );
  }

  function openImportGuide() {
    setImportRows([]);
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
      const parsed = parseCsv(await file.text(), expenses, trucks);
      if (!parsed.length) {
        throw new Error("No valid reimbursement rows found.");
      }
      setImportRows(parsed);
      setOpen(true);
    } catch (caught) {
      setImportRows([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not read reimbursement CSV."
      );
      setOpen(true);
    } finally {
      event.target.value = "";
    }
  }

  async function doImport() {
    if (!importRows.length) return;

    setBusy(true);
    setError("");

    const { error: insertError } = await createClient()
      .from("reimbursements")
      .insert(importRows);

    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setOpen(false);
    setImportRows([]);
    router.refresh();
  }


function openExportDialog() {
  setExportFrom("");
  setExportTo("");
  setExportKind("all");
  setExportTruck("all");
  setExportCategory("all");
  setExportMinAmount("");
  setExportMaxAmount("");
  setExportError("");
  setExportOpen(true);
}

function exportCsv() {
  setExportError("");

  if (exportFrom && exportTo && exportFrom > exportTo) {
    setExportError("From date cannot be after To date.");
    return;
  }

  const minAmount = exportMinAmount === "" ? null : Number(exportMinAmount);
  const maxAmount = exportMaxAmount === "" ? null : Number(exportMaxAmount);

  if (
    (minAmount != null && (!Number.isFinite(minAmount) || minAmount < 0)) ||
    (maxAmount != null && (!Number.isFinite(maxAmount) || maxAmount < 0))
  ) {
    setExportError("Amount filters must be valid non-negative numbers.");
    return;
  }

  if (minAmount != null && maxAmount != null && minAmount > maxAmount) {
    setExportError("Minimum amount cannot be greater than maximum amount.");
    return;
  }

  const selectedRows = rows.filter((row) => {
    const date = (row.reimbursement_date || "").slice(0, 10);
    const amount = Number(row.amount || 0);
    const kind = (row.export_kind || "").toLowerCase();

    const matchesFrom = !exportFrom || date >= exportFrom;
    const matchesTo = !exportTo || date <= exportTo;
    const matchesKind =
      exportKind === "all" || kind === exportKind.toLowerCase();
    const matchesTruck =
      exportTruck === "all" || row.truck_id === exportTruck;
    const matchesCategory =
      exportCategory === "all" ||
      (row.category || "").trim().toLowerCase() ===
        exportCategory.toLowerCase();
    const matchesMin = minAmount == null || amount >= minAmount;
    const matchesMax = maxAmount == null || amount <= maxAmount;

    return (
      matchesFrom &&
      matchesTo &&
      matchesKind &&
      matchesTruck &&
      matchesCategory &&
      matchesMin &&
      matchesMax
    );
  });

  if (!selectedRows.length) {
    setExportError("No reimbursements match the selected export filters.");
    return;
  }

  const truckById = new Map(
    trucks.map((truck) => [truck.id, truck.unit_number])
  );
  const expenseNumberById = new Map(
    expenses.map((expense, index) => [expense.id, index + 1])
  );

  const data = [
    [
      "Reimbursement Date",
      "Amount",
      "Recovery Type",
      "Category",
      "Truck Unit",
      "Linked Expense Number",
      "Reference",
      "Notes",
    ],
    ...selectedRows.map((row) => [
      row.reimbursement_date || "",
      String(Number(row.amount || 0)),
      row.export_kind || "",
      row.category || "",
      row.truck_id ? truckById.get(row.truck_id) || "" : "",
      row.expense_id
        ? `#${String(expenseNumberById.get(row.expense_id) || "").padStart(4, "0")}`
        : "",
      row.reference || "",
      row.notes || "",
    ]),
  ];

  const parts = ["milevoxa-reimbursements"];

  if (exportKind !== "all") {
    parts.push(exportKind.toLowerCase());
  }

  if (exportTruck !== "all") {
    parts.push(`truck-${truckById.get(exportTruck) || "selected"}`);
  }

  if (exportCategory !== "all") {
    parts.push(exportCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  }

  if (exportFrom || exportTo) {
    parts.push(`${exportFrom || "start"}-to-${exportTo || "end"}`);
  }

  downloadCsv(`${parts.join("-")}.csv`, data);
  setExportOpen(false);
}
  function downloadTemplate() {
    downloadCsv("milevoxa-reimbursement-import-template.csv", [
      REIMBURSEMENT_HEADERS,
      [
        "2026-09-27",
        "150.00",
        "Fuel",
        "101",
        "12",
        "Fuel card credit",
        "Reimbursement received from carrier",
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
        <Action
          label="Add Reimbursement"
          type="add"
          primary
          onClick={add}
        />
        <Action
          label="Import from File"
          type="import"
          onClick={openImportGuide}
        />
        <Action
          label="Export Reimbursements"
          type="export"
          onClick={openExportDialog}
          disabled={!rows.length}
        />
        <Link
          href="/reimbursements?kind=partial"
          className="fp-reimb-side-action"
        >
          <span className="fp-reimb-side-icon">
            <Icon type="partial" />
          </span>
          <span>View Partial Recovery</span>
          <span>›</span>
        </Link>
      </div>

      {error && !open && (
        <div className="fp-reimb-quick-error">{error}</div>
      )}

      {exportOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-reimb-import-backdrop">
            <div className="fp-reimb-export-modal">
              <header>
                <div>
                  <span>CSV EXPORT</span>
                  <h2>Export Reimbursements</h2>
                  <p>
                    Choose the reimbursements you want to include. Leave a
                    filter on All or blank to include everything.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExportOpen(false)}
                  aria-label="Close reimbursement export dialog"
                >
                  ×
                </button>
              </header>

              <div className="fp-reimb-export-body">
                <div className="fp-reimb-export-section">
                  <strong>Reimbursement date</strong>
                  <div className="fp-reimb-export-grid">
                    <label>
                      <span>From</span>
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
                      <span>To</span>
                      <input
                        type="date"
                        min={exportFrom || undefined}
                        value={exportTo}
                        onChange={(event) => {
                          setExportTo(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="fp-reimb-export-grid">
                  <label>
                    <span>Recovery Type</span>
                    <select
                      value={exportKind}
                      onChange={(event) => {
                        setExportKind(event.target.value);
                        setExportError("");
                      }}
                    >
                      <option value="all">All Types</option>
                      <option value="full">Full Recovery</option>
                      <option value="partial">Partial Recovery</option>
                      <option value="standalone">Standalone</option>
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

                <label className="fp-reimb-export-category">
                  <span>Category</span>
                  <select
                    value={exportCategory}
                    onChange={(event) => {
                      setExportCategory(event.target.value);
                      setExportError("");
                    }}
                  >
                    <option value="all">All Categories</option>
                    {Array.from(
                      new Set(
                        rows
                          .map((row) => (row.category || "").trim())
                          .filter(Boolean)
                      )
                    )
                      .sort((a, b) => a.localeCompare(b))
                      .map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                  </select>
                </label>

                <div className="fp-reimb-export-section">
                  <strong>Amount range</strong>
                  <div className="fp-reimb-export-grid">
                    <label>
                      <span>Minimum</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={exportMinAmount}
                        onChange={(event) => {
                          setExportMinAmount(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>

                    <label>
                      <span>Maximum</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="No maximum"
                        value={exportMaxAmount}
                        onChange={(event) => {
                          setExportMaxAmount(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="fp-reimb-export-hint">
                  Example: choose Partial Recovery + Truck #101 to export only
                  partial reimbursements for that truck. You can combine this
                  with date, category and amount filters.
                </div>

                {exportError && (
                  <div className="fp-reimb-import-error">
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
          <div className="fp-reimb-import-backdrop">
            <div className="fp-reimb-import-modal fp-reimb-import-guide-modal">
              <header>
                <div>
                  <span>CSV IMPORT</span>
                  <h2>Import Reimbursements</h2>
                  <p>
                    Use the MileVoxa CSV format below so reimbursements can be
                    matched to trucks and existing expenses correctly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close reimbursement import guide"
                >
                  ×
                </button>
              </header>

              <div className="fp-reimb-import-body">
                <section className="fp-reimb-import-guide-card">
                  <div className="fp-reimb-import-guide-title">
                    <strong>Required columns</strong>
                    <span>Every imported reimbursement needs these values.</span>
                  </div>
                  <div className="fp-reimb-import-chip-row">
                    <code>reimbursement_date</code>
                    <code>amount</code>
                    <code>category</code>
                  </div>
                </section>

                <section className="fp-reimb-import-guide-card">
                  <div className="fp-reimb-import-guide-title">
                    <strong>Optional columns</strong>
                    <span>
                      Add these when you want the reimbursement linked to a
                      truck or an existing expense.
                    </span>
                  </div>
                  <div className="fp-reimb-import-chip-row">
                    <code>truck_unit</code>
                    <code>expense_number</code>
                    <code>reference</code>
                    <code>notes</code>
                  </div>
                </section>

                <section className="fp-reimb-import-guide-card">
                  <div className="fp-reimb-import-guide-title">
                    <strong>Accepted format</strong>
                  </div>
                  <div className="fp-reimb-import-guide-rules">
                    <span>
                      Date: <b>YYYY-MM-DD</b>
                    </span>
                    <span>
                      Amount: <b>greater than 0</b>
                    </span>
                    <span>
                      Truck: visible <b>unit number</b>, e.g. 101
                    </span>
                    <span>
                      Expense: visible <b>expense number</b>, e.g. 12 or #0012
                    </span>
                  </div>
                </section>

                <section className="fp-reimb-import-guide-card">
                  <div className="fp-reimb-import-guide-title">
                    <strong>Expense linking</strong>
                  </div>
                  <p className="fp-reimb-import-guide-copy">
                    <code>expense_number</code> is optional. Use the number
                    displayed on the Expenses page, such as <b>#0012</b>.
                    MileVoxa converts it to the correct internal expense ID.
                    If category or truck is blank, the linked expense supplies
                    that information automatically.
                  </p>
                </section>

                <section className="fp-reimb-import-guide-example">
                  <div className="fp-reimb-import-guide-title">
                    <strong>Example row</strong>
                  </div>
                  <code>
                    2026-09-27,150.00,Fuel,101,12,Fuel card credit,Reimbursement received from carrier
                  </code>
                </section>

                <div className="fp-reimb-import-guide-actions">
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
                  <div className="fp-reimb-import-file">
                    <strong>{fileName}</strong>
                    <span>{importRows.length} valid rows ready</span>
                  </div>
                )}

                {error && (
                  <div className="fp-reimb-import-error">{error}</div>
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
                  onClick={doImport}
                  disabled={busy || !importRows.length}
                >
                  {busy
                    ? "Importing..."
                    : importRows.length
                      ? `Import ${importRows.length} Reimbursements`
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
      className={`fp-reimb-side-action ${primary ? "primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="fp-reimb-side-icon">
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
  type: "add" | "import" | "export" | "partial";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[13px] w-[13px] fill-none stroke-current",
    strokeWidth: 1.8,
  };

  if (type === "add") {
    return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  }

  if (type === "import") {
    return <svg {...common}><path d="M12 3v12M8 7l4-4 4 4M5 19h14" /></svg>;
  }

  if (type === "export") {
    return <svg {...common}><path d="M12 3v12M8 11l4 4 4-4M5 19h14" /></svg>;
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

function parseCsv(
  text: string,
  expenses: Expense[],
  trucks: Truck[]
): ParsedReimbursement[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) return [];

  const headers = csvLine(lines[0]).map(normalizeHeader);

  for (const required of [
    "reimbursement_date",
    "amount",
    "category",
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

    if (!isDate(raw.reimbursement_date)) {
      throw new Error(
        `Row ${rowNumber}: reimbursement_date must use YYYY-MM-DD.`
      );
    }

    const amount = Number(raw.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(
        `Row ${rowNumber}: amount must be a number greater than zero.`
      );
    }

    let expense: Expense | null = null;

    if (raw.expense_number) {
      const normalizedExpenseNumber = raw.expense_number
        .replace(/^#/, "")
        .replace(/^0+/, "");
      const expenseNumber = Number(normalizedExpenseNumber || "0");

      if (
        !Number.isInteger(expenseNumber) ||
        expenseNumber < 1 ||
        expenseNumber > expenses.length
      ) {
        throw new Error(
          `Row ${rowNumber}: expense_number "${raw.expense_number}" was not found in MileVoxa.`
        );
      }

      expense = expenses[expenseNumber - 1] || null;
    } else if (raw.expense_id) {
      expense =
        expenses.find((item) => item.id === raw.expense_id) || null;

      if (!expense) {
        throw new Error(
          `Row ${rowNumber}: expense_id does not match a known expense.`
        );
      }
    }

    let truckId: string | null = expense?.truck_id || null;

    if (raw.truck_unit) {
      truckId =
        truckByUnit.get(raw.truck_unit.trim().toLowerCase()) || null;

      if (!truckId) {
        throw new Error(
          `Row ${rowNumber}: truck_unit "${raw.truck_unit}" was not found in MileVoxa.`
        );
      }
    } else if (raw.truck_id) {
      const knownTruck = trucks.find((truck) => truck.id === raw.truck_id);

      if (!knownTruck) {
        throw new Error(
          `Row ${rowNumber}: truck_id does not match a known truck.`
        );
      }

      truckId = knownTruck.id;
    }

    const category =
      raw.category || expense?.category || "";

    if (!category) {
      throw new Error(`Row ${rowNumber}: category is required.`);
    }

    return {
      expense_id: expense?.id || null,
      truck_id: truckId,
      category,
      reference: raw.reference || null,
      reimbursement_date: raw.reimbursement_date,
      amount,
      notes: raw.notes || null,
    };
  });
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
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

function downloadCsv(fileName: string, rows: unknown[][]) {
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

function csvCell(value: unknown) {
  const safe = value == null ? "" : String(value);
  return `"${safe.replaceAll('"', '""')}"`;
}
