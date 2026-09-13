"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SmartLoadImport from "./smart-load-import";

type Truck = {
  id: string;
  unit_number: string;
  make: string | null;
  model: string | null;
};

type Draft = {
  loadNumber: string;
  referenceNumber: string;
  broker: string;
  pickup: string;
  delivery: string;
  pickupDate: string;
  deliveryDate: string;
  rate: string;
};

export default function AddLoadForm({ trucks }: { trucks: Truck[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [smartImportSignal, setSmartImportSignal] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    loadNumber: "",
    referenceNumber: "",
    broker: "",
    pickup: "",
    delivery: "",
    pickupDate: "",
    deliveryDate: "",
    rate: "",
  });


useEffect(() => {
  function openAddLoad(event: Event) {
    const custom = event as CustomEvent<{ mode?: "add" | "import" }>;
    setOpen(true);
    setError("");

    if (custom.detail?.mode === "import") {
      setSmartImportSignal((value) => value + 1);
    }

    window.setTimeout(() => {
      document
        .getElementById("add-load")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  window.addEventListener("fleetpilot:open-add-load", openAddLoad);
  return () =>
    window.removeEventListener("fleetpilot:open-add-load", openAddLoad);
}, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const rate = Number(form.get("rate")) || 0;
    const loadedMiles = Number(form.get("loaded_miles")) || 0;

    if (!form.get("truck_id") || !form.get("load_number") || !form.get("pickup") || !form.get("delivery") || !form.get("pickup_date") || !form.get("delivery_date") || rate <= 0 || loadedMiles <= 0) {
      setError("Complete the required load fields.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const { error: insertError } = await supabase.from("loads").insert({
      truck_id: String(form.get("truck_id")),
      load_number: String(form.get("load_number")).trim(),
      broker: String(form.get("broker") || "").trim(),
      pickup: String(form.get("pickup")).trim(),
      delivery: String(form.get("delivery")).trim(),
      pickup_date: String(form.get("pickup_date")),
      delivery_date: String(form.get("delivery_date")),
      rate,
      loaded_miles: loadedMiles,
      deadhead_miles: Number(form.get("deadhead_miles")) || 0,
      status: "UPCOMING",
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    formElement.reset();
    setDraft({
      loadNumber: "",
      referenceNumber: "",
      broker: "",
      pickup: "",
      delivery: "",
      pickupDate: "",
      deliveryDate: "",
      rate: "",
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  function patchDraft(data: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...data }));
  }

  return (
    <>
      {open && (
        <form
          onSubmit={submit}
          className="fp-add-load-form"
        >
          <div className="fp-add-load-header md:col-span-2">
            <div>
              <span>New Load</span>
              <h3>Add Load Details</h3>
              <p>Enter the core dispatch and financial information for this load.</p>
            </div>
            <div className="fp-add-load-required">* Required fields</div>
          </div>
          <SmartLoadImport
            openSignal={smartImportSignal}
            onParsed={(data) =>
              patchDraft({
                loadNumber: data.loadNumber ?? draft.loadNumber,
                referenceNumber:
                  data.referenceNumber ?? draft.referenceNumber,
                broker: data.broker ?? draft.broker,
                pickup: data.pickup ?? draft.pickup,
                delivery: data.delivery ?? draft.delivery,
                pickupDate: data.pickupDate ?? draft.pickupDate,
                deliveryDate: data.deliveryDate ?? draft.deliveryDate,
                rate: data.rate ?? draft.rate,
              })
            }
          />

          <SelectTruck trucks={trucks} />
          <ControlledField name="load_number" label="Load ID *" value={draft.loadNumber} setValue={(v) => patchDraft({ loadNumber: v })} />

          {draft.referenceNumber && (
            <div className="fp-telegram-ref-preview">
              <span>Telegram REF #</span>
              <strong>{draft.referenceNumber}</strong>
              <small>
                Reference is shown for review only because the current Loads table has no dedicated REF # column.
              </small>
            </div>
          )}
          <ControlledField name="broker" label="Broker / Customer" value={draft.broker} setValue={(v) => patchDraft({ broker: v })} wide />
          <ControlledField name="pickup" label="Pickup City, State *" value={draft.pickup} setValue={(v) => patchDraft({ pickup: v })} />
          <ControlledField name="delivery" label="Delivery City, State *" value={draft.delivery} setValue={(v) => patchDraft({ delivery: v })} />
          <ControlledField name="pickup_date" label="Pickup Date *" type="date" value={draft.pickupDate} setValue={(v) => patchDraft({ pickupDate: v })} />
          <ControlledField name="delivery_date" label="Delivery Date *" type="date" value={draft.deliveryDate} setValue={(v) => patchDraft({ deliveryDate: v })} />
          <ControlledField name="rate" label="Rate *" type="number" step="0.01" value={draft.rate} setValue={(v) => patchDraft({ rate: v })} />
          <Field name="loaded_miles" label="Loaded Miles *" type="number" step="0.1" />
          <Field name="deadhead_miles" label="Deadhead Miles" type="number" step="0.1" />

          {error && (
            <div className="fp-add-load-error md:col-span-2">
              {error}
            </div>
          )}

          <div className="fp-add-load-footer md:col-span-2">
            <span>Load will be created with <b>Upcoming</b> status.</span>

            <div className="fp-add-load-footer-actions">
              <button
                type="button"
                className="fp-add-load-close"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Close
              </button>

              <button
                disabled={saving}
                className="fp-add-load-save"
              >
                {saving ? "Saving..." : "Save Load"}
              </button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}

function SelectTruck({ trucks }: { trucks: Truck[] }) {
  return (
    <label className="fp-add-load-field">
      <span>
        Assign Truck *
      </span>
      <select
        name="truck_id"
        required
        className="fp-add-load-control"
      >
        <option value="">Select truck</option>
        {trucks.map((truck) => (
          <option key={truck.id} value={truck.id}>
            Truck #{truck.unit_number} — {[truck.make, truck.model].filter(Boolean).join(" ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function ControlledField({
  name,
  label,
  type = "text",
  step,
  value,
  setValue,
  wide = false,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  value: string;
  setValue: (value: string) => void;
  wide?: boolean;
}) {
  return (
    <label className={`fp-add-load-field ${wide ? "wide" : ""}`}>
      <span>
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="fp-add-load-control"
      />
    </label>
  );
}

function Field({
  name,
  label,
  type = "text",
  step,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
}) {
  return (
    <label className="fp-add-load-field">
      <span>
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        className="fp-add-load-control"
      />
    </label>
  );
}
