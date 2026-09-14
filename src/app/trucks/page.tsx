import Link from "next/link";
import AppShell from "@/components/app-shell";
import { EmptyState, StatusBadge } from "@/components/fleet-ui";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import AddTruckForm from "./add-truck-form";
import TruckActions from "./truck-actions";
import TrucksQuickActions from "./trucks-quick-actions";

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

type Maintenance = {
  truck_id: string | null;
  next_service_mileage: number | string | null;
  next_service_date: string | null;
};

type Params = {
  q?: string;
  status?: string;
  make?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 10;

export default async function TrucksPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim().toLowerCase();
  const statusFilter = (params.status || "all").toLowerCase();
  const makeFilter = (params.make || "all").toLowerCase();
  const sort = (params.sort || "unit-desc").toLowerCase();
  const requestedPage = Math.max(1, Number(params.page || "1") || 1);

  const { supabase, fullName, companyName, role } =
    await getFleetPilotAccount();

  const [
    { data: truckData, error: truckError },
    { data: maintenanceData, error: maintenanceError },
  ] = await Promise.all([
    supabase
      .from("trucks")
      .select(
        "id, unit_number, year, make, model, vin, license_plate, current_mileage, registration_expiry, insurance_expiry, status"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("maintenance_records")
      .select("truck_id, next_service_mileage, next_service_date"),
  ]);

  const allTrucks = (truckData ?? []) as Truck[];
  const maintenance = (maintenanceData ?? []) as Maintenance[];

  const maintenanceByTruck = new Map<string, Maintenance[]>();
  for (const item of maintenance) {
    if (!item.truck_id) continue;
    const existing = maintenanceByTruck.get(item.truck_id) || [];
    existing.push(item);
    maintenanceByTruck.set(item.truck_id, existing);
  }

  const activeCount = allTrucks.filter((truck) => statusGroup(truck.status) === "active").length;
  const inServiceCount = allTrucks.filter((truck) => statusGroup(truck.status) === "service").length;
  const inactiveCount = allTrucks.filter((truck) => statusGroup(truck.status) === "inactive").length;

  const makes = [...new Set(
    allTrucks
      .map((truck) => (truck.make || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  let trucks = allTrucks.filter((truck) => {
    if (!q) return true;
    return [
      truck.unit_number,
      truck.make,
      truck.model,
      truck.vin,
      truck.license_plate,
      truck.status,
    ].some((value) => (value || "").toLowerCase().includes(q));
  });

  if (statusFilter !== "all") {
    trucks = trucks.filter((truck) => statusGroup(truck.status) === statusFilter);
  }

  if (makeFilter !== "all") {
    trucks = trucks.filter(
      (truck) => (truck.make || "").toLowerCase() === makeFilter
    );
  }

  trucks = [...trucks].sort((a, b) => {
    if (sort === "unit-asc") return unitNumber(a) - unitNumber(b);
    if (sort === "mileage-desc") return mileage(b) - mileage(a);
    if (sort === "mileage-asc") return mileage(a) - mileage(b);
    return unitNumber(b) - unitNumber(a);
  });

  const pageCount = Math.max(1, Math.ceil(trucks.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageTrucks = trucks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const mileageRanking = [...allTrucks]
    .sort((a, b) => mileage(b) - mileage(a))
    .slice(0, 5);

  const errors = [truckError, maintenanceError].filter(Boolean);

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (statusFilter !== "all") query.set("status", statusFilter);
  if (makeFilter !== "all") query.set("make", makeFilter);
  if (sort !== "unit-desc") query.set("sort", sort);

  return (
    <AppShell
      active="trucks"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-trucks-page">
        <section className="fp-trucks-heading">
          <div>
            <h1 className="fp-trucks-title">Trucks</h1>
            <p className="fp-trucks-subtitle">
              Manage your trucks, track performance, maintenance and keep your fleet on the road.
            </p>
          </div>

          <div id="add-truck" className="fp-truck-add-form-host">
            <AddTruckForm />
          </div>
        </section>

        {errors.length > 0 && (
          <div className="mt-3 rounded-[10px] border border-[#ffcf82] bg-[#fff7e8] px-4 py-3 text-[10px] font-[600] text-[#966217]">
            Some truck or maintenance data could not be loaded. Successfully returned data is still shown.
          </div>
        )}

        <div className="fp-trucks-layout mt-4">
          <div className="min-w-0">
            <div className="fp-truck-kpi-grid">
              <TruckKpi label="Total Trucks" value={allTrucks.length} note="↑ 2 vs last month" tone="blue" icon="truck" />
              <TruckKpi label="Active Trucks" value={activeCount} note="↑ 20% vs last month" tone="green" icon="active" />
              <TruckKpi label="In Service" value={inServiceCount} note="↓ 50% vs last month" tone="purple" icon="service" />
              <TruckKpi label="Inactive Trucks" value={inactiveCount} note="— 0% vs last month" tone="red" icon="inactive" />
            </div>

            <section className="fp-trucks-table-card mt-4">
              <div className="fp-truck-tabs">
                <TruckTab href={filterHref("all", q, makeFilter, sort)} label="All Trucks" count={allTrucks.length} active={statusFilter === "all"} />
                <TruckTab href={filterHref("active", q, makeFilter, sort)} label="Active" count={activeCount} active={statusFilter === "active"} />
                <TruckTab href={filterHref("service", q, makeFilter, sort)} label="In Service" count={inServiceCount} active={statusFilter === "service"} />
                <TruckTab href={filterHref("inactive", q, makeFilter, sort)} label="Inactive" count={inactiveCount} active={statusFilter === "inactive"} />
              </div>

              <form action="/trucks" className="fp-truck-filterbar">
                <label className="fp-truck-search">
                  <SearchIcon />
                  <input
                    name="q"
                    defaultValue={params.q || ""}
                    placeholder="Search by truck #, plate, VIN..."
                  />
                </label>

                <select name="status" defaultValue={statusFilter} className="fp-truck-filter-select">
                  <option value="all">Status</option>
                  <option value="active">Active</option>
                  <option value="service">In Service</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select name="make" defaultValue={makeFilter} className="fp-truck-filter-select">
                  <option value="all">Make</option>
                  {makes.map((make) => (
                    <option key={make} value={make.toLowerCase()}>
                      {make}
                    </option>
                  ))}
                </select>

                <button type="submit" className="fp-truck-filter-button">
                  <FilterIcon />
                  More Filters
                </button>

                <div className="fp-truck-sort">
                  <span>Sort by</span>
                  <select name="sort" defaultValue={sort}>
                    <option value="unit-desc">Truck # (Newest)</option>
                    <option value="unit-asc">Truck # (Oldest)</option>
                    <option value="mileage-desc">Mileage (Highest)</option>
                    <option value="mileage-asc">Mileage (Lowest)</option>
                  </select>
                </div>
              </form>

              <div className="fp-truck-table-wrap">
                <table className="fp-truck-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Truck</th>
                      <th>Make / Model</th>
                      <th>Year</th>
                      <th>Status</th>
                      <th>Mileage</th>
                      <th>Next Service</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageTrucks.map((truck, index) => {
                      const nextService = getNextService(
                        maintenanceByTruck.get(truck.id) || [],
                        mileage(truck)
                      );
                      const status = statusGroup(truck.status);

                      return (
                        <tr key={truck.id}>
                          <td className="fp-truck-number">#{displayUnit(truck)}</td>

                          <td>
                            <div className="fp-truck-identity">
                              <div
                                className={`fp-truck-thumb fp-truck-thumb-${index % 3}`}
                                aria-hidden="true"
                              />
                              <div className="min-w-0">
                                <div className="fp-truck-name">
                                  Truck {displayUnit(truck)}
                                </div>
                                <div className="fp-truck-plate">
                                  {truck.license_plate || "No plate"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="fp-truck-model">
                              <strong>{truck.make || "—"}</strong>
                              <span>{truck.model || "—"}</span>
                            </div>
                          </td>

                          <td>{truck.year || "—"}</td>

                          <td>
                            <StatusBadge tone={statusTone(status)}>
                              {statusLabel(status)}
                            </StatusBadge>
                          </td>

                          <td className="fp-truck-mileage">
                            {mileage(truck).toLocaleString()} mi
                          </td>

                          <td>{nextService}</td>

                          <td className="fp-truck-actions-cell">
                            <TruckActions truck={truck} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {pageTrucks.length === 0 && (
                  <EmptyState text="No trucks match these filters." />
                )}
              </div>

              <div className="fp-truck-pagination">
                <span>
                  Showing {trucks.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, trucks.length)} of {trucks.length} trucks
                </span>

                <div className="flex items-center gap-1.5">
                  <PageLink href={pageHref(query, Math.max(1, page - 1))} disabled={page === 1}>‹</PageLink>
                  <PageLink href={pageHref(query, page)} active>{page}</PageLink>
                  <PageLink href={pageHref(query, Math.min(pageCount, page + 1))} disabled={page === pageCount}>›</PageLink>
                  <span className="fp-truck-page-size">10 per page⌄</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="fp-trucks-right-rail">
            <section className="fp-truck-side-card">
              <h2>Quick Actions</h2>
              <TrucksQuickActions
                visibleTrucks={trucks}
                inactiveHref={filterHref("inactive", q, makeFilter, sort)}
              />
            </section>

            <section className="fp-truck-side-card">
              <h2>Truck Status</h2>
              <div className="mt-4 flex justify-center">
                <TruckDonut
                  total={allTrucks.length}
                  active={activeCount}
                  service={inServiceCount}
                  inactive={inactiveCount}
                />
              </div>

              <div className="fp-truck-stat-list mt-4">
                <TruckStatRow label="Active" value={activeCount} total={allTrucks.length} color="#58bd69" />
                <TruckStatRow label="In Service" value={inServiceCount} total={allTrucks.length} color="#f4b53e" />
                <TruckStatRow label="Inactive" value={inactiveCount} total={allTrucks.length} color="#ef5755" />
              </div>
            </section>

            <section className="fp-truck-side-card">
              <div className="flex items-center justify-between">
                <h2>Top Trucks by Mileage</h2>
                <span className="text-[9px] font-[600] text-[#1188ff]">View All →</span>
              </div>

              <div className="fp-truck-ranking mt-3">
                {mileageRanking.map((truck, index) => (
                  <div key={truck.id} className="fp-truck-ranking-row">
                    <span className="fp-truck-rank">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate">
                      Truck {displayUnit(truck)}
                    </span>
                    <span>{mileage(truck).toLocaleString()} mi</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="fp-truck-promo">
              <div className="absolute inset-0 bg-gradient-to-r from-[#06182d]/82 via-[#06182d]/28 to-transparent" />
              <div className="relative z-10">
                <div className="text-[16px] font-[740] leading-[1.2] text-white">
                  Well maintained<br />trucks drive<br />greater profits.
                </div>
                <div className="mt-4 h-[3px] w-10 bg-[#4c98ff]" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function TruckKpi({
  label,
  value,
  note,
  tone,
  icon,
}: {
  label: string;
  value: number;
  note: string;
  tone: "blue" | "green" | "purple" | "red";
  icon: "truck" | "active" | "service" | "inactive";
}) {
  const palette = {
    blue: { color: "#4b8df6", soft: "#eaf3ff" },
    green: { color: "#55a965", soft: "#e9f7ed" },
    purple: { color: "#765ce7", soft: "#f0edff" },
    red: { color: "#e75b63", soft: "#fff0f1" },
  }[tone];

  return (
    <div className="fp-truck-kpi">
      <div className="fp-truck-kpi-icon" style={{ color: palette.color, backgroundColor: palette.soft }}>
        <TruckKpiIcon type={icon} />
      </div>
      <div>
        <div className="fp-truck-kpi-label">{label}</div>
        <div className="fp-number fp-truck-kpi-value">{value}</div>
        <div className={`fp-truck-kpi-note ${tone === "red" ? "negative" : ""}`}>{note}</div>
      </div>
    </div>
  );
}

function TruckKpiIcon({ type }: { type: "truck" | "active" | "service" | "inactive" }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[17px] w-[17px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "truck") {
    return (
      <svg {...common}>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  }

  if (type === "active") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="m8 12 2.6 2.6L16 9" />
      </svg>
    );
  }

  if (type === "service") {
    return (
      <svg {...common}>
        <path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v10" />
    </svg>
  );
}

function TruckTab({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link href={href} className={`fp-truck-tab ${active ? "active" : ""}`}>
      <span>{label}</span>
      <span className="fp-truck-tab-count">{count}</span>
    </Link>
  );
}

function TruckDonut({
  total,
  active,
  service,
  inactive,
}: {
  total: number;
  active: number;
  service: number;
  inactive: number;
}) {
  const safeTotal = Math.max(1, total);
  const activePct = (active / safeTotal) * 100;
  const servicePct = (service / safeTotal) * 100;
  const inactivePct = (inactive / safeTotal) * 100;

  const s1 = activePct;
  const s2 = s1 + servicePct;
  const s3 = Math.min(100, s2 + inactivePct);

  const background =
    total > 0
      ? `conic-gradient(
          #58bd69 0 ${s1}%,
          #f4b53e ${s1}% ${s2}%,
          #ef5755 ${s2}% ${s3}%,
          #e7edf3 ${s3}% 100%
        )`
      : "conic-gradient(#e7edf3 0 100%)";

  return (
    <div className="fp-truck-donut" style={{ background }}>
      <div>
        <strong>{total}</strong>
        <span>Total Trucks</span>
      </div>
    </div>
  );
}

function TruckStatRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="fp-truck-stat-row">
      <span className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1">{label}</span>
      <strong>{value}</strong>
      <span>{pct}%</span>
    </div>
  );
}

function getNextService(records: Maintenance[], currentMileage: number) {
  if (records.length === 0) return "—";

  const futureMileage = records
    .map((item) => numberValue(item.next_service_mileage))
    .filter((value) => value > currentMileage)
    .sort((a, b) => a - b)[0];

  const futureDate = records
    .map((item) => item.next_service_date)
    .filter((value): value is string => Boolean(value))
    .sort()[0];

  if (futureDate) {
    return new Date(`${futureDate.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (futureMileage) return `${futureMileage.toLocaleString()} mi`;
  return "—";
}

function filterHref(status: string, q: string, make: string, sort: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  if (make !== "all") params.set("make", make);
  if (sort !== "unit-desc") params.set("sort", sort);
  return `/trucks${params.toString() ? `?${params}` : ""}`;
}

function pageHref(baseQuery: URLSearchParams, page: number) {
  const params = new URLSearchParams(baseQuery);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  return `/trucks${params.toString() ? `?${params}` : ""}`;
}

function PageLink({
  href,
  children,
  active = false,
  disabled = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) return <span className="fp-truck-page-button disabled">{children}</span>;
  return <Link href={href} className={`fp-truck-page-button ${active ? "active" : ""}`}>{children}</Link>;
}

function statusGroup(status?: string | null): "active" | "service" | "inactive" {
  const value = (status || "ACTIVE").toUpperCase().trim();
  if (value === "INACTIVE") return "inactive";
  if (["IN SERVICE", "SERVICE", "MAINTENANCE"].includes(value)) return "service";
  return "active";
}

function statusTone(status: "active" | "service" | "inactive"): "green" | "orange" | "red" {
  if (status === "service") return "orange";
  if (status === "inactive") return "red";
  return "green";
}

function statusLabel(status: "active" | "service" | "inactive") {
  if (status === "service") return "In Service";
  if (status === "inactive") return "Inactive";
  return "Active";
}

function mileage(truck: Truck) {
  return numberValue(truck.current_mileage);
}

function unitNumber(truck: Truck) {
  const parsed = Number(String(truck.unit_number || "").replace(/\D/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function displayUnit(truck: Truck) {
  return truck.unit_number || "—";
}

function numberValue(value: number | string | null | undefined) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function PlusIcon() {
  return <span className="text-[17px] font-[400]">＋</span>;
}

function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <path d="M5 19h14V9H5z" />
      <path d="M12 3v10M8 7l4-4 4 4" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <path d="M5 5h14v14H5z" />
      <path d="M12 15V5M8 9l4-4 4 4" />
    </svg>
  );
}

function InactiveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8" />
    </svg>
  );
}
