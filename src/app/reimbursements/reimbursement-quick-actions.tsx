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
};

export default function ReimbursementQuickActions({
  rows,
}: {
  rows: Reimbursement[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function add() {
    window.dispatchEvent(
      new CustomEvent("fleetpilot:open-add-reimbursement")
    );
  }

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");

    try {
      const parsed = parseCsv(await file.text());
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

    const { error } = await createClient()
      .from("reimbursements")
      .insert(importRows);

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setOpen(false);
    setImportRows([]);
    router.refresh();
  }

  function exportCsv() {
    if (!rows.length) {
      setError("No reimbursements in the current view to export.");
      return;
    }

    const data = [
      [
        "Expense ID",
        "Truck ID",
        "Category",
        "Reference",
        "Reimbursement Date",
        "Amount",
        "Notes",
      ],
      ...rows.map((row) => [
        row.expense_id,
        row.truck_id,
        row.category,
        row.reference,
        row.reimbursement_date,
        Number(row.amount || 0),
        row.notes,
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
    anchor.download = `milevoxa-reimbursements-${new Date()
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
        <Action
          label="Add Reimbursement"
          type="add"
          primary
          onClick={add}
        />
        <Action
          label="Import from File"
          type="import"
          onClick={() => fileRef.current?.click()}
        />
        <Action
          label="Export Reimbursements"
          type="export"
          onClick={exportCsv}
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

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-reimb-import-backdrop">
            <div className="fp-reimb-import-modal">
              <header>
                <div>
                  <span>CSV IMPORT</span>
                  <h2>Import Reimbursements</h2>
                  <p>Review the file before importing reimbursement records.</p>
                </div>
                <button type="button" onClick={() => setOpen(false)}>
                  ×
                </button>
              </header>

              <div className="fp-reimb-import-body">
                <div className="fp-reimb-import-file">
                  <strong>{fileName}</strong>
                  <span>{importRows.length} valid rows</span>
                </div>

                <div className="fp-reimb-import-format">
                  <strong>Required columns</strong>
                  <span>
                    reimbursement_date, amount. Optional: expense_id,
                    truck_id, category, reference, notes.
                  </span>
                </div>

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
                    : `Import ${importRows.length} Reimbursements`}
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
      <circle cx="12" cy="12" r="8" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

function parseCsv(text: string) {
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
    "reimbursement_date",
    "amount",
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
        row.reimbursement_date &&
        Number(row.amount) > 0
    )
    .map((row) => ({
      expense_id: row.expense_id || null,
      truck_id: row.truck_id || null,
      category: row.category || null,
      reference: row.reference || null,
      reimbursement_date: row.reimbursement_date,
      amount: Number(row.amount),
      notes: row.notes || null,
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

function csvCell(value: unknown) {
  const safe = value == null ? "" : String(value);
  return `"${safe.replaceAll('"', '""')}"`;
}
