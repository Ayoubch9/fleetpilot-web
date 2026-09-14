"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Truck = {
  id: string;
  unit_number: string;
};

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

const SERVICE_TYPES = [
  "Oil Change",
  "PM Service",
  "Tires",
  "Brakes",
  "DOT Inspection",
  "Engine Repair",
  "Transmission",
  "DEF/Emissions",
  "Electrical",
  "Other",
];

export default function MaintenanceActions({
  record,
  trucks,
}: {
  record: Maintenance;
  trucks: Truck[];
}) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!menuOpen) return;

    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = 168;
      setPosition({
        top: rect.bottom + 6,
        left: Math.min(
          window.innerWidth - width - 12,
          Math.max(12, rect.right - width)
        ),
      });
    }

    function outside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (
        document
          .querySelector("[data-maint-actions-portal]")
          ?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    }

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", outside);

    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", outside);
    };
  }, [menuOpen]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const serviceType = String(data.get("service_type") || "");
    const serviceDate = String(data.get("service_date") || "");
    const vendor = String(data.get("vendor") || "").trim();
    const cost = Number(data.get("cost")) || 0;
    const supabase = createClient();

    const { error: maintenanceError } = await supabase
      .from("maintenance_records")
      .update({
        truck_id: String(data.get("truck_id") || "") || null,
        service_type: serviceType,
        service_date: serviceDate,
        mileage: Number(data.get("mileage")) || 0,
        vendor: vendor || null,
        cost,
        next_service_mileage:
          Number(data.get("next_service_mileage")) || null,
        next_service_date:
          String(data.get("next_service_date") || "") || null,
      })
      .eq("id", record.id);

    if (maintenanceError) {
      setBusy(false);
      setError(maintenanceError.message);
      return;
    }

    if (record.expense_id) {
      const { error: expenseError } = await supabase
        .from("expenses")
        .update({
          truck_id: String(data.get("truck_id") || "") || null,
          category: "Maintenance",
          expense_date: serviceDate,
          amount: cost,
          vendor: vendor || null,
          description: `${serviceType} maintenance service`,
        })
        .eq("id", record.expense_id);

      if (expenseError) {
        setBusy(false);
        setError(
          `Maintenance saved, but linked expense could not be updated: ${expenseError.message}`
        );
        router.refresh();
        return;
      }
    }

    setBusy(false);
    setEditOpen(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError("");

    const supabase = createClient();
    const expenseId = record.expense_id;

    const { error: maintenanceError } = await supabase
      .from("maintenance_records")
      .delete()
      .eq("id", record.id);

    if (maintenanceError) {
      setBusy(false);
      setError(maintenanceError.message);
      return;
    }

    if (expenseId) {
      const { error: expenseError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (expenseError) {
        setBusy(false);
        setError(
          `Service was deleted, but its linked expense remains: ${expenseError.message}`
        );
        router.refresh();
        return;
      }
    }

    setBusy(false);
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="fp-maint-actions-trigger"
        onClick={() => {
          setError("");
          setMenuOpen((value) => !value);
        }}
        aria-label="Maintenance actions"
      >
        •••
      </button>

      {menuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-maint-actions-portal
            className="fp-maint-actions-menu-portal"
            style={{ top: position.top, left: position.left }}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
            >
              <EditIcon />
              <span>Edit Service</span>
            </button>

            <button
              type="button"
              className="danger"
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
            >
              <DeleteIcon />
              <span>Delete Service</span>
            </button>
          </div>,
          document.body
        )}

      {editOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-maint-action-backdrop">
            <form className="fp-maint-edit-modal" onSubmit={save}>
              <header>
                <div>
                  <span>SERVICE DETAILS</span>
                  <h2>Edit Maintenance</h2>
                  <p>
                    Update this maintenance record and its linked expense.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={busy}
                >
                  ×
                </button>
              </header>

              <div className="fp-maint-edit-grid">
                <label>
                  <span>Truck *</span>
                  <select
                    name="truck_id"
                    defaultValue={record.truck_id || ""}
                    required
                  >
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        Truck #{truck.unit_number}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Service Type *</span>
                  <select
                    name="service_type"
                    defaultValue={record.service_type || "Other"}
                    required
                  >
                    {SERVICE_TYPES.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <Field
                  name="service_date"
                  label="Service Date *"
                  type="date"
                  defaultValue={dateValue(record.service_date)}
                  required
                />

                <Field
                  name="mileage"
                  label="Service Mileage"
                  type="number"
                  defaultValue={record.mileage ?? ""}
                />

                <Field
                  name="vendor"
                  label="Vendor"
                  defaultValue={record.vendor ?? ""}
                />

                <Field
                  name="cost"
                  label="Cost"
                  type="number"
                  step="0.01"
                  defaultValue={record.cost ?? ""}
                />

                <Field
                  name="next_service_mileage"
                  label="Next Service Mileage"
                  type="number"
                  defaultValue={record.next_service_mileage ?? ""}
                />

                <Field
                  name="next_service_date"
                  label="Next Service Date"
                  type="date"
                  defaultValue={dateValue(record.next_service_date)}
                />
              </div>

              {error && (
                <div className="fp-maint-action-error">{error}</div>
              )}

              <footer>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={busy}
                >
                  {busy ? "Saving..." : "Save Changes"}
                </button>
              </footer>
            </form>
          </div>,
          document.body
        )}

      {deleteOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-maint-action-backdrop">
            <div className="fp-maint-delete-modal">
              <div className="fp-maint-delete-icon">
                <DeleteIcon />
              </div>
              <h2>Delete this service?</h2>
              <p>
                This permanently removes the maintenance record. If it
                created a linked Maintenance expense, FleetPilot will remove
                that expense too.
              </p>

              {error && (
                <div className="fp-maint-action-error">{error}</div>
              )}

              <div className="fp-maint-delete-actions">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={remove}
                  disabled={busy}
                >
                  {busy ? "Deleting..." : "Delete Service"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  step,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue: string | number;
  type?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        required={required}
      />
    </label>
  );
}

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m4 20 4.2-1 10-10-3.2-3.2-10 10L4 20Z" />
      <path d="m13.8 7 3.2 3.2" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}
