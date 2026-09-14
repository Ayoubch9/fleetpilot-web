"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Truck = {
  id: string;
  unit_number: string;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  license_plate: string | null;
  current_mileage: number | string | null;
  status: string | null;
};

type ImportTruck = {
  unit_number: string;
  year: number | null;
  make: string;
  model: string;
  vin: string;
  license_plate: string;
  current_mileage: number;
  registration_expiry: string | null;
  insurance_expiry: string | null;
  status: string;
};

export default function TrucksQuickActions({
  visibleTrucks,
  inactiveHref,
}: {
  visibleTrucks: Truck[];
  inactiveHref: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [rows, setRows] = useState<ImportTruck[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const importCount = rows.length;

  function openAddTruck() {
    window.dispatchEvent(new CustomEvent("fleetpilot:open-add-truck"));
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setRows([]);
    setFileName(file.name);

    try {
      const text = await file.text();
      const parsed = parseTruckCsv(text);

      if (parsed.length === 0) {
        throw new Error(
          "No valid trucks were found. Make sure the CSV includes a unit_number column."
        );
      }

      setRows(parsed);
      setImportOpen(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not read this truck CSV."
      );
      setImportOpen(true);
    } finally {
      event.target.value = "";
    }
  }

  async function importTrucks() {
    if (rows.length === 0) return;

    setBusy(true);
    setError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("trucks").insert(rows);

      if (error) throw error;

      setImportOpen(false);
      setRows([]);
      setFileName("");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not import the trucks."
      );
    } finally {
      setBusy(false);
    }
  }

  function exportTrucks() {
    if (visibleTrucks.length === 0) {
      setError("There are no trucks in the current view to export.");
      return;
    }

    const data = [
      [
        "Unit Number",
        "Year",
        "Make",
        "Model",
        "VIN",
        "License Plate",
        "Current Mileage",
        "Status",
      ],
      ...visibleTrucks.map((truck) => [
        truck.unit_number || "",
        truck.year == null ? "" : String(truck.year),
        truck.make || "",
        truck.model || "",
        truck.vin || "",
        truck.license_plate || "",
        String(Number(truck.current_mileage || 0)),
        truck.status || "ACTIVE",
      ]),
    ];

    const csv = data
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fleetpilot-trucks-${new Date()
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
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={chooseFile}
      />

      <div className="mt-3 grid gap-2">
        <Action
          type="add"
          label="Add Truck"
          primary
          onClick={openAddTruck}
        />

        <Action
          type="import"
          label="Import from File"
          onClick={() => fileRef.current?.click()}
        />

        <Action
          type="export"
          label="Export Trucks"
          onClick={exportTrucks}
          disabled={visibleTrucks.length === 0}
        />

        <Link href={inactiveHref} className="fp-truck-side-action">
          <span className="fp-truck-side-icon">
            <ActionIcon type="inactive" />
          </span>
          <span>View Inactive Trucks</span>
          <span>›</span>
        </Link>
      </div>

      {error && !importOpen && (
        <div className="fp-truck-quick-error">{error}</div>
      )}

      {importOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fp-truck-import-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !busy) {
                setImportOpen(false);
              }
            }}
          >
            <div className="fp-truck-import-modal">
              <header>
                <div>
                  <span>CSV IMPORT</span>
                  <h2>Import Trucks</h2>
                  <p>
                    Review the file before adding these trucks to FleetPilot.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  disabled={busy}
                >
                  ×
                </button>
              </header>

              <div className="fp-truck-import-body">
                <div className="fp-truck-import-file">
                  <strong>{fileName || "Truck CSV"}</strong>
                  <span>
                    {importCount} valid truck{importCount === 1 ? "" : "s"} found
                  </span>
                </div>

                {rows.length > 0 && (
                  <div className="fp-truck-import-preview">
                    {rows.slice(0, 5).map((truck, index) => (
                      <div key={`${truck.unit_number}-${index}`}>
                        <strong>Truck #{truck.unit_number}</strong>
                        <span>
                          {[truck.year, truck.make, truck.model]
                            .filter(Boolean)
                            .join(" ") || "No make/model"}
                        </span>
                        <small>
                          {truck.license_plate || "No plate"} ·{" "}
                          {truck.current_mileage.toLocaleString()} mi
                        </small>
                      </div>
                    ))}
                    {rows.length > 5 && (
                      <em>+ {rows.length - 5} more trucks</em>
                    )}
                  </div>
                )}

                <div className="fp-truck-import-format">
                  <strong>Supported CSV columns</strong>
                  <span>
                    unit_number, year, make, model, vin, license_plate,
                    current_mileage, registration_expiry, insurance_expiry,
                    status
                  </span>
                </div>

                {error && (
                  <div className="fp-truck-import-error">{error}</div>
                )}
              </div>

              <footer>
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={importTrucks}
                  disabled={busy || rows.length === 0}
                >
                  {busy
                    ? "Importing..."
                    : `Import ${rows.length || ""} Truck${
                        rows.length === 1 ? "" : "s"
                      }`}
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
  type,
  label,
  primary = false,
  onClick,
  disabled = false,
}: {
  type: "add" | "import" | "export";
  label: string;
  primary?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`fp-truck-side-action ${primary ? "primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="fp-truck-side-icon">
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
  type: "add" | "import" | "export" | "inactive";
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
      <path d="M12 7v10" />
    </svg>
  );
}

function parseTruckCsv(text: string): ImportTruck[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const requiredIndex = headers.indexOf("unit_number");
  if (requiredIndex === -1) {
    throw new Error(
      "CSV is missing the required unit_number column."
    );
  }

  return lines
    .slice(1)
    .map(parseCsvLine)
    .map((cells) => {
      const record = Object.fromEntries(
        headers.map((header, index) => [
          header,
          (cells[index] || "").trim(),
        ])
      );

      const unit = record.unit_number || "";
      if (!unit) return null;

      return {
        unit_number: unit,
        year: nullableNumber(record.year),
        make: record.make || "",
        model: record.model || "",
        vin: record.vin || "",
        license_plate: record.license_plate || "",
        current_mileage: numberValue(record.current_mileage),
        registration_expiry: dateOrNull(record.registration_expiry),
        insurance_expiry: dateOrNull(record.insurance_expiry),
        status: (record.status || "ACTIVE").toUpperCase(),
      } satisfies ImportTruck;
    })
    .filter((truck): truck is ImportTruck => Boolean(truck));
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === "," && !quoted) {
      result.push(cell);
      cell = "";
      continue;
    }

    cell += character;
  }

  result.push(cell);
  return result;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function nullableNumber(value?: string) {
  if (!value) return null;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function numberValue(value?: string) {
  const parsed = Number((value || "0").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateOrNull(value?: string) {
  const cleaned = (value || "").trim();
  return cleaned || null;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
