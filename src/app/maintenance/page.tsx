import AppTabs from "@/components/app-tabs";
import KpiTile from "@/components/kpi-tile";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import PromoBanner from "@/components/promo-banner";
import { EmptyState, StatusBadge } from "@/components/fleet-ui";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import { num, parseDate, money } from "@/lib/fleetpilot-week";
import AddMaintenanceForm from "./add-maintenance-form";
import MaintenanceFilters from "./maintenance-filters";
import MaintenanceQuickActions from "./maintenance-quick-actions";
import MaintenanceActions from "./maintenance-actions";

type Truck = {
  id: string;
  unit_number: string;
  current_mileage: number | string | null;
  status: string | null;
};

type Maintenance = {
  id: string;
  truck_id: string | null;
  service_type: string | null;
  service_date: string | null;
  mileage: number | string | null;
  vendor: string | null;
  cost: number | string | null;
  next_service_mileage: number | string | null;
  next_service_date: string | null;
  expense_id: string | null;
};

type Params = {
  q?: string;
  state?: string;
  truck?: string;
  service?: string;
  sort?: string;
  page?: string;
  dateFrom?: string;
  dateTo?: string;
  vendor?: string;
  minCost?: string;
  maxCost?: string;
  minMileage?: string;
  maxMileage?: string;
};

const PAGE_SIZE = 10;

function active(status?: string | null) {
  return !["INACTIVE", "PARKED", "OUT OF SERVICE", "OUT"].includes(
    (status || "").toUpperCase()
  );
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim().toLowerCase();
  const stateFilter = (params.state || "all").toLowerCase();
  const truckFilter = params.truck || "all";
  const serviceFilter = (params.service || "all").toLowerCase();
  const sort = (params.sort || "newest").toLowerCase();
  const requestedPage = Math.max(1, Number(params.page || "1") || 1);
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const vendorFilter = (params.vendor || "").trim().toLowerCase();
  const minCost = params.minCost ? Number(params.minCost) : null;
  const maxCost = params.maxCost ? Number(params.maxCost) : null;
  const minMileage = params.minMileage ? Number(params.minMileage) : null;
  const maxMileage = params.maxMileage ? Number(params.maxMileage) : null;

  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const [
    { data: truckData, error: truckError },
    { data: maintenanceData, error: maintenanceError },
    { data: maintenanceExpenseData, error: maintenanceExpenseError },
  ] = await Promise.all([
    supabase
      .from("trucks")
      .select("id, unit_number, current_mileage, status")
      .order("unit_number"),
    supabase
      .from("maintenance_records")
      .select("*")
      .order("service_date", { ascending: false }),
    supabase
      .from("expenses")
      .select("id")
      .not("id", "is", null),
  ]);

  const allTrucks = (truckData ?? []) as Truck[];
  const trucks = allTrucks.filter((truck) => active(truck.status));
  const records = (maintenanceData ?? []) as Maintenance[];
  const linkedExpenseIds = new Set(
    (maintenanceExpenseData ?? [])
      .map((row) => row.id)
      .filter(Boolean)
  );
  const truckMap = new Map(allTrucks.map((truck) => [truck.id, truck]));

  const today = new Date();
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const state = (record: Maintenance) => {
    const serviceDate = parseDate(record.service_date);
    const hasLinkedExpense =
      Boolean(record.expense_id) &&
      linkedExpenseIds.has(String(record.expense_id));

    // A performed service in the past with a real linked expense is completed.
    // Future scheduling fields describe the NEXT service and must not relabel
    // an already-performed service as Upcoming.
    if (
      serviceDate &&
      serviceDate.getTime() <= day.getTime() &&
      hasLinkedExpense
    ) {
      return "Completed";
    }

    if (serviceDate && serviceDate.getTime() > day.getTime()) {
      return "Upcoming";
    }

    const truck = record.truck_id ? truckMap.get(record.truck_id) : undefined;
    const nextMileage =
      record.next_service_mileage == null
        ? null
        : num(record.next_service_mileage);
    const milesLeft =
      nextMileage == null || !truck
        ? null
        : nextMileage - num(truck.current_mileage);
    const nextDate = parseDate(record.next_service_date);

    const overdue =
      (milesLeft != null && milesLeft <= 0) ||
      (nextDate ? nextDate.getTime() <= day.getTime() : false);

    const upcoming =
      (milesLeft != null && milesLeft > 0 && milesLeft <= 3500) ||
      (nextDate
        ? nextDate.getTime() <= day.getTime() + 30 * 86400000
        : false);

    if (overdue) return "Overdue";
    if (upcoming) return "Upcoming";

    return serviceDate && serviceDate.getTime() <= day.getTime()
      ? "Completed"
      : "Upcoming";
  };

  const serviceTypes = [...new Set(
    records
      .map((record) => (record.service_type || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  let filteredBase = records.filter((record) => {
    if (!q) return true;
    const truck = record.truck_id ? truckMap.get(record.truck_id) : null;
    return [
      record.service_type,
      record.vendor,
      truck?.unit_number,
      state(record),
      record.service_date,
    ].some((value) => (value || "").toLowerCase().includes(q));
  });

  if (truckFilter !== "all") {
    filteredBase = filteredBase.filter(
      (record) => record.truck_id === truckFilter
    );
  }

  if (serviceFilter !== "all") {
    filteredBase = filteredBase.filter(
      (record) =>
        (record.service_type || "").toLowerCase() === serviceFilter
    );
  }

  if (dateFrom) {
    filteredBase = filteredBase.filter(
      (record) => (record.service_date || "") >= dateFrom
    );
  }

  if (dateTo) {
    filteredBase = filteredBase.filter(
      (record) => (record.service_date || "") <= dateTo
    );
  }

  if (vendorFilter) {
    filteredBase = filteredBase.filter((record) =>
      (record.vendor || "").toLowerCase().includes(vendorFilter)
    );
  }

  if (minCost != null && Number.isFinite(minCost)) {
    filteredBase = filteredBase.filter(
      (record) => num(record.cost) >= minCost
    );
  }

  if (maxCost != null && Number.isFinite(maxCost)) {
    filteredBase = filteredBase.filter(
      (record) => num(record.cost) <= maxCost
    );
  }

  if (minMileage != null && Number.isFinite(minMileage)) {
    filteredBase = filteredBase.filter(
      (record) => num(record.mileage) >= minMileage
    );
  }

  if (maxMileage != null && Number.isFinite(maxMileage)) {
    filteredBase = filteredBase.filter(
      (record) => num(record.mileage) <= maxMileage
    );
  }

  const completed = filteredBase.filter(
    (record) => state(record) === "Completed"
  ).length;
  const upcoming = filteredBase.filter(
    (record) => state(record) === "Upcoming"
  ).length;
  const overdue = filteredBase.filter(
    (record) => state(record) === "Overdue"
  ).length;

  let filtered =
    stateFilter === "all"
      ? [...filteredBase]
      : filteredBase.filter(
          (record) => state(record).toLowerCase() === stateFilter
        );

  filtered = [...filtered].sort((a, b) => {
    if (sort === "oldest") return dateValue(a.service_date) - dateValue(b.service_date);
    if (sort === "mileage") return num(b.mileage) - num(a.mileage);
    if (sort === "cost-desc") return num(b.cost) - num(a.cost);
    if (sort === "cost-asc") return num(a.cost) - num(b.cost);
    return dateValue(b.service_date) - dateValue(a.service_date);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const upcomingServices = filteredBase
    .filter((record) => ["Upcoming", "Overdue"].includes(state(record)))
    .sort((a, b) => {
      const ad = dateValue(a.next_service_date);
      const bd = dateValue(b.next_service_date);
      if (!ad) return 1;
      if (!bd) return -1;
      return ad - bd;
    })
    .slice(0, 4);

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (stateFilter !== "all") query.set("state", stateFilter);
  if (truckFilter !== "all") query.set("truck", truckFilter);
  if (serviceFilter !== "all") query.set("service", serviceFilter);
  if (sort !== "newest") query.set("sort", sort);
  if (dateFrom) query.set("dateFrom", dateFrom);
  if (dateTo) query.set("dateTo", dateTo);
  if (vendorFilter) query.set("vendor", vendorFilter);
  if (minCost != null && Number.isFinite(minCost)) query.set("minCost", String(minCost));
  if (maxCost != null && Number.isFinite(maxCost)) query.set("maxCost", String(maxCost));
  if (minMileage != null && Number.isFinite(minMileage)) query.set("minMileage", String(minMileage));
  if (maxMileage != null && Number.isFinite(maxMileage)) query.set("maxMileage", String(maxMileage));

  return (
    <AppShell
      active="maintenance"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-maint-page">
        <section className="fp-maint-heading">
          <div>
            <h1 className="fp-maint-title">Maintenance</h1>
            <p className="fp-maint-subtitle">
              Track and schedule maintenance to keep your fleet safe and on the road.
            </p>
          </div>

          <div id="add-maintenance" className="fp-maint-add-form-host">
            <AddMaintenanceForm trucks={trucks} />
          </div>
        </section>

        {(maintenanceError || truckError || maintenanceExpenseError) && (
          <div className="mt-3 rounded-[10px] border border-[#ffcf82] bg-[#fff7e8] px-4 py-3 text-[10px] font-[600] text-[#966217]">
            {(maintenanceError || truckError || maintenanceExpenseError)?.message}
          </div>
        )}

        <div className="fp-maint-layout mt-4">
          <div className="min-w-0">
            <div className="fp-maint-kpi-grid">
              <KpiTile
                label="Total Services"
                                value={filteredBase.length}
                                note={maintenanceRangeNote(dateFrom, dateTo)}
              />
              <KpiTile
                label="Completed"
                                value={completed}
                                note={maintenanceRangeNote(dateFrom, dateTo)}
              />
              <KpiTile
                label="Upcoming"
                                value={upcoming}
                                note={maintenanceRangeNote(dateFrom, dateTo)}
              />
            </div>

            <section className="fp-maint-table-card mt-4">
              <AppTabs
                activeKey={stateFilter}
                ariaLabel="Maintenance status"
                items={[
                  { key: "all", label: "All Services", count: filteredBase.length, href: maintenanceStateHref(query, "all") },
                  { key: "upcoming", label: "Upcoming", count: upcoming, href: maintenanceStateHref(query, "upcoming") },
                  { key: "overdue", label: "Overdue", count: overdue, href: maintenanceStateHref(query, "overdue") },
                  { key: "completed", label: "Completed", count: completed, href: maintenanceStateHref(query, "completed") },
                ]}
              />

              <MaintenanceFilters
                trucks={allTrucks}
                serviceTypes={serviceTypes}
              />

              <div className="fp-maint-table-wrap">
                <table className="fp-maint-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Service Type</th>
                      <th>Vendor</th>
                      <th>Truck</th>
                      <th>Mileage</th>
                      <th>Status</th>
                      <th>Next Due</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecords.map((record, index) => {
                      const truck = record.truck_id ? truckMap.get(record.truck_id) : undefined;
                      const status = state(record);
                      return (
                        <tr key={record.id}>
                          <td className="fp-maint-number">
                            #{String((page - 1) * PAGE_SIZE + index + 1).padStart(4, "0")}
                          </td>
                          <td>{shortDate(record.service_date)}</td>
                          <td className="fp-maint-type">{record.service_type || "Service"}</td>
                          <td>{record.vendor || "—"}</td>
                          <td className="font-[700]">#{truck?.unit_number || "—"}</td>
                          <td>{num(record.mileage) > 0 ? `${num(record.mileage).toLocaleString()} mi` : "—"}</td>
                          <td>
                            <StatusBadge tone={status === "Overdue" ? "red" : status === "Upcoming" ? "blue" : "green"}>
                              {status}
                            </StatusBadge>
                          </td>
                          <td className={status === "Overdue" ? "text-[#e5525b]" : ""}>
                            {nextDue(record)}
                          </td>
                          <td className="fp-maint-actions-cell">
                            <MaintenanceActions
                              record={record}
                              trucks={allTrucks}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {pageRecords.length === 0 && <EmptyState text="No maintenance records match these filters." />}
              </div>

              <div className="fp-maint-pagination">
                <span>
                  Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} services
                </span>
                <div className="flex items-center gap-1.5">
                  <PageLink href={pageHref(query, Math.max(1, page - 1))} disabled={page === 1}>‹</PageLink>
                  <PageLink href={pageHref(query, page)} active>{page}</PageLink>
                  <PageLink href={pageHref(query, Math.min(pageCount, page + 1))} disabled={page === pageCount}>›</PageLink>
                  <span className="fp-maint-page-size">10 per page⌄</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="fp-maint-right-rail">
            <section className="fp-maint-side-card">
              <h2>Quick Actions</h2>
              <MaintenanceQuickActions records={filtered} />
            </section>

            <section className="fp-maint-side-card">
              <h2>Maintenance Status</h2>
              <div className="mt-4 flex justify-center">
                <MaintDonut total={filteredBase.length} completed={completed} upcoming={upcoming} overdue={overdue} />
              </div>
              <div className="fp-maint-stat-list mt-4">
                <MaintStatRow label="Completed" value={completed} total={filteredBase.length} color="#58bd69" />
                <MaintStatRow label="Upcoming" value={upcoming} total={filteredBase.length} color="#16853B" />
                <MaintStatRow label="Overdue" value={overdue} total={filteredBase.length} color="#ef5755" />
              </div>
            </section>

            <section className="fp-maint-side-card">
              <div className="flex items-center justify-between">
                <h2>Upcoming Services</h2>
                <span className="text-[9px] font-[600] text-[#16853B]">View All →</span>
              </div>
              <div className="fp-maint-upcoming-list mt-3">
                {upcomingServices.length > 0 ? upcomingServices.map((record) => {
                  const truck = record.truck_id ? truckMap.get(record.truck_id) : undefined;
                  return (
                    <div key={record.id} className="fp-maint-upcoming-row">
                      <span className="fp-maint-upcoming-icon"><CalendarIcon /></span>
                      <div className="min-w-0">
                        <div className="truncate">#{truck?.unit_number || "—"} · {record.service_type || "Service"}</div>
                        <span>{nextDue(record)}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-4 text-[9px] text-[#8192a6]">No upcoming service items.</div>
                )}
              </div>
            </section>

            <PromoBanner
              headline="Prevent problems. Drive further."
              subtext="Keep service history and upcoming maintenance tied to the trucks you run."
              cta={{ label: "View trucks", href: "/trucks" }}
            />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}




function MaintDonut({ total, completed, upcoming, overdue }: { total: number; completed: number; upcoming: number; overdue: number }) {
  const safe = Math.max(1, total);
  const c = (completed / safe) * 100;
  const u = (upcoming / safe) * 100;
  const o = (overdue / safe) * 100;
  const s2 = c + u;
  const s3 = Math.min(100, s2 + o);
  const background = total > 0
    ? `conic-gradient(#58bd69 0 ${c}%, #16853B ${c}% ${s2}%, #ef5755 ${s2}% ${s3}%, #e7edf3 ${s3}% 100%)`
    : "conic-gradient(#e7edf3 0 100%)";
  return (
    <div className="fp-maint-donut" style={{ background }}>
      <div><strong>{total}</strong><span>Total Services</span></div>
    </div>
  );
}

function MaintStatRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="fp-maint-stat-row">
      <span className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1">{label}</span><strong>{value}</strong><span>{pct}%</span>
    </div>
  );
}

function nextDue(record: Maintenance) {
  if (record.next_service_date) return shortDate(record.next_service_date);
  if (record.next_service_mileage) return `${num(record.next_service_mileage).toLocaleString()} mi`;
  return "—";
}

function maintenanceStateHref(base: URLSearchParams, state: string) {
  const params = new URLSearchParams(base);
  params.delete("page");

  if (state === "all") params.delete("state");
  else params.set("state", state);

  return `/maintenance${params.toString() ? `?${params}` : ""}`;
}

function maintenanceRangeNote(from?: string, to?: string) {
  if (from && to) return `${shortRangeDate(from)} – ${shortRangeDate(to)}`;
  if (from) return `from ${shortRangeDate(from)}`;
  if (to) return `through ${shortRangeDate(to)}`;
  return "current filtered view";
}

function shortRangeDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function pageHref(base: URLSearchParams, page: number) {
  const params = new URLSearchParams(base);
  if (page > 1) params.set("page", String(page)); else params.delete("page");
  return `/maintenance${params.toString() ? `?${params}` : ""}`;
}

function PageLink({ href, children, active = false, disabled = false }: {
  href: string; children: React.ReactNode; active?: boolean; disabled?: boolean;
}) {
  if (disabled) return <span className="fp-maint-page-button disabled">{children}</span>;
  return <Link href={href} className={`fp-maint-page-button ${active ? "active" : ""}`}>{children}</Link>;
}

function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(`${value.slice(0,10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dateValue(value?: string | null) {
  if (!value) return 0;
  return new Date(`${value.slice(0,10)}T12:00:00`).getTime();
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>;
}
function FilterIcon() {
  return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 6h16M7 12h10M10 18h4"/></svg>;
}
function ToolIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z"/></svg>;
}
function CheckIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><path d="m8 12 2.5 2.5L16 9"/></svg>;
}
function CalendarIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16"/></svg>;
}
function HistoryIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8M8 13h8"/></svg>;
}
function AlertIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="m12 3 9 16H3L12 3Z"/><path d="M12 9v4M12 16h.01"/></svg>;
}
