"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/format";

type Truck = {
  id: string;
  unitNumber: string;
  make: string;
  model: string;
  currentMileage: number | null;
};

type RecordRow = {
  truckId: string;
  startOdometer: number | null;
  endOdometer: number | null;
  ratePerMile: number | null;
};

type FormState = Record<
  string,
  {
    start: string;
    end: string;
  }
>;

function initialState(trucks: Truck[], records: RecordRow[]): FormState {
  const byTruck = new Map(records.map((row) => [row.truckId, row]));

  return Object.fromEntries(
    trucks.map((truck) => {
      const record = byTruck.get(truck.id);
      return [
        truck.id,
        {
          start:
            record?.startOdometer == null
              ? ""
              : String(record.startOdometer),
          end:
            record?.endOdometer == null ? "" : String(record.endOdometer),
        },
      ];
    })
  );
}

function numberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function OdometerManager({
  weekStart,
  weekLabel,
  mileageRate,
  mileageFeeActive,
  trucks,
  records,
}: {
  weekStart: string;
  weekLabel: string;
  mileageRate: number;
  mileageFeeActive: boolean;
  trucks: Truck[];
  records: RecordRow[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(() =>
    initialState(trucks, records)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const summary = useMemo(() => {
    let miles = 0;
    let completed = 0;

    for (const truck of trucks) {
      const row = values[truck.id];
      const start = numberOrNull(row?.start || "");
      const end = numberOrNull(row?.end || "");

      if (start != null && end != null && end >= start) {
        miles += end - start;
        completed += 1;
      }
    }

    return {
      miles,
      completed,
      fee: mileageFeeActive ? miles * mileageRate : 0,
    };
  }, [values, trucks, mileageRate, mileageFeeActive]);

  function setValue(
    truckId: string,
    field: "start" | "end",
    value: string
  ) {
    setValues((current) => ({
      ...current,
      [truckId]: {
        ...(current[truckId] || { start: "", end: "" }),
        [field]: value,
      },
    }));
    setSuccess("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const rows = trucks
      .map((truck) => {
        const value = values[truck.id] || { start: "", end: "" };
        const start = numberOrNull(value.start);
        const end = numberOrNull(value.end);

        return {
          truck,
          start,
          end,
        };
      })
      .filter((row) => row.start != null || row.end != null);

    if (rows.length === 0) {
      setError("Enter at least one truck's starting and ending odometer.");
      return;
    }

    for (const row of rows) {
      if (row.start == null || row.end == null) {
        setError(
          `${row.truck.unitNumber}: both starting and ending odometer are required.`
        );
        return;
      }

      if (row.start < 0 || row.end < 0) {
        setError(`${row.truck.unitNumber}: odometer values cannot be negative.`);
        return;
      }

      if (row.end < row.start) {
        setError(
          `${row.truck.unitNumber}: ending odometer cannot be lower than starting odometer.`
        );
        return;
      }
    }

    setSaving(true);
    const supabase = createClient();

    try {
      for (const row of rows) {
        const { data: existing, error: lookupError } = await supabase
          .from("weekly_odometer_records")
          .select("truck_id")
          .eq("truck_id", row.truck.id)
          .eq("week_start", weekStart)
          .limit(1);

        if (lookupError) throw lookupError;

        const payload = {
          truck_id: row.truck.id,
          week_start: weekStart,
          start_odometer: row.start,
          end_odometer: row.end,
          rate_per_mile: Number(mileageRate.toFixed(2)),
        };

        if ((existing ?? []).length > 0) {
          const { error: updateError } = await supabase
            .from("weekly_odometer_records")
            .update(payload)
            .eq("truck_id", row.truck.id)
            .eq("week_start", weekStart);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("weekly_odometer_records")
            .insert(payload);

          if (insertError) throw insertError;
        }
      }

      setSuccess(`Weekly odometer saved for ${weekLabel}.`);
      router.refresh();
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : "Unable to save weekly odometer.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (trucks.length === 0) {
    return (
      <section className="fp-odometer-empty">
        <strong>No active trucks found</strong>
        <p>Add an active truck before recording weekly odometer mileage.</p>
      </section>
    );
  }

  return (
    <form onSubmit={save}>
      <section className="fp-odometer-summary">
        <div>
          <span>Weekly Odometer Miles</span>
          <strong>{summary.miles.toLocaleString()} mi</strong>
          <small>
            {summary.completed} of {trucks.length} trucks complete
          </small>
        </div>
        <div>
          <span>Mileage Rate</span>
          <strong>{formatMoney(mileageRate)}/mi</strong>
          <small>
            {mileageFeeActive ? "Mileage fee is active" : "Mileage fee is disabled"}
          </small>
        </div>
        <div>
          <span>Weekly Mileage Expense</span>
          <strong>{formatMoney(summary.fee)}</strong>
          <small>Odometer miles × company mileage rate</small>
        </div>
      </section>

      <section className="fp-odometer-card">
        <div className="fp-odometer-card-head">
          <div>
            <span>TRUCK ODOMETERS</span>
            <h2>{weekLabel}</h2>
          </div>
          <p>
            Enter the odometer at the beginning and end of the selected week.
          </p>
        </div>

        <div className="fp-odometer-table-wrap">
          <table className="fp-odometer-table">
            <thead>
              <tr>
                <th>Truck</th>
                <th>Starting Odometer</th>
                <th>Ending Odometer</th>
                <th>Weekly Miles</th>
                <th>Mileage Expense</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => {
                const row = values[truck.id] || { start: "", end: "" };
                const start = numberOrNull(row.start);
                const end = numberOrNull(row.end);
                const valid =
                  start != null && end != null && end >= start;
                const miles = valid ? end - start : null;
                const fee =
                  miles == null || !mileageFeeActive
                    ? 0
                    : miles * mileageRate;

                return (
                  <tr key={truck.id}>
                    <td>
                      <div className="fp-odometer-truck">
                        <strong>{truck.unitNumber}</strong>
                        <span>
                          {[truck.make, truck.model].filter(Boolean).join(" ") ||
                            "Active truck"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={row.start}
                        onChange={(event) =>
                          setValue(truck.id, "start", event.target.value)
                        }
                        placeholder={
                          truck.currentMileage == null
                            ? "Start"
                            : String(Math.round(truck.currentMileage))
                        }
                        aria-label={`${truck.unitNumber} starting odometer`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={row.end}
                        onChange={(event) =>
                          setValue(truck.id, "end", event.target.value)
                        }
                        placeholder="End"
                        aria-label={`${truck.unitNumber} ending odometer`}
                      />
                    </td>
                    <td>
                      <strong className="fp-odometer-calculated">
                        {miles == null
                          ? "—"
                          : `${miles.toLocaleString()} mi`}
                      </strong>
                    </td>
                    <td>
                      <strong className="fp-odometer-fee">
                        {miles == null
                          ? "—"
                          : formatMoney(fee)}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(error || success) && (
          <div
            className={
              error ? "fp-odometer-message error" : "fp-odometer-message success"
            }
          >
            {error || success}
          </div>
        )}

        <div className="fp-odometer-save-row">
          <div>
            <span>Settlement impact</span>
            <strong>
              {summary.miles.toLocaleString()} mi ×{" "}
              {formatMoney(mileageRate)} = {formatMoney(summary.fee)}
            </strong>
          </div>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Weekly Odometer"}
          </button>
        </div>
      </section>
    </form>
  );
}
