import AppTabs from "@/components/app-tabs";
import KpiTile from "@/components/kpi-tile";
import { formatMoney } from "@/lib/format";
import Link from "next/link";
import AppShell from "@/components/app-shell";
import PromoBanner from "@/components/promo-banner";
import { EmptyState, StatusBadge } from "@/components/fleet-ui";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import AddReimbursementForm from "./add-reimbursement-form";
import ReimbursementFilters from "./reimbursement-filters";
import ReimbursementQuickActions from "./reimbursement-quick-actions";
import ReimbursementActions from "./reimbursement-actions";

type Reimbursement = {
  id: string;
  expense_id: string | null;
  truck_id: string | null;
  category: string | null;
  reference: string | null;
  reimbursement_date: string | null;
  amount: number | string | null;
  notes: string | null;
};

type Expense = {
  id: string;
  category: string | null;
  vendor: string | null;
  amount: number | string | null;
  expense_date: string | null;
  truck_id: string | null;
};

type Truck = {
  id: string;
  unit_number: string;
};

type Params = {
  q?: string;
  kind?: string;
  truck?: string;
  sort?: string;
  page?: string;
  dateFrom?: string;
  dateTo?: string;
  vendor?: string;
  category?: string;
  minAmount?: string;
  maxAmount?: string;
};

const PAGE_SIZE = 10;

export default async function ReimbursementsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim().toLowerCase();
  const kind = (params.kind || "all").toLowerCase();
  const truckFilter = params.truck || "all";
  const sort = (params.sort || "newest").toLowerCase();
  const requestedPage = Math.max(1, Number(params.page || "1") || 1);
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const vendorFilter = (params.vendor || "").trim().toLowerCase();
  const categoryFilter = (params.category || "").trim().toLowerCase();
  const minAmount = params.minAmount ? Number(params.minAmount) : null;
  const maxAmount = params.maxAmount ? Number(params.maxAmount) : null;

  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const [
    { data: reimbursementData, error },
    { data: expenseData },
    { data: truckData },
  ] = await Promise.all([
    supabase
      .from("reimbursements")
      .select("id, expense_id, truck_id, category, reference, reimbursement_date, amount, notes")
      .order("reimbursement_date", { ascending: false }),
    supabase
      .from("expenses")
      .select("id, category, vendor, amount, expense_date, truck_id")
      .order("expense_date", { ascending: false })
      .limit(300),
    supabase.from("trucks").select("id, unit_number").order("unit_number"),
  ]);

  const reimbursements = (reimbursementData ?? []) as Reimbursement[];
  const expenses = (expenseData ?? []) as Expense[];
  const trucks = (truckData ?? []) as Truck[];
  const expenseMap = new Map(expenses.map((expense) => [expense.id, expense]));
  const truckMap = new Map(trucks.map((truck) => [truck.id, truck]));
  const categories = [...new Set(
    [
      ...expenses.map((expense) => (expense.category || "").trim()),
      ...reimbursements.map((row) => (row.category || "").trim()),
    ].filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));


  const linkedExpense = (row: Reimbursement) =>
    row.expense_id ? expenseMap.get(row.expense_id) : undefined;

  const effectiveTruckId = (row: Reimbursement) =>
    row.truck_id || linkedExpense(row)?.truck_id || null;

  const effectiveCategory = (row: Reimbursement) =>
    row.category || linkedExpense(row)?.category || "Other";

  const isStandalone = (row: Reimbursement) => !row.expense_id;

  const isFull = (row: Reimbursement) => {
    const expense = linkedExpense(row);
    if (!expense) return false;
    return numberValue(row.amount) >= numberValue(expense.amount) - 0.005;
  };

  let filteredBase = reimbursements.filter((row) => {
    if (!q) return true;
    const expense = linkedExpense(row);
    const truckId = effectiveTruckId(row);
    const truck = truckId ? truckMap.get(truckId) : null;
    return [
      row.notes,
      row.reference,
      row.reimbursement_date,
      effectiveCategory(row),
      expense?.vendor,
      truck?.unit_number,
      isStandalone(row)
        ? "standalone reimbursement"
        : isFull(row)
          ? "full recovery"
          : "partial recovery",
    ].some((value) => (value || "").toLowerCase().includes(q));
  });

  if (truckFilter !== "all") {
    filteredBase = filteredBase.filter(
      (row) => effectiveTruckId(row) === truckFilter
    );
  }

  if (dateFrom) {
    filteredBase = filteredBase.filter(
      (row) => (row.reimbursement_date || "") >= dateFrom
    );
  }

  if (dateTo) {
    filteredBase = filteredBase.filter(
      (row) => (row.reimbursement_date || "") <= dateTo
    );
  }

  if (vendorFilter) {
    filteredBase = filteredBase.filter((row) =>
      (linkedExpense(row)?.vendor || "")
        .toLowerCase()
        .includes(vendorFilter)
    );
  }

  if (categoryFilter) {
    filteredBase = filteredBase.filter(
      (row) =>
        effectiveCategory(row).toLowerCase() === categoryFilter
    );
  }

  if (minAmount != null && Number.isFinite(minAmount)) {
    filteredBase = filteredBase.filter(
      (row) => numberValue(row.amount) >= minAmount
    );
  }

  if (maxAmount != null && Number.isFinite(maxAmount)) {
    filteredBase = filteredBase.filter(
      (row) => numberValue(row.amount) <= maxAmount
    );
  }

  const total = filteredBase.reduce(
    (sum, row) => sum + numberValue(row.amount),
    0
  );
  const standaloneRows = filteredBase.filter(isStandalone);
  const linkedRows = filteredBase.filter((row) => !isStandalone(row));
  const fullRows = linkedRows.filter(isFull);
  const partialRows = linkedRows.filter((row) => !isFull(row));

  const fullCount = fullRows.length;
  const partialCount = partialRows.length;
  const standaloneCount = standaloneRows.length;

  const fullAmount = fullRows.reduce(
    (sum, row) => sum + numberValue(row.amount),
    0
  );
  const partialAmount = partialRows.reduce(
    (sum, row) => sum + numberValue(row.amount),
    0
  );
  const standaloneAmount = standaloneRows.reduce(
    (sum, row) => sum + numberValue(row.amount),
    0
  );

  let filtered =
    kind === "all"
      ? [...filteredBase]
      : kind === "full"
        ? fullRows
        : kind === "partial"
          ? partialRows
          : standaloneRows;

  filtered = [...filtered].sort((a, b) => {
    if (sort === "oldest") return dateValue(a.reimbursement_date) - dateValue(b.reimbursement_date);
    if (sort === "amount-desc") return numberValue(b.amount) - numberValue(a.amount);
    if (sort === "amount-asc") return numberValue(a.amount) - numberValue(b.amount);
    return dateValue(b.reimbursement_date) - dateValue(a.reimbursement_date);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const categoryTotals = new Map<string, number>();
  for (const row of filteredBase) {
    const label = effectiveCategory(row);
    categoryTotals.set(label, (categoryTotals.get(label) || 0) + numberValue(row.amount));
  }
  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (kind !== "all") query.set("kind", kind);
  if (truckFilter !== "all") query.set("truck", truckFilter);
  if (sort !== "newest") query.set("sort", sort);
  if (dateFrom) query.set("dateFrom", dateFrom);
  if (dateTo) query.set("dateTo", dateTo);
  if (vendorFilter) query.set("vendor", vendorFilter);
  if (categoryFilter) query.set("category", categoryFilter);
  if (minAmount != null && Number.isFinite(minAmount)) query.set("minAmount", String(minAmount));
  if (maxAmount != null && Number.isFinite(maxAmount)) query.set("maxAmount", String(maxAmount));

  return (
    <AppShell
      active="reimbursements"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-reimb-page">
        <section className="fp-reimb-heading">
          <div>
            <h1 className="fp-reimb-title">Reimbursements</h1>
            <p className="fp-reimb-subtitle">
              Track recovered business expenses and reimbursement history.
            </p>
          </div>
          <div id="add-reimbursement" className="fp-reimb-add-form-host">
            <AddReimbursementForm expenses={expenses} trucks={trucks} />
          </div>
        </section>

        {error && (
          <div className="mt-3 rounded-[10px] border border-[#ffcf82] bg-[#fff7e8] px-4 py-3 text-[10px] font-[600] text-[#966217]">
            {error.message}
          </div>
        )}

        <div className="fp-reimb-layout mt-4">
          <div className="min-w-0">
            <div className="fp-reimb-kpi-grid">
              <KpiTile
                label="Total Reimbursed" value={money(total)} note={reimbursementRangeNote(dateFrom, dateTo)}
              />
              <KpiTile
                label="Records" value={`${filteredBase.length}`} note={reimbursementRangeNote(dateFrom, dateTo)}
              />
              <KpiTile
                label="Full Recovery" value={money(fullAmount)} note={`${fullCount} records`}
              />
              <KpiTile
                label="Partial Recovery" value={money(partialAmount)} note={`${partialCount} records`}
              />
            </div>

            <section className="fp-reimb-table-card mt-4">
              <AppTabs
                activeKey={kind}
                ariaLabel="Reimbursement status"
                items={[
                  { key: "all", label: "All", count: filteredBase.length, href: reimbursementKindHref(query, "all") },
                  { key: "full", label: "Full Recovery", count: fullCount, href: reimbursementKindHref(query, "full") },
                  { key: "partial", label: "Partial Recovery", count: partialCount, href: reimbursementKindHref(query, "partial") },
                  { key: "standalone", label: "Standalone", count: standaloneCount, href: reimbursementKindHref(query, "standalone") },
                ]}
              />

              <ReimbursementFilters
                trucks={trucks}
                categories={categories}
              />

              <div className="fp-reimb-table-wrap">
                <table className="fp-reimb-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Recovered</th>
                      <th>Truck</th>
                      <th>Vendor</th>
                      <th>Recovery</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, index) => {
                      const expense = linkedExpense(row);
                      const truckId = effectiveTruckId(row);
                      const truck = truckId ? truckMap.get(truckId) : null;
                      const full = isFull(row);
                      const standalone = isStandalone(row);
                      const category = effectiveCategory(row);
                      return (
                        <tr key={row.id}>
                          <td className="fp-reimb-number">#{String((page - 1) * PAGE_SIZE + index + 1).padStart(4, "0")}</td>
                          <td>{shortDate(row.reimbursement_date)}</td>
                          <td className="fp-reimb-description">
                            {row.notes || row.reference || `${category} reimbursement`}
                          </td>
                          <td className="fp-reimb-amount">{money(numberValue(row.amount))}</td>
                          <td>{truck ? `#${truck.unit_number}` : "—"}</td>
                          <td>{expense?.vendor || row.reference || "—"}</td>
                          <td>
                            <StatusBadge tone={standalone ? "blue" : full ? "green" : "orange"}>
                              {standalone ? "Standalone" : full ? "Full" : "Partial"}
                            </StatusBadge>
                          </td>
                          <td className="fp-reimb-actions-cell">
                            <ReimbursementActions
                              row={row}
                              expenses={expenses}
                              trucks={trucks}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {pageRows.length === 0 && <EmptyState text="No reimbursements match these filters." />}
              </div>

              <div className="fp-reimb-pagination">
                <span>
                  Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} reimbursements
                </span>
                <div className="flex items-center gap-1.5">
                  <PageLink href={pageHref(query, Math.max(1, page - 1))} disabled={page === 1}>‹</PageLink>
                  <PageLink href={pageHref(query, page)} active>{page}</PageLink>
                  <PageLink href={pageHref(query, Math.min(pageCount, page + 1))} disabled={page === pageCount}>›</PageLink>
                  <span className="fp-reimb-page-size">10 per page⌄</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="fp-reimb-right-rail">
            <section className="fp-reimb-side-card">
              <h2>Quick Actions</h2>
              <ReimbursementQuickActions rows={filtered} />
            </section>

            <section className="fp-reimb-side-card">
              <h2>Recovery Breakdown</h2>
              <div className="mt-4 flex justify-center">
                <ReimbDonut
                  total={total}
                  full={fullAmount}
                  partial={partialAmount}
                  standalone={standaloneAmount}
                />
              </div>
              <div className="fp-reimb-stat-list mt-4">
                <ReimbStatRow label="Full Recovery" amount={fullAmount} total={total} color="#58bd69" />
                <ReimbStatRow label="Partial Recovery" amount={partialAmount} total={total} color="#f4b53e" />
                <ReimbStatRow label="Standalone" amount={standaloneAmount} total={total} color="#16853B" />
              </div>
            </section>

            <section className="fp-reimb-side-card">
              <div className="flex items-center justify-between">
                <h2>Top Recovered Categories</h2>
                <span className="text-[9px] font-[600] text-[#16853B]">View All →</span>
              </div>
              <div className="fp-reimb-ranking mt-3">
                {topCategories.map(([label, amount], index) => (
                  <div key={label} className="fp-reimb-ranking-row">
                    <span className="fp-reimb-rank">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    <span>{money(amount)}</span>
                  </div>
                ))}
              </div>
            </section>

            <PromoBanner
              headline="Recover more. Protect profit."
              subtext="Keep recovered business costs visible beside the expenses they offset."
              cta={{ label: "Review expenses", href: "/expenses" }}
            />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}




function ReimbDonut({
  total,
  full,
  partial,
  standalone,
}: {
  total: number;
  full: number;
  partial: number;
  standalone: number;
}) {
  const safe = Math.max(1, total);
  const fullPct = (full / safe) * 100;
  const partialPct = (partial / safe) * 100;
  const standalonePct = (standalone / safe) * 100;
  const partialEnd = Math.min(100, fullPct + partialPct);
  const standaloneEnd = Math.min(
    100,
    partialEnd + standalonePct
  );

  const background =
    total > 0
      ? `conic-gradient(
          #58bd69 0 ${fullPct}%,
          #f4b53e ${fullPct}% ${partialEnd}%,
          #16853B ${partialEnd}% ${standaloneEnd}%,
          #e7edf3 ${standaloneEnd}% 100%
        )`
      : "conic-gradient(#e7edf3 0 100%)";

  return (
    <div className="fp-reimb-donut" style={{ background }}>
      <div>
        <strong>{money(total)}</strong>
        <span>Total</span>
      </div>
    </div>
  );
}

function ReimbStatRow({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  return (
    <div className="fp-reimb-stat-row">
      <span className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1">{label}</span><strong>{money(amount)}</strong><span>{pct}%</span>
    </div>
  );
}

function reimbursementKindHref(base: URLSearchParams, kind: string) {
  const params = new URLSearchParams(base);
  params.delete("page");

  if (kind === "all") params.delete("kind");
  else params.set("kind", kind);

  return `/reimbursements${params.toString() ? `?${params}` : ""}`;
}

function reimbursementRangeNote(from?: string, to?: string) {
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
  return `/reimbursements${params.toString() ? `?${params}` : ""}`;
}

function PageLink({ href, children, active = false, disabled = false }: {
  href: string; children: React.ReactNode; active?: boolean; disabled?: boolean;
}) {
  if (disabled) return <span className="fp-reimb-page-button disabled">{children}</span>;
  return <Link href={href} className={`fp-reimb-page-button ${active ? "active" : ""}`}>{children}</Link>;
}

function numberValue(value: number | string | null | undefined) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}
function dateValue(value?: string | null) {
  if (!value) return 0;
  return new Date(`${value.slice(0,10)}T12:00:00`).getTime();
}
function money(value: number) {
  return formatMoney(value);
}
function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(`${value.slice(0,10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function SearchIcon() {
  return <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>;
}
function FilterIcon() {
  return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 6h16M7 12h10M10 18h4"/></svg>;
}
function CalendarIcon() {
  return <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16"/></svg>;
}
function WalletIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 6h16v12H4z"/><path d="M16 10h5v4h-5a2 2 0 0 1 0-4Z"/></svg>;
}
function ClockIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>;
}
function CheckIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><path d="m8 12 2.5 2.5L16 9"/></svg>;
}
function PartialIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><path d="M9 9l6 6M15 9l-6 6"/></svg>;
}
function ImportIcon() {
  return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><path d="M5 19h14V9H5z"/><path d="M12 3v10M8 7l4-4 4 4"/></svg>;
}
function ExportIcon() {
  return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><path d="M5 5h14v14H5z"/><path d="M12 15V5M8 9l4-4 4 4"/></svg>;
}
