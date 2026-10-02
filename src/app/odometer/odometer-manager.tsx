"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
    rate: number;
  }
>;

function initialState(
  trucks: Truck[],
  records: RecordRow[],
  currentMileageRate: number
): FormState {
  const byTruck = new Map(records.map((row) => [row.truckId, row]));

  return Object.fromEntries(
    trucks.map((truck) => {
      const record = byTruck.get(truck.id);
      return [
        truck.id,
        {
          start: record?.startOdometer == null ? "" : String(record.startOdometer),
          end: record?.endOdometer == null ? "" : String(record.endOdometer),
          rate:
            record?.ratePerMile == null
              ? currentMileageRate
              : record.ratePerMile,
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
    initialState(trucks, records, mileageRate)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setValues(initialState(trucks, records, mileageRate));
    setError("");
    setSuccess("");
  }, [weekStart, trucks, records, mileageRate]);

  const summary = useMemo(() => {
    let miles = 0;
    let fee = 0;
    let completed = 0;
    const rates = new Set<number>();

    for (const truck of trucks) {
      const row = values[truck.id];
      const start = numberOrNull(row?.start || "");
      const end = numberOrNull(row?.end || "");
      const rowRate = Number(row?.rate ?? mileageRate);

      if (Number.isFinite(rowRate)) {
        rates.add(Number(rowRate.toFixed(4)));
      }

      if (start != null && end != null && end >= start) {
        const rowMiles = end - start;
        miles += rowMiles;
        fee += mileageFeeActive ? rowMiles * rowRate : 0;
        completed += 1;
      }
    }

    return {
      miles,
      fee,
      completed,
      rates: [...rates],
    };
  }, [values, trucks, mileageRate, mileageFeeActive]);

  const rateLabel =
    summary.rates.length <= 1
      ? `${formatMoney(summary.rates[0] ?? mileageRate)}/mi`
      : "Mixed rates";

  function setValue(
    truckId: string,
    field: "start" | "end",
    value: string
  ) {
    setValues((current) => ({
      ...current,
      [truckId]: {
        ...(current[truckId] || {
          start: "",
          end: "",
          rate: mileageRate,
        }),
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
        const value = values[truck.id] || {
          start: "",
          end: "",
          rate: mileageRate,
        };

        return {
          truck,
          start: numberOrNull(value.start),
          end: numberOrNull(value.end),
          rate: value.rate,
        };
      })
      .filter((row) => row.start != null || row.end != null);

    if (rows.length === 0) {
      setError(`Enter odometer values for ${weekLabel}.`);
      return;
    }

    for (const row of rows) {
      if (row.start == null || row.end == null) {
        setError(
          `${row.truck.unitNumber}: both starting and ending odometer are required for ${weekLabel}.`
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
          rate_per_mile: Number(row.rate.toFixed(4)),
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

      setSuccess(`Odometer data saved only for ${weekLabel}.`);
      router.refresh();
    } catch (caught) {
      const message =
        caught && typeof caught === "object" && "message" in caught
          ? String(caught.message)
          : `Unable to save odometer data for ${weekLabel}.`;
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
      <div className="fp-odometer-week-isolation">
        <strong>{weekLabel}</strong>
        <span>
          This week has its own odometer readings and mileage fee. Changing
          weeks does not copy these values to another week.
        </span>
      </div>

      <section className="fp-odometer-summary">
        <div>
          <span>Weekly Odometer Miles</span>
          <strong>{summary.miles.toLocaleString()} mi</strong>
          <small>{summary.completed} of {trucks.length} trucks complete</small>
        </div>

        <div>
          <span>Saved Week Rate</span>
          <strong>{rateLabel}</strong>
          <small>
            {records.length > 0
              ? "Uses this week's saved rate"
              : "New week uses the current company rate"}
          </small>
        </div>

        <div>
          <span>Weekly Mileage Expense</span>
          <strong>{formatMoney(summary.fee)}</strong>
          <small>Each truck's weekly miles × its saved weekly rate</small>
        </div>
      </section>

      <section className="fp-odometer-card">
        <div className="fp-odometer-card-head">
          <div>
            <span>TRUCK ODOMETERS</span>
            <h2>{weekLabel}</h2>
          </div>
          <p>Enter the beginning and ending odometer for this selected week only.</p>
        </div>

        <div className="fp-odometer-table-wrap">
          <table className="fp-odometer-table">
            <thead>
              <tr>
                <th>Truck</th>
                <th>Starting Odometer</th>
                <th>Ending Odometer</th>
                <th>Weekly Miles</th>
                <th>Rate</th>
                <th>Mileage Expense</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => {
                const row =
                  values[truck.id] || {
                    start: "",
                    end: "",
                    rate: mileageRate,
                  };
                const start = numberOrNull(row.start);
                const end = numberOrNull(row.end);
                const valid = start != null && end != null && end >= start;
                const miles = valid ? end - start : null;
                const fee =
                  miles == null || !mileageFeeActive
                    ? 0
                    : miles * row.rate;

                return (
                  <tr key={`${weekStart}-${truck.id}`}>
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
                        placeholder="Start"
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
                      />
                    </td>

                    <td>
                      <strong className="fp-odometer-calculated">
                        {miles == null ? "—" : `${miles.toLocaleString()} mi`}
                      </strong>
                    </td>

                    <td>
                      <strong className="fp-odometer-rate">
                        {formatMoney(row.rate)}/mi
                      </strong>
                    </td>

                    <td>
                      <strong className="fp-odometer-fee">
                        {miles == null ? "—" : formatMoney(fee)}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(error || success) && (
          <div className={error ? "fp-odometer-message error" : "fp-odometer-message success"}>
            {error || success}
          </div>
        )}

        <div className="fp-odometer-save-row">
          <div>
            <span>Selected week settlement impact</span>
            <strong>{summary.miles.toLocaleString()} mi → {formatMoney(summary.fee)}</strong>
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : `Save ${weekLabel}`}
          </button>
        </div>
      </section>
    </form>
  );
}
