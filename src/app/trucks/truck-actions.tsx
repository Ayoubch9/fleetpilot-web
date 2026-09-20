"use client";

import { useEffect, useRef, useState } from "react";
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

export default function TruckActions({ truck }: { truck: Truck }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const active = (truck.status || "ACTIVE").toUpperCase() !== "INACTIVE";

  useEffect(() => {
    if (!menuOpen) return;

    function reposition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menuWidth = 168;
      const viewportPadding = 12;

      const left = Math.min(
        window.innerWidth - menuWidth - viewportPadding,
        Math.max(viewportPadding, rect.right - menuWidth)
      );

      setMenuPosition({
        top: rect.bottom + 6,
        left,
      });
    }

    function closeOnOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;

      const portalMenu = document.querySelector(
        "[data-truck-actions-portal='true']"
      );
      if (portalMenu?.contains(target)) return;

      setMenuOpen(false);
    }

    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("mousedown", closeOnOutside);

    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("mousedown", closeOnOutside);
    };
  }, [menuOpen]);

  async function toggleStatus() {
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("trucks")
      .update({ status: active ? "INACTIVE" : "ACTIVE" })
      .eq("id", truck.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMenuOpen(false);
    router.refresh();
  }

  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const supabase = createClient();

    const { error } = await supabase
      .from("trucks")
      .update({
        unit_number: String(data.get("unit_number") || "").trim(),
        year: Number(data.get("year")) || null,
        make: String(data.get("make") || "").trim() || null,
        model: String(data.get("model") || "").trim() || null,
        vin: String(data.get("vin") || "").trim() || null,
        license_plate:
          String(data.get("license_plate") || "").trim() || null,
        current_mileage: Number(data.get("current_mileage")) || 0,
        registration_expiry:
          String(data.get("registration_expiry") || "") || null,
        insurance_expiry:
          String(data.get("insurance_expiry") || "") || null,
      })
      .eq("id", truck.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setEditOpen(false);
    setMenuOpen(false);
    router.refresh();
  }

  async function deleteTruck() {
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("trucks")
      .delete()
      .eq("id", truck.id);

    setSaving(false);

    if (error) {
      setError(
        error.message.includes("foreign key")
          ? "This truck is linked to existing records. Mark it Inactive instead of deleting it."
          : error.message
      );
      return;
    }

    setDeleteOpen(false);
    setMenuOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="fp-truck-row-actions">
        <button
          ref={triggerRef}
          type="button"
          className="fp-truck-actions-trigger"
          onClick={() => {
            setError("");
            setMenuOpen((value) => !value);
          }}
          aria-label={`Actions for truck ${truck.unit_number}`}
        >
          <span>•••</span>
        </button>

      </div>

      {menuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-truck-actions-portal="true"
            className="fp-truck-actions-menu fp-truck-actions-menu-portal"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setEditOpen(true);
              }}
            >
              <EditIcon />
              <span>Edit Truck</span>
            </button>

            <button
              type="button"
              onClick={toggleStatus}
              disabled={saving}
            >
              <StatusIcon />
              <span>{active ? "Mark Inactive" : "Activate Truck"}</span>
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
              <span>Delete Truck</span>
            </button>
          </div>,
          document.body
        )}

      {editOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-truck-action-backdrop">
            <form className="fp-truck-edit-modal" onSubmit={saveEdit}>
              <header>
                <div>
                  <span>TRUCK DETAILS</span>
                  <h2>Edit Truck #{truck.unit_number}</h2>
                  <p>Update the truck information saved in MileVoxa.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  ×
                </button>
              </header>

              <div className="fp-truck-edit-grid">
                <EditField
                  name="unit_number"
                  label="Unit Number *"
                  defaultValue={truck.unit_number}
                  required
                />
                <EditField
                  name="year"
                  label="Year"
                  type="number"
                  defaultValue={truck.year ?? ""}
                />
                <EditField
                  name="make"
                  label="Make"
                  defaultValue={truck.make ?? ""}
                />
                <EditField
                  name="model"
                  label="Model"
                  defaultValue={truck.model ?? ""}
                />
                <EditField
                  name="vin"
                  label="VIN"
                  defaultValue={truck.vin ?? ""}
                />
                <EditField
                  name="license_plate"
                  label="License Plate"
                  defaultValue={truck.license_plate ?? ""}
                />
                <EditField
                  name="current_mileage"
                  label="Current Mileage"
                  type="number"
                  defaultValue={truck.current_mileage ?? ""}
                />
                <div />
                <EditField
                  name="registration_expiry"
                  label="Registration Expiry"
                  type="date"
                  defaultValue={dateValue(truck.registration_expiry)}
                />
                <EditField
                  name="insurance_expiry"
                  label="Insurance Expiry"
                  type="date"
                  defaultValue={dateValue(truck.insurance_expiry)}
                />
              </div>

              {error && <div className="fp-truck-action-error">{error}</div>}

              <footer>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </footer>
            </form>
          </div>,
          document.body
        )}

      {deleteOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fp-truck-action-backdrop">
            <div className="fp-truck-delete-modal">
              <div className="fp-truck-delete-icon">
                <DeleteIcon />
              </div>
              <h2>Delete Truck #{truck.unit_number}?</h2>
              <p>
                This permanently removes the truck. If it has historical loads,
                expenses or maintenance records, MileVoxa may require you to
                mark it Inactive instead.
              </p>

              {error && <div className="fp-truck-action-error">{error}</div>}

              <div className="fp-truck-delete-actions">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={deleteTruck}
                  disabled={saving}
                >
                  {saving ? "Deleting..." : "Delete Truck"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function EditField({
  name,
  label,
  defaultValue,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  defaultValue: string | number;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
      />
    </label>
  );
}

function dateValue(value: string | null) {
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

function StatusIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v10" />
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
