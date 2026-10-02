"use client";

import { ChangeEvent, useRef, useState } from "react";
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
  registration_expiry: string | null;
  insurance_expiry: string | null;
  status: string | null;
};

type ImportTruck = {
  unit_number: string;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  license_plate: string | null;
  current_mileage: number;
  registration_expiry: string | null;
  insurance_expiry: string | null;
  status: string;
};

const TRUCK_HEADERS = [
  "unit_number",
  "year",
  "make",
  "model",
  "vin",
  "license_plate",
  "current_mileage",
  "registration_expiry",
  "insurance_expiry",
  "status",
];

const VALID_STATUSES = new Set([
  "ACTIVE",
  "INACTIVE",
  "IN SERVICE",
  "SERVICE",
  "MAINTENANCE",
]);

export default function TrucksQuickActions({
  trucks,
  inactiveHref,
}: {
  trucks: Truck[];
  inactiveHref: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [rows, setRows] = useState<ImportTruck[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState("all");
  const [exportMake, setExportMake] = useState("all");
  const [exportUnit, setExportUnit] = useState("");
  const [exportMinMileage, setExportMinMileage] = useState("");
  const [exportMaxMileage, setExportMaxMileage] = useState("");
  const [exportRegistrationFrom, setExportRegistrationFrom] = useState("");
  const [exportRegistrationTo, setExportRegistrationTo] = useState("");
  const [exportInsuranceFrom, setExportInsuranceFrom] = useState("");
  const [exportInsuranceTo, setExportInsuranceTo] = useState("");
  const [exportError, setExportError] = useState("");

  function openAddTruck() {
    window.dispatchEvent(new CustomEvent("fleetpilot:open-add-truck"));
  }

  function openImportGuide() {
    setRows([]);
    setFileName("");
    setError("");
    setImportOpen(true);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setRows([]);
    setFileName(file.name);

    try {
      const parsed = parseTruckCsv(await file.text(), trucks);
      if (!parsed.length) {
        throw new Error("No valid truck rows were found.");
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
    if (!rows.length) return;

    setBusy(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("trucks")
        .insert(rows);

      if (insertError) throw insertError;

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

  function downloadTemplate() {
    downloadCsv("milevoxa-truck-import-template.csv", [
      TRUCK_HEADERS,
      [
        "101",
        "2022",
        "Freightliner",
        "Cascadia",
        "1FUJHHDR0NLAB1234",
        "ABC1234",
        "485250",
        "2027-06-30",
        "2027-03-31",
        "ACTIVE",
      ],
    ]);
  }

  function openExportDialog() {
    setExportStatus("all");
    setExportMake("all");
    setExportUnit("");
    setExportMinMileage("");
    setExportMaxMileage("");
    setExportRegistrationFrom("");
    setExportRegistrationTo("");
    setExportInsuranceFrom("");
    setExportInsuranceTo("");
    setExportError("");
    setExportOpen(true);
  }

  function exportTrucks() {
    setExportError("");

    const minMileage =
      exportMinMileage === "" ? null : Number(exportMinMileage);
    const maxMileage =
      exportMaxMileage === "" ? null : Number(exportMaxMileage);

    if (
      (minMileage != null &&
        (!Number.isFinite(minMileage) || minMileage < 0)) ||
      (maxMileage != null &&
        (!Number.isFinite(maxMileage) || maxMileage < 0))
    ) {
      setExportError("Mileage filters must be valid non-negative numbers.");
      return;
    }

    if (
      minMileage != null &&
      maxMileage != null &&
      minMileage > maxMileage
    ) {
      setExportError(
        "Minimum mileage cannot be greater than maximum mileage."
      );
      return;
    }

    if (
      exportRegistrationFrom &&
      exportRegistrationTo &&
      exportRegistrationFrom > exportRegistrationTo
    ) {
      setExportError(
        "Registration From date cannot be after Registration To date."
      );
      return;
    }

    if (
      exportInsuranceFrom &&
      exportInsuranceTo &&
      exportInsuranceFrom > exportInsuranceTo
    ) {
      setExportError(
        "Insurance From date cannot be after Insurance To date."
      );
      return;
    }

    const selected = trucks.filter((truck) => {
      const mileage = Number(truck.current_mileage || 0);
      const registration = (truck.registration_expiry || "").slice(0, 10);
      const insurance = (truck.insurance_expiry || "").slice(0, 10);
      const status = normalizeStatus(truck.status);
      const make = (truck.make || "").trim().toLowerCase();

      const matchesStatus =
        exportStatus === "all" ||
        status === exportStatus.toUpperCase();

      const matchesMake =
        exportMake === "all" ||
        make === exportMake.toLowerCase();

      const matchesUnit =
        !exportUnit ||
        (truck.unit_number || "")
          .toLowerCase()
          .includes(exportUnit.trim().toLowerCase());

      const matchesMinMileage =
        minMileage == null || mileage >= minMileage;

      const matchesMaxMileage =
        maxMileage == null || mileage <= maxMileage;

      const matchesRegistrationFrom =
        !exportRegistrationFrom ||
        (registration && registration >= exportRegistrationFrom);

      const matchesRegistrationTo =
        !exportRegistrationTo ||
        (registration && registration <= exportRegistrationTo);

      const matchesInsuranceFrom =
        !exportInsuranceFrom ||
        (insurance && insurance >= exportInsuranceFrom);

      const matchesInsuranceTo =
        !exportInsuranceTo ||
        (insurance && insurance <= exportInsuranceTo);

      return (
        matchesStatus &&
        matchesMake &&
        matchesUnit &&
        matchesMinMileage &&
        matchesMaxMileage &&
        matchesRegistrationFrom &&
        matchesRegistrationTo &&
        matchesInsuranceFrom &&
        matchesInsuranceTo
      );
    });

    if (!selected.length) {
      setExportError("No trucks match the selected export filters.");
      return;
    }

    downloadCsv(
      buildExportFileName(),
      [
        TRUCK_HEADERS,
        ...selected.map((truck) => [
          truck.unit_number || "",
          truck.year == null ? "" : String(truck.year),
          truck.make || "",
          truck.model || "",
          truck.vin || "",
          truck.license_plate || "",
          String(Number(truck.current_mileage || 0)),
          truck.registration_expiry || "",
          truck.insurance_expiry || "",
          normalizeStatus(truck.status),
        ]),
      ]
    );

    setExportOpen(false);
  }

  function buildExportFileName() {
    const parts = ["milevoxa-trucks"];

    if (exportStatus !== "all") {
      parts.push(exportStatus.toLowerCase().replace(/\s+/g, "-"));
    }

    if (exportMake !== "all") {
      parts.push(exportMake.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }

    if (exportUnit.trim()) {
      parts.push(`unit-${exportUnit.trim().replace(/[^a-z0-9]+/gi, "-")}`);
    }

    parts.push(new Date().toISOString().slice(0, 10));
    return `${parts.join("-")}.csv`;
  }

  const makes = Array.from(
    new Set(
      trucks
        .map((truck) => (truck.make || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

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
          onClick={openImportGuide}
        />

        <Action
          type="export"
          label="Export Trucks"
          onClick={openExportDialog}
          disabled={!trucks.length}
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

      {exportOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-truck-import-backdrop">
            <div className="fp-truck-export-modal">
              <header>
                <div>
                  <span>CSV EXPORT</span>
                  <h2>Export Trucks</h2>
                  <p>
                    Choose which trucks you want to include. Leave a filter on
                    All or blank to export the full fleet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExportOpen(false)}
                  aria-label="Close truck export dialog"
                >
                  ×
                </button>
              </header>

              <div className="fp-truck-export-body">
                <div className="fp-truck-export-grid">
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
                      <option value="ACTIVE">Active</option>
                      <option value="IN SERVICE">In Service</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </label>

                  <label>
                    <span>Make</span>
                    <select
                      value={exportMake}
                      onChange={(event) => {
                        setExportMake(event.target.value);
                        setExportError("");
                      }}
                    >
                      <option value="all">All Makes</option>
                      {makes.map((make) => (
                        <option key={make} value={make}>
                          {make}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="fp-truck-export-single">
                  <span>Unit Number</span>
                  <input
                    value={exportUnit}
                    onChange={(event) => {
                      setExportUnit(event.target.value);
                      setExportError("");
                    }}
                    placeholder="Example: 101"
                  />
                </label>

                <div className="fp-truck-export-section">
                  <strong>Mileage range</strong>
                  <div className="fp-truck-export-grid">
                    <label>
                      <span>Minimum</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={exportMinMileage}
                        onChange={(event) => {
                          setExportMinMileage(event.target.value);
                          setExportError("");
                        }}
                        placeholder="0"
                      />
                    </label>

                    <label>
                      <span>Maximum</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={exportMaxMileage}
                        onChange={(event) => {
                          setExportMaxMileage(event.target.value);
                          setExportError("");
                        }}
                        placeholder="No maximum"
                      />
                    </label>
                  </div>
                </div>

                <div className="fp-truck-export-section">
                  <strong>Registration expiry</strong>
                  <div className="fp-truck-export-grid">
                    <label>
                      <span>From</span>
                      <input
                        type="date"
                        value={exportRegistrationFrom}
                        onChange={(event) => {
                          setExportRegistrationFrom(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>

                    <label>
                      <span>To</span>
                      <input
                        type="date"
                        min={exportRegistrationFrom || undefined}
                        value={exportRegistrationTo}
                        onChange={(event) => {
                          setExportRegistrationTo(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="fp-truck-export-section">
                  <strong>Insurance expiry</strong>
                  <div className="fp-truck-export-grid">
                    <label>
                      <span>From</span>
                      <input
                        type="date"
                        value={exportInsuranceFrom}
                        onChange={(event) => {
                          setExportInsuranceFrom(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>

                    <label>
                      <span>To</span>
                      <input
                        type="date"
                        min={exportInsuranceFrom || undefined}
                        value={exportInsuranceTo}
                        onChange={(event) => {
                          setExportInsuranceTo(event.target.value);
                          setExportError("");
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="fp-truck-export-hint">
                  Example: choose Active + Freightliner to export only active
                  Freightliner trucks. You can combine status, make, unit,
                  mileage and expiry-date filters.
                </div>

                {exportError && (
                  <div className="fp-truck-import-error">{exportError}</div>
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
                  onClick={exportTrucks}
                >
                  Export CSV
                </button>
              </footer>
            </div>
          </div>,
          document.body
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
            <div className="fp-truck-import-modal fp-truck-import-guide-modal">
              <header>
                <div>
                  <span>CSV IMPORT</span>
                  <h2>Import Trucks</h2>
                  <p>
                    Use the MileVoxa truck CSV model below before uploading
                    your fleet data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  disabled={busy}
                  aria-label="Close truck import guide"
                >
                  ×
                </button>
              </header>

              <div className="fp-truck-import-body">
                <section className="fp-truck-import-guide-card">
                  <div className="fp-truck-import-guide-title">
                    <strong>Required column</strong>
                    <span>Every truck must have a unique unit number.</span>
                  </div>
                  <div className="fp-truck-import-chip-row">
                    <code>unit_number</code>
                  </div>
                </section>

                <section className="fp-truck-import-guide-card">
                  <div className="fp-truck-import-guide-title">
                    <strong>Optional columns</strong>
                    <span>
                      Add these to create a complete truck profile.
                    </span>
                  </div>
                  <div className="fp-truck-import-chip-row">
                    <code>year</code>
                    <code>make</code>
                    <code>model</code>
                    <code>vin</code>
                    <code>license_plate</code>
                    <code>current_mileage</code>
                    <code>registration_expiry</code>
                    <code>insurance_expiry</code>
                    <code>status</code>
                  </div>
                </section>

                <section className="fp-truck-import-guide-card">
                  <div className="fp-truck-import-guide-title">
                    <strong>Accepted format</strong>
                  </div>
                  <div className="fp-truck-import-guide-rules">
                    <span>
                      Dates: <b>YYYY-MM-DD</b>
                    </span>
                    <span>
                      Mileage: <b>non-negative number</b>
                    </span>
                    <span>
                      Year: <b>4-digit year</b>
                    </span>
                    <span>
                      Status: <b>ACTIVE, IN SERVICE, or INACTIVE</b>
                    </span>
                  </div>
                </section>

                <section className="fp-truck-import-guide-card">
                  <div className="fp-truck-import-guide-title">
                    <strong>Duplicate protection</strong>
                  </div>
                  <p className="fp-truck-import-guide-copy">
                    MileVoxa rejects duplicate <code>unit_number</code> values
                    inside the CSV and unit numbers that already exist in your
                    fleet, so an import cannot accidentally create the same
                    truck twice.
                  </p>
                </section>

                <section className="fp-truck-import-guide-example">
                  <div className="fp-truck-import-guide-title">
                    <strong>Example row</strong>
                  </div>
                  <code>
                    101,2022,Freightliner,Cascadia,1FUJHHDR0NLAB1234,ABC1234,485250,2027-06-30,2027-03-31,ACTIVE
                  </code>
                </section>

                <div className="fp-truck-import-guide-actions">
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
                  <div className="fp-truck-import-file">
                    <strong>{fileName}</strong>
                    <span>
                      {rows.length} valid truck{rows.length === 1 ? "" : "s"} ready
                    </span>
                  </div>
                )}

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
                    : rows.length
                      ? `Import ${rows.length} Truck${rows.length === 1 ? "" : "s"}`
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
    return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
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

function parseTruckCsv(text: string, existingTrucks: Truck[]): ImportTruck[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);

  if (!headers.includes("unit_number")) {
    throw new Error("CSV is missing required column: unit_number.");
  }

  const existingUnits = new Set(
    existingTrucks.map((truck) => truck.unit_number.trim().toLowerCase())
  );
  const csvUnits = new Set<string>();

  return lines.slice(1).map((line, index) => {
    const rowNumber = index + 2;
    const cells = parseCsvLine(line);
    const raw = Object.fromEntries(
      headers.map((header, cellIndex) => [
        header,
        (cells[cellIndex] || "").trim(),
      ])
    ) as Record<string, string>;

    const unit = raw.unit_number;
    if (!unit) {
      throw new Error(`Row ${rowNumber}: unit_number is required.`);
    }

    const normalizedUnit = unit.toLowerCase();

    if (csvUnits.has(normalizedUnit)) {
      throw new Error(
        `Row ${rowNumber}: unit_number "${unit}" is duplicated in this CSV.`
      );
    }

    if (existingUnits.has(normalizedUnit)) {
      throw new Error(
        `Row ${rowNumber}: Truck #${unit} already exists in MileVoxa.`
      );
    }

    csvUnits.add(normalizedUnit);

    const year = parseYear(raw.year, rowNumber);
    const currentMileage = parseNonNegativeNumber(
      raw.current_mileage,
      rowNumber,
      "current_mileage",
      0
    );

    const registrationExpiry = parseOptionalDate(
      raw.registration_expiry,
      rowNumber,
      "registration_expiry"
    );
    const insuranceExpiry = parseOptionalDate(
      raw.insurance_expiry,
      rowNumber,
      "insurance_expiry"
    );

    const status = normalizeStatus(raw.status || "ACTIVE");
    if (!VALID_STATUSES.has(status)) {
      throw new Error(
        `Row ${rowNumber}: status must be ACTIVE, IN SERVICE, or INACTIVE.`
      );
    }

    return {
      unit_number: unit,
      year,
      make: raw.make || null,
      model: raw.model || null,
      vin: raw.vin || null,
      license_plate: raw.license_plate || null,
      current_mileage: currentMileage,
      registration_expiry: registrationExpiry,
      insurance_expiry: insuranceExpiry,
      status: status === "SERVICE" || status === "MAINTENANCE"
        ? "IN SERVICE"
        : status,
    };
  });
}

function parseYear(raw: string | undefined, rowNumber: number) {
  if (!raw) return null;

  if (!/^\d{4}$/.test(raw)) {
    throw new Error(`Row ${rowNumber}: year must be a 4-digit year.`);
  }

  const year = Number(raw);
  if (year < 1900 || year > 2100) {
    throw new Error(`Row ${rowNumber}: year is outside the accepted range.`);
  }

  return year;
}

function parseNonNegativeNumber(
  raw: string | undefined,
  rowNumber: number,
  field: string,
  fallback: number
) {
  if (!raw) return fallback;

  const value = Number(raw.replaceAll(",", ""));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `Row ${rowNumber}: ${field} must be a valid non-negative number.`
    );
  }

  return value;
}

function parseOptionalDate(
  raw: string | undefined,
  rowNumber: number,
  field: string
) {
  if (!raw) return null;

  if (!isDate(raw)) {
    throw new Error(`Row ${rowNumber}: ${field} must use YYYY-MM-DD.`);
  }

  return raw;
}

function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function normalizeStatus(value?: string | null) {
  const status = (value || "ACTIVE").trim().toUpperCase();

  if (status === "SERVICE" || status === "MAINTENANCE") {
    return "IN SERVICE";
  }

  return status;
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

function downloadCsv(fileName: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
