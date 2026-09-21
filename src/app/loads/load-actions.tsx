"use client";

import { FormEvent, useState } from "react";
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

type Truck = {
  id: string;
  unit_number: string;
};

const statuses = [
  "UPCOMING",
  "DISPATCHED",
  "IN TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
];

export default function LoadActions({
  load,
  trucks,
}: {
  load: Load;
  trucks: Truck[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");

  async function changeStatus(value: string) {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("loads")
      .update({ status: value })
      .eq("id", load.id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setMenuOpen(false);
    router.refresh();
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const rate = Number(form.get("rate") || 0);
    const mileage = validateLoadMiles(
      form.get("loaded_miles"),
      form.get("deadhead_miles")
    );
    const pickup = normalizeUsLocation(String(form.get("pickup") || ""));
    const delivery = normalizeUsLocation(String(form.get("delivery") || ""));

    if (
      !form.get("truck_id") ||
      !form.get("load_number") ||
      !form.get("pickup_date") ||
      !form.get("delivery_date") ||
      rate <= 0
    ) {
      setSaving(false);
      setError("Complete the required fields with valid values.");
      return;
    }

    if (!mileage.ok) {
      setSaving(false);
      setError(mileage.error);
      return;
    }

    if (!pickup.ok) {
      setSaving(false);
      setError(`Pickup: ${pickup.error}`);
      return;
    }

    if (!delivery.ok) {
      setSaving(false);
      setError(`Delivery: ${delivery.error}`);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("loads")
      .update({
        truck_id: String(form.get("truck_id")),
        load_number: String(form.get("load_number")).trim(),
        broker: String(form.get("broker") || "").trim(),
        pickup: pickup.value,
        delivery: delivery.value,
        pickup_date: String(form.get("pickup_date")),
        delivery_date: String(form.get("delivery_date")),
        rate,
        loaded_miles: mileage.loadedMiles,
        deadhead_miles: mileage.deadheadMiles,
        status: String(form.get("status") || "UPCOMING"),
      })
      .eq("id", load.id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }

    setEditOpen(false);
    setMenuOpen(false);
    router.refresh();
  }

  async function deleteLoad() {
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("loads")
      .delete()
      .eq("id", load.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDeleteOpen(false);
    setMenuOpen(false);
    router.refresh();
  }

  const modal =
    typeof document !== "undefined" &&
    (editOpen || deleteOpen)
      ? createPortal(
          <div
            className="fp-load-action-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) {
                setEditOpen(false);
                setDeleteOpen(false);
                setError("");
              }
            }}
          >
            {editOpen && (
              <div className="fp-load-edit-modal">
                <header>
                  <div>
                    <h2>Edit Load #{load.load_number || "—"}</h2>
                    <p>Update the load details and save them directly to MileVoxa.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    disabled={saving}
                  >
                    ×
                  </button>
                </header>

                <form onSubmit={saveEdit}>
                  <div className="fp-load-edit-fields">
                    <label>
                      <span>Truck *</span>
                      <select
                        name="truck_id"
                        defaultValue={load.truck_id || ""}
                        required
                      >
                        <option value="">Select truck</option>
                        {trucks.map((truck) => (
                          <option key={truck.id} value={truck.id}>
                            Truck #{truck.unit_number}
                          </option>
                        ))}
                      </select>
                    </label>

                    <Field
                      name="load_number"
                      label="Load / Reference #"
                      defaultValue={load.load_number || ""}
                      required
                    />
                    <Field
                      name="broker"
                      label="Broker / Customer"
                      defaultValue={load.broker || ""}
                    />
                    <label>
                      <span>Status</span>
                      <select
                        name="status"
                        defaultValue={(load.status || "UPCOMING").toUpperCase()}
                      >
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </label>

                    <Field
                      name="pickup"
                      label="Pickup City, State"
                      defaultValue={load.pickup || ""}
                      required
                    />
                    <Field
                      name="delivery"
                      label="Delivery City, State"
                      defaultValue={load.delivery || ""}
                      required
                    />
                    <Field
                      name="pickup_date"
                      label="Pickup Date"
                      type="date"
                      defaultValue={load.pickup_date?.slice(0, 10) || ""}
                      required
                    />
                    <Field
                      name="delivery_date"
                      label="Delivery Date"
                      type="date"
                      defaultValue={load.delivery_date?.slice(0, 10) || ""}
                      required
                    />
                    <Field
                      name="rate"
                      label="Rate"
                      type="number"
                      step="0.01"
                      defaultValue={String(load.rate || "")}
                      required
                    />
                    <Field
                      name="loaded_miles"
                      label="Loaded Miles"
                      type="number"
                      step="0.1"
                      defaultValue={String(load.loaded_miles || 0)}
                    />
                    <Field
                      name="deadhead_miles"
                      label="Deadhead Miles"
                      type="number"
                      step="0.1"
                      defaultValue={String(load.deadhead_miles || 0)}
                    />
                  </div>

                  {error && <div className="fp-load-action-error">{error}</div>}

                  <footer>
                    <button
                      type="button"
                      onClick={() => setEditOpen(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      className="primary"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </footer>
                </form>
              </div>
            )}

            {deleteOpen && (
              <div className="fp-load-delete-modal">
                <div className="fp-load-delete-icon">!</div>
                <h2>Delete Load?</h2>
                <p>
                  Load #{load.load_number || "—"} will be permanently deleted.
                  This cannot be undone.
                </p>

                {error && <div className="fp-load-action-error">{error}</div>}

                <div className="fp-load-delete-actions">
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
                    onClick={deleteLoad}
                    disabled={saving}
                  >
                    {saving ? "Deleting..." : "Delete Load"}
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="fp-load-row-actions">
        <select
          disabled={saving}
          value={(load.status || "UPCOMING").toUpperCase()}
          onChange={(event) => void changeStatus(event.target.value)}
          className="fp-load-status-select"
          aria-label="Change load status"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="fp-load-action-menu-wrap">
          <button
            type="button"
            className="fp-load-action-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Load actions"
          >
            ⋯
          </button>

          {menuOpen && (
            <div className="fp-load-action-menu">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setEditOpen(true);
                }}
              >
                <span>✎</span>
                Edit Load
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setError("");
                  setDeleteOpen(true);
                }}
              >
                <span>⌫</span>
                Delete Load
              </button>
            </div>
          )}
        </div>
      </div>
      {modal}
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  step,
  min,
  defaultValue,
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  min?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span>{label}{required ? " *" : ""}</span>
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        defaultValue={defaultValue}
        required={required}
      />
    </label>
  );
}
