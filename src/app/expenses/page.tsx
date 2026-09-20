import Link from "next/link";
import AppShell from "@/components/app-shell";
import { EmptyState } from "@/components/fleet-ui";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import AddExpenseForm from "./add-expense-form";
import ExpenseActions from "./expense-actions";
import ExpenseFilters from "./expense-filters";
import ExpenseQuickActions from "./expense-quick-actions";

type Expense = {
  id: string;
  category: string | null;
  expense_date: string | null;
  amount: number | string | null;
  vendor: string | null;
  description: string | null;
  truck_id: string | null;
  load_id: string | null;
  gallons: number | string | null;
  fuel_price_per_gallon: number | string | null;
  receipt_path: string | null;
};

type Truck = {
  id: string;
  unit_number: string;
  status?: string | null;
};

type Load = {
  id: string;
  load_number: string | null;
  pickup: string | null;
  delivery: string | null;
};

type Params = {
  q?: string;
  category?: string;
  truck?: string;
  sort?: string;
  page?: string;
  dateFrom?: string;
  dateTo?: string;
  vendor?: string;
  minAmount?: string;
  maxAmount?: string;
};

const PAGE_SIZE = 10;

const TAB_CATEGORIES = [
  { key: "all", label: "All Expenses" },
  { key: "fuel", label: "Fuel" },
  { key: "maintenance", label: "Maintenance" },
  { key: "tolls", label: "Tolls" },
  { key: "insurance", label: "Insurance" },
  { key: "other", label: "Other" },
] as const;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim().toLowerCase();
  const categoryFilter = (params.category || "all").toLowerCase();
  const truckFilter = params.truck || "all";
  const sort = (params.sort || "newest").toLowerCase();
  const requestedPage = Math.max(1, Number(params.page || "1") || 1);
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const vendorFilter = (params.vendor || "").trim().toLowerCase();
  const minAmount = params.minAmount ? Number(params.minAmount) : null;
  const maxAmount = params.maxAmount ? Number(params.maxAmount) : null;

  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const [
    { data: expenseData, error: expenseError },
    { data: truckData, error: truckError },
    { data: loadData, error: loadError },
    { data: reimbursementData, error: reimbursementError },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        "id, category, expense_date, amount, vendor, description, truck_id, load_id, gallons, fuel_price_per_gallon, receipt_path"
      )
      .order("expense_date", { ascending: false }),
    supabase
      .from("trucks")
      .select("id, unit_number, status")
      .order("unit_number"),
    supabase
      .from("loads")
      .select("id, load_number, pickup, delivery")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("reimbursements").select("expense_id, amount"),
  ]);

  const allExpenses = (expenseData ?? []) as Expense[];
  const trucks = ((truckData ?? []) as Truck[]).filter(
    (truck) => (truck.status || "").toUpperCase() !== "INACTIVE"
  );
  const loads = (loadData ?? []) as Load[];

  const truckMap = new Map(trucks.map((truck) => [truck.id, truck]));
  const reimbursementByExpense = new Map<string, number>();

  for (const row of reimbursementData ?? []) {
    if (!row.expense_id) continue;
    reimbursementByExpense.set(
      row.expense_id,
      (reimbursementByExpense.get(row.expense_id) || 0) +
        numberValue(row.amount)
    );
  }

  let filteredExpenses = allExpenses.filter((expense) => {
    if (!q) return true;
    const truck = expense.truck_id ? truckMap.get(expense.truck_id) : null;
    return [
      expense.description,
      expense.vendor,
      expense.category,
      expense.expense_date,
      truck?.unit_number,
    ].some((value) => (value || "").toLowerCase().includes(q));
  });

  if (truckFilter !== "all") {
    filteredExpenses = filteredExpenses.filter(
      (expense) => expense.truck_id === truckFilter
    );
  }

  if (dateFrom) {
    filteredExpenses = filteredExpenses.filter(
      (expense) => (expense.expense_date || "") >= dateFrom
    );
  }

  if (dateTo) {
    filteredExpenses = filteredExpenses.filter(
      (expense) => (expense.expense_date || "") <= dateTo
    );
  }

  if (vendorFilter) {
    filteredExpenses = filteredExpenses.filter((expense) =>
      (expense.vendor || "").toLowerCase().includes(vendorFilter)
    );
  }

  if (minAmount != null && Number.isFinite(minAmount)) {
    filteredExpenses = filteredExpenses.filter(
      (expense) => numberValue(expense.amount) >= minAmount
    );
  }

  if (maxAmount != null && Number.isFinite(maxAmount)) {
    filteredExpenses = filteredExpenses.filter(
      (expense) => numberValue(expense.amount) <= maxAmount
    );
  }

  const total = totalOf(filteredExpenses);
  const fuel = totalOf(
    filteredExpenses.filter(
      (expense) => categoryKey(expense.category) === "fuel"
    )
  );
  const maintenance = totalOf(
    filteredExpenses.filter(
      (expense) => categoryKey(expense.category) === "maintenance"
    )
  );
  const otherExpenses = Math.max(0, total - fuel - maintenance);

  const categoryCounts = Object.fromEntries(
    TAB_CATEGORIES.map((tab) => [
      tab.key,
      tab.key === "all"
        ? filteredExpenses.length
        : filteredExpenses.filter((expense) =>
            matchesCategoryTab(expense.category, tab.key)
          ).length,
    ])
  ) as Record<(typeof TAB_CATEGORIES)[number]["key"], number>;

  let expenses =
    categoryFilter === "all"
      ? [...filteredExpenses]
      : filteredExpenses.filter((expense) =>
          matchesCategoryTab(expense.category, categoryFilter)
        );

  expenses = [...expenses].sort((a, b) => {
    if (sort === "oldest") {
      return dateValue(a.expense_date) - dateValue(b.expense_date);
    }
    if (sort === "amount-desc") {
      return numberValue(b.amount) - numberValue(a.amount);
    }
    if (sort === "amount-asc") {
      return numberValue(a.amount) - numberValue(b.amount);
    }
    return dateValue(b.expense_date) - dateValue(a.expense_date);
  });

  const pageCount = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageExpenses = expenses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const breakdown = expenseBreakdown(filteredExpenses);
  const rankedCategories = [...breakdown]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const errors = [
    expenseError,
    truckError,
    loadError,
    reimbursementError,
  ].filter(Boolean);

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (categoryFilter !== "all") query.set("category", categoryFilter);
  if (truckFilter !== "all") query.set("truck", truckFilter);
  if (sort !== "newest") query.set("sort", sort);
  if (dateFrom) query.set("dateFrom", dateFrom);
  if (dateTo) query.set("dateTo", dateTo);
  if (vendorFilter) query.set("vendor", vendorFilter);
  if (minAmount != null && Number.isFinite(minAmount)) query.set("minAmount", String(minAmount));
  if (maxAmount != null && Number.isFinite(maxAmount)) query.set("maxAmount", String(maxAmount));

  return (
    <AppShell
      active="expenses"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-expenses-page">
        <section className="fp-expenses-heading">
          <div>
            <h1 className="fp-expenses-title">Expenses</h1>
            <p className="fp-expenses-subtitle">
              Track and manage all your business expenses. Keep your costs under control.
            </p>
          </div>

          <div id="add-expense" className="fp-expense-add-form-host">
            <AddExpenseForm trucks={trucks} loads={loads} />
          </div>
        </section>

        {errors.length > 0 && (
          <div className="mt-3 rounded-[10px] border border-[#ffcf82] bg-[#fff7e8] px-4 py-3 text-[10px] font-[600] text-[#966217]">
            Some expense data could not be loaded. Successfully returned data is still shown.
          </div>
        )}

        <div className="fp-expenses-layout mt-4">
          <div className="min-w-0">
            <div className="fp-expense-kpi-grid">
              <ExpenseKpi
                label="Total Expenses"
                value={money(total)}
                change={dateFrom || dateTo ? "Selected range" : "All time"}
                note={dateFrom || dateTo ? expenseRangeLabel(dateFrom, dateTo) : "recorded expenses"}
                tone="blue"
                icon="card"
              />
              <ExpenseKpi
                label="Fuel Expenses"
                value={money(fuel)}
                change={dateFrom || dateTo ? "Selected range" : "All time"}
                note={dateFrom || dateTo ? expenseRangeLabel(dateFrom, dateTo) : "recorded fuel"}
                tone="green"
                icon="fuel"
              />
              <ExpenseKpi
                label="Maintenance"
                value={money(maintenance)}
                change={dateFrom || dateTo ? "Selected range" : "All time"}
                note={dateFrom || dateTo ? expenseRangeLabel(dateFrom, dateTo) : "recorded maintenance"}
                tone="purple"
                icon="maintenance"
              />
              <ExpenseKpi
                label="Other Expenses"
                value={money(otherExpenses)}
                change={dateFrom || dateTo ? "Selected range" : "All time"}
                note={dateFrom || dateTo ? expenseRangeLabel(dateFrom, dateTo) : "other recorded costs"}
                tone="blue"
                icon="other"
              />
            </div>

            <section className="fp-expenses-table-card mt-4">
              <div className="fp-expense-tabs">
                {TAB_CATEGORIES.map((tab) => (
                  <ExpenseTab
                    key={tab.key}
                    href={filterHref(
                      tab.key,
                      q,
                      truckFilter,
                      sort
                    )}
                    label={tab.label}
                    count={categoryCounts[tab.key]}
                    active={categoryFilter === tab.key}
                  />
                ))}
              </div>

              <ExpenseFilters trucks={trucks} />

              <div className="fp-expense-table-wrap">
                <table className="fp-expense-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Truck</th>
                      <th>Vendor</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageExpenses.map((expense, index) => {
                      const truck = expense.truck_id
                        ? truckMap.get(expense.truck_id)
                        : null;

                      return (
                        <tr key={expense.id}>
                          <td className="fp-expense-number">
                            #{String((page - 1) * PAGE_SIZE + index + 1).padStart(4, "0")}
                          </td>

                          <td>{longDate(expense.expense_date)}</td>

                          <td className="fp-expense-description">
                            {expense.description || expense.vendor || "Expense"}
                          </td>

                          <td>
                            <CategoryBadge category={expense.category} />
                          </td>

                          <td className="fp-expense-amount">
                            {money(numberValue(expense.amount))}
                          </td>

                          <td>
                            {truck ? `#${truck.unit_number}` : "—"}
                          </td>

                          <td className="fp-expense-vendor">
                            {expense.vendor || "—"}
                          </td>

                          <td className="fp-expense-actions-cell">
                            <ExpenseActions
                              expense={expense}
                              trucks={trucks}
                              loads={loads}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {pageExpenses.length === 0 && (
                  <EmptyState text="No expenses match these filters." />
                )}
              </div>

              <div className="fp-expense-pagination">
                <span>
                  Showing {expenses.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, expenses.length)} of {expenses.length} expenses
                </span>

                <div className="flex items-center gap-1.5">
                  <PageLink
                    href={pageHref(query, Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    ‹
                  </PageLink>

                  {Array.from({ length: Math.min(3, pageCount) }).map(
                    (_, index) => {
                      const number = index + 1;
                      return (
                        <PageLink
                          key={number}
                          href={pageHref(query, number)}
                          active={number === page}
                        >
                          {number}
                        </PageLink>
                      );
                    }
                  )}

                  {pageCount > 4 && (
                    <>
                      <span className="px-1 text-[9px] text-[#8192a5]">…</span>
                      <PageLink
                        href={pageHref(query, pageCount)}
                        active={pageCount === page}
                      >
                        {pageCount}
                      </PageLink>
                    </>
                  )}

                  <PageLink
                    href={pageHref(query, Math.min(pageCount, page + 1))}
                    disabled={page === pageCount}
                  >
                    ›
                  </PageLink>

                  <span className="fp-expense-page-size">10 per page⌄</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="fp-expenses-right-rail">
            <section className="fp-expense-side-card">
              <h2>Quick Actions</h2>

              <ExpenseQuickActions expenses={expenses} />
            </section>

            <section className="fp-expense-side-card">
              <h2>Expenses by Category</h2>

              <div className="mt-4 flex justify-center">
                <ExpenseDonut total={total} items={breakdown} />
              </div>

              <div className="fp-expense-breakdown-list mt-4">
                {breakdown.map((item) => (
                  <ExpenseBreakdownRow
                    key={item.label}
                    item={item}
                    total={total}
                  />
                ))}
              </div>
            </section>

            <section className="fp-expense-side-card">
              <div className="flex items-center justify-between">
                <h2>Top Expenses</h2>
                <span className="text-[9px] font-[600] text-[#16853B]">
                  View All →
                </span>
              </div>

              <div className="fp-expense-ranking mt-3">
                {rankedCategories.map((item, index) => (
                  <div key={item.label} className="fp-expense-ranking-row">
                    <span className="fp-expense-rank">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span>{money(item.amount)}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="fp-expense-promo">
              <div className="absolute inset-0 bg-gradient-to-r from-[#06182d]/82 via-[#06182d]/30 to-transparent" />
              <div className="relative z-10">
                <div className="text-[16px] font-[740] leading-[1.15] text-white">
                  Lower Costs.<br />Higher Miles.
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

function ExpenseKpi({
  label,
  value,
  change,
  note,
  tone,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  note: string;
  tone: "blue" | "green" | "purple";
  icon: "card" | "fuel" | "maintenance" | "other";
}) {
  const palette = {
    blue: { color: "#4b8df6", soft: "#eaf3ff" },
    green: { color: "#55a965", soft: "#e9f7ed" },
    purple: { color: "#765ce7", soft: "#f0edff" },
  }[tone];

  return (
    <div className="fp-expense-kpi">
      <div
        className="fp-expense-kpi-icon"
        style={{ color: palette.color, backgroundColor: palette.soft }}
      >
        <ExpenseKpiIcon type={icon} />
      </div>

      <div className="min-w-0">
        <div className="fp-expense-kpi-label">{label}</div>
        <div className="fp-number fp-expense-kpi-value">{value}</div>
        <div
          className={`fp-expense-kpi-change ${
            change.startsWith("↓")
              ? "positive"
              : change === "Selected range" || change === "All time"
                ? "neutral"
                : ""
          }`}
        >
          {change}
        </div>
        <div className="fp-expense-kpi-note">{note}</div>
      </div>

    </div>
  );
}

function ExpenseKpiIcon({
  type,
}: {
  type: "card" | "fuel" | "maintenance" | "other";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[17px] w-[17px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "card") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M7 14h5" />
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

  if (type === "maintenance") {
    return (
      <svg {...common}>
        <path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  );
}

function ExpenseTab({
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
    <Link href={href} className={`fp-expense-tab ${active ? "active" : ""}`}>
      <span>{label}</span>
      <span className="fp-expense-tab-count">{count}</span>
    </Link>
  );
}

function CategoryBadge({ category }: { category?: string | null }) {
  const meta = categoryMeta(category);
  return (
    <span
      className="fp-expense-category-badge"
      style={{ color: meta.text, backgroundColor: meta.soft }}
    >
      {meta.label}
    </span>
  );
}

function ExpenseDonut({
  total,
  items,
}: {
  total: number;
  items: ExpenseCategory[];
}) {
  const safeTotal = Math.max(1, total);
  let cursor = 0;

  const stops = items.map((item) => {
    const share = (item.amount / safeTotal) * 100;
    const from = cursor;
    const to = cursor + share;
    cursor = to;
    return `${item.color} ${from}% ${to}%`;
  });

  if (cursor < 100) stops.push(`#e7edf3 ${cursor}% 100%`);

  return (
    <div
      className="fp-expense-donut"
      style={{
        background:
          total > 0
            ? `conic-gradient(${stops.join(", ")})`
            : "conic-gradient(#e7edf3 0 100%)",
      }}
    >
      <div>
        <strong>{money(total)}</strong>
        <span>Total Expenses</span>
      </div>
    </div>
  );
}

function ExpenseBreakdownRow({
  item,
  total,
}: {
  item: ExpenseCategory;
  total: number;
}) {
  const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;

  return (
    <div className="fp-expense-breakdown-row">
      <span
        className="h-[9px] w-[9px] rounded-full"
        style={{ backgroundColor: item.color }}
      />
      <span className="flex-1">{item.label}</span>
      <strong>{money(item.amount)}</strong>
      <span>{pct}%</span>
    </div>
  );
}

type ExpenseCategory = {
  label: string;
  amount: number;
  color: string;
};

function expenseBreakdown(expenses: Expense[]): ExpenseCategory[] {
  const bucket = {
    Fuel: 0,
    Maintenance: 0,
    Tolls: 0,
    Insurance: 0,
    Other: 0,
  };

  for (const expense of expenses) {
    const key = categoryKey(expense.category);
    const amount = numberValue(expense.amount);

    if (key === "fuel") bucket.Fuel += amount;
    else if (key === "maintenance") bucket.Maintenance += amount;
    else if (key === "tolls") bucket.Tolls += amount;
    else if (key === "insurance") bucket.Insurance += amount;
    else bucket.Other += amount;
  }

  return [
    { label: "Fuel", amount: bucket.Fuel, color: "#62bd70" },
    { label: "Maintenance", amount: bucket.Maintenance, color: "#7a55e7" },
    { label: "Tolls", amount: bucket.Tolls, color: "#f2b33f" },
    { label: "Insurance", amount: bucket.Insurance, color: "#e85f58" },
    { label: "Other", amount: bucket.Other, color: "#aab8cb" },
  ];
}

function categoryMeta(category?: string | null) {
  const key = categoryKey(category);
  if (key === "fuel") {
    return { label: "Fuel", text: "#4a9f5b", soft: "#e8f7e9" };
  }
  if (key === "maintenance") {
    return { label: "Maintenance", text: "#7253df", soft: "#f0ebff" };
  }
  if (key === "tolls") {
    return { label: "Tolls", text: "#d79626", soft: "#fff3da" };
  }
  if (key === "insurance") {
    return { label: "Insurance", text: "#dc5454", soft: "#ffebec" };
  }
  return {
    label: (category || "Other").trim() || "Other",
    text: "#546a84",
    soft: "#eef2f7",
  };
}

function matchesCategoryTab(category: string | null, tab: string) {
  const key = categoryKey(category);
  if (tab === "all") return true;
  if (tab === "other") {
    return !["fuel", "maintenance", "tolls", "insurance"].includes(key);
  }
  return key === tab;
}

function categoryKey(category?: string | null) {
  const key = (category || "Other").trim().toLowerCase();
  if (key.includes("fuel")) return "fuel";
  if (key.includes("maintenance")) return "maintenance";
  if (key.includes("toll")) return "tolls";
  if (key.includes("insurance")) return "insurance";
  return key;
}

function filterHref(
  category: string,
  q: string,
  truck: string,
  sort: string
) {
  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  if (truck !== "all") params.set("truck", truck);
  if (sort !== "newest") params.set("sort", sort);
  return `/expenses${params.toString() ? `?${params}` : ""}`;
}

function pageHref(baseQuery: URLSearchParams, page: number) {
  const params = new URLSearchParams(baseQuery);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  return `/expenses${params.toString() ? `?${params}` : ""}`;
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
  if (disabled) {
    return <span className="fp-expense-page-button disabled">{children}</span>;
  }
  return (
    <Link
      href={href}
      className={`fp-expense-page-button ${active ? "active" : ""}`}
    >
      {children}
    </Link>
  );
}

function totalOf(expenses: Expense[]) {
  return expenses.reduce(
    (sum, expense) => sum + numberValue(expense.amount),
    0
  );
}

function expenseRangeLabel(from?: string, to?: string) {
  if (from && to) {
    return `${shortDate(from)} – ${shortDate(to)}`;
  }
  if (from) return `from ${shortDate(from)}`;
  if (to) return `through ${shortDate(to)}`;
  return "selected dates";
}

function shortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function longDate(value?: string | null) {
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

function dateValue(value?: string | null) {
  if (!value) return 0;
  return new Date(`${value.slice(0, 10)}T12:00:00`).getTime();
}

function numberValue(value: number | string | null | undefined) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 9h16" />
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

function RecurringIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}
