"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type DepositSettings = {
  id: string | null;
  company_id: string;
  target_amount: number;
  hold_method: "WEEKLY" | "ONE_TIME" | "MANUAL";
  weekly_amount: number;
  start_date: string | null;
  expected_release_date: string | null;
  status: "HOLDING" | "PARTIALLY_RETURNED" | "FULLY_RETURNED" | "CLOSED";
  notes: string | null;
};

export type DepositTransaction = {
  id: string;
  company_id: string;
  truck_id: string | null;
  transaction_date: string;
  transaction_type: "HOLD" | "RETURN" | "ADJUSTMENT";
  adjustment_direction: "INCREASE" | "DECREASE" | null;
  amount: number;
  description: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string | null;
};

export type DepositTruck = {
  id: string;
  unit_number: string;
};

export default function SecurityDepositManager({
  companyId,
  initialSettings,
  initialTransactions,
  trucks,
  owner,
  storageReady,
}: {
  companyId: string;
  initialSettings: DepositSettings | null;
  initialTransactions: DepositTransaction[];
  trucks: DepositTruck[];
  owner: boolean;
  storageReady: boolean;
}) {
  const router = useRouter();

  const [settings, setSettings] = useState<DepositSettings>(
    initialSettings || {
      id: null,
      company_id: companyId,
      target_amount: 0,
      hold_method: "MANUAL",
      weekly_amount: 0,
      start_date: null,
      expected_release_date: null,
      status: "HOLDING",
      notes: null,
    }
  );
  const [transactions, setTransactions] =
    useState<DepositTransaction[]>(initialTransactions);

  const [type, setType] =
    useState<"HOLD" | "RETURN" | "ADJUSTMENT">("HOLD");
  const [adjustmentDirection, setAdjustmentDirection] =
    useState<"INCREASE" | "DECREASE">("INCREASE");
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [truckId, setTruckId] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyFilter, setHistoryFilter] =
    useState<"ALL" | "HOLD" | "RETURN" | "ADJUSTMENT">("ALL");

  const totals = useMemo(() => calculateTotals(transactions), [transactions]);

  const targetRemaining = Math.max(
    Number(settings.target_amount || 0) - totals.heldToDate,
    0
  );

  const targetProgress =
    settings.target_amount > 0
      ? Math.min(100, (totals.heldToDate / settings.target_amount) * 100)
      : 0;

  const filtered = transactions.filter((row) =>
    historyFilter === "ALL"
      ? true
      : row.transaction_type === historyFilter
  );

  async function saveSettings() {
    if (!owner || !storageReady || !companyId) return;

    setBusy(true);
    setMessage("");

    try {
      const supabase = createClient();
      const payload = {
        company_id: companyId,
        target_amount: Number(settings.target_amount || 0),
        hold_method: settings.hold_method,
        weekly_amount: Number(settings.weekly_amount || 0),
        start_date: settings.start_date || null,
        expected_release_date:
          settings.expected_release_date || null,
        status: settings.status,
        notes: settings.notes?.trim() || null,
      };

      if (settings.id) {
        const { error } = await supabase
          .from("security_deposit_settings")
          .update(payload)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("security_deposit_settings")
          .insert(payload)
          .select(
            "id, company_id, target_amount, hold_method, weekly_amount, start_date, expected_release_date, status, notes"
          )
          .single();

        if (error) throw error;

        setSettings({
          id: data.id,
          company_id: data.company_id,
          target_amount: Number(data.target_amount || 0),
          hold_method: data.hold_method,
          weekly_amount: Number(data.weekly_amount || 0),
          start_date: data.start_date,
          expected_release_date: data.expected_release_date,
          status: data.status,
          notes: data.notes,
        });
      }

      setMessage("Security deposit settings saved.");
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Could not save security deposit settings."
      );
    } finally {
      setBusy(false);
    }
  }

  async function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!owner || !storageReady || !companyId) return;

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Enter an amount greater than zero.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const supabase = createClient();
      const payload = {
        company_id: companyId,
        truck_id: truckId || null,
        transaction_date: date,
        transaction_type: type,
        adjustment_direction:
          type === "ADJUSTMENT" ? adjustmentDirection : null,
        amount: value,
        description: description.trim() || null,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      };

      const { data, error } = await supabase
        .from("security_deposit_transactions")
        .insert(payload)
        .select(
          "id, company_id, truck_id, transaction_date, transaction_type, adjustment_direction, amount, description, reference, notes, created_at"
        )
        .single();

      if (error) throw error;

      setTransactions((current) =>
        [
          {
            ...data,
            amount: Number(data.amount || 0),
          },
          ...current,
        ].sort((a, b) =>
          b.transaction_date.localeCompare(a.transaction_date)
        )
      );

      setAmount("");
      setDescription("");
      setReference("");
      setNotes("");
      setMessage(
        type === "HOLD"
          ? "Hold recorded. MileVoxa increased the amount the company owes you."
          : type === "RETURN"
            ? "Return recorded. MileVoxa reduced the amount still owed to you."
            : "Deposit adjustment recorded."
      );
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Could not add security deposit transaction."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteTransaction(row: DepositTransaction) {
    if (!owner || !row.id) return;

    if (
      !window.confirm(
        `Delete this ${transactionLabel(row).toLowerCase()} of ${usd(
          row.amount
        )}?`
      )
    ) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("security_deposit_transactions")
        .delete()
        .eq("id", row.id);

      if (error) throw error;

      setTransactions((current) =>
        current.filter((item) => item.id !== row.id)
      );
      setMessage("Security deposit transaction deleted.");
      router.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Could not delete transaction."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!storageReady && (
        <div className="fp-deposit-warning">
          <strong>Security Deposit storage needs setup</strong>
          <span>
            Run <b>supabase_security_deposit_setup.sql</b> once in Supabase.
            Until then this page cannot save holdbacks or repayments.
          </span>
        </div>
      )}

      {message && (
        <div className="fp-deposit-message">{message}</div>
      )}

      <div className="fp-deposit-kpis">
        <DepositKpi
          label="Held to Date"
          value={usd(totals.heldToDate)}
          note={`${totals.holdCount} hold transaction${
            totals.holdCount === 1 ? "" : "s"
          }`}
          tone="blue"
        />
        <DepositKpi
          label="Returned"
          value={usd(totals.returned)}
          note={`${totals.returnCount} repayment${
            totals.returnCount === 1 ? "" : "s"
          } recorded`}
          tone="green"
        />
        <DepositKpi
          label="Still Owed to You"
          value={usd(totals.outstanding)}
          note="Money still held by the company"
          tone="purple"
        />
        <DepositKpi
          label="Target Remaining"
          value={usd(targetRemaining)}
          note={
            settings.target_amount > 0
              ? `${targetProgress.toFixed(0)}% of target collected`
              : "No target amount configured"
          }
          tone="amber"
        />
      </div>

      <div className="fp-deposit-layout">
        <div className="min-w-0">
          <section className="fp-deposit-card">
            <div className="fp-deposit-card-heading">
              <div>
                <span>HOLD AGREEMENT</span>
                <h2>Security Deposit Setup</h2>
                <p>
                  Define how the company collects the deposit and when you
                  expect it to be released.
                </p>
              </div>
              <div className={`fp-deposit-status ${settings.status.toLowerCase()}`}>
                {statusLabel(settings.status)}
              </div>
            </div>

            <div className="fp-deposit-settings-grid">
              <label>
                <span>Target Deposit</span>
                <MoneyInput
                  value={settings.target_amount}
                  disabled={!owner}
                  onChange={(value) =>
                    setSettings((current) => ({
                      ...current,
                      target_amount: value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Hold Method</span>
                <select
                  value={settings.hold_method}
                  disabled={!owner}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      hold_method: event.target
                        .value as DepositSettings["hold_method"],
                    }))
                  }
                >
                  <option value="WEEKLY">Weekly Holdback</option>
                  <option value="ONE_TIME">One-Time Hold</option>
                  <option value="MANUAL">Manual / As Needed</option>
                </select>
              </label>

              <label>
                <span>Weekly Hold Amount</span>
                <MoneyInput
                  value={settings.weekly_amount}
                  disabled={!owner || settings.hold_method !== "WEEKLY"}
                  onChange={(value) =>
                    setSettings((current) => ({
                      ...current,
                      weekly_amount: value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={settings.status}
                  disabled={!owner}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      status: event.target
                        .value as DepositSettings["status"],
                    }))
                  }
                >
                  <option value="HOLDING">Holding</option>
                  <option value="PARTIALLY_RETURNED">
                    Partially Returned
                  </option>
                  <option value="FULLY_RETURNED">Fully Returned</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </label>

              <label>
                <span>Start Date</span>
                <input
                  type="date"
                  value={settings.start_date || ""}
                  disabled={!owner}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      start_date: event.target.value || null,
                    }))
                  }
                />
              </label>

              <label>
                <span>Expected Release Date</span>
                <input
                  type="date"
                  value={settings.expected_release_date || ""}
                  disabled={!owner}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      expected_release_date:
                        event.target.value || null,
                    }))
                  }
                />
              </label>

              <label className="wide">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={settings.notes || ""}
                  disabled={!owner}
                  placeholder="Company deposit terms, release conditions, contact notes..."
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="fp-deposit-progress-block">
              <div>
                <span>Deposit Target Progress</span>
                <strong>
                  {usd(totals.heldToDate)} /{" "}
                  {usd(settings.target_amount)}
                </strong>
              </div>
              <div className="fp-deposit-progress-track">
                <i style={{ width: `${targetProgress}%` }} />
              </div>
            </div>

            <div className="fp-deposit-save-row">
              <span>
                Settings are company-level and will later be shared with the
                MileVoxa mobile app through the same Supabase records.
              </span>
              <button
                type="button"
                disabled={
                  busy || !owner || !storageReady || !companyId
                }
                onClick={() => void saveSettings()}
              >
                {busy ? "Saving..." : "Save Deposit Setup"}
              </button>
            </div>
          </section>

          <section className="fp-deposit-card">
            <div className="fp-deposit-card-heading">
              <div>
                <span>LEDGER</span>
                <h2>Deposit Transactions</h2>
                <p>
                  Every hold or repayment changes the amount the company still
                  owes you.
                </p>
              </div>
            </div>

            <div className="fp-deposit-ledger-tabs">
              {(["ALL", "HOLD", "RETURN", "ADJUSTMENT"] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={historyFilter === filter ? "active" : ""}
                    onClick={() => setHistoryFilter(filter)}
                  >
                    {filter === "ALL"
                      ? "All"
                      : filter === "HOLD"
                        ? "Holds"
                        : filter === "RETURN"
                          ? "Returns"
                          : "Adjustments"}
                  </button>
                )
              )}
            </div>

            <div className="fp-deposit-table-wrap">
              <table className="fp-deposit-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Truck</th>
                    <th>Description</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Balance Effect</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const truck = trucks.find(
                      (item) => item.id === row.truck_id
                    );
                    const effect = transactionEffect(row);

                    return (
                      <tr key={row.id}>
                        <td>{displayDate(row.transaction_date)}</td>
                        <td>
                          <span
                            className={`fp-deposit-type ${effect > 0 ? "hold" : "return"}`}
                          >
                            {transactionLabel(row)}
                          </span>
                        </td>
                        <td>
                          {truck ? `#${truck.unit_number}` : "Company"}
                        </td>
                        <td>{row.description || "—"}</td>
                        <td>{row.reference || "—"}</td>
                        <td className="fp-deposit-money">
                          {usd(row.amount)}
                        </td>
                        <td
                          className={
                            effect > 0
                              ? "fp-deposit-balance-increase"
                              : "fp-deposit-balance-decrease"
                          }
                        >
                          {effect > 0 ? "+" : "-"}
                          {usd(Math.abs(effect))}
                        </td>
                        <td>
                          {owner && (
                            <button
                              type="button"
                              className="fp-deposit-row-delete"
                              disabled={busy}
                              onClick={() =>
                                void deleteTransaction(row)
                              }
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="fp-deposit-empty">
                  No security deposit transactions in this view.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="fp-deposit-right">
          <section className="fp-deposit-side-card">
            <h2>Add Transaction</h2>

            <form onSubmit={addTransaction}>
              <label>
                <span>Transaction Type</span>
                <select
                  value={type}
                  disabled={!owner}
                  onChange={(event) =>
                    setType(
                      event.target
                        .value as "HOLD" | "RETURN" | "ADJUSTMENT"
                    )
                  }
                >
                  <option value="HOLD">Money Held</option>
                  <option value="RETURN">Money Returned</option>
                  <option value="ADJUSTMENT">Balance Adjustment</option>
                </select>
              </label>

              {type === "ADJUSTMENT" && (
                <label>
                  <span>Adjustment Direction</span>
                  <select
                    value={adjustmentDirection}
                    disabled={!owner}
                    onChange={(event) =>
                      setAdjustmentDirection(
                        event.target
                          .value as "INCREASE" | "DECREASE"
                      )
                    }
                  >
                    <option value="INCREASE">Increase Amount Owed</option>
                    <option value="DECREASE">Decrease Amount Owed</option>
                  </select>
                </label>
              )}

              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={date}
                  disabled={!owner}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>

              <label>
                <span>Amount</span>
                <div className="fp-deposit-money-input">
                  <b>$</b>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    disabled={!owner}
                    placeholder="0.00"
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
              </label>

              <label>
                <span>Truck (Optional)</span>
                <select
                  value={truckId}
                  disabled={!owner}
                  onChange={(event) => setTruckId(event.target.value)}
                >
                  <option value="">Company / General</option>
                  {trucks.map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      Truck #{truck.unit_number}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Description</span>
                <input
                  value={description}
                  disabled={!owner}
                  placeholder={
                    type === "HOLD"
                      ? "Weekly security deposit"
                      : type === "RETURN"
                        ? "Company deposit repayment"
                        : "Balance correction"
                  }
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                />
              </label>

              <label>
                <span>Reference / Statement</span>
                <input
                  value={reference}
                  disabled={!owner}
                  placeholder="Settlement #, check #, statement..."
                  onChange={(event) => setReference(event.target.value)}
                />
              </label>

              <label>
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={notes}
                  disabled={!owner}
                  placeholder="Optional details"
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={
                  busy ||
                  !owner ||
                  !storageReady ||
                  !companyId ||
                  !amount
                }
              >
                {busy
                  ? "Saving..."
                  : type === "HOLD"
                    ? "Record Money Held"
                    : type === "RETURN"
                      ? "Record Repayment"
                      : "Record Adjustment"}
              </button>
            </form>
          </section>

          <section className="fp-deposit-side-card fp-deposit-explainer">
            <span>ACCOUNTING RULE</span>
            <h2>Holdback is not an expense.</h2>
            <p>
              The company still owes this money to you. MileVoxa tracks it
              separately so operating profit stays accurate while cash received
              reflects what was actually paid.
            </p>

            <div>
              <span>Outstanding today</span>
              <strong>{usd(totals.outstanding)}</strong>
            </div>
          </section>

          {settings.expected_release_date && (
            <section className="fp-deposit-side-card fp-deposit-release-card">
              <span>EXPECTED RELEASE</span>
              <strong>
                {displayDate(settings.expected_release_date)}
              </strong>
              <p>
                Use this date as a reminder to follow up with the company about
                the remaining {usd(totals.outstanding)}.
              </p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function DepositKpi({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "blue" | "green" | "purple" | "amber";
}) {
  return (
    <div className={`fp-deposit-kpi ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function MoneyInput({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="fp-deposit-money-input">
      <b>$</b>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(Number(event.target.value) || 0)
        }
      />
    </div>
  );
}

export function transactionEffect(row: DepositTransaction) {
  if (row.transaction_type === "HOLD") return row.amount;
  if (row.transaction_type === "RETURN") return -row.amount;

  return row.adjustment_direction === "DECREASE"
    ? -row.amount
    : row.amount;
}

export function calculateTotals(rows: DepositTransaction[]) {
  let heldToDate = 0;
  let returned = 0;
  let holdCount = 0;
  let returnCount = 0;

  for (const row of rows) {
    const effect = transactionEffect(row);

    if (effect > 0) {
      heldToDate += effect;
      holdCount += 1;
    } else {
      returned += Math.abs(effect);
      returnCount += 1;
    }
  }

  return {
    heldToDate,
    returned,
    outstanding: Math.max(heldToDate - returned, 0),
    holdCount,
    returnCount,
  };
}

function transactionLabel(row: DepositTransaction) {
  if (row.transaction_type === "HOLD") return "Held";
  if (row.transaction_type === "RETURN") return "Returned";
  return row.adjustment_direction === "DECREASE"
    ? "Adjustment −"
    : "Adjustment +";
}

function statusLabel(status: DepositSettings["status"]) {
  if (status === "PARTIALLY_RETURNED") return "Partially Returned";
  if (status === "FULLY_RETURNED") return "Fully Returned";
  if (status === "CLOSED") return "Closed";
  return "Holding";
}

function displayDate(value?: string | null) {
  if (!value) return "—";

  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function today() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}
