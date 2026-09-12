"use client";

import { FormEvent, useState } from "react";
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
  const [draft, setDraft] = useState<Draft>({
    loadNumber: "",
    broker: "",
    pickup: "",
    delivery: "",
    pickupDate: "",
    deliveryDate: "",
    rate: "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const form = new FormData(event.currentTarget);
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

    event.currentTarget.reset();
    setDraft({
      loadNumber: "",
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
      <button
        onClick={() => setOpen((value) => !value)}
        disabled={trucks.length === 0}
        className="rounded-[6px] bg-[#1188ff] px-4 py-2.5 text-[10px] font-black text-white shadow-[0_7px_18px_rgba(17,136,255,.15)] hover:bg-[#0879ee] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {open ? "Close" : "+ Add Load"}
      </button>

      {open && (
        <form
          onSubmit={submit}
          className="mt-5 grid gap-4 rounded-[10px] border border-[#dce5ef] bg-white p-5 md:grid-cols-2"
        >
          <SmartLoadImport
            onParsed={(data) =>
              patchDraft({
                loadNumber: data.loadNumber ?? draft.loadNumber,
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
          <ControlledField name="load_number" label="Load / Reference # *" value={draft.loadNumber} setValue={(v) => patchDraft({ loadNumber: v })} />
          <ControlledField name="broker" label="Broker / Customer" value={draft.broker} setValue={(v) => patchDraft({ broker: v })} />
          <div />
          <ControlledField name="pickup" label="Pickup City, State *" value={draft.pickup} setValue={(v) => patchDraft({ pickup: v })} />
          <ControlledField name="delivery" label="Delivery City, State *" value={draft.delivery} setValue={(v) => patchDraft({ delivery: v })} />
          <ControlledField name="pickup_date" label="Pickup Date *" type="date" value={draft.pickupDate} setValue={(v) => patchDraft({ pickupDate: v })} />
          <ControlledField name="delivery_date" label="Delivery Date *" type="date" value={draft.deliveryDate} setValue={(v) => patchDraft({ deliveryDate: v })} />
          <ControlledField name="rate" label="Rate *" type="number" step="0.01" value={draft.rate} setValue={(v) => patchDraft({ rate: v })} />
          <Field name="loaded_miles" label="Loaded Miles *" type="number" step="0.1" />
          <Field name="deadhead_miles" label="Deadhead Miles" type="number" step="0.1" />

          {error && (
            <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end">
            <button
              disabled={saving}
              className="rounded-[6px] bg-[#17c978] px-4 py-2.5 text-[10px] font-black text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Load"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function SelectTruck({ trucks }: { trucks: Truck[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">
        Assign Truck *
      </span>
      <select
        name="truck_id"
        required
        className="w-full fp-field text-[11px]"
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
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full fp-field text-[11px]"
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
    <label className="block">
      <span className="mb-2 block text-[8px] font-black uppercase tracking-[.12em] text-[#71859a]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        className="w-full fp-field text-[11px]"
      />
    </label>
  );
}
