"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeUsLocation, validateLoadMiles } from "@/lib/load-domain";

type ActionType = "load" | "expense" | "fuel" | "maintenance";

type Truck = {
  id: string;
  unit_number: string;
  current_mileage: number;
};

const expenseCategories = [
  "Fuel",
  "Maintenance",
  "Tolls",
  "Parking",
  "Scale",
  "Insurance",
  "Permits",
  "Driver Pay",
  "Truck Payment",
  "Trailer",
  "Food / Travel",
  "Other",
];

const serviceTypes = [
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

const detailsHref: Record<ActionType, string> = {
  load: "/loads#add-load",
  expense: "/expenses#add-expense",
  fuel: "/expenses#add-expense",
  maintenance: "/maintenance#add-maintenance",
};

const actionCopy: Record<
  ActionType,
  { title: string; subtitle: string; save: string }
> = {
  load: {
    title: "Quick Add Load",
    subtitle: "Enter the core dispatch details now.",
    save: "Save Load",
  },
  expense: {
    title: "Quick Add Expense",
    subtitle: "Record a business expense in a few seconds.",
    save: "Save Expense",
  },
  fuel: {
    title: "Quick Add Fuel",
    subtitle: "Capture the fuel purchase and truck now.",
    save: "Save Fuel",
  },
  maintenance: {
    title: "Quick Add Maintenance",
    subtitle: "Record the essential service information.",
    save: "Save Service",
  },
};

export default function DashboardQuickActions({
  trucks,
}: {
  trucks: Truck[];
}) {
  const router = useRouter();
  const [action, setAction] = useState<ActionType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function open(type: ActionType) {
    setError("");
    setAction(type);
  }

  function close() {
    if (saving) return;
    setAction(null);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;

    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    try {
      if (action === "load") {
        const truckId = value(form, "truck_id");
        const loadNumber = value(form, "load_number");
        const pickupRaw = value(form, "pickup");
        const deliveryRaw = value(form, "delivery");
        const pickupDate = value(form, "pickup_date");
        const deliveryDate = value(form, "delivery_date");
        const rate = number(form, "rate");
        const mileage = validateLoadMiles(number(form, "loaded_miles"), 0);
        const pickup = normalizeUsLocation(pickupRaw);
        const delivery = normalizeUsLocation(deliveryRaw);

        if (
          !truckId ||
          !loadNumber ||
          !pickupDate ||
          !deliveryDate ||
          rate <= 0
        ) {
          throw new Error("Complete all required load fields.");
        }

        if (!mileage.ok) throw new Error(mileage.error);
        if (!pickup.ok) throw new Error(`Pickup: ${pickup.error}`);
        if (!delivery.ok) throw new Error(`Delivery: ${delivery.error}`);

        const { error } = await supabase.from("loads").insert({
          truck_id: truckId,
          load_number: loadNumber,
          broker: value(form, "broker"),
          pickup: pickup.value,
          delivery: delivery.value,
          pickup_date: pickupDate,
          delivery_date: deliveryDate,
          rate,
          loaded_miles: mileage.loadedMiles,
          deadhead_miles: mileage.deadheadMiles,
          status: "UPCOMING",
        });

        if (error) throw error;
      }

      if (action === "expense") {
        const amount = number(form, "amount");
        const date = value(form, "expense_date");
        const category = value(form, "category") || "Other";

        if (!date || amount <= 0) {
          throw new Error("Date and an amount greater than zero are required.");
        }

        const { error } = await supabase.from("expenses").insert({
          truck_id: value(form, "truck_id") || null,
          load_id: null,
          category,
          expense_date: date,
          amount,
          vendor: value(form, "vendor"),
          description: "",
          gallons: null,
          fuel_price_per_gallon: null,
          receipt_path: null,
        });

        if (error) throw error;
      }

      if (action === "fuel") {
        const truckId = value(form, "truck_id");
        const date = value(form, "expense_date");
        const gallons = number(form, "gallons");
        const price = number(form, "fuel_price_per_gallon");
        const manualAmount = number(form, "amount");
        const amount =
          manualAmount > 0
            ? manualAmount
            : gallons > 0 && price > 0
              ? gallons * price
              : 0;

        if (!truckId || !date || amount <= 0) {
          throw new Error(
            "Truck, date, and fuel total are required. You can enter Total or Gallons × Price/Gal."
          );
        }

        const { error } = await supabase.from("expenses").insert({
          truck_id: truckId,
          load_id: null,
          category: "Fuel",
          expense_date: date,
          amount,
          vendor: value(form, "vendor"),
          description: "",
          gallons: gallons > 0 ? gallons : null,
          fuel_price_per_gallon: price > 0 ? price : null,
          receipt_path: null,
        });

        if (error) throw error;
      }

      if (action === "maintenance") {
        const truckId = value(form, "truck_id");
        const serviceType = value(form, "service_type");
        const serviceDate = value(form, "service_date");
        const mileage = number(form, "mileage");
        const cost = number(form, "cost");
        const vendor = value(form, "vendor");

        if (!truckId || !serviceType || !serviceDate) {
          throw new Error("Truck, service type, and service date are required.");
        }

        let expenseId: string | null = null;

        if (cost > 0) {
          const { data: expense, error: expenseError } = await supabase
            .from("expenses")
            .insert({
              truck_id: truckId,
              load_id: null,
              category: "Maintenance",
              expense_date: serviceDate,
              amount: cost,
              vendor,
              description: `${serviceType} maintenance service`,
              gallons: null,
              fuel_price_per_gallon: null,
            })
            .select("id")
            .single();

          if (expenseError) throw expenseError;
          expenseId = expense?.id ?? null;
        }

        const { error: maintenanceError } = await supabase
          .from("maintenance_records")
          .insert({
            truck_id: truckId,
            service_type: serviceType,
            service_date: serviceDate,
            mileage,
            vendor,
            cost,
            next_service_mileage: null,
            next_service_date: null,
            expense_id: expenseId,
          });

        if (maintenanceError) {
          if (expenseId) {
            await supabase.from("expenses").delete().eq("id", expenseId);
          }
          throw maintenanceError;
        }
      }

      setAction(null);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save this record."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fp-quick-actions-list px-3 pb-3">
        <QuickButton
          label="Add Load"
          type="load"
          primary
          onClick={() => open("load")}
          disabled={trucks.length === 0}
        />
        <QuickButton
          label="Add Expense"
          type="expense"
          onClick={() => open("expense")}
        />
        <QuickButton
          label="Add Fuel Purchase"
          type="fuel"
          onClick={() => open("fuel")}
          disabled={trucks.length === 0}
        />
        <QuickButton
          label="Add Maintenance"
          type="maintenance"
          onClick={() => open("maintenance")}
          disabled={trucks.length === 0}
        />
      </div>

      {action &&
        typeof document !== "undefined" &&
        createPortal(
        <div
          className="fp-quick-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={actionCopy[action].title}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="fp-quick-modal">
            <header className="fp-quick-modal-head">
              <div>
                <span className={`fp-quick-modal-icon ${action}`}>
                  <QuickIcon type={action} />
                </span>
                <div>
                  <h2>{actionCopy[action].title}</h2>
                  <p>{actionCopy[action].subtitle}</p>
                </div>
              </div>

              <button
                type="button"
                className="fp-quick-modal-close"
                onClick={close}
                aria-label="Close"
                disabled={saving}
              >
                ×
              </button>
            </header>

            <form onSubmit={submit}>
              <div className="fp-quick-modal-fields">
                {action === "load" && (
                  <>
                    <TruckField trucks={trucks} required />
                    <Field name="load_number" label="Load / Reference #" required />
                    <Field name="pickup" label="Pickup City, State" required />
                    <Field name="delivery" label="Delivery City, State" required />
                    <Field
                      name="pickup_date"
                      label="Pickup Date"
                      type="date"
                      defaultValue={today}
                      required
                    />
                    <Field
                      name="delivery_date"
                      label="Delivery Date"
                      type="date"
                      defaultValue={today}
                      required
                    />
                    <Field name="rate" label="Rate" type="number" step="0.01" required />
                    <Field
                      name="loaded_miles"
                      label="Loaded Miles"
                      type="number"
                      step="1"
                      min="0"
                      required
                    />
                    <Field name="broker" label="Broker / Customer" wide />
                  </>
                )}

                {action === "expense" && (
                  <>
                    <label>
                      <span>Category *</span>
                      <select name="category" defaultValue="Other">
                        {expenseCategories
                          .filter((item) => item !== "Fuel")
                          .map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                      </select>
                    </label>
                    <Field
                      name="expense_date"
                      label="Expense Date"
                      type="date"
                      defaultValue={today}
                      required
                    />
                    <Field name="amount" label="Amount" type="number" step="0.01" required />
                    <Field name="vendor" label="Vendor" />
                    <TruckField trucks={trucks} includeNone />
                  </>
                )}

                {action === "fuel" && (
                  <>
                    <TruckField trucks={trucks} required />
                    <Field
                      name="expense_date"
                      label="Fuel Date"
                      type="date"
                      defaultValue={today}
                      required
                    />
                    <Field name="vendor" label="Fuel Station / Vendor" />
                    <Field name="amount" label="Total Amount" type="number" step="0.01" />
                    <Field name="gallons" label="Gallons" type="number" step="0.001" />
                    <Field
                      name="fuel_price_per_gallon"
                      label="Price / Gallon"
                      type="number"
                      step="0.001"
                    />
                  </>
                )}

                {action === "maintenance" && (
                  <>
                    <TruckField trucks={trucks} required />
                    <label>
                      <span>Service Type *</span>
                      <select name="service_type" defaultValue="Oil Change">
                        {serviceTypes.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </label>
                    <Field
                      name="service_date"
                      label="Service Date"
                      type="date"
                      defaultValue={today}
                      required
                    />
                    <Field name="mileage" label="Service Mileage" type="number" step="0.1" />
                    <Field name="cost" label="Cost" type="number" step="0.01" />
                    <Field name="vendor" label="Vendor / Shop" />
                  </>
                )}
              </div>

              {error && <div className="fp-quick-modal-error">{error}</div>}

              <div className="fp-quick-more-details">
                <div>
                  <strong>Need more details?</strong>
                  <span>
                    Add receipts, notes, assignments, scheduling, deadhead miles and other advanced information on the full page.
                  </span>
                </div>
                <Link href={detailsHref[action]} onClick={close}>
                  Full details →
                </Link>
              </div>

              <footer className="fp-quick-modal-footer">
                <button type="button" onClick={close} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={saving}>
                  {saving ? "Saving..." : actionCopy[action].save}
                </button>
              </footer>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function QuickButton({
  label,
  type,
  primary = false,
  onClick,
  disabled = false,
}: {
  label: string;
  type: ActionType;
  primary?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`fp-quick-row ${primary ? "fp-quick-row-primary" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Add an active truck first" : label}
    >
      <span className="fp-quick-left">
        <span className={`fp-quick-icon ${primary ? "fp-quick-icon-primary" : ""}`}>
          <QuickIcon type={type} />
        </span>
        <span>{label}</span>
      </span>
      <span className="fp-quick-arrow">›</span>
    </button>
  );
}

function TruckField({
  trucks,
  required = false,
  includeNone = false,
}: {
  trucks: Truck[];
  required?: boolean;
  includeNone?: boolean;
}) {
  return (
    <label>
      <span>{required ? "Truck *" : "Truck"}</span>
      <select name="truck_id" required={required}>
        {includeNone && <option value="">No truck</option>}
        {!includeNone && <option value="">Select truck</option>}
        {trucks.map((truck) => (
          <option key={truck.id} value={truck.id}>
            Truck #{truck.unit_number}
            {truck.current_mileage > 0
              ? ` · ${Math.round(truck.current_mileage).toLocaleString()} mi`
              : ""}
          </option>
        ))}
      </select>
    </label>
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
  wide = false,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  min?: string;
  defaultValue?: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "wide" : ""}>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
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

function value(form: FormData, name: string) {
  return String(form.get(name) || "").trim();
}

function number(form: FormData, name: string) {
  const parsed = Number(form.get(name));
  return Number.isFinite(parsed) ? parsed : 0;
}

function QuickIcon({ type }: { type: ActionType }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[14px] w-[14px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "load") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (type === "expense") {
    return (
      <svg {...common}>
        <path d="M6 3h12v18H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    );
  }

  if (type === "fuel") {
    return (
      <svg {...common}>
        <path d="M6 3h9v18H6z" />
        <path d="M8 7h5" />
        <path d="M15 8h2l2 3v6a2 2 0 0 0 2 2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z" />
    </svg>
  );
}
