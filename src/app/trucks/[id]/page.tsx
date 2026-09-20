import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import { money, num } from "@/lib/fleetpilot-week";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

type Truck = {
  id: string;
  unit_number: string;
  year: number | string | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  license_plate: string | null;
  current_mileage: number | string | null;
  registration_expiry: string | null;
  insurance_expiry: string | null;
  status: string | null;
};

export default async function TruckProfilePage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const [
    truckResult,
    loadsResult,
    expensesResult,
    maintenanceResult,
  ] = await Promise.all([
    supabase
      .from("trucks")
      .select(
        "id, unit_number, year, make, model, vin, license_plate, current_mileage, registration_expiry, insurance_expiry, status"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("loads")
      .select(
        "id, load_number, pickup, delivery, pickup_date, rate, loaded_miles, deadhead_miles, status"
      )
      .eq("truck_id", id)
      .order("pickup_date", { ascending: false }),
    supabase
      .from("expenses")
      .select(
        "id, category, expense_date, amount, vendor, description, gallons, fuel_price_per_gallon"
      )
      .eq("truck_id", id)
      .order("expense_date", { ascending: false }),
    supabase
      .from("maintenance_records")
      .select(
        "id, service_type, service_date, mileage, cost, vendor, next_service_mileage, next_service_date"
      )
      .eq("truck_id", id)
      .order("service_date", { ascending: false }),
  ]);

  if (!truckResult.data) notFound();

  const truck = truckResult.data as Truck;
  const loads = loadsResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const maintenance = maintenanceResult.data ?? [];

  const revenue = loads.reduce((sum, row: any) => sum + num(row.rate), 0);
  const miles = loads.reduce(
    (sum, row: any) =>
      sum + num(row.loaded_miles) + num(row.deadhead_miles),
    0
  );
  const totalExpenses = expenses.reduce(
    (sum, row: any) => sum + num(row.amount),
    0
  );
  const fuelCost = expenses
    .filter(
      (row: any) =>
        (row.category || "").trim().toLowerCase() === "fuel"
    )
    .reduce((sum: number, row: any) => sum + num(row.amount), 0);
  const maintenanceCost = maintenance.reduce(
    (sum: number, row: any) => sum + num(row.cost),
    0
  );
  const netProfit = revenue - totalExpenses;
  const costPerMile = miles > 0 ? totalExpenses / miles : 0;
  const profitPerMile = miles > 0 ? netProfit / miles : 0;

  const tab =
    query.tab === "loads" ||
    query.tab === "expenses" ||
    query.tab === "maintenance" ||
    query.tab === "fuel" ||
    query.tab === "history"
      ? query.tab
      : "overview";

  return (
    <AppShell
      active="trucks"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-detail-page">
        <div className="fp-detail-breadcrumb">
          <Link href="/trucks">Trucks</Link>
          <span>›</span>
          <span>Truck #{truck.unit_number}</span>
        </div>

        <section className="fp-truck-profile-hero">
          <div className="fp-truck-profile-avatar">
            {String(truck.unit_number || "T").slice(-3)}
          </div>
          <div className="fp-truck-profile-copy">
            <span className="fp-detail-eyebrow">TRUCK PROFILE</span>
            <h1>Truck #{truck.unit_number}</h1>
            <p>
              {[truck.year, truck.make, truck.model]
                .filter(Boolean)
                .join(" ") || "Fleet truck"}
            </p>
          </div>
          <div className="fp-truck-profile-status">
            <span>{truck.status || "ACTIVE"}</span>
            <small>{num(truck.current_mileage).toLocaleString()} mi</small>
          </div>
        </section>

        <nav className="fp-truck-profile-tabs">
          {[
            ["overview", "Overview"],
            ["loads", "Loads"],
            ["expenses", "Expenses"],
            ["maintenance", "Maintenance"],
            ["fuel", "Fuel"],
            ["history", "History"],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={`/trucks/${id}${key === "overview" ? "" : `?tab=${key}`}`}
              className={tab === key ? "active" : ""}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="fp-detail-kpi-grid">
          <DetailKpi label="Revenue" value={money(revenue)} tone="blue" />
          <DetailKpi label="Expenses" value={money(totalExpenses)} tone="red" />
          <DetailKpi
            label="Net Profit"
            value={money(netProfit)}
            tone={netProfit >= 0 ? "green" : "red"}
          />
          <DetailKpi
            label="Profit / Mile"
            value={money(profitPerMile)}
            tone={profitPerMile >= 0 ? "green" : "red"}
          />
        </div>

        {tab === "overview" && (
          <>
            <div className="fp-detail-two-col">
              <section className="fp-detail-card">
                <div className="fp-detail-card-heading">
                  <div>
                    <span>BUSINESS PERFORMANCE</span>
                    <h2>Truck Economics</h2>
                  </div>
                </div>
                <div className="fp-load-economics-grid">
                  <Metric label="Loads" value={String(loads.length)} />
                  <Metric label="Total Miles" value={`${miles.toLocaleString()} mi`} />
                  <Metric label="Cost / Mile" value={money(costPerMile)} />
                  <Metric label="Profit / Mile" value={money(profitPerMile)} />
                  <Metric label="Fuel Cost" value={money(fuelCost)} />
                  <Metric label="Maintenance Cost" value={money(maintenanceCost)} />
                </div>
              </section>

              <section className="fp-detail-card">
                <div className="fp-detail-card-heading">
                  <div>
                    <span>TRUCK DETAILS</span>
                    <h2>Vehicle Information</h2>
                  </div>
                </div>
                <div className="fp-truck-info-list">
                  <Info label="VIN" value={truck.vin || "—"} />
                  <Info label="License Plate" value={truck.license_plate || "—"} />
                  <Info label="Current Mileage" value={`${num(truck.current_mileage).toLocaleString()} mi`} />
                  <Info label="Registration Expiry" value={displayDate(truck.registration_expiry)} />
                  <Info label="Insurance Expiry" value={displayDate(truck.insurance_expiry)} />
                  <Info label="Status" value={truck.status || "ACTIVE"} />
                </div>
              </section>
            </div>

            <section className="fp-detail-card">
              <div className="fp-detail-card-heading">
                <div>
                  <span>RECENT ACTIVITY</span>
                  <h2>Latest Loads</h2>
                </div>
                <Link href={`/trucks/${id}?tab=loads`}>View all →</Link>
              </div>
              <LoadsTable rows={loads.slice(0, 6)} />
            </section>
          </>
        )}

        {tab === "loads" && (
          <section className="fp-detail-card">
            <div className="fp-detail-card-heading">
              <div><span>LOAD HISTORY</span><h2>Loads</h2></div>
            </div>
            <LoadsTable rows={loads} />
          </section>
        )}

        {tab === "expenses" && (
          <section className="fp-detail-card">
            <div className="fp-detail-card-heading">
              <div><span>COST HISTORY</span><h2>Expenses</h2></div>
            </div>
            <ExpensesTable rows={expenses} />
          </section>
        )}

        {tab === "maintenance" && (
          <section className="fp-detail-card">
            <div className="fp-detail-card-heading">
              <div><span>SERVICE HISTORY</span><h2>Maintenance</h2></div>
            </div>
            <MaintenanceTable rows={maintenance} />
          </section>
        )}

        {tab === "fuel" && (
          <section className="fp-detail-card">
            <div className="fp-detail-card-heading">
              <div><span>FUEL HISTORY</span><h2>Fuel</h2></div>
            </div>
            <ExpensesTable
              rows={expenses.filter(
                (row: any) =>
                  (row.category || "").toLowerCase() === "fuel"
              )}
            />
          </section>
        )}

        {tab === "history" && (
          <section className="fp-detail-card">
            <div className="fp-detail-card-heading">
              <div><span>OPERATING HISTORY</span><h2>Truck Timeline</h2></div>
            </div>
            <div className="fp-truck-history">
              {[
                ...loads.map((row: any) => ({
                  date: row.pickup_date,
                  title: `Load #${row.load_number || "—"}`,
                  body: `${row.pickup || "Pickup"} → ${row.delivery || "Delivery"} · ${money(num(row.rate))}`,
                  type: "load",
                })),
                ...expenses.map((row: any) => ({
                  date: row.expense_date,
                  title: row.category || "Expense",
                  body: `${row.vendor || "No vendor"} · ${money(num(row.amount))}`,
                  type: "expense",
                })),
                ...maintenance.map((row: any) => ({
                  date: row.service_date,
                  title: row.service_type || "Maintenance",
                  body: `${row.vendor || "No vendor"} · ${money(num(row.cost))}`,
                  type: "maintenance",
                })),
              ]
                .sort(
                  (a, b) =>
                    dateValue(b.date) - dateValue(a.date)
                )
                .slice(0, 40)
                .map((item, index) => (
                  <div key={`${item.type}-${item.date}-${index}`}>
                    <i className={item.type} />
                    <div>
                      <span>{displayDate(item.date)}</span>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function LoadsTable({ rows }: { rows: any[] }) {
  return (
    <div className="fp-detail-table-wrap">
      <table className="fp-detail-table">
        <thead>
          <tr>
            <th>Load</th><th>Route</th><th>Date</th><th>Miles</th><th>Revenue</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td><Link href={`/loads/${row.id}`} className="fp-detail-link">#{row.load_number || "—"}</Link></td>
              <td>{row.pickup || "—"} → {row.delivery || "—"}</td>
              <td>{displayDate(row.pickup_date)}</td>
              <td>{(num(row.loaded_miles)+num(row.deadhead_miles)).toLocaleString()} mi</td>
              <td className="fp-detail-money">{money(num(row.rate))}</td>
              <td>{row.status || "Upcoming"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="fp-detail-empty">No loads recorded for this truck.</div>}
    </div>
  );
}

function ExpensesTable({ rows }: { rows: any[] }) {
  return (
    <div className="fp-detail-table-wrap">
      <table className="fp-detail-table">
        <thead>
          <tr><th>Date</th><th>Category</th><th>Vendor</th><th>Description</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{displayDate(row.expense_date)}</td>
              <td>{row.category || "Other"}</td>
              <td>{row.vendor || "—"}</td>
              <td>{row.description || "—"}</td>
              <td className="fp-detail-money">{money(num(row.amount))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="fp-detail-empty">No expenses recorded for this truck.</div>}
    </div>
  );
}

function MaintenanceTable({ rows }: { rows: any[] }) {
  return (
    <div className="fp-detail-table-wrap">
      <table className="fp-detail-table">
        <thead>
          <tr><th>Date</th><th>Service</th><th>Mileage</th><th>Vendor</th><th>Cost</th><th>Next Due</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{displayDate(row.service_date)}</td>
              <td>{row.service_type || "Service"}</td>
              <td>{num(row.mileage).toLocaleString()} mi</td>
              <td>{row.vendor || "—"}</td>
              <td className="fp-detail-money">{money(num(row.cost))}</td>
              <td>{row.next_service_date ? displayDate(row.next_service_date) : row.next_service_mileage ? `${num(row.next_service_mileage).toLocaleString()} mi` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="fp-detail-empty">No maintenance records for this truck.</div>}
    </div>
  );
}

function DetailKpi({ label, value, tone }: { label: string; value: string; tone: "blue" | "red" | "green" }) {
  return <div className={`fp-detail-kpi ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}
function Metric({ label, value }: { label: string; value: string }) {
  return <div className="fp-detail-metric"><span>{label}</span><strong>{value}</strong></div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
function displayDate(value?: string | null) {
  if (!value) return "—";
  return new Date(`${value.slice(0,10)}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function dateValue(value?: string | null) {
  if (!value) return 0;
  const parsed=Date.parse(`${value.slice(0,10)}T12:00:00`);
  return Number.isFinite(parsed)?parsed:0;
}
